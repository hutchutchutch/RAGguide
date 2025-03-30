import { IStorage } from './storage';
import { 
  Book, InsertBook, 
  EmbeddingSettings, InsertEmbeddingSettings,
  Chunk, InsertChunk,
  ChatSession, InsertChatSession,
  ChatChunk, InsertChatChunk,
  LlmPrompt, InsertLlmPrompt,
  Node, InsertNode,
  Edge, InsertEdge,
  NodeChunk, InsertNodeChunk
} from '../shared/schema';
import { db } from './lib/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '../shared/schema';

/**
 * PostgreSQL implementation of the IStorage interface
 * This class provides persistent storage in a PostgreSQL database
 */
export class PgStorage implements IStorage {
  // Book operations
  async getBooks(): Promise<Book[]> {
    return await db.select().from(schema.books);
  }

  async getBook(id: string): Promise<Book | undefined> {
    const results = await db.select().from(schema.books).where(eq(schema.books.id, id));
    return results[0];
  }

  async createBook(book: InsertBook): Promise<Book> {
    const results = await db.insert(schema.books).values(book).returning();
    return results[0];
  }

  // Embedding settings operations
  async getEmbeddingSettings(id: string): Promise<EmbeddingSettings | undefined> {
    const results = await db.select().from(schema.embeddingSettings).where(eq(schema.embeddingSettings.id, id));
    return results[0];
  }

  async createEmbeddingSettings(settings: InsertEmbeddingSettings): Promise<EmbeddingSettings> {
    const results = await db.insert(schema.embeddingSettings).values(settings).returning();
    return results[0];
  }

  // Chunk operations
  async getChunks(bookId: string, settingsId: string): Promise<Chunk[]> {
    return await db.select().from(schema.chunks).where(
      and(
        eq(schema.chunks.book_id, bookId),
        eq(schema.chunks.embedding_settings_id, settingsId)
      )
    );
  }

  async getChunk(id: string): Promise<Chunk | undefined> {
    const results = await db.select().from(schema.chunks).where(eq(schema.chunks.id, id));
    return results[0];
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    // Parse the embedding JSON string to array for the vector field
    const embeddingArray = JSON.parse(chunk.embedding);
    
    // Insert with both the text embedding and the vector embedding
    const results = await db.insert(schema.chunks).values({
      ...chunk,
      embedding_vector: embeddingArray
    }).returning();
    
    return results[0];
  }

  async createChunks(chunks: InsertChunk[]): Promise<Chunk[]> {
    if (chunks.length === 0) return [];
    
    // Parse embedding for each chunk and add the vector field
    const chunksWithVectors = chunks.map(chunk => {
      const embeddingArray = JSON.parse(chunk.embedding);
      return {
        ...chunk,
        embedding_vector: embeddingArray
      };
    });
    
    const results = await db.insert(schema.chunks).values(chunksWithVectors).returning();
    return results;
  }

  // Chat session operations
  async getChatSessions(bookId: string): Promise<ChatSession[]> {
    return await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.book_id, bookId));
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const results = await db.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, id));
    return results[0];
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const results = await db.insert(schema.chatSessions).values(session).returning();
    return results[0];
  }

  // Chat chunk operations
  async getChatChunks(chatId: string): Promise<ChatChunk[]> {
    return await db.select().from(schema.chatChunks).where(eq(schema.chatChunks.chat_id, chatId));
  }

  async createChatChunk(chatChunk: InsertChatChunk): Promise<ChatChunk> {
    const results = await db.insert(schema.chatChunks).values(chatChunk).returning();
    return results[0];
  }

  // LLM prompt operations
  async getLlmPrompt(chatId: string): Promise<LlmPrompt | undefined> {
    const results = await db.select().from(schema.llmPrompts).where(eq(schema.llmPrompts.chat_id, chatId));
    return results[0];
  }

  async createLlmPrompt(prompt: InsertLlmPrompt): Promise<LlmPrompt> {
    const results = await db.insert(schema.llmPrompts).values(prompt).returning();
    return results[0];
  }

  // Knowledge graph node operations
  async getNodes(bookId: string): Promise<Node[]> {
    return await db.select().from(schema.nodes).where(eq(schema.nodes.book_id, bookId));
  }

  async getNode(id: string): Promise<Node | undefined> {
    const results = await db.select().from(schema.nodes).where(eq(schema.nodes.id, id));
    return results[0];
  }

  async createNode(node: InsertNode): Promise<Node> {
    const results = await db.insert(schema.nodes).values(node).returning();
    return results[0];
  }

  // Knowledge graph edge operations
  async getEdges(bookId: string): Promise<Edge[]> {
    // Join with nodes to get edges for a specific book
    const results = await db.select().from(schema.edges)
      .innerJoin(schema.nodes, eq(schema.edges.source_node_id, schema.nodes.id))
      .where(eq(schema.nodes.book_id, bookId));
    
    // Extract just the edge data
    return results.map(r => r.edges);
  }

  async getEdge(id: string): Promise<Edge | undefined> {
    const results = await db.select().from(schema.edges).where(eq(schema.edges.id, id));
    return results[0];
  }

  async createEdge(edge: InsertEdge): Promise<Edge> {
    const results = await db.insert(schema.edges).values(edge).returning();
    return results[0];
  }

  // Node chunk associations
  async getNodeChunks(nodeId: string): Promise<NodeChunk[]> {
    return await db.select().from(schema.nodeChunks).where(eq(schema.nodeChunks.node_id, nodeId));
  }

  async createNodeChunk(nodeChunk: InsertNodeChunk): Promise<NodeChunk> {
    const results = await db.insert(schema.nodeChunks).values(nodeChunk).returning();
    return results[0];
  }
}