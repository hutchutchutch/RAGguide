import { RunnableConfig } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';
import { BaseMessage } from '@langchain/core/messages';

// Base state interface that all graph states extend
export interface BaseState {
  config: RunnableConfig;
  error?: Error;
}

// State for document processing
export interface DocumentState extends BaseState {
  documents: Document[];
  chunks?: Document[];
  embeddings?: number[][];
}

// State for retrieval operations
export interface RetrievalState extends BaseState {
  query: string;
  relevantChunks?: Document[];
  rerankedChunks?: Document[];
}

// State for research/analysis operations
export interface ResearchState extends BaseState {
  question: string;
  context?: Document[];
  messages: BaseMessage[];
  response?: string;
  citations?: string[];
}

// Shared types for graph nodes
export type GraphNode = {
  id: string;
  type: string;
  data?: any;
};

export type GraphEdge = {
  source: string;
  target: string;
  label?: string;
};

// Type for tracking progress of long-running operations
export interface ProgressState {
  total: number;
  completed: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
} 