import { pgTable, serial, text, doublePrecision, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  rewardAmount: doublePrecision("reward_amount").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  durationSeconds: integer("duration_seconds").notNull().default(30),
  category: text("category").notNull().default("general"),
  isActive: boolean("is_active").notNull().default(true),
  completionCount: integer("completion_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Task = typeof tasksTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
