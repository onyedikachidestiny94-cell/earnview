import { Router } from "express";
import { db, usersTable, achievementsTable, userAchievementsTable, taskCompletionsTable, referralsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { ensureAchievementsSeedeed } from "../lib/achievements";

const router = Router();

// GET /api/achievements
router.get("/achievements", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;

  await ensureAchievementsSeedeed();

  const allAchievements = await db.select().from(achievementsTable);

  const earnedList = await db
    .select({ achievementId: userAchievementsTable.achievementId, earnedAt: userAchievementsTable.earnedAt })
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const earnedMap = new Map(earnedList.map((e) => [e.achievementId, e.earnedAt]));

  const [tasksCompletedRow] = await db
    .select({ count: count() })
    .from(taskCompletionsTable)
    .where(eq(taskCompletionsTable.userId, userId));

  const [referralCountRow] = await db
    .select({ count: count() })
    .from(referralsTable)
    .where(eq(referralsTable.inviterId, userId));

  const statsMap: Record<string, number> = {
    tasks_completed: tasksCompletedRow.count,
    streak_days: user.streakCount,
    referrals: referralCountRow.count,
    earnings: user.totalEarned,
    level: user.level,
  };

  res.json(
    allAchievements.map((a) => {
      const earned = earnedMap.has(a.id);
      const currentValue = statsMap[a.requirement] ?? 0;
      const progress = Math.min(100, Math.floor((currentValue / a.requirementValue) * 100));

      return {
        id: a.id,
        badgeName: a.badgeName,
        description: a.description,
        icon: a.icon,
        requirement: a.requirement,
        requirementValue: a.requirementValue,
        earned,
        earnedAt: earned ? (earnedMap.get(a.id)?.toISOString() ?? null) : null,
        progress: earned ? 100 : progress,
        xpReward: a.xpReward,
      };
    })
  );
});

export default router;
