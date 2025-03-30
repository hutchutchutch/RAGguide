import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { createVectorIndexSQL } from './pgvector';

// Check if database URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create postgres connection
const connectionString = process.env.DATABASE_URL;
const queryClient = postgres(connectionString, { 
  max: 10,
  connect_timeout: 10
});

// Create drizzle client
export const db = drizzle(queryClient, { schema });

// Initialize database function
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Enable pgvector extension
    await queryClient.unsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Vector extension enabled');
    
    // Push schema to database (create tables)
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const migrationDb = drizzle(migrationClient);
    
    // Create tables
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS embedding_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chunk_size INTEGER NOT NULL,
        overlap INTEGER NOT NULL,
        cleaner TEXT NOT NULL,
        strategy TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID NOT NULL REFERENCES books(id),
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL,
        embedding_vector vector(1536),
        page_number INTEGER,
        embedding_settings_id UUID NOT NULL REFERENCES embedding_settings(id)
      );
      
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID NOT NULL REFERENCES books(id),
        question TEXT NOT NULL,
        llm_response TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS chat_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES chat_sessions(id),
        chunk_id UUID NOT NULL REFERENCES chunks(id),
        rank INTEGER NOT NULL,
        retrieval_type TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS llm_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES chat_sessions(id),
        system_prompt TEXT NOT NULL,
        context_chunks TEXT[] NOT NULL,
        final_prompt TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID NOT NULL REFERENCES books(id),
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT
      );
      
      CREATE TABLE IF NOT EXISTS edges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_node_id UUID NOT NULL REFERENCES nodes(id),
        target_node_id UUID NOT NULL REFERENCES nodes(id),
        label TEXT NOT NULL,
        explanation TEXT
      );
      
      CREATE TABLE IF NOT EXISTS node_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        node_id UUID NOT NULL REFERENCES nodes(id),
        chunk_id UUID NOT NULL REFERENCES chunks(id)
      );
    `);
    
    // Create vector index on chunks.embedding_vector
    const createIndexSQL = createVectorIndexSQL(
      'idx_chunks_embedding_vector',
      'chunks',
      'embedding_vector',
      'cosine'
    );
    
    // Execute the SQL directly using the client
    await queryClient.unsafe(createIndexSQL);
    
    // Close the migration client
    await migrationClient.end();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Function to create vector similarity search query
export async function findSimilarChunks(
  embeddingVector: number[],
  bookId: string,
  settingsId: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<schema.Chunk[]> {
  // SQL query using the cosine similarity operator (<=>)
  const result = await queryClient.unsafe<schema.Chunk[]>(
    `SELECT * FROM chunks 
     WHERE book_id = $1 
     AND embedding_settings_id = $2
     AND embedding_vector <=> $3 < ${1 - threshold}
     ORDER BY embedding_vector <=> $3
     LIMIT $4`,
    [bookId, settingsId, `[${embeddingVector.join(',')}]`, limit]
  );
  
  return result;
}