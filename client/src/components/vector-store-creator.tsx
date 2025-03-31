import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookContext } from "@/contexts/book-context";
import { useRagPipeline } from "@/hooks/use-rag-pipeline";
import { ChunkingStrategy, CleanerType, EmbeddingConfig } from "@/lib/rag";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { insertEmbeddingSettingsSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SettingsCarousel from "@/components/settings-carousel";

const embeddingFormSchema = insertEmbeddingSettingsSchema.extend({
  chunkSize: z.coerce.number().min(100, "Chunk size must be at least 100").max(8000, "Chunk size must not exceed 8000"),
  overlap: z.coerce.number().min(0, "Overlap cannot be negative").max(1000, "Overlap must not exceed 1000"),
  vectorDb: z.string().min(1, "Vector database is required"),
  embeddingModel: z.string().min(1, "Embedding model is required"),
  specialContentHandling: z.string().optional(),
  documentPreprocessing: z.array(z.string()).optional(),
  modelDimensions: z.string().optional(),
  contextualSetting: z.string().optional(),
  batchSize: z.coerce.number().optional(),
  metadataExtraction: z.array(z.string()).optional(),
  storeOriginalText: z.boolean().optional(),
  documentStructure: z.string().optional(),
  languageProcessing: z.string().optional(),
  qualityControl: z.array(z.string()).optional(),
  dimensionReduction: z.string().optional(),
  contentEnrichment: z.array(z.string()).optional(),
  distanceMetric: z.string().optional(),
  processingAllocation: z.string().optional(),
  parallelThreads: z.coerce.number().optional(),
  errorHandling: z.string().optional(),
});

type FormValues = z.infer<typeof embeddingFormSchema>;

// Sections configuration to track completion
interface SectionConfig {
  title: string;
  optionsCount: number;
  completedOptions: number;
  key: string;
}

export default function VectorStoreCreator() {
  const { selectedBook } = useBookContext();
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    textProcessing: false,
    embeddingConfig: false,
    metadata: false,
    advanced: false,
    system: false,
  });
  
  const { 
    isPreparing, 
    currentStep, 
    prepareRagPipeline,
    currentChunk,
    allChunks,
    navigateToChunk,
  } = useRagPipeline();

  const form = useForm<FormValues>({
    resolver: zodResolver(embeddingFormSchema),
    defaultValues: {
      chunkSize: 1024,
      overlap: 200,
      cleaner: "simple",
      strategy: "recursive",
      model: "text-embedding-ada-002",
      vectorDb: "pgvector",
      embeddingModel: "openai",
      specialContentHandling: "keep-tables",
      documentPreprocessing: ["clean-formatting"],
      modelDimensions: "1536",
      contextualSetting: "with-context",
      batchSize: 32,
      metadataExtraction: ["page-numbers", "section-titles"],
      storeOriginalText: true,
      documentStructure: "preserve-hierarchy",
      languageProcessing: "auto-detect",
      qualityControl: ["remove-duplicates"],
      dimensionReduction: "none",
      contentEnrichment: [],
      distanceMetric: "cosine",
      processingAllocation: "cpu",
      parallelThreads: 4,
      errorHandling: "skip-problematic",
    },
  });

  // Track form completion by section
  const sections: SectionConfig[] = [
    {
      title: "Primary Options",
      key: "primary",
      optionsCount: 2,
      completedOptions: [
        form.watch("vectorDb"),
        form.watch("embeddingModel")
      ].filter(Boolean).length
    },
    {
      title: "Text Processing",
      key: "textProcessing",
      optionsCount: 5,
      completedOptions: [
        form.watch("chunkSize"),
        form.watch("overlap"),
        form.watch("strategy"),
        form.watch("specialContentHandling"),
        form.watch("documentPreprocessing")?.length
      ].filter(Boolean).length
    },
    {
      title: "Embedding Configuration",
      key: "embeddingConfig",
      optionsCount: 3,
      completedOptions: [
        form.watch("modelDimensions"),
        form.watch("contextualSetting"),
        form.watch("batchSize")
      ].filter(Boolean).length
    },
    {
      title: "Metadata Options",
      key: "metadata",
      optionsCount: 4,
      completedOptions: [
        form.watch("metadataExtraction")?.length,
        form.watch("storeOriginalText") !== undefined,
        form.watch("documentStructure")
      ].filter(Boolean).length
    },
    {
      title: "Advanced Settings",
      key: "advanced",
      optionsCount: 5,
      completedOptions: [
        form.watch("languageProcessing"),
        form.watch("qualityControl")?.length,
        form.watch("dimensionReduction"),
        form.watch("contentEnrichment")?.length,
        form.watch("distanceMetric")
      ].filter(Boolean).length
    },
    {
      title: "System Settings",
      key: "system",
      optionsCount: 3,
      completedOptions: [
        form.watch("processingAllocation"),
        form.watch("parallelThreads"),
        form.watch("errorHandling")
      ].filter(Boolean).length
    }
  ];

  // Calculate overall progress
  const totalOptions = sections.reduce((acc, section) => acc + section.optionsCount, 0);
  const completedOptions = sections.reduce((acc, section) => acc + section.completedOptions, 0);
  const progressPercentage = Math.round((completedOptions / totalOptions) * 100);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCreateVectorStore = async (values: FormValues) => {
    if (!selectedBook) {
      toast({
        title: "No book selected",
        description: "Please upload or select a book first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to EmbeddingConfig type
      const config: EmbeddingConfig = {
        chunkSize: values.chunkSize,
        overlap: values.overlap,
        cleaner: values.cleaner as CleanerType,
        strategy: values.strategy as ChunkingStrategy,
        model: values.model
      };
      
      await prepareRagPipeline(config, selectedBook.id);
      toast({
        title: "Processing complete",
        description: "Vector store created successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred during vector store creation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-white">Vector Store Creation</h2>
        
        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Configuration Progress</span>
            <span className="text-xs font-medium text-gray-300">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Form Sections */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateVectorStore)} className="space-y-4">
            {/* Primary Options (Always Visible) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Primary Options</h3>
                <span className="text-xs text-gray-400">{sections[0].completedOptions}/{sections[0].optionsCount} selected</span>
              </div>
              
              <FormField
                control={form.control}
                name="vectorDb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Vector Database</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-highlight animated-border">
                          <SelectValue placeholder="Select a vector database" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#303030] border-gray-600 text-white">
                        <SelectItem value="pgvector">PostgreSQL (pgvector)</SelectItem>
                        <SelectItem value="pinecone">Pinecone</SelectItem>
                        <SelectItem value="weaviate">Weaviate</SelectItem>
                        <SelectItem value="qdrant">Qdrant</SelectItem>
                        <SelectItem value="chroma">Chroma</SelectItem>
                        <SelectItem value="milvus">Milvus</SelectItem>
                        <SelectItem value="supabase">Supabase Vector</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="embeddingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Embedding Model</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="input-highlight animated-border">
                          <SelectValue placeholder="Select an embedding model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#303030] border-gray-600 text-white">
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="cohere">Cohere</SelectItem>
                        <SelectItem value="huggingface">Hugging Face models</SelectItem>
                        <SelectItem value="opensource">Open source models</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              {/* Document type info */}
              <div className="bg-gray-800 rounded-md p-3 border border-gray-700 mt-2">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-300">
                    Document type will be automatically detected from your uploaded file.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Text Processing */}
            <Collapsible 
              open={expandedSections.textProcessing} 
              onOpenChange={() => toggleSection('textProcessing')}
              className="border border-gray-700 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between bg-[#303030] p-3 text-left">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">Text Processing</h3>
                  <span className="ml-2 text-xs text-gray-400">{sections[1].completedOptions}/{sections[1].optionsCount} selected</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.textProcessing ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[#252525] p-3 space-y-3">
                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Chunking Method</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select chunking method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="fixed">Fixed Size</SelectItem>
                          <SelectItem value="semantic">Semantic</SelectItem>
                          <SelectItem value="sliding">Sliding Window</SelectItem>
                          <SelectItem value="recursive">Recursive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="chunkSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Chunk Size</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger className="input-highlight animated-border">
                              <SelectValue placeholder="Select chunk size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#303030] border-gray-600 text-white">
                            <SelectItem value="256">256 tokens</SelectItem>
                            <SelectItem value="512">512 tokens</SelectItem>
                            <SelectItem value="1024">1024 tokens</SelectItem>
                            <SelectItem value="2048">2048 tokens</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="overlap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Chunk Overlap</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(val) => {
                            const percentage = parseInt(val);
                            const chunkSize = form.getValues("chunkSize");
                            const overlapValue = Math.round(chunkSize * (percentage / 100));
                            field.onChange(overlapValue);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="input-highlight animated-border">
                              <SelectValue placeholder="Select overlap" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#303030] border-gray-600 text-white">
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="specialContentHandling"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Special Content Handling</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Special content handling" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="keep-tables">Keep tables</SelectItem>
                          <SelectItem value="extract-tables">Extract tables as structured data</SelectItem>
                          <SelectItem value="remove-tables">Remove tables</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cleaner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Document Preprocessing</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select a cleaner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="simple">Remove headers/footers</SelectItem>
                          <SelectItem value="advanced">Clean formatting artifacts</SelectItem>
                          <SelectItem value="ocr-optimized">Keep raw text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {/* Embedding Configuration */}
            <Collapsible
              open={expandedSections.embeddingConfig}
              onOpenChange={() => toggleSection('embeddingConfig')}
              className="border border-gray-700 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between bg-[#303030] p-3 text-left">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">Embedding Configuration</h3>
                  <span className="ml-2 text-xs text-gray-400">{sections[2].completedOptions}/{sections[2].optionsCount} selected</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.embeddingConfig ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[#252525] p-3 space-y-3">
                <FormField
                  control={form.control}
                  name="modelDimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Model Dimensions</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select dimensions" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="384">384</SelectItem>
                          <SelectItem value="768">768</SelectItem>
                          <SelectItem value="1536">1536</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contextualSetting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Contextual Setting</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select contextual setting" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="with-context">With document context</SelectItem>
                          <SelectItem value="without-context">Without context</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="batchSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Batch Processing</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select batch size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="16">Batch size: 16</SelectItem>
                          <SelectItem value="32">Batch size: 32</SelectItem>
                          <SelectItem value="64">Batch size: 64</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {/* Metadata Options */}
            <Collapsible
              open={expandedSections.metadata}
              onOpenChange={() => toggleSection('metadata')}
              className="border border-gray-700 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between bg-[#303030] p-3 text-left">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">Metadata Options</h3>
                  <span className="ml-2 text-xs text-gray-400">{sections[3].completedOptions}/{sections[3].optionsCount} selected</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.metadata ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[#252525] p-3 space-y-3">
                {/* Metadata option fields here */}
                <FormField
                  control={form.control}
                  name="metadataExtraction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Automatic Extraction</FormLabel>
                      <Select
                        value={field.value ? field.value[0] : ""}
                        onValueChange={(val) => field.onChange([val])}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select metadata extraction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="page-numbers">Page numbers</SelectItem>
                          <SelectItem value="section-titles">Section titles</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="storeOriginalText"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-gray-300">Store Original Text</FormLabel>
                      </div>
                      <FormControl>
                        <div 
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${field.value ? "bg-gray-700" : "bg-gray-600"}`}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <div 
                            className={`bg-white rounded-full h-4 w-4 shadow-md transform transition-transform ${field.value ? "translate-x-5" : "translate-x-0"}`} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documentStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Document Structure</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select document structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="preserve-hierarchy">Preserve hierarchy</SelectItem>
                          <SelectItem value="flatten-structure">Flatten structure</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {/* Advanced Settings */}
            <Collapsible
              open={expandedSections.advanced}
              onOpenChange={() => toggleSection('advanced')}
              className="border border-gray-700 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between bg-[#303030] p-3 text-left">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">Advanced Settings</h3>
                  <span className="ml-2 text-xs text-gray-400">{sections[4].completedOptions}/{sections[4].optionsCount} selected</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[#252525] p-3 space-y-3">
                {/* Advanced option fields here */}
                <FormField
                  control={form.control}
                  name="languageProcessing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Language Processing</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select language processing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="auto-detect">Auto-detect language</SelectItem>
                          <SelectItem value="specific-language">Specific language</SelectItem>
                          <SelectItem value="multilingual">Multilingual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dimensionReduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Vector Dimension Reduction</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select dimension reduction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="pca">PCA</SelectItem>
                          <SelectItem value="t-sne">t-SNE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="distanceMetric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Distance Metric</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select distance metric" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="cosine">Cosine</SelectItem>
                          <SelectItem value="euclidean">Euclidean</SelectItem>
                          <SelectItem value="dot">Dot Product</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {/* System Settings */}
            <Collapsible
              open={expandedSections.system}
              onOpenChange={() => toggleSection('system')}
              className="border border-gray-700 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between bg-[#303030] p-3 text-left">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">System Settings</h3>
                  <span className="ml-2 text-xs text-gray-400">{sections[5].completedOptions}/{sections[5].optionsCount} selected</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.system ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-[#252525] p-3 space-y-3">
                {/* System option fields here */}
                <FormField
                  control={form.control}
                  name="processingAllocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Processing Allocation</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select processing allocation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="cpu">CPU</SelectItem>
                          <SelectItem value="gpu">GPU</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parallelThreads"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Parallel Processing</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select thread count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="1">Threads: 1</SelectItem>
                          <SelectItem value="2">Threads: 2</SelectItem>
                          <SelectItem value="4">Threads: 4</SelectItem>
                          <SelectItem value="8">Threads: 8</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="errorHandling"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Error Handling</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="input-highlight animated-border">
                            <SelectValue placeholder="Select error handling" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#303030] border-gray-600 text-white">
                          <SelectItem value="skip-problematic">Skip problematic files</SelectItem>
                          <SelectItem value="abort-on-error">Abort on error</SelectItem>
                          <SelectItem value="attempt-recovery">Attempt recovery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {/* Create Vector Store Button */}
            <Button 
              type="submit" 
              className="w-full bg-[#303030] hover:bg-[#404040] text-white animated-border"
              disabled={isPreparing || !selectedBook}
            >
              {isPreparing ? "Processing..." : "Create Vector Store"}
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Chunk Preview (show when processing is complete) */}
      <div className="flex-1 overflow-auto p-4">
        {currentChunk ? (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm uppercase tracking-wider text-gray-400">Chunk Preview</h3>
              <div className="flex space-x-2">
                <button 
                  className="text-gray-400 hover:text-white" 
                  title="Previous Chunk"
                  onClick={() => navigateToChunk(-1)}
                  disabled={!allChunks || allChunks.length <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span className="text-xs text-gray-400">
                  Chunk {currentChunk.chunk_index + 1} of {allChunks?.length || 0}
                </span>
                <button 
                  className="text-gray-400 hover:text-white" 
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
            
            <div className="bg-[#252525] border border-gray-700 rounded-md">
              <div className="p-3 bg-[#202020] text-sm max-h-[300px] overflow-auto">
                <div className="code-block text-gray-300 whitespace-pre-wrap font-mono text-xs">
                  {currentChunk.text}
                </div>
              </div>
              
              <div className="border-t border-gray-700 p-3 flex justify-between">
                <div className="text-xs text-gray-400">
                  Page: {currentChunk.page_number || 'N/A'} • 
                  Words: {currentChunk.text.split(/\s+/).length} • 
                  Characters: {currentChunk.text.length}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="bg-[#252525] border border-gray-700">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm text-center">
                Configure options and create a vector store to see chunks here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}