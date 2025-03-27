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
    } catch (error) {
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
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3">
                {selectedBook 
                  ? `Chat with "${selectedBook.title}"` 
                  : "Upload or select a book to begin"}
              </h2>
              <p className="text-neutral-600">
                Ask questions about the book content. Toggle between standard RAG and GraphRAG to compare results.
              </p>
            </div>
            
            {/* Toggle between RAG views */}
            <div className="flex border border-neutral-200 rounded-md overflow-hidden bg-white mb-8">
              <button
                className={`flex-1 py-3 ${
                  viewMode === 'standard' 
                    ? 'bg-secondary-500 text-white font-medium' 
                    : 'bg-white text-neutral-600'
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
                    ? 'bg-secondary-500 text-white font-medium' 
                    : 'bg-white text-neutral-600'
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
            
            {/* Message thread */}
            {messages.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No messages yet</h3>
                <p className="text-neutral-500">
                  Ask a question about the book to start chatting
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={message.id || index} className="mb-6">
                  {/* User message */}
                  {message.role === 'user' && (
                    <div className="flex items-start mb-1">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-neutral-600 mb-1">You</p>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p>{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Assistant message */}
                  {message.role === 'assistant' && (
                    <div className="flex items-start mt-4">
                      <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                          <p className="font-medium text-sm text-neutral-600 mr-2">Assistant</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            message.type === 'standard' 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'bg-secondary-100 text-secondary-700'
                          }`}>
                            {message.type === 'standard' ? 'Standard RAG' : 'GraphRAG'}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="mb-3 whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Source chunks used */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 border-t border-neutral-200 pt-3">
                              <p className="text-sm font-medium text-neutral-600 mb-2">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="bg-neutral-50 p-3 rounded-md text-xs text-neutral-700 border border-neutral-200 mb-2 last:mb-0">
                                  <p className="mb-1 font-medium text-neutral-500">
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
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-neutral-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <form className="flex items-end" onSubmit={handleSubmit}>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask a question about the book..."
                rows={2}
                className="w-full border border-neutral-300 rounded-lg py-3 px-4 pr-10 resize-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none"
              />
              {userMessage && (
                <button 
                  type="button" 
                  className="absolute right-3 bottom-3 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setUserMessage("")}
                  title="Clear input"
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
              className="ml-3 bg-primary-500 hover:bg-primary-600 text-white"
              disabled={isLoading || !userMessage.trim() || !selectedBook}
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
              className="text-sm text-neutral-500 hover:text-neutral-700"
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
