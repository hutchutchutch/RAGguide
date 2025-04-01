import OpenAI from "openai";

// Define default models
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
export const DEFAULT_LLM_MODEL = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Initialize OpenAI client with mock in development if no API key
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.warn("Error initializing OpenAI client:", error);
  
  // Create a mock client for development
  if (process.env.NODE_ENV !== 'production') {
    console.log("Creating mock OpenAI client for development");
    openai = {
      embeddings: {
        create: () => Promise.resolve({ 
          data: [{ embedding: Array(1536).fill(0).map(() => Math.random()) }] 
        })
      },
      chat: {
        completions: {
          create: () => Promise.resolve({ 
            choices: [{ message: { content: "This is a mock response in development mode." } }] 
          })
        }
      }
    };
  } else {
    throw new Error("OpenAI client initialization failed in production mode");
  }
}

// Get embeddings for text
export async function getEmbedding(text: string, model = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding from OpenAI:', error);
    throw error;
  }
}

// Generate chat completion
export async function generateCompletion(
  messages: any[],
  model = DEFAULT_LLM_MODEL
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating completion from OpenAI:', error);
    throw error;
  }
}

// Export default module for import in routes
export default {
  getEmbedding,
  generateCompletion,
};