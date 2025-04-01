import { z } from 'zod';

export const CONFIG = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    embedding_model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    api_key: process.env.OPENAI_API_KEY,
    max_tokens: 4096,
    temperature: 0.7,
  },
  database: {
    url: process.env.DATABASE_URL,
    max_connections: 10,
    connect_timeout: 10,
  },
  indexing: {
    chunk_size: 1000,
    chunk_overlap: 200,
    default_cleaner: 'simple',
    default_strategy: 'recursive',
  },
  retrieval: {
    max_chunks: 5,
    similarity_threshold: 0.7,
    reranking_enabled: true,
  }
};

// Validation schemas for configuration
export const ConfigSchema = z.object({
  openai: z.object({
    model: z.string(),
    embedding_model: z.string(),
    api_key: z.string(),
    max_tokens: z.number(),
    temperature: z.number(),
  }),
  database: z.object({
    url: z.string(),
    max_connections: z.number(),
    connect_timeout: z.number(),
  }),
  indexing: z.object({
    chunk_size: z.number(),
    chunk_overlap: z.number(),
    default_cleaner: z.string(),
    default_strategy: z.string(),
  }),
  retrieval: z.object({
    max_chunks: z.number(),
    similarity_threshold: z.number(),
    reranking_enabled: z.boolean(),
  }),
}); 