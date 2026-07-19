import { pgTable, serial, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id").notNull().references(() => usersTable.id),
  referredUserId: integer("referred_user_id").notNull().unique().references(() => usersTable.id),
  rewardAmount: doublePrecision("reward_amount").notNull().default(1.0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
