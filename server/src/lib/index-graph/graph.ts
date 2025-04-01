import { StateGraph, Annotation, UpdateType } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from '@langchain/openai';
import { INDEXING_CONFIG } from './configuration';
import { IndexingState, ProcessedChunk } from './state';
import { chunkDocument, cleanText } from '../shared/utils';
import { db } from '../db';
import { CONFIG } from "../shared/configuration";
import { START, END } from "@langchain/langgraph";

// Define node names as a type for type safety
type NodeNames = "clean" | "chunk" | "embed" | "store";

// Define state types using Annotation
const StateAnnotation = Annotation.Root({
  config: Annotation<{
    cleaner: string;
    strategy: string;
    chunkSize: number;
    overlap: number;
    batchSize: number;
  }>({
    default: () => ({
      cleaner: CONFIG.indexing.default_cleaner,
      strategy: CONFIG.indexing.default_strategy,
      chunkSize: CONFIG.indexing.chunk_size,
      overlap: CONFIG.indexing.chunk_overlap,
      batchSize: INDEXING_CONFIG.embedding.batch_size
    }),
    reducer: (curr, update) => ({ ...curr, ...update })
  }),
  documents: Annotation<Document[]>({
    default: () => [],
    reducer: (curr, update) => [...curr, ...update]
  }),
  chunks: Annotation<Document[]>({
    default: () => [],
    reducer: (curr, update) => [...curr, ...update]
  }),
  embeddings: Annotation<number[][]>({
    default: () => [],
    reducer: (curr, update) => [...curr, ...update]
  }),
  currentPhase: Annotation<'cleaning' | 'chunking' | 'embedding' | 'storing' | 'complete'>({
    default: () => 'cleaning' as const,
    reducer: (_, update) => update
  }),
  processedDocuments: Annotation<number>({
    default: () => 0,
    reducer: (curr, update) => curr + update
  }),
  totalDocuments: Annotation<number>({
    default: () => 0,
    reducer: (_, update) => update
  }),
  error: Annotation<string | null>({
    default: () => null,
    reducer: (_, update) => update
  })
});

type StateType = typeof StateAnnotation.State;
type NodeReturn = Partial<StateType>;

export class IndexingGraph extends StateGraph<
  typeof StateAnnotation["spec"],
  StateType,
  UpdateType<typeof StateAnnotation["spec"]>,
  typeof START,
  typeof StateAnnotation["spec"],
  typeof StateAnnotation["spec"]
> {
  constructor() {
    super({ stateSchema: StateAnnotation });

    // Define routing function for conditional edges
    const routeNext = (state: StateType): NodeNames | typeof END => {
      if (state.error) return END;
      switch (state.currentPhase) {
        case 'cleaning': return "chunk";
        case 'chunking': return "embed";
        case 'embedding': return "store";
        case 'storing':
        case 'complete': return END;
        default: return END;
      }
    };

    // Define nodes
    const cleanNode = async (state: StateType): Promise<NodeReturn> => {
      try {
        const cleanedDocs = state.documents.map(doc => ({
          ...doc,
          pageContent: cleanText(doc.pageContent)
        }));
        return { 
          documents: cleanedDocs,
          currentPhase: 'chunking' as const,
          processedDocuments: 1
        };
      } catch (err) {
        const error = err as Error;
        return { error: error.message };
      }
    };

    const chunkNode = async (state: StateType): Promise<NodeReturn> => {
      try {
        const chunks = state.documents.flatMap(doc => 
          chunkDocument(doc, state.config.chunkSize, state.config.overlap)
        );
        return { 
          chunks,
          currentPhase: 'embedding' as const,
          processedDocuments: state.processedDocuments
        };
      } catch (err) {
        const error = err as Error;
        return { error: error.message };
      }
    };

    const embedNode = async (state: StateType): Promise<NodeReturn> => {
      try {
        const embeddings = await Promise.all(
          (state.chunks || []).map(chunk => new OpenAIEmbeddings().embedQuery(chunk.pageContent))
        );
        return { 
          embeddings,
          currentPhase: 'storing' as const,
          processedDocuments: state.processedDocuments
        };
      } catch (err) {
        const error = err as Error;
        return { error: error.message };
      }
    };

    const storeNode = async (state: StateType): Promise<NodeReturn> => {
      if (!db) throw new Error("Database not initialized");
      try {
        await Promise.all(
          (state.chunks || []).map((chunk, i) => 
            db?.execute(
              `INSERT INTO chunks (text, metadata, embedding_vector) VALUES ($1, $2, $3)`,
              [chunk.pageContent, chunk.metadata, (state.embeddings || [])[i]]
            )
          )
        );
        return { 
          currentPhase: 'complete' as const,
          processedDocuments: state.processedDocuments
        };
      } catch (err) {
        const error = err as Error;
        return { error: error.message };
      }
    };

    // Add nodes and edges in a chain
    this
      .addNode("clean", cleanNode)
      .addNode("chunk", chunkNode)
      .addNode("embed", embedNode)
      .addNode("store", storeNode)
      .addEdge(START, "clean")
      .addConditionalEdges("clean", routeNext)
      .addConditionalEdges("chunk", routeNext)
      .addConditionalEdges("embed", routeNext)
      .addConditionalEdges("store", routeNext);
  }

  async processDocument(
    document: Document,
    config: Required<StateType['config']>
  ): Promise<ProcessedChunk[]> {
    const runnable = this.compile();
    const state = await runnable.invoke({
      documents: [document],
      config,
      totalDocuments: 1
    });

    if (state.error) {
      throw new Error(state.error);
    }

    return (state.chunks || []).map((chunk: Document, i: number) => ({
      text: chunk.pageContent,
      metadata: {
        documentId: chunk.metadata.documentId || 'unknown',
        chunkIndex: i,
        pageNumber: chunk.metadata.pageNumber
      },
      embedding: (state.embeddings || [])[i]
    }));
  }
} 