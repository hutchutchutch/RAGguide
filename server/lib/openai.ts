import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  console.warn("Missing OPENAI_API_KEY - OpenAI API calls will fail");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
export const DEFAULT_LLM_MODEL = 'gpt-4o';

// Get embeddings for a text
export async function getEmbedding(text: string, model = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Generate chat completion
export async function generateCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model = DEFAULT_LLM_MODEL
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error('Error generating completion:', error);
    throw error;
  }
}

// Export server-side functions 
export default {
  getEmbedding,
  generateCompletion,
};
