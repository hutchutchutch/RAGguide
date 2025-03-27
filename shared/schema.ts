import { pgTable, text, serial, integer, timestamp, uuid, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Books table for storing uploaded PDFs
export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  uploaded_at: timestamp("uploaded_at").defaultNow().notNull(),
});

// Embedding settings for configuring the chunking and embedding process
export const embeddingSettings = pgTable("embedding_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  chunk_size: integer("chunk_size").notNull(),
  overlap: integer("overlap").notNull(),
  cleaner: text("cleaner").notNull(), // 'simple' | 'advanced' | 'ocr-optimized'
  strategy: text("strategy").notNull(), // 'recursive' | 'semantic'
  model: text("model").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Chunks table for storing book chunks with embeddings
export const chunks = pgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  book_id: uuid("book_id").references(() => books.id).notNull(),
  chunk_index: integer("chunk_index").notNull(),
  text: text("text").notNull(),
  embedding: text("embedding").notNull(), // Store as JSON string for in-memory use
  page_number: integer("page_number"),
  embedding_settings_id: uuid("embedding_settings_id").references(() => embeddingSettings.id).notNull(),
});

// Chat sessions for storing user interactions
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  book_id: uuid("book_id").references(() => books.id).notNull(),
  question: text("question").notNull(),
  llm_response: text("llm_response").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Chat chunks for tracking which chunks were used in each chat session
export const chatChunks = pgTable("chat_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  chat_id: uuid("chat_id").references(() => chatSessions.id).notNull(),
  chunk_id: uuid("chunk_id").references(() => chunks.id).notNull(),
  rank: integer("rank").notNull(),
  retrieval_type: text("retrieval_type").notNull(), // 'rag' | 'graphrag'
});

// LLM prompts for storing the prompts sent to the LLM
export const llmPrompts = pgTable("llm_prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  chat_id: uuid("chat_id").references(() => chatSessions.id).notNull(),
  system_prompt: text("system_prompt").notNull(),
  context_chunks: text("context_chunks").array().notNull(),
  final_prompt: text("final_prompt").notNull(),
});

// Knowledge graph nodes
export const nodes = pgTable("nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  book_id: uuid("book_id").references(() => books.id).notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(), // 'person' | 'place' | 'object' | 'concept'
  description: text("description"),
});

// Knowledge graph edges (relationships between nodes)
export const edges = pgTable("edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  source_node_id: uuid("source_node_id").references(() => nodes.id).notNull(),
  target_node_id: uuid("target_node_id").references(() => nodes.id).notNull(),
  label: text("label").notNull(),
  explanation: text("explanation"),
});

// Node chunk associations
export const nodeChunks = pgTable("node_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  node_id: uuid("node_id").references(() => nodes.id).notNull(),
  chunk_id: uuid("chunk_id").references(() => chunks.id).notNull(),
});

// Insert schemas
export const insertBookSchema = createInsertSchema(books).omit({ id: true, uploaded_at: true });
export const insertEmbeddingSettingsSchema = createInsertSchema(embeddingSettings).omit({ id: true, created_at: true });
export const insertChunkSchema = createInsertSchema(chunks).omit({ id: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, created_at: true });
export const insertChatChunkSchema = createInsertSchema(chatChunks).omit({ id: true });
export const insertLlmPromptSchema = createInsertSchema(llmPrompts).omit({ id: true });
export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true });
export const insertEdgeSchema = createInsertSchema(edges).omit({ id: true });
export const insertNodeChunkSchema = createInsertSchema(nodeChunks).omit({ id: true });

// Types
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type EmbeddingSettings = typeof embeddingSettings.$inferSelect;
export type InsertEmbeddingSettings = z.infer<typeof insertEmbeddingSettingsSchema>;

export type Chunk = typeof chunks.$inferSelect;
export type InsertChunk = z.infer<typeof insertChunkSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatChunk = typeof chatChunks.$inferSelect;
export type InsertChatChunk = z.infer<typeof insertChatChunkSchema>;

export type LlmPrompt = typeof llmPrompts.$inferSelect;
export type InsertLlmPrompt = z.infer<typeof insertLlmPromptSchema>;

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

export type Edge = typeof edges.$inferSelect;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;

export type NodeChunk = typeof nodeChunks.$inferSelect;
export type InsertNodeChunk = z.infer<typeof insertNodeChunkSchema>;
