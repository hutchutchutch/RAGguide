import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookSchema } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DriveFilePicker from "./drive-file-picker";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const uploadSchema = insertBookSchema.extend({
  file: z.instanceof(File, { message: "Please select a PDF or TXT file" })
    .refine(
      file => file.type === "application/pdf" || file.type === "text/plain", 
      "File must be a PDF or TXT"
    )
    .refine(file => file.size <= 20 * 1024 * 1024, "File size must not exceed 20MB"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (data: UploadFormValues) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("file", data.file);

      await apiRequest("POST", "/api/books", formData);
      
      toast({
        title: "Book uploaded successfully",
        description: `"${data.title}" has been uploaded and is ready for processing.`,
      });
      
      // Invalidate books query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      
      // Close modal and reset form
      onClose();
      form.reset();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.type === "text/plain") {
        form.setValue("file", file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or TXT file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileImported = (bookId: string) => {
    toast({
      title: "Book imported successfully",
      description: "The book has been imported from Google Drive and is ready for processing.",
    });
    
    // Invalidate books query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    
    // Close modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md lg:max-w-lg bg-[#252525] border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">Upload New Book</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="local" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#303030]">
            <TabsTrigger value="local" className="text-white data-[state=active]:bg-[#404040]">
              Local Upload
            </TabsTrigger>
            <TabsTrigger value="google" className="text-white data-[state=active]:bg-[#404040]">
              Google Drive
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="mt-4">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Book Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter book title..." 
                          className="bg-[#303030] border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-gray-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">File Upload (PDF or TXT)</FormLabel>
                      <FormControl>
                        <div 
                          className={`border-2 border-dashed rounded-md p-4 text-center ${
                            isDragging ? "border-gray-400 bg-[#303030]" : "border-gray-600"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {value ? value.name : "Drag & drop your PDF or TXT file here or"}
                          </p>
                          <Button
                            type="button"
                            className="bg-[#303030] hover:bg-[#404040] text-white"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "application/pdf,text/plain";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              };
                              input.click();
                            }}
                          >
                            Browse Files
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">Maximum file size: 20MB</p>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-[#303030] hover:text-white"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#303030] hover:bg-[#404040] text-white"
                    disabled={isSubmitting || !form.formState.isValid}
                  >
                    {isSubmitting ? "Uploading..." : "Upload & Process"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="google" className="mt-4">
            <DriveFilePicker onFileImported={handleFileImported} />
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-[#303030] hover:text-white"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
