import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PromptPreviewProps {
  prompt?: string;
}

export default function PromptPreview({ prompt }: PromptPreviewProps) {
  const { toast } = useToast();
  
  const handleCopyToClipboard = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt)
        .then(() => {
          toast({
            title: "Copied",
            description: "Prompt copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Could not copy to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-md">
      <div className="border-b border-neutral-200 px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Final System Prompt</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-neutral-700 h-8 w-8 p-0"
          onClick={handleCopyToClipboard}
          disabled={!prompt}
          title="Copy to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
        </Button>
      </div>
      
      <div className="p-3 bg-neutral-50 text-xs max-h-[150px] overflow-auto">
        <div className="code-block text-neutral-800 whitespace-pre-wrap font-mono">
          {prompt || "No prompt available. Ask a question to generate a prompt."}
        </div>
      </div>
    </div>
  );
}
