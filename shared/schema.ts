import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (from the template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Script schema
export const scriptSchema = z.object({
  trump1: z.string(),
  zelensky: z.string(),
  trump2: z.string(),
  vance: z.string(),
});

export type Script = z.infer<typeof scriptSchema>;

// Remix table
export const remixes = pgTable("remixes", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  trumpCaresAbout: text("trump_cares_about").notNull(),
  zelenskyCaresAbout: text("zelensky_cares_about").notNull(),
  vanceCaresAbout: text("vance_cares_about").notNull(),
  script: jsonb("script").$type<Script>().notNull(),
  videoUrl: text("video_url").notNull(),
  audioUrl: text("audio_url").notNull(),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRemixSchema = createInsertSchema(remixes)
  .omit({ id: true, views: true, createdAt: true })
  .extend({
    script: scriptSchema,
  });

export type InsertRemix = z.infer<typeof insertRemixSchema>;
export type Remix = typeof remixes.$inferSelect;

// Form input schema for generating script
export const generateScriptSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  trumpCaresAbout: z.string().min(1, "Please specify what Trump cares about"),
  zelenskyCaresAbout: z.string().min(1, "Please specify what Zelensky cares about"),
  vanceCaresAbout: z.string().min(1, "Please specify what JD Vance cares about"),
});

export type GenerateScriptInput = z.infer<typeof generateScriptSchema>;

// Form input schema for rendering remix
export const renderRemixSchema = generateScriptSchema.extend({
  trump1: z.string().min(1, "Trump's first line is required"),
  zelensky: z.string().min(1, "Zelensky's line is required"),
  trump2: z.string().min(1, "Trump's second line is required"),
  vance: z.string().min(1, "Vance's line is required"),
});

export type RenderRemixInput = z.infer<typeof renderRemixSchema>;
