import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useBookContext } from "@/contexts/book-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

export default function ChatInterface() {
  const [userMessage, setUserMessage] = useState("");
  const [viewMode, setViewMode] = useState<'standard' | 'graph'>('standard');
  const { selectedBook } = useBookContext();
  const { messages, sendMessage, isLoading } = useChat();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim()) return;
    if (!selectedBook) {
      toast({
        title: "No book selected",
        description: "Please upload or select a book first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await sendMessage(userMessage, viewMode);
      setUserMessage("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error sending message",
        description: error.message || "Failed to process your message",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="bg-[#303030] rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3 text-white">
                {selectedBook 
                  ? `Chat with "${selectedBook.title}"` 
                  : "Upload or select a book to begin"}
              </h2>
              <p className="text-gray-300">
                Ask questions about the book content. Toggle between standard RAG and GraphRAG to compare results.
              </p>
            </div>
            
            {/* Toggle between RAG views */}
            <div className="flex border border-gray-700 rounded-md overflow-hidden bg-[#252525] mb-8">
              <button
                className={`flex-1 py-3 ${
                  viewMode === 'standard' 
                    ? 'bg-gray-700 text-white font-medium' 
                    : 'bg-[#252525] text-gray-300'
                }`}
                onClick={() => setViewMode('standard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M8 12h8"></path>
                  <path d="M8 8h8"></path>
                  <path d="M8 16h8"></path>
                </svg>
                Standard RAG
              </button>
              <button
                className={`flex-1 py-3 ${
                  viewMode === 'graph' 
                    ? 'bg-gray-700 text-white font-medium' 
                    : 'bg-[#252525] text-gray-300'
                }`}
                onClick={() => setViewMode('graph')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                GraphRAG
              </button>
            </div>
          </div>
          
          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="text-center p-8 bg-[#252525] rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
              <p className="text-gray-400">
                Ask a question about the book to start chatting
              </p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <div key={message.id || index} className="mb-6">
                  {/* User message */}
                  {message.role === 'user' && (
                    <div className="flex items-start mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-300 mb-1">You</p>
                        <div className="bg-[#303030] rounded-lg p-4 shadow-sm text-white">
                          <p>{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Assistant message */}
                  {message.role === 'assistant' && (
                    <div className="flex items-start mt-4">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 8V4H8"></path>
                          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                          <path d="M2 14h2"></path>
                          <path d="M20 14h2"></path>
                          <path d="M15 13v2"></path>
                          <path d="M9 13v2"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-sm text-gray-300 mr-2">Assistant</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {message.type === 'standard' ? 'Standard RAG' : 'GraphRAG'}
                          </span>
                        </div>
                        <div className="bg-[#303030] rounded-lg p-4 shadow-sm text-white">
                          <p className="mb-3 whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Source chunks used */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 border-t border-gray-600 pt-3">
                              <p className="text-sm font-medium text-gray-300 mb-2">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="bg-[#252525] p-3 rounded-md text-xs text-gray-300 border border-gray-700 mb-2 last:mb-0">
                                  <p className="mb-1 font-medium text-gray-400">
                                    Chunk #{idx + 1} ({Math.round(source.relevance * 100)}% relevance)
                                  </p>
                                  <p className="code-block whitespace-pre-wrap font-mono">
                                    {source.text.length > 200 
                                      ? `"...${source.text.substring(0, 200)}..."`
                                      : `"${source.text}"`
                                    }
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-800 bg-[#252525] p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask a question about the book..."
                rows={2}
                className="w-full resize-none p-3 border border-gray-600 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-[#303030] text-white"
              />
              {userMessage && (
                <button 
                  type="button" 
                  className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-200"
                  onClick={() => setUserMessage("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            <Button 
              type="submit"
              disabled={isLoading || !userMessage.trim() || !selectedBook}
              className="ml-3 bg-[#303030] hover:bg-[#404040] text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"></path>
                <path d="M22 2 11 13"></path>
              </svg>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
          
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-gray-400 hover:text-gray-200"
              onClick={() => {
                toast({
                  title: "Advanced Options",
                  description: "Configuration options coming soon",
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Advanced Options
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}