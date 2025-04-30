import { users, type User, type InsertUser, Remix, InsertRemix, remixes } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, like, or, and, not } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Remix methods
  createRemix(remix: InsertRemix): Promise<Remix>;
  getRemix(id: number): Promise<Remix | undefined>;
  getRemixes(search: string, sortBy: "newest" | "popular", limit: number): Promise<Remix[]>;
  getPopularRemixes(limit: number): Promise<Remix[]>;
  getRelatedRemixes(remixId: number, limit: number): Promise<Remix[]>;
  incrementViews(remixId: number): Promise<void>;
}

// Database-based storage implementation
export class DatabaseStorage implements IStorage {
  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Remix methods
  async createRemix(insertRemix: InsertRemix): Promise<Remix> {
    const [remix] = await db
      .insert(remixes)
      .values(insertRemix)
      .returning();
    return remix;
  }
  
  async getRemix(id: number): Promise<Remix | undefined> {
    const [remix] = await db
      .select()
      .from(remixes)
      .where(eq(remixes.id, id));
    return remix;
  }
  
  async getRemixes(search: string, sortBy: "newest" | "popular", limit: number): Promise<Remix[]> {
    // Build base query
    let queryBuilder = db.select().from(remixes);
    
    // Apply search filter if provided
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      queryBuilder = queryBuilder.where(
        or(
          like(sql`LOWER(${remixes.topic})`, searchPattern),
          like(sql`LOWER(${remixes.trumpCaresAbout})`, searchPattern),
          like(sql`LOWER(${remixes.zelenskyCaresAbout})`, searchPattern),
          like(sql`LOWER(${remixes.vanceCaresAbout})`, searchPattern)
        )
      );
    }
    
    // Apply sort
    if (sortBy === "newest") {
      queryBuilder = queryBuilder.orderBy(desc(remixes.createdAt));
    } else {
      // Sort by popularity (views)
      queryBuilder = queryBuilder.orderBy(desc(remixes.views));
    }
    
    // Apply limit
    const results = await queryBuilder.limit(limit);
    
    return results;
  }
  
  async getPopularRemixes(limit: number): Promise<Remix[]> {
    return this.getRemixes("", "popular", limit);
  }
  
  async getRelatedRemixes(remixId: number, limit: number): Promise<Remix[]> {
    // Get the source remix first
    const sourceRemix = await this.getRemix(remixId);
    if (!sourceRemix) {
      return [];
    }
    
    // Find remixes with similar topics or character interests
    const relatedRemixes = await db
      .select()
      .from(remixes)
      .where(
        and(
          not(eq(remixes.id, remixId)),
          or(
            like(sql`LOWER(${remixes.topic})`, `%${sourceRemix.topic.toLowerCase()}%`),
            eq(remixes.trumpCaresAbout, sourceRemix.trumpCaresAbout),
            eq(remixes.zelenskyCaresAbout, sourceRemix.zelenskyCaresAbout),
            eq(remixes.vanceCaresAbout, sourceRemix.vanceCaresAbout)
          )
        )
      )
      .orderBy(desc(remixes.views))
      .limit(limit);
    
    return relatedRemixes;
  }
  
  async incrementViews(remixId: number): Promise<void> {
    await db
      .update(remixes)
      .set({ views: sql`${remixes.views} + 1` })
      .where(eq(remixes.id, remixId));
  }
}

export const storage = new DatabaseStorage();
