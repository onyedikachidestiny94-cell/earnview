import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      currentUser?: User;
    }
  }
}

function generateReferralCode(clerkId: string): string {
  return "EV" + clerkId.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkUserId),
    });

    if (!user) {
      const claims = (auth?.sessionClaims ?? {}) as Record<string, unknown>;
      const email = (claims["email"] as string | undefined) ?? `${clerkUserId}@earnview.app`;
      const rawUsername =
        (claims["username"] as string | undefined) ??
        (claims["firstName"] as string | undefined) ??
        email.split("@")[0];
      const username = String(rawUsername).slice(0, 40);

      let referralCode = generateReferralCode(clerkUserId);
      // Ensure uniqueness
      const existing = await db.query.usersTable.findFirst({
        where: eq(usersTable.referralCode, referralCode),
      });
      if (existing) {
        referralCode = referralCode + Math.floor(Math.random() * 999).toString();
      }

      const [newUser] = await db
        .insert(usersTable)
        .values({ clerkId: clerkUserId, username, email, referralCode })
        .returning();
      user = newUser;
    }

    if (user.isSuspended) {
      res.status(403).json({ error: "Account suspended" });
      return;
    }

    req.userId = user.id;
    req.currentUser = user;
    next();
  } catch (err) {
    req.log.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.currentUser?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
