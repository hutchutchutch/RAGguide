import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useBookContext } from "@/contexts/book-context";
import { Chunk } from "@shared/schema";
import { extractTextFromPDF, cleanText, splitIntoChunks, recursiveTextSplitter } from "@/lib/pdf";
import { EmbeddingConfig, processTextToChunks } from "@/lib/rag";

export function useRagPipeline() {
  const { selectedBook } = useBookContext();
  const queryClient = useQueryClient();
  const [isPreparing, setIsPreparing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1-5: preprocess, chunk, embed, retrieve, generate
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [embeddingSettings, setEmbeddingSettings] = useState<string | null>(null);
  const [currentStepOutput, setCurrentStepOutput] = useState<string>("");

  // Get chunks for the current book and embedding settings
  const { data: allChunks, isLoading: isChunksLoading } = useQuery<Chunk[]>({
    queryKey: [
      `/api/books/${selectedBook?.id}/chunks`, 
      { settingsId: embeddingSettings }
    ],
    enabled: !!selectedBook && !!embeddingSettings,
  });

  // Computed current chunk based on index
  const currentChunk = allChunks ? allChunks[currentChunkIndex] : undefined;

  // Create embedding settings
  const createSettingsMutation = useMutation({
    mutationFn: async (config: EmbeddingConfig) => {
      return apiRequest("POST", "/api/embedding-settings", config) as Promise<{ id: string }>;
    },
  });

  // Create chunks
  const createChunksMutation = useMutation({
    mutationFn: async (chunks: any[]) => {
      return apiRequest("POST", "/api/chunks/batch", chunks) as Promise<Chunk[]>;
    },
  });

  // Prepare RAG pipeline
  const prepareRagPipeline = useCallback(async (config: EmbeddingConfig, bookId: string) => {
    setIsPreparing(true);
    setCurrentStep(1);
    
    try {
      // Step 1: Create embedding settings
      setCurrentStepOutput("Creating embedding settings...");
      const settings = await createSettingsMutation.mutateAsync(config);
      setEmbeddingSettings(settings.id);
      
      // Step 2: Fetch the PDF file
      setCurrentStepOutput("Fetching PDF file...");
      const bookResponse = await fetch(`/api/books/${bookId}`);
      if (!bookResponse.ok) throw new Error("Failed to fetch book details");
      const book = await bookResponse.json();
      
      // Fetch PDF file
      const fileResponse = await fetch(`/uploads/${book.filename}`);
      if (!fileResponse.ok) throw new Error("Failed to fetch PDF file");
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], book.filename, { type: "application/pdf" });
      
      // Step 3: Extract text from PDF
      setCurrentStepOutput("Extracting text from PDF...");
      const pageTexts = await extractTextFromPDF(file);
      
      // Step 4: Process text into chunks
      setCurrentStep(2);
      setCurrentStepOutput("Processing text into chunks...");
      
      const allChunks = [];
      for (let i = 0; i < pageTexts.length; i++) {
        const chunks = await processTextToChunks(
          pageTexts[i],
          i + 1, // page number
          config,
          bookId,
          settings.id
        );
        allChunks.push(...chunks);
      }
      
      // Step 5: Create chunks in database
      setCurrentStep(3);
      setCurrentStepOutput("Creating embeddings for chunks...");
      await createChunksMutation.mutateAsync(allChunks);
      
      // Refresh chunks data
      setCurrentStepOutput("RAG pipeline preparation complete!");
      queryClient.invalidateQueries({ 
        queryKey: [`/api/books/${bookId}/chunks`] 
      });
      
      setCurrentStep(4); // Ready for retrieval
      return true;
    } catch (error) {
      console.error("Error preparing RAG pipeline:", error);
      setCurrentStepOutput(`Error: ${error.message || "An unknown error occurred"}`);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  }, [createSettingsMutation, createChunksMutation, queryClient]);

  // Navigate through chunks
  const navigateToChunk = useCallback((direction: number) => {
    if (!allChunks || allChunks.length === 0) return;
    
    setCurrentChunkIndex((prevIndex) => {
      const newIndex = prevIndex + direction;
      // Handle wrap-around
      if (newIndex < 0) return allChunks.length - 1;
      if (newIndex >= allChunks.length) return 0;
      return newIndex;
    });
  }, [allChunks]);

  return {
    isPreparing,
    currentStep,
    currentStepOutput,
    allChunks,
    currentChunk,
    navigateToChunk,
    prepareRagPipeline,
    embeddingSettings,
  };
}
