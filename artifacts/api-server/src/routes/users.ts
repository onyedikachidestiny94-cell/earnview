import { Router } from "express";
import { db, usersTable, referralsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getLevelInfo } from "../lib/levelUtils";

const router = Router();

// GET /api/users/me
router.get("/users/me", requireAuth, async (req, res) => {
  const user = req.currentUser!;
  const levelInfo = getLevelInfo(user.xp);
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    balance: user.balance,
    totalEarned: user.totalEarned,
    xp: user.xp,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
    streakCount: user.streakCount,
    referralCode: user.referralCode,
    isAdmin: user.isAdmin,
    isSuspended: user.isSuspended,
    lastCheckinAt: user.lastCheckinAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

// PUT /api/users/me
router.put("/users/me", requireAuth, async (req, res) => {
  const { username, avatarUrl } = req.body as { username?: string; avatarUrl?: string };
  const userId = req.userId!;

  const updates: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if (username && typeof username === "string") updates.username = username.slice(0, 40);
  if (avatarUrl && typeof avatarUrl === "string") updates.avatarUrl = avatarUrl;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const levelInfo = getLevelInfo(updated.xp);

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    username: updated.username,
    email: updated.email,
    avatarUrl: updated.avatarUrl ?? null,
    balance: updated.balance,
    totalEarned: updated.totalEarned,
    xp: updated.xp,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
    streakCount: updated.streakCount,
    referralCode: updated.referralCode,
    isAdmin: updated.isAdmin,
    isSuspended: updated.isSuspended,
    lastCheckinAt: updated.lastCheckinAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

// POST /api/users/apply-referral
router.post("/users/apply-referral", requireAuth, async (req, res) => {
  const { referralCode } = req.body as { referralCode?: string };
  const userId = req.userId!;

  if (!referralCode) {
    res.status(400).json({ error: "Referral code required" });
    return;
  }

  // Check if already referred
  const alreadyReferred = await db.query.referralsTable.findFirst({
    where: eq(referralsTable.referredUserId, userId),
  });

  if (alreadyReferred) {
    res.status(400).json({ error: "Already used a referral code" });
    return;
  }

  // Find inviter
  const inviter = await db.query.usersTable.findFirst({
    where: eq(usersTable.referralCode, referralCode.toUpperCase()),
  });

  if (!inviter || inviter.id === userId) {
    res.status(400).json({ error: "Invalid referral code" });
    return;
  }

  const rewardAmount = 1.0;

  // Give inviter a reward
  const [updatedInviter] = await db.update(usersTable)
    .set({
      balance: inviter.balance + rewardAmount,
      totalEarned: inviter.totalEarned + rewardAmount,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, inviter.id))
    .returning();

  await db.insert(transactionsTable).values({
    userId: inviter.id,
    type: "referral",
    description: `Referral bonus for inviting ${req.currentUser!.username}`,
    amount: rewardAmount,
    balanceAfter: updatedInviter.balance,
  });

  await db.insert(referralsTable).values({
    inviterId: inviter.id,
    referredUserId: userId,
    rewardAmount,
  });

  await db.insert(notificationsTable).values({
    userId: inviter.id,
    type: "referral",
    title: "Referral Bonus!",
    message: `${req.currentUser!.username} joined using your referral code. You earned $${rewardAmount.toFixed(2)}!`,
  });

  res.json({ success: true, message: "Referral applied" });
});

export default router;
