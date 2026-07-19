import { pgTable, serial, integer, doublePrecision, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tasksTable } from "./tasks";

export const taskCompletionsTable = pgTable("task_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  taskId: integer("task_id").notNull().references(() => tasksTable.id),
  rewardAmount: doublePrecision("reward_amount").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.taskId)]);

export type TaskCompletion = typeof taskCompletionsTable.$inferSelect;
