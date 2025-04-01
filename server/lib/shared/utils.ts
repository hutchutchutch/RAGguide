import { Document } from '@langchain/core/documents';
import { BaseMessage } from '@langchain/core/messages';
import { ProgressState } from './state';

// Text cleaning utilities
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, '\n')
    .trim();
}

// Document chunking utilities
export function chunkDocument(
  doc: Document,
  size: number,
  overlap: number
): Document[] {
  const text = doc.pageContent;
  const chunks: Document[] = [];
  let i = 0;

  while (i < text.length) {
    const chunk = text.slice(i, i + size);
    chunks.push(new Document({
      pageContent: chunk,
      metadata: { ...doc.metadata, chunk_index: chunks.length }
    }));
    i += size - overlap;
  }

  return chunks;
}

// Progress tracking utilities
export function createProgressTracker(total: number): ProgressState {
  return {
    total,
    completed: 0,
    status: 'pending'
  };
}

export function updateProgress(
  progress: ProgressState,
  completed: number,
  message?: string
): ProgressState {
  return {
    ...progress,
    completed,
    message,
    status: completed === progress.total ? 'complete' : 'processing'
  };
}

// Message formatting utilities
export function formatChatMessage(message: BaseMessage): string {
  return `${message.type}: ${message.content}`;
}

// Error handling utilities
export class GraphError extends Error {
  constructor(
    message: string,
    public readonly phase: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

export function handleError(error: unknown, phase: string): GraphError {
  if (error instanceof GraphError) {
    return error;
  }
  return new GraphError(
    error instanceof Error ? error.message : 'Unknown error occurred',
    phase,
    error
  );
} 