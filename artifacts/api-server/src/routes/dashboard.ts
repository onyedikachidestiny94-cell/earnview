import { Router } from "express";
import { db, usersTable, taskCompletionsTable, tasksTable, transactionsTable, referralsTable, withdrawalsTable, notificationsTable } from "@workspace/db";
import { eq, count, sql, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";

const router = Router();

// GET /api/dashboard
router.get("/dashboard", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;

  const [tasksCompletedRow] = await db
    .select({ count: count() })
    .from(taskCompletionsTable)
    .where(eq(taskCompletionsTable.userId, userId));

  const [tasksAvailableRow] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.isActive, true));

  const completedTaskIds = await db
    .select({ taskId: taskCompletionsTable.taskId })
    .from(taskCompletionsTable)
    .where(eq(taskCompletionsTable.userId, userId));

  const completedSet = new Set(completedTaskIds.map((r) => r.taskId));

  const [tasksAvailableForUser] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.isActive, true));

  const actualAvailable = tasksAvailableForUser.count - completedSet.size;

  const [referralEarningsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${referralsTable.rewardAmount}), 0)` })
    .from(referralsTable)
    .where(eq(referralsTable.inviterId, userId));

  const pendingWithdrawals = await db
    .select({ amount: withdrawalsTable.amount })
    .from(withdrawalsTable)
    .where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "pending")));

  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const [unreadRow] = await db
    .select({ count: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  // 7-day earnings trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentTxns = await db
    .select({
      day: sql<string>`to_char(${transactionsTable.createdAt}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.createdAt, sevenDaysAgo),
        sql`${transactionsTable.amount} > 0`,
      )
    )
    .groupBy(sql`to_char(${transactionsTable.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${transactionsTable.createdAt}, 'YYYY-MM-DD')`);

  // Fill in missing days
  const recentEarnings = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = recentTxns.find((r) => r.day === dateStr);
    recentEarnings.push({ date: dateStr, amount: found ? Number(found.total) : 0 });
  }

  const levelInfo = getLevelInfo(user.xp);

  res.json({
    balance: user.balance,
    totalEarned: user.totalEarned,
    tasksCompleted: tasksCompletedRow.count,
    tasksAvailable: Math.max(0, actualAvailable),
    streakCount: user.streakCount,
    xp: user.xp,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
    xpToNextLevel: levelInfo.xpToNextLevel,
    xpProgress: levelInfo.xpProgress,
    referralEarnings: Number(referralEarningsRow.total),
    pendingWithdrawals: pendingAmount,
    unreadNotifications: unreadRow.count,
    recentEarnings,
  });
});

// GET /api/dashboard/activity
router.get("/dashboard/activity", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const txns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);

  res.json(
    txns.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: t.amount,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

export default router;
