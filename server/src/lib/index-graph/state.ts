import { BaseState, DocumentState } from '../shared/state';
import { INDEXING_CONFIG } from './configuration';

export interface IndexingConfig {
  cleaner: keyof typeof INDEXING_CONFIG.cleaners;
  strategy: keyof typeof INDEXING_CONFIG.strategies;
  chunkSize: number;
  overlap: number;
  batchSize: number;
}

export interface IndexingState extends DocumentState {
  config: IndexingConfig;
  processedDocuments?: number;
  totalDocuments?: number;
  currentPhase: 'cleaning' | 'chunking' | 'embedding' | 'storing' | 'complete';
}

export interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding?: number[];
}

export interface ProcessedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface IndexingResult {
  documentId: string;
  chunks: ProcessedChunk[];
  embeddings: number[][];
} 