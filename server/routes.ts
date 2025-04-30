import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateScript } from "./openai";
import { generateSpeech } from "./tts";
import { createVideo } from "./video";
import { z } from "zod";
import { generateScriptSchema, renderRemixSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Generate a script using OpenAI
  app.post("/api/generate", async (req, res) => {
    try {
      const validatedData = generateScriptSchema.parse(req.body);
      
      const script = await generateScript(
        validatedData.topic,
        validatedData.trumpCaresAbout,
        validatedData.zelenskyCaresAbout,
        validatedData.vanceCaresAbout
      );
      
      res.json(script);
    } catch (error) {
      console.error("Script generation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to generate script" 
      });
    }
  });
  
  // Render a remix with TTS and video
  app.post("/api/render", async (req, res) => {
    try {
      const validatedData = renderRemixSchema.parse(req.body);
      
      // Generate unique IDs for the audio and video files
      const id = randomUUID();
      
      // Create script object
      const script = {
        trump1: validatedData.trump1,
        zelensky: validatedData.zelensky,
        trump2: validatedData.trump2,
        vance: validatedData.vance
      };
      
      // Generate TTS audio for each line
      const trumpAudio1 = await generateSpeech("trump", script.trump1);
      const zelenskyAudio = await generateSpeech("zelensky", script.zelensky);
      const trumpAudio2 = await generateSpeech("trump", script.trump2);
      const vanceAudio = await generateSpeech("vance", script.vance);
      
      // Create video with the audio
      const { videoUrl, audioUrl } = await createVideo(
        id,
        trumpAudio1,
        zelenskyAudio,
        trumpAudio2,
        vanceAudio
      );
      
      // Save remix to storage
      const remix = await storage.createRemix({
        topic: validatedData.topic,
        trumpCaresAbout: validatedData.trumpCaresAbout,
        zelenskyCaresAbout: validatedData.zelenskyCaresAbout,
        vanceCaresAbout: validatedData.vanceCaresAbout,
        script,
        videoUrl,
        audioUrl
      });
      
      res.json({ 
        message: "Remix created successfully", 
        id: remix.id
      });
    } catch (error) {
      console.error("Remix creation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create remix" 
      });
    }
  });
  
  // Get a specific rot by ID
  app.get("/api/remixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rot ID" });
      }
      
      const remix = await storage.getRemix(id);
      
      if (!remix) {
        return res.status(404).json({ message: "Rot not found" });
      }
      
      res.json(remix);
    } catch (error) {
      console.error("Error fetching remix:", error);
      res.status(500).json({ message: "Failed to fetch remix" });
    }
  });
  
  // Track a view for a rot
  app.post("/api/remixes/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rot ID" });
      }
      
      await storage.incrementViews(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });
  
  // Get popular rots
  app.get("/api/remixes/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const remixes = await storage.getPopularRemixes(limit);
      
      res.json(remixes);
    } catch (error) {
      console.error("Error fetching popular rots:", error);
      res.status(500).json({ message: "Failed to fetch rots" });
    }
  });
  
  // Get related rots
  app.get("/api/remixes/related/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rot ID" });
      }
      
      const limit = parseInt(req.query.limit as string) || 4;
      const remixes = await storage.getRelatedRemixes(id, limit);
      
      res.json(remixes);
    } catch (error) {
      console.error("Error fetching related rots:", error);
      res.status(500).json({ message: "Failed to fetch rots" });
    }
  });
  
  // Get all remixes with search and sort
  app.get("/api/remixes", async (req, res) => {
    try {
      const search = req.query.search as string || "";
      const sortBy = req.query.sortBy as "newest" | "popular" || "popular";
      const limit = parseInt(req.query.limit as string) || 20;
      
      const remixes = await storage.getRemixes(search, sortBy, limit);
      
      res.json(remixes);
    } catch (error) {
      console.error("Error fetching remixes:", error);
      res.status(500).json({ message: "Failed to fetch remixes" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
