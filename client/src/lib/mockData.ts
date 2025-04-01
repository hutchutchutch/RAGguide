// Mock API responses for development mode
export const mockApiResponses: Record<string, any> = {
  // Authentication endpoints
  "GET:/api/auth/user": {
    id: "dev-user-123",
    username: "devuser",
    email: "dev@example.com",
    avatar_url: null,
    google_id: null
  },
  
  // Books endpoints
  "GET:/api/user/books": [
    {
      id: "book-1",
      title: "Introduction to RAG Systems",
      description: "A comprehensive guide to Retrieval-Augmented Generation",
      file_path: "/sample/path/to/file.pdf",
      file_type: "pdf",
      uploaded_at: new Date().toISOString(),
      user_id: "dev-user-123",
      total_pages: 145,
      total_chunks: 432
    },
    {
      id: "book-2",
      title: "Advanced Vector Search",
      description: "Deep dive into vector search algorithms",
      file_path: "/sample/path/to/another.pdf",
      file_type: "pdf",
      uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      user_id: "dev-user-123",
      total_pages: 87,
      total_chunks: 261
    }
  ],
  
  // Embedding settings
  "GET:/api/embedding-settings": [
    {
      id: "setting-1",
      name: "Default",
      chunk_size: 1024,
      chunk_overlap: 128,
      embedding_model: "text-embedding-ada-002",
      created_at: new Date().toISOString(),
      is_default: true
    },
    {
      id: "setting-2",
      name: "Small Chunks",
      chunk_size: 512,
      chunk_overlap: 64,
      embedding_model: "text-embedding-ada-002",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_default: false
    }
  ],
  
  // Mock for specific book data
  "GET:/api/books/book-1": {
    id: "book-1",
    title: "Introduction to RAG Systems",
    description: "A comprehensive guide to Retrieval-Augmented Generation",
    file_path: "/sample/path/to/file.pdf",
    file_type: "pdf",
    uploaded_at: new Date().toISOString(),
    user_id: "dev-user-123",
    total_pages: 145,
    total_chunks: 432
  },
  
  // Mock for chat sessions
  "GET:/api/chat-sessions/book-1": [
    {
      id: "chat-1",
      book_id: "book-1",
      title: "Initial exploration",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "chat-2",
      book_id: "book-1",
      title: "Deep dive into Chapter 3",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString()
    }
  ],
  
  // Add more mock responses as needed
};