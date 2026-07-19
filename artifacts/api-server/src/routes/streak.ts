import { Router } from "express";
import { db, usersTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";
import { checkAndGrantAchievements } from "../lib/achievements";

const router = Router();

// POST /api/streak/checkin
router.post("/streak/checkin", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Check if already checked in today
  if (user.lastCheckinAt && user.lastCheckinAt >= todayStart) {
    res.json({
      success: true,
      alreadyCheckedIn: true,
      streakCount: user.streakCount,
      bonusAmount: 0,
      xpBonus: 0,
    });
    return;
  }

  // Determine streak
  let newStreak = 1;
  if (user.lastCheckinAt) {
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    if (user.lastCheckinAt >= yesterday) {
      // Consecutive day
      newStreak = user.streakCount + 1;
    } else {
      // Missed a day — reset
      newStreak = 1;
    }
  }

  // Calculate bonus
  const bonusAmount = parseFloat((0.10 + 0.02 * Math.min(newStreak, 30)).toFixed(2));
  const xpBonus = 20 + 5 * Math.min(newStreak, 30);
  const newBalance = user.balance + bonusAmount;
  const newTotalEarned = user.totalEarned + bonusAmount;
  const newXp = user.xp + xpBonus;
  const levelInfo = getLevelInfo(newXp);

  await db.update(usersTable)
    .set({
      streakCount: newStreak,
      lastCheckinAt: now,
      balance: newBalance,
      totalEarned: newTotalEarned,
      xp: newXp,
      level: levelInfo.level,
      updatedAt: now,
    })
    .where(eq(usersTable.id, userId));

  await db.insert(transactionsTable).values({
    userId,
    type: "bonus",
    description: `Daily check-in bonus (Day ${newStreak} streak)`,
    amount: bonusAmount,
    balanceAfter: newBalance,
  });

  if (newStreak > 1) {
    await db.insert(notificationsTable).values({
      userId,
      type: "streak",
      title: `${newStreak}-Day Streak!`,
      message: `You're on a ${newStreak}-day streak! You earned $${bonusAmount.toFixed(2)} and +${xpBonus} XP as a bonus.`,
    });
  }

  await checkAndGrantAchievements(userId);

  res.json({
    success: true,
    alreadyCheckedIn: false,
    streakCount: newStreak,
    bonusAmount,
    xpBonus,
  });
});

export default router;
