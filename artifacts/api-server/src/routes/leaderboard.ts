import { Router } from "express";
import { db, usersTable, taskCompletionsTable, referralsTable, transactionsTable } from "@workspace/db";
import { eq, desc, sql, count, and, gte, sum } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";

const router = Router();

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  if (period === "daily") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "monthly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null; // all time
}

// GET /api/leaderboard
router.get("/leaderboard", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { period = "weekly", type = "earnings" } = req.query as { period?: string; type?: string };

  const periodStart = getPeriodStart(period);

  let entries: Array<{ userId: number; value: number }> = [];

  if (type === "earnings") {
    const rows = await db
      .select({
        userId: transactionsTable.userId,
        value: sql<number>`coalesce(sum(${transactionsTable.amount}), 0)`,
      })
      .from(transactionsTable)
      .where(
        periodStart
          ? and(sql`${transactionsTable.amount} > 0`, gte(transactionsTable.createdAt, periodStart))
          : sql`${transactionsTable.amount} > 0`
      )
      .groupBy(transactionsTable.userId)
      .orderBy(desc(sql`sum(${transactionsTable.amount})`))
      .limit(50);
    entries = rows.map((r) => ({ userId: r.userId, value: Number(r.value) }));
  } else if (type === "tasks") {
    const rows = await db
      .select({
        userId: taskCompletionsTable.userId,
        value: sql<number>`count(*)`,
      })
      .from(taskCompletionsTable)
      .where(periodStart ? gte(taskCompletionsTable.completedAt, periodStart) : undefined)
      .groupBy(taskCompletionsTable.userId)
      .orderBy(desc(sql`count(*)`))
      .limit(50);
    entries = rows.map((r) => ({ userId: r.userId, value: Number(r.value) }));
  } else if (type === "referrals") {
    const rows = await db
      .select({
        userId: referralsTable.inviterId,
        value: sql<number>`count(*)`,
      })
      .from(referralsTable)
      .where(periodStart ? gte(referralsTable.createdAt, periodStart) : undefined)
      .groupBy(referralsTable.inviterId)
      .orderBy(desc(sql`count(*)`))
      .limit(50);
    entries = rows.map((r) => ({ userId: r.userId, value: Number(r.value) }));
  } else if (type === "streak") {
    const rows = await db
      .select({ id: usersTable.id, streakCount: usersTable.streakCount })
      .from(usersTable)
      .where(eq(usersTable.isSuspended, false))
      .orderBy(desc(usersTable.streakCount))
      .limit(50);
    entries = rows.map((r) => ({ userId: r.id, value: r.streakCount }));
  }

  // Fetch user details
  const userIds = entries.map((e) => e.userId);
  const users =
    userIds.length > 0
      ? await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(${userIds})`)
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = entries.map((e, i) => {
    const u = userMap.get(e.userId);
    const levelInfo = u ? getLevelInfo(u.xp) : { level: 1, levelName: "Beginner" };
    return {
      rank: i + 1,
      userId: e.userId,
      username: u?.username ?? "Unknown",
      avatarUrl: u?.avatarUrl ?? null,
      value: e.value,
      level: levelInfo.level,
      levelName: levelInfo.levelName,
      isCurrentUser: e.userId === userId,
    };
  });

  res.json(result);
});

export default router;
