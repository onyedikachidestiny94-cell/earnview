import { db, usersTable, achievementsTable, userAchievementsTable, taskCompletionsTable, referralsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, count, and, sum, sql } from "drizzle-orm";
import { ACHIEVEMENT_DEFINITIONS, getLevelInfo } from "./levelUtils";

export async function ensureAchievementsSeedeed() {
  const existing = await db.select({ id: achievementsTable.id }).from(achievementsTable).limit(1);
  if (existing.length > 0) return;

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await db.insert(achievementsTable).values(def).onConflictDoNothing();
  }
}

export async function checkAndGrantAchievements(userId: number): Promise<string[]> {
  await ensureAchievementsSeedeed();

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) return [];

  const allAchievements = await db.select().from(achievementsTable);
  const earned = await db.select({ achievementId: userAchievementsTable.achievementId })
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const [taskCountRow] = await db
    .select({ count: count() })
    .from(taskCompletionsTable)
    .where(eq(taskCompletionsTable.userId, userId));
  const tasksCompleted = taskCountRow?.count ?? 0;

  const [referralCountRow] = await db
    .select({ count: count() })
    .from(referralsTable)
    .where(eq(referralsTable.inviterId, userId));
  const referralCount = referralCountRow?.count ?? 0;

  const newlyGranted: string[] = [];

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue;

    let met = false;
    switch (achievement.requirement) {
      case "tasks_completed":
        met = tasksCompleted >= achievement.requirementValue;
        break;
      case "streak_days":
        met = user.streakCount >= achievement.requirementValue;
        break;
      case "referrals":
        met = referralCount >= achievement.requirementValue;
        break;
      case "earnings":
        met = user.totalEarned >= achievement.requirementValue;
        break;
      case "level":
        met = user.level >= achievement.requirementValue;
        break;
    }

    if (met) {
      await db.insert(userAchievementsTable).values({
        userId,
        achievementId: achievement.id,
      });

      // Award XP
      const newXp = user.xp + achievement.xpReward;
      const levelInfo = getLevelInfo(newXp);
      await db.update(usersTable)
        .set({ xp: newXp, level: levelInfo.level, updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      // Create notification
      await db.insert(notificationsTable).values({
        userId,
        type: "achievement",
        title: "Achievement Unlocked!",
        message: `You earned the "${achievement.badgeName}" badge and +${achievement.xpReward} XP`,
      });

      newlyGranted.push(achievement.badgeName);
      earnedIds.add(achievement.id);
    }
  }

  return newlyGranted;
}
