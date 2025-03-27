import { useState } from "react";
import { useBooks } from "@/hooks/use-books";
import RagPipelineInspector from "@/components/rag-pipeline-inspector";
import ChatInterface from "@/components/chat-interface";
import KnowledgeGraphBuilder from "@/components/knowledge-graph-builder";
import UploadModal from "@/components/upload-modal";
import { Book } from "@shared/schema";
import { useBookContext } from "@/contexts/book-context";

export default function Dashboard() {
  const { books, isLoading } = useBooks();
  const { selectedBook, setSelectedBook } = useBookContext();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(350);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [isRightResizing, setIsRightResizing] = useState(false);

  // Handle book selection
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookId = e.target.value;
    const book = books?.find((b) => b.id === bookId);
    if (book) {
      setSelectedBook(book);
    }
  };

  // Handle panel resizing
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeftResizing(true);
    document.addEventListener("mousemove", handleLeftResize);
    document.addEventListener("mouseup", stopLeftResize);
  };

  const handleLeftResize = (e: MouseEvent) => {
    if (!isLeftResizing) return;
    const newWidth = e.clientX;
    
    // Set bounds
    if (newWidth < 350) {
      setLeftPanelWidth(350);
    } else if (newWidth > 500) {
      setLeftPanelWidth(500);
    } else {
      setLeftPanelWidth(newWidth);
    }
  };

  const stopLeftResize = () => {
    setIsLeftResizing(false);
    document.removeEventListener("mousemove", handleLeftResize);
    document.removeEventListener("mouseup", stopLeftResize);
  };

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRightResizing(true);
    document.addEventListener("mousemove", handleRightResize);
    document.addEventListener("mouseup", stopRightResize);
  };

  const handleRightResize = (e: MouseEvent) => {
    if (!isRightResizing) return;
    const windowWidth = window.innerWidth;
    const newWidth = windowWidth - e.clientX;
    
    // Set bounds
    if (newWidth < 350) {
      setRightPanelWidth(350);
    } else if (newWidth > 500) {
      setRightPanelWidth(500);
    } else {
      setRightPanelWidth(newWidth);
    }
  };

  const stopRightResize = () => {
    setIsRightResizing(false);
    document.removeEventListener("mousemove", handleRightResize);
    document.removeEventListener("mouseup", stopRightResize);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-secondary-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1 className="text-xl font-semibold">RAG Explorer</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => setUploadModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Book</span>
          </button>
          
          <div className="flex items-center">
            <span className="mr-2 text-neutral-500 text-sm">Current Book:</span>
            {isLoading ? (
              <div className="animate-pulse h-10 w-48 bg-gray-200 rounded-md"></div>
            ) : (
              <select 
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white text-sm"
                value={selectedBook?.id || ""}
                onChange={handleBookChange}
                disabled={!books || books.length === 0}
              >
                {!books || books.length === 0 ? (
                  <option value="">No books available</option>
                ) : (
                  books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content area with three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: RAG Pipeline Inspector */}
        <div 
          id="left-panel" 
          className="bg-white border-r border-neutral-200 flex flex-col"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <RagPipelineInspector />
        </div>
        
        <div 
          className={`resizer ${isLeftResizing ? 'active' : ''}`} 
          onMouseDown={handleLeftResizeStart}
          style={{
            background: isLeftResizing ? '#3182CE' : '#E2E8F0',
            width: '5px',
            cursor: 'col-resize',
          }}
        ></div>
        
        {/* Main panel: Chat Interface */}
        <div id="main-panel" className="flex-1 flex flex-col bg-neutral-50">
          <ChatInterface />
        </div>
        
        <div 
          className={`resizer ${isRightResizing ? 'active' : ''}`} 
          onMouseDown={handleRightResizeStart}
          style={{
            background: isRightResizing ? '#3182CE' : '#E2E8F0',
            width: '5px',
            cursor: 'col-resize',
          }}
        ></div>
        
        {/* Right panel: Knowledge Graph Builder */}
        <div 
          id="right-panel" 
          className="bg-white border-l border-neutral-200 flex flex-col"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <KnowledgeGraphBuilder />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}
