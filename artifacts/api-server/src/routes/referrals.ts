import { Router } from "express";
import { db, usersTable, referralsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/referrals
router.get("/referrals", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = req.currentUser!;

  const referralList = await db
    .select({
      id: referralsTable.id,
      rewardAmount: referralsTable.rewardAmount,
      createdAt: referralsTable.createdAt,
      referredUsername: usersTable.username,
    })
    .from(referralsTable)
    .innerJoin(usersTable, eq(referralsTable.referredUserId, usersTable.id))
    .where(eq(referralsTable.inviterId, userId))
    .orderBy(referralsTable.createdAt);

  const totalEarned = referralList.reduce((sum, r) => sum + r.rewardAmount, 0);
  const host = req.headers.host ?? "earnview.app";
  const referralLink = `https://${host}/?ref=${user.referralCode}`;

  res.json({
    referralCode: user.referralCode,
    referralLink,
    totalReferrals: referralList.length,
    totalEarned,
    referrals: referralList.map((r) => ({
      id: r.id,
      referredUsername: r.referredUsername,
      rewardAmount: r.rewardAmount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
