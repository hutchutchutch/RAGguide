import type { InsertChunk } from "@shared/schema";

// OpenAI API wrapper functions for the frontend
const OPENAI_API_ENDPOINT = '/api/openai';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
export const DEFAULT_LLM_MODEL = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Calculate similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return dotProduct / (normA * normB);
}

// Get embeddings for a text
export async function getEmbedding(text: string, model = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
  try {
    const response = await fetch(`${OPENAI_API_ENDPOINT}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get embedding: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Similar vector search from array of chunks
export function vectorSearch(
  query: number[],
  chunks: InsertChunk[],
  topK = 5
): { chunkId: string; score: number }[] {
  const similarities = chunks.map((chunk) => {
    const embedding = JSON.parse(chunk.embedding);
    return {
      chunkId: chunk.id || '', // Handle undefined ID
      score: cosineSimilarity(query, embedding),
    };
  });

  // Sort by similarity score (highest first)
  similarities.sort((a, b) => b.score - a.score);

  // Return top K results
  return similarities.slice(0, topK);
}

// Generate completion from OpenAI
export async function generateCompletion(
  prompt: string,
  systemMessage: string,
  model = DEFAULT_LLM_MODEL
): Promise<string> {
  try {
    const response = await fetch(`${OPENAI_API_ENDPOINT}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate completion: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error generating completion:', error);
    throw error;
  }
}
