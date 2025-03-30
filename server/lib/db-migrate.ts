import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import * as schema from '../../shared/schema';
import { createVectorIndexSQL } from './pgvector';

// Check if database URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create postgres connection for migrations
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// Function to run migrations
export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create drizzle instance
    const db = drizzle(migrationClient);
    
    // Auto-generate migrations
    const migrationsFolder = path.join(__dirname, '../migrations');
    
    // Push schema to database directly (for demo purposes)
    for (const table of Object.values(schema)) {
      if (typeof table === 'object' && table.hasOwnProperty('_: "PgTable"')) {
        try {
          const query = `CREATE TABLE IF NOT EXISTS ${(table as any).name} ();`;
          await migrationClient.unsafe(query);
          console.log(`Created table: ${(table as any).name}`);
        } catch (error) {
          console.error(`Error creating table ${(table as any).name}:`, error);
        }
      }
    }

    // Enable pgvector extension if not already enabled
    try {
      await migrationClient.unsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('Vector extension enabled');
    } catch (error) {
      console.error('Error enabling vector extension:', error);
    }
    
    // Create vector index
    try {
      const createIndexSQL = createVectorIndexSQL(
        'idx_chunks_embedding_vector',
        'chunks',
        'embedding_vector',
        'cosine'
      );
      
      await migrationClient.unsafe(createIndexSQL);
      console.log('Vector index created');
    } catch (error) {
      console.error('Error creating vector index:', error);
    }
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  } finally {
    // Close the migration client
    await migrationClient.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}