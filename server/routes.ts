import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import * as openaiLib from "./lib/openai";
import { GoogleDriveService } from "./lib/drive";
import { setupAuth, isAuthenticated, hasGoogleDriveAccess } from "./lib/auth";
import { z } from "zod";
import {
  insertBookSchema,
  insertEmbeddingSettingsSchema,
  insertChunkSchema,
  insertChatSessionSchema,
  insertChatChunkSchema,
  insertLlmPromptSchema,
  insertNodeSchema,
  insertEdgeSchema,
  insertNodeChunkSchema,
} from "@shared/schema";

// Schema for rating an embedding setting
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5)
});

// Set up file storage for PDFs
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = uuidv4();
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are allowed"));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Add a fallback handler for Google OAuth callback to handle any redirect issues
  app.get("/api/auth/google/callback", (req: Request, res: Response) => {
    console.log("Fallback handler for OAuth callback triggered");
    res.redirect("/");
  });
  // Book routes
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books", error: error.message });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch book", error: error.message });
    }
  });

  app.post("/api/books", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const bookData = insertBookSchema.parse({
        title: req.body.title,
        filename: req.file.filename,
      });

      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: "Failed to create book", error: error.message });
    }
  });

  // Embedding settings routes
  app.get("/api/embedding-settings", async (req, res) => {
    try {
      const settings = await storage.getEmbeddingSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch embedding settings", error: error.message });
    }
  });
  
  app.get("/api/embedding-settings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = await storage.getEmbeddingSettingsById(id);
      
      if (!settings) {
        return res.status(404).json({ message: "Embedding settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch embedding settings", error: error.message });
    }
  });
  
  app.post("/api/embedding-settings", async (req, res) => {
    try {
      const settingsData = insertEmbeddingSettingsSchema.parse(req.body);
      const settings = await storage.createEmbeddingSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to create embedding settings", error: error.message });
    }
  });
  
  app.post("/api/embedding-settings/:id/rate", async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = ratingSchema.parse(req.body);
      
      // First get the existing settings
      const settings = await storage.getEmbeddingSettingsById(id);
      
      if (!settings) {
        return res.status(404).json({ message: "Embedding settings not found" });
      }
      
      // Update the rating
      const updatedSettings = await storage.updateEmbeddingSettings(id, { ...settings, rating });
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Failed to rate embedding settings", error: error.message });
    }
  });

  // Chunk routes
  app.get("/api/books/:bookId/chunks", async (req, res) => {
    try {
      const { bookId } = req.params;
      const { settingsId } = req.query;

      if (!settingsId || typeof settingsId !== "string") {
        return res.status(400).json({ message: "Embedding settings ID is required" });
      }

      const chunks = await storage.getChunks(bookId, settingsId);
      res.json(chunks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chunks", error: error.message });
    }
  });

  app.post("/api/chunks", async (req, res) => {
    try {
      const chunkData = insertChunkSchema.parse(req.body);
      const chunk = await storage.createChunk(chunkData);
      res.status(201).json(chunk);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chunk", error: error.message });
    }
  });

  app.post("/api/chunks/batch", async (req, res) => {
    try {
      const chunksData = req.body.map((chunk: any) => insertChunkSchema.parse(chunk));
      const chunks = await storage.createChunks(chunksData);
      res.status(201).json(chunks);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chunks", error: error.message });
    }
  });

  // Chat session routes
  app.get("/api/books/:bookId/chat-sessions", async (req, res) => {
    try {
      const { bookId } = req.params;
      const chatSessions = await storage.getChatSessions(bookId);
      res.json(chatSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat sessions", error: error.message });
    }
  });

  app.post("/api/chat-sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chat session", error: error.message });
    }
  });

  // Chat chunk routes
  app.get("/api/chat-sessions/:chatId/chunks", async (req, res) => {
    try {
      const { chatId } = req.params;
      const chatChunks = await storage.getChatChunks(chatId);
      
      // Fetch the actual chunk data for each chat chunk
      const fullChunks = await Promise.all(
        chatChunks.map(async (chatChunk) => {
          const chunk = await storage.getChunk(chatChunk.chunk_id);
          return {
            ...chatChunk,
            chunk,
          };
        })
      );
      
      res.json(fullChunks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat chunks", error: error.message });
    }
  });

  app.post("/api/chat-chunks", async (req, res) => {
    try {
      const chatChunkData = insertChatChunkSchema.parse(req.body);
      const chatChunk = await storage.createChatChunk(chatChunkData);
      res.status(201).json(chatChunk);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chat chunk", error: error.message });
    }
  });

  // LLM prompt routes
  app.get("/api/chat-sessions/:chatId/prompt", async (req, res) => {
    try {
      const { chatId } = req.params;
      const prompt = await storage.getLlmPrompt(chatId);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch LLM prompt", error: error.message });
    }
  });

  app.post("/api/llm-prompts", async (req, res) => {
    try {
      const promptData = insertLlmPromptSchema.parse(req.body);
      const prompt = await storage.createLlmPrompt(promptData);
      res.status(201).json(prompt);
    } catch (error) {
      res.status(400).json({ message: "Failed to create LLM prompt", error: error.message });
    }
  });

  // Knowledge graph routes
  app.get("/api/books/:bookId/nodes", async (req, res) => {
    try {
      const { bookId } = req.params;
      const nodes = await storage.getNodes(bookId);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nodes", error: error.message });
    }
  });

  app.post("/api/nodes", async (req, res) => {
    try {
      const nodeData = insertNodeSchema.parse(req.body);
      const node = await storage.createNode(nodeData);
      res.status(201).json(node);
    } catch (error) {
      res.status(400).json({ message: "Failed to create node", error: error.message });
    }
  });

  app.get("/api/books/:bookId/edges", async (req, res) => {
    try {
      const { bookId } = req.params;
      const edges = await storage.getEdges(bookId);
      res.json(edges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch edges", error: error.message });
    }
  });

  app.post("/api/edges", async (req, res) => {
    try {
      const edgeData = insertEdgeSchema.parse(req.body);
      const edge = await storage.createEdge(edgeData);
      res.status(201).json(edge);
    } catch (error) {
      res.status(400).json({ message: "Failed to create edge", error: error.message });
    }
  });

  // Node-chunk associations
  app.get("/api/nodes/:nodeId/chunks", async (req, res) => {
    try {
      const { nodeId } = req.params;
      const nodeChunks = await storage.getNodeChunks(nodeId);
      
      // Fetch the actual chunk data for each node chunk
      const fullChunks = await Promise.all(
        nodeChunks.map(async (nodeChunk) => {
          const chunk = await storage.getChunk(nodeChunk.chunk_id);
          return {
            ...nodeChunk,
            chunk,
          };
        })
      );
      
      res.json(fullChunks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch node chunks", error: error.message });
    }
  });

  app.post("/api/node-chunks", async (req, res) => {
    try {
      const nodeChunkData = insertNodeChunkSchema.parse(req.body);
      const nodeChunk = await storage.createNodeChunk(nodeChunkData);
      res.status(201).json(nodeChunk);
    } catch (error) {
      res.status(400).json({ message: "Failed to create node chunk", error: error.message });
    }
  });

  // Knowledge graph full data (nodes + edges)
  app.get("/api/books/:bookId/knowledge-graph", async (req, res) => {
    try {
      const { bookId } = req.params;
      const nodes = await storage.getNodes(bookId);
      const edges = await storage.getEdges(bookId);
      
      res.json({
        nodes,
        edges,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge graph", error: error.message });
    }
  });

  // OpenAI API routes
  app.post("/api/openai/embeddings", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add your API key in the environment variables." 
        });
      }

      const { input, model } = req.body;
      
      if (!input) {
        return res.status(400).json({ message: "Input text is required" });
      }
      
      const embedding = await openaiLib.getEmbedding(input, model);
      res.json({ embedding });
    } catch (error) {
      console.error("Error generating embeddings:", error);
      res.status(500).json({ 
        message: "Failed to generate embeddings", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/openai/chat", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add your API key in the environment variables." 
        });
      }

      const { messages, model } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Valid messages array is required" });
      }
      
      const content = await openaiLib.generateCompletion(messages, model);
      res.json({ content });
    } catch (error) {
      console.error("Error generating chat completion:", error);
      res.status(500).json({ 
        message: "Failed to generate chat completion", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Google Drive Integration Routes
  
  // List documents from Google Drive
  app.get("/api/drive/documents", hasGoogleDriveAccess, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const documents = await GoogleDriveService.listDocuments(user.google_access_token);
      res.json(documents);
    } catch (error) {
      console.error("Error listing documents from Google Drive:", error);
      res.status(500).json({ 
        message: "Failed to list documents from Google Drive", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Import document from Google Drive
  app.post("/api/drive/import", hasGoogleDriveAccess, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { fileId, fileName } = req.body;
      
      if (!fileId || !fileName) {
        return res.status(400).json({ message: "File ID and file name are required" });
      }
      
      // Download the file from Google Drive
      const filePath = await GoogleDriveService.downloadFile(
        user.google_access_token, 
        fileId, 
        fileName
      );
      
      // Create a book record for the imported file
      const bookData = insertBookSchema.parse({
        title: fileName,
        filename: path.basename(filePath),
        user_id: user.id,
        source: "google_drive",
        drive_file_id: fileId
      });
      
      const book = await storage.createBook(bookData);
      
      // Move file from temp directory to uploads directory
      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const destination = path.join(uploadDir, path.basename(filePath));
      fs.copyFileSync(filePath, destination);
      
      // Response with created book
      res.status(201).json(book);
    } catch (error) {
      console.error("Error importing document from Google Drive:", error);
      res.status(500).json({
        message: "Failed to import document from Google Drive",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get user's books
  app.get("/api/user/books", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const books = await storage.getBooksByUserId(user.id);
      res.json(books);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user's books", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
