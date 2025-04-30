import { users, type User, type InsertUser, Remix, InsertRemix } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private remixes: Map<number, Remix>;
  private userCurrentId: number;
  private remixCurrentId: number;

  constructor() {
    this.users = new Map();
    this.remixes = new Map();
    this.userCurrentId = 1;
    this.remixCurrentId = 1;
  }

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Remix methods
  async createRemix(insertRemix: InsertRemix): Promise<Remix> {
    const id = this.remixCurrentId++;
    const now = new Date();
    
    const remix: Remix = { 
      ...insertRemix, 
      id, 
      views: 0, 
      createdAt: now 
    };
    
    this.remixes.set(id, remix);
    return remix;
  }
  
  async getRemix(id: number): Promise<Remix | undefined> {
    return this.remixes.get(id);
  }
  
  async getRemixes(search: string, sortBy: "newest" | "popular", limit: number): Promise<Remix[]> {
    let remixes = Array.from(this.remixes.values());
    
    // Apply search filter if provided
    if (search) {
      const lowerSearch = search.toLowerCase();
      remixes = remixes.filter(remix => 
        remix.topic.toLowerCase().includes(lowerSearch) ||
        remix.trumpCaresAbout.toLowerCase().includes(lowerSearch) ||
        remix.zelenskyCaresAbout.toLowerCase().includes(lowerSearch) ||
        remix.vanceCaresAbout.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Apply sort
    if (sortBy === "newest") {
      remixes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Sort by popularity (views)
      remixes.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    
    // Apply limit
    return remixes.slice(0, limit);
  }
  
  async getPopularRemixes(limit: number): Promise<Remix[]> {
    return this.getRemixes("", "popular", limit);
  }
  
  async getRelatedRemixes(remixId: number, limit: number): Promise<Remix[]> {
    const sourceRemix = this.remixes.get(remixId);
    if (!sourceRemix) {
      return [];
    }
    
    // Get all remixes except the source
    let remixes = Array.from(this.remixes.values())
      .filter(remix => remix.id !== remixId);
    
    // Calculate relevance score based on topic similarity
    const scoredRemixes = remixes.map(remix => {
      let score = 0;
      
      // Simple string matching for similarity
      if (remix.topic.toLowerCase().includes(sourceRemix.topic.toLowerCase()) ||
          sourceRemix.topic.toLowerCase().includes(remix.topic.toLowerCase())) {
        score += 5;
      }
      
      if (remix.trumpCaresAbout === sourceRemix.trumpCaresAbout) score += 1;
      if (remix.zelenskyCaresAbout === sourceRemix.zelenskyCaresAbout) score += 1;
      if (remix.vanceCaresAbout === sourceRemix.vanceCaresAbout) score += 1;
      
      return { remix, score };
    });
    
    // Sort by relevance score then by views
    scoredRemixes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.remix.views || 0) - (a.remix.views || 0);
    });
    
    return scoredRemixes.slice(0, limit).map(item => item.remix);
  }
  
  async incrementViews(remixId: number): Promise<void> {
    const remix = this.remixes.get(remixId);
    if (remix) {
      remix.views = (remix.views || 0) + 1;
      this.remixes.set(remixId, remix);
    }
  }
}

export const storage = new MemStorage();
