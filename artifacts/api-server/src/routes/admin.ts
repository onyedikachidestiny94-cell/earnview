import { Router } from "express";
import { db, usersTable, tasksTable, taskCompletionsTable, withdrawalsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, count, desc, sql, and, gte, ilike, or } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get("/admin/stats", async (req, res) => {
  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable);
  const [activeUsersRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isSuspended, false));
  const [tasksCompletedRow] = await db.select({ count: count() }).from(taskCompletionsTable);
  const [rewardsRow] = await db.select({ total: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)` }).from(transactionsTable).where(sql`${transactionsTable.amount} > 0`);

  const pendingWithdrawalList = await db
    .select({ amount: withdrawalsTable.amount })
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.status, "pending"));
  const pendingAmount = pendingWithdrawalList.reduce((sum, w) => sum + w.amount, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [newUsersTodayRow] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, todayStart));
  const [tasksTodayRow] = await db.select({ count: count() }).from(taskCompletionsTable).where(gte(taskCompletionsTable.completedAt, todayStart));

  res.json({
    totalUsers: totalUsersRow.count,
    activeUsers: activeUsersRow.count,
    totalTasksCompleted: tasksCompletedRow.count,
    totalRewardsDistributed: Number(rewardsRow.total),
    pendingWithdrawalsCount: pendingWithdrawalList.length,
    pendingWithdrawalsAmount: pendingAmount,
    newUsersToday: newUsersTodayRow.count,
    tasksCompletedToday: tasksTodayRow.count,
  });
});

// GET /api/admin/users
router.get("/admin/users", async (req, res) => {
  const { search, status } = req.query as { search?: string; status?: string };

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(100);

  if (search) {
    const s = search.toLowerCase();
    users = users.filter((u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }
  if (status === "suspended") users = users.filter((u) => u.isSuspended);
  if (status === "active") users = users.filter((u) => !u.isSuspended);

  const result = await Promise.all(
    users.map(async (u) => {
      const [tasksRow] = await db.select({ count: count() }).from(taskCompletionsTable).where(eq(taskCompletionsTable.userId, u.id));
      const levelInfo = getLevelInfo(u.xp);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl ?? null,
        balance: u.balance,
        totalEarned: u.totalEarned,
        xp: u.xp,
        level: levelInfo.level,
        streakCount: u.streakCount,
        tasksCompleted: tasksRow.count,
        isAdmin: u.isAdmin,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt.toISOString(),
        lastActiveAt: u.updatedAt?.toISOString() ?? null,
      };
    })
  );

  res.json(result);
});

// PATCH /api/admin/users/:userId
router.patch("/admin/users/:userId", async (req, res) => {
  const userId = parseInt(req.params['userId'] as string);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const { isSuspended, isAdmin } = req.body as { isSuspended?: boolean; isAdmin?: boolean };
  const updates: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof isSuspended === "boolean") updates.isSuspended = isSuspended;
  if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  const [tasksRow] = await db.select({ count: count() }).from(taskCompletionsTable).where(eq(taskCompletionsTable.userId, userId));
  const levelInfo = getLevelInfo(updated.xp);

  res.json({
    id: updated.id,
    username: updated.username,
    email: updated.email,
    avatarUrl: updated.avatarUrl ?? null,
    balance: updated.balance,
    totalEarned: updated.totalEarned,
    xp: updated.xp,
    level: levelInfo.level,
    streakCount: updated.streakCount,
    tasksCompleted: tasksRow.count,
    isAdmin: updated.isAdmin,
    isSuspended: updated.isSuspended,
    createdAt: updated.createdAt.toISOString(),
    lastActiveAt: updated.updatedAt?.toISOString() ?? null,
  });
});

// GET /api/admin/tasks
router.get("/admin/tasks", async (req, res) => {
  const tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
  res.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      videoUrl: t.videoUrl ?? null,
      rewardAmount: t.rewardAmount,
      xpReward: t.xpReward,
      durationSeconds: t.durationSeconds,
      category: t.category,
      isActive: t.isActive,
      completedByUser: false,
      completionCount: t.completionCount,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

// POST /api/admin/tasks
router.post("/admin/tasks", async (req, res) => {
  const { title, description, videoUrl, rewardAmount, xpReward, durationSeconds, category, isActive } =
    req.body as {
      title: string;
      description: string;
      videoUrl?: string;
      rewardAmount: number;
      xpReward: number;
      durationSeconds: number;
      category: string;
      isActive?: boolean;
    };

  if (!title || !description || !rewardAmount || !durationSeconds || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [task] = await db.insert(tasksTable).values({
    title,
    description,
    videoUrl: videoUrl || null,
    rewardAmount,
    xpReward: xpReward ?? 10,
    durationSeconds,
    category,
    isActive: isActive ?? true,
  }).returning();

  res.status(201).json({
    id: task.id,
    title: task.title,
    description: task.description,
    videoUrl: task.videoUrl ?? null,
    rewardAmount: task.rewardAmount,
    xpReward: task.xpReward,
    durationSeconds: task.durationSeconds,
    category: task.category,
    isActive: task.isActive,
    completedByUser: false,
    completionCount: 0,
    createdAt: task.createdAt.toISOString(),
  });
});

// PUT /api/admin/tasks/:taskId
router.put("/admin/tasks/:taskId", async (req, res) => {
  const taskId = parseInt(req.params['taskId'] as string);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid task ID" }); return; }

  const { title, description, videoUrl, rewardAmount, xpReward, durationSeconds, category, isActive } =
    req.body as Partial<{
      title: string; description: string; videoUrl: string;
      rewardAmount: number; xpReward: number; durationSeconds: number;
      category: string; isActive: boolean;
    }>;

  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (videoUrl !== undefined) updates.videoUrl = videoUrl;
  if (rewardAmount !== undefined) updates.rewardAmount = rewardAmount;
  if (xpReward !== undefined) updates.xpReward = xpReward;
  if (durationSeconds !== undefined) updates.durationSeconds = durationSeconds;
  if (category !== undefined) updates.category = category;
  if (isActive !== undefined) updates.isActive = isActive;

  const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, taskId)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  res.json({
    id: task.id, title: task.title, description: task.description,
    videoUrl: task.videoUrl ?? null, rewardAmount: task.rewardAmount,
    xpReward: task.xpReward, durationSeconds: task.durationSeconds,
    category: task.category, isActive: task.isActive,
    completedByUser: false, completionCount: task.completionCount,
    createdAt: task.createdAt.toISOString(),
  });
});

// DELETE /api/admin/tasks/:taskId
router.delete("/admin/tasks/:taskId", async (req, res) => {
  const taskId = parseInt(req.params['taskId'] as string);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid task ID" }); return; }

  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  res.json({ success: true, message: "Task deleted" });
});

// GET /api/admin/withdrawals
router.get("/admin/withdrawals", async (req, res) => {
  const { status } = req.query as { status?: string };

  let withdrawals = await db
    .select({
      id: withdrawalsTable.id,
      userId: withdrawalsTable.userId,
      amount: withdrawalsTable.amount,
      paymentMethod: withdrawalsTable.paymentMethod,
      paymentDetails: withdrawalsTable.paymentDetails,
      status: withdrawalsTable.status,
      adminNote: withdrawalsTable.adminNote,
      createdAt: withdrawalsTable.createdAt,
      updatedAt: withdrawalsTable.updatedAt,
      username: usersTable.username,
    })
    .from(withdrawalsTable)
    .innerJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
    .orderBy(desc(withdrawalsTable.createdAt))
    .limit(100);

  if (status && status !== "all") {
    withdrawals = withdrawals.filter((w) => w.status === status);
  }

  res.json(
    withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      username: w.username,
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

// PATCH /api/admin/withdrawals/:withdrawalId
router.patch("/admin/withdrawals/:withdrawalId", async (req, res) => {
  const withdrawalId = parseInt(req.params['withdrawalId'] as string);
  if (isNaN(withdrawalId)) { res.status(400).json({ error: "Invalid withdrawal ID" }); return; }

  const { status, adminNote } = req.body as { status: "approved" | "rejected"; adminNote?: string };

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be approved or rejected" });
    return;
  }

  const withdrawal = await db.query.withdrawalsTable.findFirst({ where: eq(withdrawalsTable.id, withdrawalId) });
  if (!withdrawal) { res.status(404).json({ error: "Withdrawal not found" }); return; }

  const [updated] = await db
    .update(withdrawalsTable)
    .set({ status, adminNote: adminNote ?? null, updatedAt: new Date() })
    .where(eq(withdrawalsTable.id, withdrawalId))
    .returning();

  // If rejected, refund balance
  if (status === "rejected" && withdrawal.status === "pending") {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, withdrawal.userId) });
    if (user) {
      const refundedBalance = user.balance + withdrawal.amount;
      await db.update(usersTable)
        .set({ balance: refundedBalance, updatedAt: new Date() })
        .where(eq(usersTable.id, withdrawal.userId));

      await db.insert(transactionsTable).values({
        userId: withdrawal.userId,
        type: "bonus",
        description: "Withdrawal request rejected — funds returned",
        amount: withdrawal.amount,
        balanceAfter: refundedBalance,
      });
    }
  }

  await db.insert(notificationsTable).values({
    userId: withdrawal.userId,
    type: "withdrawal",
    title: status === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected",
    message: status === "approved"
      ? `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved.`
      : `Your withdrawal of $${withdrawal.amount.toFixed(2)} was rejected.${adminNote ? " Note: " + adminNote : ""}`,
  });

  res.json({
    id: updated.id,
    userId: updated.userId,
    username: null,
    amount: updated.amount,
    paymentMethod: updated.paymentMethod,
    paymentDetails: updated.paymentDetails,
    status: updated.status,
    adminNote: updated.adminNote ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
