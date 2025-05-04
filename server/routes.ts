import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateScript } from "./openai";
import { generateSpeech } from "./tts";
import { createVideo, generateTTS } from "./video";
import { z } from "zod";
import { generateScriptSchema, renderRemixSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import path from "path";

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
  
  // Render a rot with TTS and video
  app.post("/api/render", async (req, res) => {
    try {
      const validatedData = renderRemixSchema.parse(req.body);
      
      // Generate unique ID for the remix
      const id = randomUUID();
      
      // Create script object
      const script = {
        trump1: validatedData.trump1,
        zelensky: validatedData.zelensky,
        trump2: validatedData.trump2,
        vance: validatedData.vance
      };
      
      console.log(`Generating TTS for remix ${id}`);
      
      // Generate all TTS audio files using our new Python processor
      const audioFiles = await generateTTS(script);
      
      console.log(`TTS generated successfully for remix ${id}:`, audioFiles);
      
      // Create the final video with the audio files
      const { videoUrl, clipInfo } = await createVideo(
        id,
        audioFiles.trump1,
        audioFiles.zelensky,
        audioFiles.trump2,
        audioFiles.vance
      );
      
      console.log(`Video generated successfully for remix ${id}: ${videoUrl}`);
      console.log(`Clip info prepared for remix ${id}:`, clipInfo);
      
      // Save rot to storage
      const remix = await storage.createRemix({
        topic: validatedData.topic,
        trumpCaresAbout: validatedData.trumpCaresAbout,
        zelenskyCaresAbout: validatedData.zelenskyCaresAbout,
        vanceCaresAbout: validatedData.vanceCaresAbout,
        script,
        videoUrl,
        audioUrl: "", // We don't return a separate audio URL anymore
        clipInfo: clipInfo
      });
      
      res.json({ 
        message: "Rot created successfully", 
        id: remix.id
      });
    } catch (error) {
      console.error("Rot creation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create rot" 
      });
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
      console.error("Error fetching rot:", error);
      res.status(500).json({ message: "Failed to fetch rot" });
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
  

  
  // Get all rots with search and sort
  app.get("/api/remixes", async (req, res) => {
    try {
      const search = req.query.search as string || "";
      const sortBy = req.query.sortBy as "newest" | "popular" || "popular";
      const limit = parseInt(req.query.limit as string) || 20;
      
      const remixes = await storage.getRemixes(search, sortBy, limit);
      
      res.json(remixes);
    } catch (error) {
      console.error("Error fetching rots:", error);
      res.status(500).json({ message: "Failed to fetch rots" });
    }
  });

  // Serve videos from the static/videos directory
  app.get("/videos/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Security check to prevent directory traversal attacks
      if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ message: "Invalid video filename" });
      }
      
      const videoPath = path.join(process.cwd(), "static", "videos", filename);
      
      console.log(`Serving video: ${videoPath}`);
      
      // Check if the video file exists
      const fs = require("fs");
      if (!fs.existsSync(videoPath)) {
        console.error(`Video file not found: ${videoPath}`);
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Stream the video file with proper content type
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Cache-Control", "max-age=3600"); // Cache for 1 hour
      fs.createReadStream(videoPath).pipe(res);
    } catch (error) {
      console.error("Error serving video:", error);
      res.status(500).json({ message: "Failed to serve video" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
