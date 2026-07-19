import { Router } from "express";
import { db, usersTable, transactionsTable, withdrawalsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const MINIMUM_WITHDRAWAL = 5.0;

const router = Router();

// GET /api/wallet
router.get("/wallet", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;

  const pendingWithdrawals = await db
    .select({ amount: withdrawalsTable.amount })
    .from(withdrawalsTable)
    .where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "pending")));
  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const approvedWithdrawals = await db
    .select({ amount: withdrawalsTable.amount })
    .from(withdrawalsTable)
    .where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "approved")));
  const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const [taskEarnings] = await db
    .select({ total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "earn")));

  const [referralEarnings] = await db
    .select({ total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "referral")));

  const [bonusEarnings] = await db
    .select({ total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "bonus")));

  res.json({
    balance: user.balance,
    totalEarned: user.totalEarned,
    pendingWithdrawals: pendingAmount,
    minimumWithdrawal: MINIMUM_WITHDRAWAL,
    totalWithdrawn,
    earningsByType: {
      tasks: Number(taskEarnings.total),
      referrals: Number(referralEarnings.total),
      bonuses: Number(bonusEarnings.total),
    },
  });
});

// GET /api/transactions
router.get("/transactions", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { type, limit } = req.query as { type?: string; limit?: string };

  const results = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit ? Math.min(parseInt(limit) || 50, 100) : 50);

  const filtered = type && type !== "all" ? results.filter((t) => t.type === type) : results;

  res.json(
    filtered.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

// GET /api/withdrawals
router.get("/withdrawals", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const withdrawals = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, userId))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(
    withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      username: null,
      amount: w.amount,
      paymentMethod: w.paymentMethod,
      paymentDetails: w.paymentDetails,
      status: w.status,
      adminNote: w.adminNote ?? null,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }))
  );
});

// POST /api/withdrawals
router.post("/withdrawals", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;
  const { amount, paymentMethod, paymentDetails } = req.body as {
    amount?: number;
    paymentMethod?: string;
    paymentDetails?: string;
  };

  if (!amount || amount < MINIMUM_WITHDRAWAL) {
    res.status(400).json({ error: `Minimum withdrawal is $${MINIMUM_WITHDRAWAL}` });
    return;
  }
  if (!paymentMethod || !paymentDetails) {
    res.status(400).json({ error: "Payment method and details are required" });
    return;
  }
  if (user.balance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const newBalance = user.balance - amount;

  await db.update(usersTable)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId,
    amount,
    paymentMethod,
    paymentDetails,
    status: "pending",
  }).returning();

  await db.insert(transactionsTable).values({
    userId,
    type: "withdraw",
    description: `Withdrawal via ${paymentMethod}`,
    amount: -amount,
    balanceAfter: newBalance,
  });

  await db.insert(notificationsTable).values({
    userId,
    type: "withdrawal",
    title: "Withdrawal Request Submitted",
    message: `Your withdrawal of $${amount.toFixed(2)} via ${paymentMethod} is being processed.`,
  });

  res.status(201).json({
    id: withdrawal.id,
    userId: withdrawal.userId,
    username: null,
    amount: withdrawal.amount,
    paymentMethod: withdrawal.paymentMethod,
    paymentDetails: withdrawal.paymentDetails,
    status: withdrawal.status,
    adminNote: null,
    createdAt: withdrawal.createdAt.toISOString(),
    updatedAt: withdrawal.updatedAt.toISOString(),
  });
});

export default router;
