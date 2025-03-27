import { Chunk, InsertChunk } from "@shared/schema";
import { getEmbedding, vectorSearch, generateCompletion } from "./openai";
import { splitIntoChunks, recursiveTextSplitter, cleanText } from "./pdf";

export type ChunkingStrategy = 'recursive' | 'semantic';
export type CleanerType = 'simple' | 'advanced' | 'ocr-optimized';

export interface EmbeddingConfig {
  chunkSize: number;
  overlap: number;
  strategy: ChunkingStrategy;
  cleaner: CleanerType;
  model: string;
}

export interface RagResult {
  answer: string;
  chunks: {
    chunk: Chunk;
    score: number;
  }[];
  promptUsed: string;
}

// Process text into chunks according to settings
export async function processTextToChunks(
  text: string, 
  pageNumber: number,
  config: EmbeddingConfig,
  bookId: string,
  embeddingSettingsId: string
): Promise<InsertChunk[]> {
  // Step 1: Clean the text
  const cleanedText = cleanText(text, config.cleaner);
  
  // Step 2: Split into chunks based on strategy
  let textChunks: string[];
  if (config.strategy === 'recursive') {
    textChunks = recursiveTextSplitter(cleanedText, config.chunkSize, config.overlap);
  } else {
    textChunks = splitIntoChunks(cleanedText, config.chunkSize, config.overlap);
  }
  
  // Step 3: Get embeddings for each chunk
  const chunks: InsertChunk[] = [];
  for (let i = 0; i < textChunks.length; i++) {
    const chunkText = textChunks[i];
    const embedding = await getEmbedding(chunkText, config.model);
    
    chunks.push({
      book_id: bookId,
      chunk_index: i,
      text: chunkText,
      embedding: JSON.stringify(embedding), // Store as string for storage
      page_number: pageNumber,
      embedding_settings_id: embeddingSettingsId,
    });
  }
  
  return chunks;
}

// Standard RAG retrieval
export async function performRagRetrieval(
  query: string,
  chunks: Chunk[],
  bookTitle: string,
  topK = 5
): Promise<RagResult> {
  // Get embedding for query
  const queryEmbedding = await getEmbedding(query);
  
  // Convert chunks embedding from string to array
  const preparedChunks = chunks.map(chunk => ({
    ...chunk,
    embedding: JSON.parse(chunk.embedding)
  }));
  
  // Find relevant chunks
  const results = vectorSearch(queryEmbedding, preparedChunks, topK);
  
  // Get the actual chunks
  const retrievedChunks = results.map(result => {
    const chunk = chunks.find(c => c.id === result.chunkId);
    return {
      chunk: chunk!,
      score: result.score
    };
  });
  
  // Build context from chunks
  const context = retrievedChunks
    .map((item, index) => `[Chunk ${index + 1}] ${item.chunk.text}`)
    .join('\n\n');
  
  // Create system message
  const systemMessage = `You are a helpful assistant answering questions about "${bookTitle}".
Use ONLY the information from the provided context to answer the question.
If you don't know the answer based on the provided context, say "I don't have enough information to answer this question."
Do not use prior knowledge. Provide specific details from the text when possible.`;

  // Create prompt
  const prompt = `Context:\n${context}\n\nQuestion: ${query}`;
  
  // Generate answer
  const answer = await generateCompletion(prompt, systemMessage);
  
  return {
    answer,
    chunks: retrievedChunks,
    promptUsed: prompt
  };
}

// GraphRAG retrieval
export async function performGraphRagRetrieval(
  query: string,
  chunks: Chunk[],
  nodes: any[],
  edges: any[],
  bookTitle: string,
  topK = 5
): Promise<RagResult> {
  // Get embedding for query
  const queryEmbedding = await getEmbedding(query);
  
  // Convert chunks embedding from string to array
  const preparedChunks = chunks.map(chunk => ({
    ...chunk,
    embedding: JSON.parse(chunk.embedding)
  }));
  
  // Find relevant chunks via vector search first
  const vectorResults = vectorSearch(queryEmbedding, preparedChunks, topK);
  
  // Find chunks connected to relevant nodes
  // This simulates using the knowledge graph to improve retrieval
  const graphEnhancedChunks = new Set<string>();
  
  // Add initial vector search results
  vectorResults.forEach(result => graphEnhancedChunks.add(result.chunkId));
  
  // Use entity recognition on the query (simulated)
  // In a real implementation, we would use NLP to extract entities
  const chunksWithExtractedEntities = (await Promise.all(
    Array.from(graphEnhancedChunks).map(async chunkId => {
      const chunk = chunks.find(c => c.id === chunkId);
      if (!chunk) return null;
      
      // Find nodes that might be mentioned in the chunk
      // This is a simplistic approach - in a real system we'd use entity linking
      const relatedNodes = nodes.filter(node => 
        chunk.text.toLowerCase().includes(node.label.toLowerCase())
      );
      
      return { chunk, relatedNodes };
    })
  )).filter(Boolean) as { chunk: Chunk, relatedNodes: any[] }[];
  
  // Follow graph edges to find connected information
  let expandedChunkIds = new Set<string>(graphEnhancedChunks);
  
  for (const { relatedNodes } of chunksWithExtractedEntities) {
    for (const node of relatedNodes) {
      // Find connected nodes via edges
      const connectedNodeIds = edges
        .filter(edge => edge.source_node_id === node.id || edge.target_node_id === node.id)
        .map(edge => edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id);
        
      // Find chunks associated with connected nodes
      for (const nodeId of connectedNodeIds) {
        const connectedNode = nodes.find(n => n.id === nodeId);
        if (!connectedNode) continue;
        
        // Find chunks that mention this entity
        const relatedChunks = chunks.filter(chunk => 
          chunk.text.toLowerCase().includes(connectedNode.label.toLowerCase())
        );
        
        // Add to expanded set
        relatedChunks.forEach(chunk => expandedChunkIds.add(chunk.id!));
      }
    }
  }
  
  // Rerank all the collected chunks
  const finalChunkIds = Array.from(expandedChunkIds);
  const finalChunks = finalChunkIds.map(id => chunks.find(c => c.id === id)!);
  
  // Rerank by vector similarity
  const rerankedResults = vectorSearch(
    queryEmbedding, 
    finalChunks.map(chunk => ({
      ...chunk,
      embedding: JSON.stringify(JSON.parse(chunk.embedding))
    })), 
    topK
  );
  
  // Get the actual chunks
  const retrievedChunks = rerankedResults.map(result => {
    const chunk = chunks.find(c => c.id === result.chunkId);
    return {
      chunk: chunk!,
      score: result.score
    };
  });
  
  // Build context from chunks
  const context = retrievedChunks
    .map((item, index) => `[Chunk ${index + 1}] ${item.chunk.text}`)
    .join('\n\n');
  
  // Create system message
  const systemMessage = `You are a helpful assistant answering questions about "${bookTitle}" using graph-enhanced retrieval.
Use ONLY the information from the provided context to answer the question.
If you don't know the answer based on the provided context, say "I don't have enough information to answer this question."
Do not use prior knowledge. Provide specific details from the text when possible.`;

  // Create prompt
  const prompt = `Context:\n${context}\n\nQuestion: ${query}`;
  
  // Generate answer
  const answer = await generateCompletion(prompt, systemMessage);
  
  return {
    answer,
    chunks: retrievedChunks,
    promptUsed: prompt
  };
}
