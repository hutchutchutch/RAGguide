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
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import { PgStorage } from './pg-storage';

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Book operations
  getBooks(): Promise<Book[]>;
  getBooksByUserId(userId: string): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  
  // Embedding settings operations
  getEmbeddingSettings(): Promise<EmbeddingSettings[]>;
  getEmbeddingSettingsById(id: string): Promise<EmbeddingSettings | undefined>;
  createEmbeddingSettings(settings: InsertEmbeddingSettings): Promise<EmbeddingSettings>;
  updateEmbeddingSettings(id: string, settings: Partial<EmbeddingSettings>): Promise<EmbeddingSettings>;
  
  // Chunk operations
  getChunks(bookId: string, settingsId: string): Promise<Chunk[]>;
  getChunk(id: string): Promise<Chunk | undefined>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  createChunks(chunks: InsertChunk[]): Promise<Chunk[]>;
  
  // Chat session operations
  getChatSessions(bookId: string): Promise<ChatSession[]>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  
  // Chat chunk operations
  getChatChunks(chatId: string): Promise<ChatChunk[]>;
  createChatChunk(chatChunk: InsertChatChunk): Promise<ChatChunk>;
  
  // LLM prompt operations
  getLlmPrompt(chatId: string): Promise<LlmPrompt | undefined>;
  createLlmPrompt(prompt: InsertLlmPrompt): Promise<LlmPrompt>;
  
  // Knowledge graph operations
  getNodes(bookId: string): Promise<Node[]>;
  getNode(id: string): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  
  getEdges(bookId: string): Promise<Edge[]>;
  getEdge(id: string): Promise<Edge | undefined>;
  createEdge(edge: InsertEdge): Promise<Edge>;
  
  // Node-chunk associations
  getNodeChunks(nodeId: string): Promise<NodeChunk[]>;
  createNodeChunk(nodeChunk: InsertNodeChunk): Promise<NodeChunk>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private books: Map<string, Book>;
  private embeddingSettings: Map<string, EmbeddingSettings>;
  private chunks: Map<string, Chunk>;
  private chatSessions: Map<string, ChatSession>;
  private chatChunks: Map<string, ChatChunk>;
  private llmPrompts: Map<string, LlmPrompt>;
  private nodes: Map<string, Node>;
  private edges: Map<string, Edge>;
  private nodeChunks: Map<string, NodeChunk>;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.embeddingSettings = new Map();
    this.chunks = new Map();
    this.chatSessions = new Map();
    this.chatChunks = new Map();
    this.llmPrompts = new Map();
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeChunks = new Map();
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.google_id === googleId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = uuidv4();
    const newUser: User = {
      ...user,
      id,
      avatar_url: user.avatar_url || null,
      google_id: user.google_id || null,
      google_access_token: user.google_access_token || null,
      google_refresh_token: user.google_refresh_token || null,
      created_at: new Date(),
      last_login: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = {
      ...existingUser,
      ...updates
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Book operations
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBooksByUserId(userId: string): Promise<Book[]> {
    return Array.from(this.books.values()).filter(book => book.user_id === userId);
  }

  async getBook(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(book: InsertBook): Promise<Book> {
    const id = uuidv4();
    const newBook: Book = {
      ...book,
      id,
      user_id: book.user_id || null,
      source: book.source || 'upload',
      drive_file_id: book.drive_file_id || null,
      uploaded_at: new Date(),
    };
    this.books.set(id, newBook);
    return newBook;
  }

  // Embedding settings operations
  async getEmbeddingSettings(): Promise<EmbeddingSettings[]> {
    return Array.from(this.embeddingSettings.values());
  }
  
  async getEmbeddingSettingsById(id: string): Promise<EmbeddingSettings | undefined> {
    return this.embeddingSettings.get(id);
  }

  async createEmbeddingSettings(settings: InsertEmbeddingSettings): Promise<EmbeddingSettings> {
    const id = uuidv4();
    const newSettings: EmbeddingSettings = {
      ...settings,
      id,
      created_at: new Date(),
      rating: null,
      name: null,
      description: null
    };
    this.embeddingSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateEmbeddingSettings(id: string, updates: Partial<EmbeddingSettings>): Promise<EmbeddingSettings> {
    const existingSettings = this.embeddingSettings.get(id);
    
    if (!existingSettings) {
      throw new Error(`Embedding settings with ID ${id} not found`);
    }
    
    const updatedSettings = {
      ...existingSettings,
      ...updates
    };
    
    this.embeddingSettings.set(id, updatedSettings);
    return updatedSettings;
  }

  // Chunk operations
  async getChunks(bookId: string, settingsId: string): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter(
      (chunk) => chunk.book_id === bookId && chunk.embedding_settings_id === settingsId
    );
  }

  async getChunk(id: string): Promise<Chunk | undefined> {
    return this.chunks.get(id);
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    const id = uuidv4();
    const newChunk: Chunk = {
      ...chunk,
      id,
      embedding_vector: null,  // Set to null for in-memory storage
      page_number: chunk.page_number || null
    };
    this.chunks.set(id, newChunk);
    return newChunk;
  }

  async createChunks(chunks: InsertChunk[]): Promise<Chunk[]> {
    return Promise.all(chunks.map(chunk => this.createChunk(chunk)));
  }

  // Chat session operations
  async getChatSessions(bookId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter((session) => session.book_id === bookId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const id = uuidv4();
    const newSession: ChatSession = {
      ...session,
      id,
      created_at: new Date(),
    };
    this.chatSessions.set(id, newSession);
    return newSession;
  }

  // Chat chunk operations
  async getChatChunks(chatId: string): Promise<ChatChunk[]> {
    return Array.from(this.chatChunks.values())
      .filter((chatChunk) => chatChunk.chat_id === chatId)
      .sort((a, b) => a.rank - b.rank);
  }

  async createChatChunk(chatChunk: InsertChatChunk): Promise<ChatChunk> {
    const id = uuidv4();
    const newChatChunk: ChatChunk = {
      ...chatChunk,
      id,
    };
    this.chatChunks.set(id, newChatChunk);
    return newChatChunk;
  }

  // LLM prompt operations
  async getLlmPrompt(chatId: string): Promise<LlmPrompt | undefined> {
    return Array.from(this.llmPrompts.values()).find(
      (prompt) => prompt.chat_id === chatId
    );
  }

  async createLlmPrompt(prompt: InsertLlmPrompt): Promise<LlmPrompt> {
    const id = uuidv4();
    const newPrompt: LlmPrompt = {
      ...prompt,
      id,
    };
    this.llmPrompts.set(id, newPrompt);
    return newPrompt;
  }

  // Knowledge graph operations
  async getNodes(bookId: string): Promise<Node[]> {
    return Array.from(this.nodes.values()).filter(
      (node) => node.book_id === bookId
    );
  }

  async getNode(id: string): Promise<Node | undefined> {
    return this.nodes.get(id);
  }

  async createNode(node: InsertNode): Promise<Node> {
    const id = uuidv4();
    const newNode: Node = {
      ...node,
      id,
      description: node.description || null
    };
    this.nodes.set(id, newNode);
    return newNode;
  }

  async getEdges(bookId: string): Promise<Edge[]> {
    // First get all nodes for the book
    const bookNodes = await this.getNodes(bookId);
    const bookNodeIds = new Set(bookNodes.map(node => node.id));
    
    // Then filter edges where both source and target are in the book
    return Array.from(this.edges.values()).filter(edge => {
      return bookNodeIds.has(edge.source_node_id) && bookNodeIds.has(edge.target_node_id);
    });
  }

  async getEdge(id: string): Promise<Edge | undefined> {
    return this.edges.get(id);
  }

  async createEdge(edge: InsertEdge): Promise<Edge> {
    const id = uuidv4();
    const newEdge: Edge = {
      ...edge,
      id,
      explanation: edge.explanation || null
    };
    this.edges.set(id, newEdge);
    return newEdge;
  }

  // Node-chunk associations
  async getNodeChunks(nodeId: string): Promise<NodeChunk[]> {
    return Array.from(this.nodeChunks.values()).filter(
      (nodeChunk) => nodeChunk.node_id === nodeId
    );
  }

  async createNodeChunk(nodeChunk: InsertNodeChunk): Promise<NodeChunk> {
    const id = uuidv4();
    const newNodeChunk: NodeChunk = {
      ...nodeChunk,
      id,
    };
    this.nodeChunks.set(id, newNodeChunk);
    return newNodeChunk;
  }
}

// Create a postgres storage instance to use in production
const pgStorage = new PgStorage();

// Use PostgreSQL storage in production, fall back to memory storage for development if needed
export const storage: IStorage = process.env.DATABASE_URL ? pgStorage : new MemStorage();
