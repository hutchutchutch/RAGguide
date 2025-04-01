import { CONFIG } from '../shared/configuration';

export const INDEXING_CONFIG = {
  ...CONFIG.indexing,
  cleaners: {
    simple: (text: string) => text.trim(),
    aggressive: (text: string) => text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .trim(),
  },
  strategies: {
    recursive: {
      name: 'recursive',
      description: 'Recursively split text into smaller chunks',
      params: {
        min_chunk_size: 100,
        max_chunk_size: CONFIG.indexing.chunk_size,
        overlap: CONFIG.indexing.chunk_overlap,
      }
    },
    sentence: {
      name: 'sentence',
      description: 'Split text by sentences',
      params: {
        separator: '.',
        min_length: 50,
        max_length: CONFIG.indexing.chunk_size,
      }
    }
  },
  embedding: {
    model: CONFIG.openai.embedding_model,
    batch_size: 100,
    dimensions: 1536, // For text-embedding-3-small
  }
}; 