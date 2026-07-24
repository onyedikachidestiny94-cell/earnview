import { Router } from "express";
import { db, adsAuditTable, usersTable, taskCompletionsTable, transactionsTable, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// POST /api/ads/verify
// Expected body: { taskId, provider, providerPayload }
// This endpoint attempts server-side verification with the ad provider (Monetag) if configured.
// For now it records an audit row and returns success; when MONETAG creds are present it will call Monetag.
router.post("/ads/verify", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { taskId, provider, providerPayload } = req.body as any;
    if (!taskId || !provider) {
      res.status(400).json({ error: "Missing taskId or provider" });
      return;
    }

    // Record an audit row (assumes adsAuditTable exists in your schema)
    await db.insert(adsAuditTable).values({
      userId,
      taskId,
      provider,
      providerPayload: JSON.stringify(providerPayload),
      verificationStatus: "pending",
    });

    // TODO: if MONETAG_VERIFY_URL is set, call Monetag server verification here and update the audit row

    res.json({ success: true });
  } catch (err: any) {
    console.error("/api/ads/verify error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
