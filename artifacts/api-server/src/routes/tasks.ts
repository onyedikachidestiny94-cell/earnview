import { Router } from "express";
import { db, usersTable, tasksTable, taskCompletionsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";
import { checkAndGrantAchievements } from "../lib/achievements";

const router = Router();

// GET /api/tasks
router.get("/tasks", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { category, status } = req.query as { category?: string; status?: string };

  const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.isActive, true)).orderBy(desc(tasksTable.createdAt));

  const completions = await db
    .select({ taskId: taskCompletionsTable.taskId })
    .from(taskCompletionsTable)
    .where(eq(taskCompletionsTable.userId, userId));

  const completedIds = new Set(completions.map((c) => c.taskId));

  let tasks = allTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    videoUrl: t.videoUrl ?? null,
    rewardAmount: t.rewardAmount,
    xpReward: t.xpReward,
    durationSeconds: t.durationSeconds,
    category: t.category,
    isActive: t.isActive,
    completedByUser: completedIds.has(t.id),
    completionCount: t.completionCount,
    createdAt: t.createdAt.toISOString(),
  }));

  if (category) tasks = tasks.filter((t) => t.category === category);
  if (status === "completed") tasks = tasks.filter((t) => t.completedByUser);
  if (status === "available") tasks = tasks.filter((t) => !t.completedByUser);

  res.json(tasks);
});

// GET /api/tasks/history
router.get("/tasks/history", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const completions = await db
    .select({
      id: taskCompletionsTable.id,
      taskId: taskCompletionsTable.taskId,
      rewardAmount: taskCompletionsTable.rewardAmount,
      xpEarned: taskCompletionsTable.xpEarned,
      completedAt: taskCompletionsTable.completedAt,
      taskTitle: tasksTable.title,
    })
    .from(taskCompletionsTable)
    .innerJoin(tasksTable, eq(taskCompletionsTable.taskId, tasksTable.id))
    .where(eq(taskCompletionsTable.userId, userId))
    .orderBy(desc(taskCompletionsTable.completedAt));

  res.json(
    completions.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      taskTitle: c.taskTitle,
      rewardAmount: c.rewardAmount,
      xpEarned: c.xpEarned,
      completedAt: c.completedAt.toISOString(),
    }))
  );
});

// GET /api/tasks/:taskId
router.get("/tasks/:taskId", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params['taskId'] as string);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid task ID" }); return; }

  const userId = req.userId!;
  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const completion = await db.query.taskCompletionsTable.findFirst({
    where: and(eq(taskCompletionsTable.userId, userId), eq(taskCompletionsTable.taskId, taskId)),
  });

  res.json({
    id: task.id,
    title: task.title,
    description: task.description,
    videoUrl: task.videoUrl ?? null,
    rewardAmount: task.rewardAmount,
    xpReward: task.xpReward,
    durationSeconds: task.durationSeconds,
    category: task.category,
    isActive: task.isActive,
    completedByUser: !!completion,
    completionCount: task.completionCount,
    createdAt: task.createdAt.toISOString(),
  });
});

// POST /api/tasks/:taskId/complete
router.post("/tasks/:taskId/complete", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params['taskId'] as string);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid task ID" }); return; }

  const userId = req.userId!;
  const user = req.currentUser!;
  const { watchedDuration } = req.body as { watchedDuration?: number };

  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (!task || !task.isActive) { res.status(404).json({ error: "Task not found or inactive" }); return; }

  const existing = await db.query.taskCompletionsTable.findFirst({
    where: and(eq(taskCompletionsTable.userId, userId), eq(taskCompletionsTable.taskId, taskId)),
  });
  if (existing) { res.status(400).json({ error: "Task already completed" }); return; }

  const minDuration = Math.floor(task.durationSeconds * 0.8);
  if (typeof watchedDuration !== "number" || watchedDuration < minDuration) {
    res.status(400).json({ error: `Must watch at least ${minDuration} seconds` });
    return;
  }

  const newBalance = user.balance + task.rewardAmount;
  const newTotalEarned = user.totalEarned + task.rewardAmount;
  const newXp = user.xp + task.xpReward;
  const levelInfo = getLevelInfo(newXp);
  const oldLevel = user.level;

  await db.update(usersTable)
    .set({ balance: newBalance, totalEarned: newTotalEarned, xp: newXp, level: levelInfo.level, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  await db.insert(taskCompletionsTable).values({
    userId,
    taskId,
    rewardAmount: task.rewardAmount,
    xpEarned: task.xpReward,
  });

  await db.update(tasksTable)
    .set({ completionCount: task.completionCount + 1 })
    .where(eq(tasksTable.id, taskId));

  await db.insert(transactionsTable).values({
    userId,
    type: "earn",
    description: `Completed task: ${task.title}`,
    amount: task.rewardAmount,
    balanceAfter: newBalance,
  });

  await db.insert(notificationsTable).values({
    userId,
    type: "reward",
    title: "Reward Earned!",
    message: `You earned $${task.rewardAmount.toFixed(2)} and +${task.xpReward} XP for completing "${task.title}"`,
  });

  const achievementsUnlocked = await checkAndGrantAchievements(userId);

  const leveledUp = levelInfo.level > oldLevel;
  if (leveledUp) {
    await db.insert(notificationsTable).values({
      userId,
      type: "achievement",
      title: "Level Up!",
      message: `Congratulations! You've reached ${levelInfo.levelName} (Level ${levelInfo.level})`,
    });
  }

  res.json({
    success: true,
    rewardAmount: task.rewardAmount,
    xpEarned: task.xpReward,
    newBalance,
    newXp,
    newLevel: levelInfo.level,
    newLevelName: levelInfo.levelName,
    leveledUp,
    achievementsUnlocked,
  });
});

export default router;
