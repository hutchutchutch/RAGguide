import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookContext } from "@/contexts/book-context";
import { useRagPipeline } from "@/hooks/use-rag-pipeline";
import { useChat } from "@/hooks/use-chat";
import { ChunkingStrategy, CleanerType } from "@/lib/rag";
import PromptPreview from "./prompt-preview";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { insertEmbeddingSettingsSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const embeddingFormSchema = insertEmbeddingSettingsSchema.extend({
  chunkSize: z.coerce.number().min(100, "Chunk size must be at least 100").max(8000, "Chunk size must not exceed 8000"),
  overlap: z.coerce.number().min(0, "Overlap cannot be negative").max(1000, "Overlap must not exceed 1000"),
});

type EmbeddingFormValues = z.infer<typeof embeddingFormSchema>;

export default function RagPipelineInspector() {
  const { selectedBook } = useBookContext();
  const { toast } = useToast();
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const { 
    isPreparing, 
    currentStep, 
    prepareRagPipeline,
    currentChunk,
    allChunks,
    navigateToChunk,
    currentStepOutput
  } = useRagPipeline();
  
  const { currentPrompt } = useChat();

  const form = useForm<EmbeddingFormValues>({
    resolver: zodResolver(embeddingFormSchema),
    defaultValues: {
      chunkSize: 1024,
      overlap: 200,
      cleaner: "simple",
      strategy: "recursive",
      model: "text-embedding-ada-002",
    },
  });

  const handleRechunkAndEmbed = async (values: EmbeddingFormValues) => {
    if (!selectedBook) {
      toast({
        title: "No book selected",
        description: "Please upload or select a book first",
        variant: "destructive",
      });
      return;
    }

    try {
      await prepareRagPipeline(values, selectedBook.id);
      toast({
        title: "Processing complete",
        description: "Book has been chunked and embedded successfully",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred during chunking and embedding",
        variant: "destructive",
      });
    }
  };

  // Helper function to determine if a step is active
  const getStepStatus = (step: number) => {
    if (currentStep > step) return "complete";
    if (currentStep === step) return "active";
    return "inactive";
  };

  return (
    <>
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold mb-4">RAG Pipeline Inspector</h2>
        
        {/* Embedding Settings Form */}
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Embedding Settings</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRechunkAndEmbed)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="chunkSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chunk Size</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overlap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overlap</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="cleaner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Cleaner</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cleaner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simple">Simple Cleaner</SelectItem>
                        <SelectItem value="advanced">Advanced Cleaner</SelectItem>
                        <SelectItem value="ocr-optimized">OCR Optimized</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chunking Strategy</FormLabel>
                    <div className="flex border border-neutral-300 rounded-md overflow-hidden">
                      <Button
                        type="button"
                        className={`flex-1 py-2 rounded-none ${
                          field.value === 'recursive'
                            ? 'bg-primary-500 text-white font-medium'
                            : 'bg-white text-neutral-600'
                        }`}
                        onClick={() => field.onChange('recursive')}
                      >
                        Recursive
                      </Button>
                      <Button
                        type="button"
                        className={`flex-1 py-2 rounded-none ${
                          field.value === 'semantic'
                            ? 'bg-primary-500 text-white font-medium'
                            : 'bg-white text-neutral-600'
                        }`}
                        onClick={() => field.onChange('semantic')}
                      >
                        Semantic
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary-500 hover:bg-primary-600"
                disabled={isPreparing}
              >
                {isPreparing ? "Processing..." : "Rechunk + Embed"}
              </Button>
            </form>
          </Form>
        </div>
        
        {/* RAG Pipeline Steps */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Pipeline Steps</h3>
          
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`step-circle ${getStepStatus(step)}`}>
                  {step}
                </div>
                {index < 4 && (
                  <div className={`step-connector ${currentStep > step ? 'active' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-xs flex justify-between text-neutral-500 mb-4">
            <span>Preprocess</span>
            <span>Chunk</span>
            <span>Embed</span>
            <span>Retrieve</span>
            <span>Generate</span>
          </div>
          
          <div className="bg-neutral-50 rounded-md p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">
                Current Step: {
                  currentStep === 1 ? "Preprocessing" :
                  currentStep === 2 ? "Chunking" :
                  currentStep === 3 ? "Embedding" :
                  currentStep === 4 ? "Retrieving" :
                  "Generating"
                }
              </h4>
            </div>
            <div className="text-sm text-neutral-600">
              {currentStep === 1 && "Cleaning and preprocessing text..."}
              {currentStep === 2 && `Processing text into optimal chunks based on size: ${form.watch('chunkSize')} and overlap: ${form.watch('overlap')}...`}
              {currentStep === 3 && "Creating vector embeddings for each chunk..."}
              {currentStep === 4 && "Finding the most relevant chunks for your query..."}
              {currentStep === 5 && "Generating a response based on retrieved information..."}
            </div>
          </div>
          
          <Button 
            className="w-full bg-secondary-500 hover:bg-secondary-600 text-white"
            onClick={() => toast({
              title: "Run RAG",
              description: "Use the chat interface to ask questions",
            })}
            disabled={isPreparing || !allChunks || allChunks.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 17.5l-9.9 5.7a.9.9 0 0 1-.9 0l-9.9-5.7a1 1 0 0 1 0-1.7L12 10l9.9 5.7a1 1 0 0 1 0 1.7Z"></path>
              <path d="M22 12.7l-9.9 5.7a.9.9 0 0 1-.9 0l-9.9-5.7a1 1 0 0 1 0-1.7L12 5.3l9.9 5.7a1 1 0 0 1 0 1.7Z"></path>
            </svg>
            Run RAG
          </Button>
        </div>
      </div>
      
      {/* Pipeline Step Output */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4">
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Step Output</h3>
          
          {currentChunk ? (
            <div className="bg-white border border-neutral-200 rounded-md">
              <div className="border-b border-neutral-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Chunk Preview</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="text-neutral-500 hover:text-neutral-700" 
                      title="Previous Chunk"
                      onClick={() => navigateToChunk(-1)}
                      disabled={!allChunks || allChunks.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                    </button>
                    <span className="text-xs text-neutral-500">
                      Chunk {currentChunk.chunk_index + 1} of {allChunks?.length || 0}
                    </span>
                    <button 
                      className="text-neutral-500 hover:text-neutral-700" 
                      title="Next Chunk"
                      onClick={() => navigateToChunk(1)}
                      disabled={!allChunks || allChunks.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-neutral-50 text-sm max-h-[300px] overflow-auto">
                <div className="code-block text-neutral-800 whitespace-pre-wrap font-mono text-xs">
                  {currentChunk.text}
                </div>
              </div>
              
              <div className="border-t border-neutral-200 p-3 flex justify-between">
                <div className="text-xs text-neutral-500">
                  Page: {currentChunk.page_number || 'N/A'} • 
                  Words: {currentChunk.text.split(/\s+/).length} • 
                  Characters: {currentChunk.text.length}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-secondary-500 hover:text-secondary-600"
                  onClick={() => {
                    toast({
                      title: "Label Chunk",
                      description: "Use the Knowledge Graph Builder panel to label chunks",
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                  Label Chunk
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-neutral-500 text-sm">
                  No chunks available. Configure embedding settings and process a book to see chunks here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Button
            variant="link"
            className="text-primary-500 hover:text-primary-600 mb-2"
            onClick={() => setShowPromptPreview(!showPromptPreview)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {showPromptPreview ? "Hide" : "Preview"} Final Prompt
          </Button>
          
          {showPromptPreview && (
            <PromptPreview prompt={currentPrompt} />
          )}
        </div>
      </div>
    </>
  );
}
