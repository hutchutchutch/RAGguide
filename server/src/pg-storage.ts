import { IStorage } from './storage';
import { 
  User, InsertUser,
  Book, InsertBook, 
  EmbeddingSettings, InsertEmbeddingSettings,
  Chunk, InsertChunk,
  ChatSession, InsertChatSession,
  ChatChunk, InsertChatChunk,
  LlmPrompt, InsertLlmPrompt,
  Node, InsertNode,
  Edge, InsertEdge,
  NodeChunk, InsertNodeChunk
} from '../../shared/schema';
import { db } from './lib/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
const { Pool } = pg;
import { log } from '../vite';

/**
 * PostgreSQL implementation of the IStorage interface
 * This class provides persistent storage in a PostgreSQL database
 */
export class PgStorage implements IStorage {
  readonly sessionStore: session.Store;
  
  constructor() {
    // Create a pool connection to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create the session store with PostgreSQL
    const PostgresStore = connectPgSimple(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
    });
    
    log('PostgreSQL session store initialized', 'auth');
  }

  private get dbOrThrow() {
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await this.dbOrThrow.select().from(schema.users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const results = await this.dbOrThrow.select().from(schema.users).where(eq(schema.users.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await this.dbOrThrow.select().from(schema.users).where(eq(schema.users.email, email));
    return results[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const results = await this.dbOrThrow.select().from(schema.users).where(eq(schema.users.google_id, googleId));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.dbOrThrow.insert(schema.users).values(user).returning();
    return results[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const results = await this.dbOrThrow.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    
    if (results.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return results[0];
  }

  // Book operations
  async getBooks(): Promise<Book[]> {
    return await this.dbOrThrow.select().from(schema.books);
  }

  async getBooksByUserId(userId: string): Promise<Book[]> {
    return await this.dbOrThrow.select().from(schema.books).where(eq(schema.books.user_id, userId));
  }

  async getBook(id: string): Promise<Book | undefined> {
    const results = await this.dbOrThrow.select().from(schema.books).where(eq(schema.books.id, id));
    return results[0];
  }

  async createBook(book: InsertBook): Promise<Book> {
    const results = await this.dbOrThrow.insert(schema.books).values(book).returning();
    return results[0];
  }

  // Embedding settings operations
  async getEmbeddingSettings(): Promise<EmbeddingSettings[]> {
    return await this.dbOrThrow.select().from(schema.embeddingSettings);
  }
  
  async getEmbeddingSettingsById(id: string): Promise<EmbeddingSettings | undefined> {
    const results = await this.dbOrThrow.select().from(schema.embeddingSettings).where(eq(schema.embeddingSettings.id, id));
    return results[0];
  }

  async createEmbeddingSettings(settings: InsertEmbeddingSettings): Promise<EmbeddingSettings> {
    const results = await this.dbOrThrow.insert(schema.embeddingSettings).values(settings).returning();
    return results[0];
  }
  
  async updateEmbeddingSettings(id: string, updates: Partial<EmbeddingSettings>): Promise<EmbeddingSettings> {
    const results = await this.dbOrThrow
      .update(schema.embeddingSettings)
      .set(updates)
      .where(eq(schema.embeddingSettings.id, id))
      .returning();
      
    if (results.length === 0) {
      throw new Error(`Embedding settings with ID ${id} not found`);
    }
    
    return results[0];
  }

  // Chunk operations
  async getChunks(bookId: string, settingsId: string): Promise<Chunk[]> {
    return await this.dbOrThrow.select().from(schema.chunks).where(
      and(
        eq(schema.chunks.book_id, bookId),
        eq(schema.chunks.embedding_settings_id, settingsId)
      )
    );
  }

  async getChunk(id: string): Promise<Chunk | undefined> {
    const results = await this.dbOrThrow.select().from(schema.chunks).where(eq(schema.chunks.id, id));
    return results[0];
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    // Parse the embedding JSON string to array for the vector field
    const embeddingArray = JSON.parse(chunk.embedding);
    
    // Insert with both the text embedding and the vector embedding
    const results = await this.dbOrThrow.insert(schema.chunks).values({
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
    
    const results = await this.dbOrThrow.insert(schema.chunks).values(chunksWithVectors).returning();
    return results;
  }

  // Chat session operations
  async getChatSessions(bookId: string): Promise<ChatSession[]> {
    return await this.dbOrThrow.select().from(schema.chatSessions).where(eq(schema.chatSessions.book_id, bookId));
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const results = await this.dbOrThrow.select().from(schema.chatSessions).where(eq(schema.chatSessions.id, id));
    return results[0];
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const results = await this.dbOrThrow.insert(schema.chatSessions).values(session).returning();
    return results[0];
  }

  // Chat chunk operations
  async getChatChunks(chatId: string): Promise<ChatChunk[]> {
    return await this.dbOrThrow.select().from(schema.chatChunks).where(eq(schema.chatChunks.chat_id, chatId));
  }

  async createChatChunk(chatChunk: InsertChatChunk): Promise<ChatChunk> {
    const results = await this.dbOrThrow.insert(schema.chatChunks).values(chatChunk).returning();
    return results[0];
  }

  // LLM prompt operations
  async getLlmPrompt(chatId: string): Promise<LlmPrompt | undefined> {
    const results = await this.dbOrThrow.select().from(schema.llmPrompts).where(eq(schema.llmPrompts.chat_id, chatId));
    return results[0];
  }

  async createLlmPrompt(prompt: InsertLlmPrompt): Promise<LlmPrompt> {
    // Ensure context_chunks is an array
    const promptWithArrayChunks = {
      ...prompt,
      context_chunks: Array.isArray(prompt.context_chunks) ? prompt.context_chunks : [prompt.context_chunks]
    };
    const results = await this.dbOrThrow.insert(schema.llmPrompts).values(promptWithArrayChunks).returning();
    return results[0];
  }

  // Knowledge graph node operations
  async getNodes(bookId: string): Promise<Node[]> {
    return await this.dbOrThrow.select().from(schema.nodes).where(eq(schema.nodes.book_id, bookId));
  }

  async getNode(id: string): Promise<Node | undefined> {
    const results = await this.dbOrThrow.select().from(schema.nodes).where(eq(schema.nodes.id, id));
    return results[0];
  }

  async createNode(node: InsertNode): Promise<Node> {
    const results = await this.dbOrThrow.insert(schema.nodes).values(node).returning();
    return results[0];
  }

  // Knowledge graph edge operations
  async getEdges(bookId: string): Promise<Edge[]> {
    // Join with nodes to get edges for a specific book
    const results = await this.dbOrThrow
      .select({
        edges: schema.edges
      })
      .from(schema.edges)
      .innerJoin(schema.nodes, eq(schema.edges.source_node_id, schema.nodes.id))
      .where(eq(schema.nodes.book_id, bookId));
    
    // Extract just the edge data
    return results.map(r => r.edges);
  }

  async getEdge(id: string): Promise<Edge | undefined> {
    const results = await this.dbOrThrow.select().from(schema.edges).where(eq(schema.edges.id, id));
    return results[0];
  }

  async createEdge(edge: InsertEdge): Promise<Edge> {
    const results = await this.dbOrThrow.insert(schema.edges).values(edge).returning();
    return results[0];
  }

  // Node chunk associations
  async getNodeChunks(nodeId: string): Promise<NodeChunk[]> {
    return await this.dbOrThrow.select().from(schema.nodeChunks).where(eq(schema.nodeChunks.node_id, nodeId));
  }

  async createNodeChunk(nodeChunk: InsertNodeChunk): Promise<NodeChunk> {
    const results = await this.dbOrThrow.insert(schema.nodeChunks).values(nodeChunk).returning();
    return results[0];
  }
}