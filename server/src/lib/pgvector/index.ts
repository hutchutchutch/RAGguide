import { customType } from "drizzle-orm/pg-core";
import { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Custom vector type for pgvector
 * Adds the vector type to the database schema.
 * 
 * Example usage:
 * ```
 * import { pgTable } from 'drizzle-orm/pg-core';
 * import { vector } from './pgvector';
 * 
 * export const embeddings = pgTable('embeddings', {
 *   id: serial('id').primaryKey(),
 *   embedding: vector('embedding', { dimensions: 1536 }),
 * });
 * ```
 */
export const vector = customType<{
  data: number[];
  driverData: string;
  config: {
    dimensions: number;
  };
}>({
  dataType(config) {
    if (!config || !config.dimensions) {
      throw new Error('Vector dimensions must be specified');
    }
    return `vector(${config.dimensions})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // Value from the database will be a string like '[0.1,0.2,0.3]'
    if (typeof value !== 'string') {
      throw new Error(`Expected string, got ${typeof value}`);
    }
    // Remove brackets and split by commas
    return value.slice(1, -1).split(',').map(Number);
  },
});

/**
 * Helper function to create a vector index
 * Example usage:
 * ```
 * createVectorIndex('idx_chunks_embedding', 'chunks', 'embedding', 'hnsw');
 * ```
 */
export const createVectorIndexSQL = (
  indexName: string,
  tableName: string,
  columnName: string,
  method: 'ivfflat' | 'hnsw' | 'cosine' = 'cosine'
): string => {
  // For pgvector 0.8.0, only basic index is available
  if (method === 'cosine') {
    return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING ivfflat (${columnName} vector_l2_ops);`;
  } else if (method === 'ivfflat') {
    return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING ivfflat (${columnName} vector_l2_ops);`;
  } else {
    // Fallback to basic index for HNSW if not supported
    return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING ivfflat (${columnName} vector_l2_ops);`;
  }
};

/**
 * Helper function for vector similarity search
 * @param column The vector column to search
 * @param vector The query vector
 * @param limit The maximum number of results to return
 * @param threshold The minimum similarity score (0 to 1)
 * @returns SQL function call string
 */
export const cosineSimilaritySearch = (
  column: AnyPgColumn,
  vector: number[],
  limit: number = 5,
  threshold: number = 0.7
): { sql: string, params: any[] } => {
  return {
    sql: `${column.name} <=> $1 < ${1 - threshold} ORDER BY ${column.name} <=> $1 LIMIT ${limit}`,
    params: [`[${vector.join(',')}]`]
  };
};