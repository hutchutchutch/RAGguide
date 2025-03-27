import { useState, useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { apiRequest } from "@/lib/queryClient";
import { useBookContext } from "@/contexts/book-context";
import { useRagPipeline } from "@/hooks/use-rag-pipeline";
import { useKnowledgeGraph } from "@/hooks/use-knowledge-graph";
import { performRagRetrieval, performGraphRagRetrieval } from "@/lib/rag";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'standard' | 'graph';
  sources?: {
    chunkId: string;
    text: string;
    relevance: number;
  }[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const { selectedBook } = useBookContext();
  const { allChunks, embeddingSettings } = useRagPipeline();
  const { nodes, edges } = useKnowledgeGraph();
  const queryClient = useQueryClient();
  
  const chatMutation = useMutation({
    mutationFn: async ({
      question,
      type,
    }: {
      question: string;
      type: 'standard' | 'graph';
    }) => {
      if (!selectedBook || !allChunks || allChunks.length === 0) {
        throw new Error("Book or chunks not available");
      }

      // Add user message
      const userMessageId = uuidv4();
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: question,
        type: type,
      };

      setMessages((prev) => [...prev, userMessage]);

      let result;

      try {
        // Perform retrieval based on type
        if (type === 'standard') {
          result = await performRagRetrieval(
            question,
            allChunks,
            selectedBook.title,
            5 // topK
          );
        } else {
          result = await performGraphRagRetrieval(
            question,
            allChunks,
            nodes || [],
            edges || [],
            selectedBook.title,
            5 // topK
          );
        }

        // Save the full prompt for review
        setCurrentPrompt(result.promptUsed);

        // Format the sources for display
        const sources = result.chunks.map((chunk) => ({
          chunkId: chunk.chunk.id || "",
          text: chunk.chunk.text,
          relevance: chunk.score,
        }));

        // Save chat session to backend
        const chatSession = await apiRequest("POST", "/api/chat-sessions", {
          book_id: selectedBook.id,
          question: question,
          llm_response: result.answer,
        });

        // Save retrieved chunks
        if (chatSession && chatSession.id) {
          // Save each chat chunk
          for (let i = 0; i < result.chunks.length; i++) {
            const chunk = result.chunks[i];
            await apiRequest("POST", "/api/chat-chunks", {
              chat_id: chatSession.id,
              chunk_id: chunk.chunk.id,
              rank: i,
              retrieval_type: type,
            });
          }

          // Save the prompt
          await apiRequest("POST", "/api/llm-prompts", {
            chat_id: chatSession.id,
            system_prompt: "You are a helpful assistant answering questions about the book.",
            context_chunks: result.chunks.map(c => c.chunk.id || ""),
            final_prompt: result.promptUsed,
          });
        }

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: result.answer,
          type: type,
          sources: sources,
        };

        return assistantMessage;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (assistantMessage) => {
      setMessages((prev) => [...prev, assistantMessage]);
    },
  });

  const sendMessage = useCallback(
    async (question: string, type: 'standard' | 'graph' = 'standard') => {
      return chatMutation.mutateAsync({ question, type });
    },
    [chatMutation]
  );

  return {
    messages,
    currentPrompt,
    sendMessage,
    isLoading: chatMutation.isPending,
  };
}
