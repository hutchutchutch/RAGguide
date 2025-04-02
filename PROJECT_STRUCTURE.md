# RAG Guide Project Structure

This document provides a comprehensive overview of the RAG Guide project structure, detailing the organization of directories and files, as well as the functionality housed in each.

## Project Overview

The RAG Guide is a web application for advanced Retrieval-Augmented Generation (RAG) strategy exploration. It offers in-depth comparative analysis of different RAG approaches with sophisticated PDF document processing and knowledge graph visualization.

### Core Technologies

- **Frontend**: React with TypeScript, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with pgvector for embeddings storage and vector similarity search
- **Authentication**: Local and Google OAuth
- **Document Processing**: PDF parsing and chunking
- **Vector Embeddings**: OpenAI embeddings API
- **Knowledge Graph**: Generation and visualization

## Directory Structure

The project is organized as a monorepo with distinct client and server directories, and shared code in a common location.

```
/
├── client/                  # Frontend React application
├── server/                  # Backend Express.js server
├── shared/                  # Shared code (database schema, types)
├── attached_assets/         # Static assets (images, etc.)
└── node_modules/            # Dependencies (root and workspace)
```

## Shared Directory

Located at the root level, the `shared` directory contains code that is used by both frontend and backend.

```
/shared/
└── schema.ts                # Database schema definitions and types
```

### schema.ts

This file defines:
- PostgreSQL database tables using Drizzle ORM
- Insert schemas for validating data
- TypeScript types for each model
- Custom vector type for pgvector compatibility

It includes these data models:
- **users**: Authentication and user profile data
- **books**: Uploaded PDF documents
- **embeddingSettings**: Configuration for text chunking and embedding
- **chunks**: Document chunks with vector embeddings
- **chatSessions**: User chat interactions with the system
- **chatChunks**: Mapping between chat sessions and relevant chunks
- **llmPrompts**: Prompts sent to language models
- **nodes**: Knowledge graph nodes
- **edges**: Knowledge graph relationships
- **nodeChunks**: Mapping between graph nodes and text chunks

## Client Directory

The `client` directory contains the frontend React application.

```
/client/
├── src/                     # Source code
│   ├── components/          # UI components
│   ├── contexts/            # React contexts for state management
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and services
│   ├── pages/               # Page components for routes
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── package.json             # Frontend dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

### Key Frontend Components

- **App.tsx**: Defines the main application structure and routing
- **pages/landing.tsx**: Home page and authentication screens
- **pages/dashboard.tsx**: Main application dashboard for RAG functionality
- **contexts/book-context.tsx**: Manages the state of the current book and PDF processing
- **hooks/use-auth.tsx**: Authentication logic and user state management
- **lib/queryClient.ts**: Configuration for React Query data fetching

## Server Directory

The `server` directory contains the backend Express.js server.

```
/server/
├── src/                     # Source code
│   ├── lib/                 # Utility functions and services
│   │   ├── auth.ts          # Authentication logic
│   │   ├── db.ts            # Database connection and initialization
│   │   ├── drive.ts         # Google Drive integration
│   │   ├── openai.ts        # OpenAI API integration
│   │   ├── pgvector/        # pgvector utilities
│   │   └── index-graph/     # Knowledge graph indexing
│   ├── index.ts             # Server entry point
│   ├── pg-storage.ts        # PostgreSQL storage implementation
│   ├── routes.ts            # API route definitions
│   └── storage.ts           # Storage interface and in-memory implementation
├── uploads/                 # Directory for uploaded files
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Backend dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.ts                  # Vite integration for serving the frontend
```

### Key Backend Components

- **index.ts**: Server initialization, middleware setup, and request handling
- **routes.ts**: API endpoint definitions and request handlers
- **storage.ts**: Interface for data storage with in-memory fallback
- **pg-storage.ts**: PostgreSQL implementation of the storage interface
- **lib/auth.ts**: Authentication strategies (local and Google OAuth)
- **lib/db.ts**: Database connection, initialization, and vector search
- **lib/openai.ts**: OpenAI API integration for embeddings and completions

## API Endpoints

The backend exposes the following API endpoints:

### Authentication

- **GET /api/user**: Get the current authenticated user
- **POST /api/register**: Register a new user
- **POST /api/login**: Log in an existing user
- **POST /api/logout**: Log out the current user
- **GET /api/auth/google**: Initiate Google OAuth
- **GET /api/auth/google/callback**: Google OAuth callback

### Books and Documents

- **GET /api/books**: Get all books
- **GET /api/books/:id**: Get a specific book
- **POST /api/books**: Upload a new book
- **GET /api/drive/documents**: List documents from Google Drive
- **POST /api/drive/import**: Import a document from Google Drive

### Embedding Settings

- **GET /api/embedding-settings**: Get all embedding settings
- **GET /api/embedding-settings/:id**: Get specific embedding settings
- **POST /api/embedding-settings**: Create new embedding settings
- **POST /api/embedding-settings/:id/rate**: Rate embedding settings

### Chunks

- **GET /api/books/:bookId/chunks**: Get chunks for a book with specific settings
- **POST /api/chunks**: Create a new chunk
- **POST /api/chunks/batch**: Create multiple chunks

### Chat

- **GET /api/books/:bookId/chat-sessions**: Get chat sessions for a book
- **POST /api/chat-sessions**: Create a new chat session
- **GET /api/chat-sessions/:chatId/chunks**: Get chunks for a chat session
- **POST /api/chat-chunks**: Associate a chunk with a chat session
- **GET /api/chat-sessions/:chatId/prompt**: Get the LLM prompt for a chat session
- **POST /api/llm-prompts**: Create a new LLM prompt

### Knowledge Graph

- **GET /api/books/:bookId/nodes**: Get nodes for a book
- **POST /api/nodes**: Create a new node
- **GET /api/books/:bookId/edges**: Get edges for a book
- **POST /api/edges**: Create a new edge
- **GET /api/nodes/:nodeId/chunks**: Get chunks associated with a node
- **POST /api/node-chunks**: Associate a chunk with a node
- **GET /api/books/:bookId/knowledge-graph**: Get the complete knowledge graph for a book

### OpenAI Integration

- **POST /api/openai/embeddings**: Generate embeddings for text
- **POST /api/openai/chat**: Generate a completion from OpenAI

## Database Structure

The PostgreSQL database uses several tables defined in the shared schema:

- **users**: User accounts and authentication information
- **books**: Uploaded PDF documents
- **embedding_settings**: Configuration for text chunking and embedding
- **chunks**: Document chunks with vector embeddings
- **chat_sessions**: User chat interactions
- **chat_chunks**: Mapping between chat sessions and chunks
- **llm_prompts**: Prompts sent to language models
- **nodes**: Knowledge graph nodes
- **edges**: Knowledge graph relationships
- **node_chunks**: Mapping between nodes and chunks

Vector embeddings are stored using pgvector for efficient similarity search.

## Development Workflows

The project uses concurrently to run the frontend and backend development servers:

```
npm run dev
```

This command:
1. Starts the backend server on port 5000
2. Starts the Vite dev server for the frontend on port 5173 
3. The backend server proxies requests to the frontend dev server

## Database Migrations

Database schema changes are pushed using Drizzle Kit:

```
npm run db:push
```

This command updates the database schema to match the definitions in `shared/schema.ts`.

## Authentication

The application supports:

1. **Local authentication**: Email and password
2. **Google OAuth**: For Google account login and Google Drive access

## Application Features

### PDF Processing

1. Upload PDF documents
2. Import documents from Google Drive
3. Configure chunking and embedding settings
4. Generate embeddings for document chunks

### RAG Comparison

1. Create different embedding configurations
2. Compare retrieval performance across configurations
3. Rate and annotate configurations

### Knowledge Graph

1. Generate knowledge graphs from documents
2. Visualize relationships between entities
3. Use graph-enhanced RAG for improved retrieval

### Chat Interface

1. Ask questions about documents
2. See which chunks were used in the response
3. Compare traditional RAG and graph-enhanced RAG responses

## Recent Restructuring

The project has undergone a significant restructuring to improve separation of concerns and configuration management:

### Directory Structure Reorganization

1. **Server Restructuring**: The server code has been moved into a proper `src` directory with subdirectories for better organization:
   - `src/lib` contains utility modules and services
   - Core functionality like routes and storage are at the `src` level

2. **Import Path Standardization**: All import paths have been updated to use relative paths instead of alias paths:
   - Changed from aliased imports like `@shared/schema` to direct relative paths like `../../shared/schema`
   - This ensures proper module resolution regardless of environment

3. **Configuration File Placement**: Configuration files have been moved to their appropriate directories:
   - `tailwind.config.ts` placed in the client directory
   - `drizzle.config.ts` placed in the server directory
   - Each workspace has its own specific configuration

### Import Path Structure

The project uses the following import path structure:

1. **Frontend (client)**: 
   - `@/*`: Imports from the client's src directory 
     - Example: `import { Button } from "@/components/ui/button"`
   - `@shared/*`: Imports from the shared directory
     - Example: `import { type Book } from "@shared/schema"`
   - `@assets/*`: Imports from the attached_assets directory
     - Example: `import logo from "@assets/logo.png"`

2. **Backend (server)**:
   - Relative paths for all imports
     - Direct imports: `import { storage } from "./storage"`
     - Parent directory: `import { log } from "../vite"`
     - Shared directory: `import { User } from "../../shared/schema"`

### Development Experience Improvements

1. **Independent Frontend Development**: Frontend now supports development without backend dependency:
   - Client-side mocking of API responses when backend is unavailable
   - Auto-login as development user for frontend testing
   - Environment variables to control development mode behavior

2. **Clearer Error Handling**: Improved error handling and reporting throughout the application:
   - Detailed error messages with proper HTTP status codes
   - Better logging of errors and their sources
   - Type-safe error responses

3. **Simplified Workflow**: Streamlined development workflow:
   - Concurrent running of frontend and backend servers
   - Backend proxying to frontend for seamless development
   - Automatic database schema management

## Troubleshooting

### Common Issues and Solutions

1. **Module Import Errors**
   - Issue: `Cannot find module '../../../shared/schema'` or similar
   - Solution: Double-check relative path imports in server files; they should be relative to the file location

2. **Database Connection**
   - Issue: Unable to connect to the PostgreSQL database
   - Solution: Verify `DATABASE_URL` environment variable is set correctly

3. **Development Server Port Conflicts**
   - Issue: Port 5000 or 5173 already in use
   - Solution: Kill the process using the port or change the port configuration

4. **Authentication Errors**
   - Issue: Google OAuth not working or redirects failing
   - Solution: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly

5. **OpenAI API Integration**
   - Issue: Unable to generate embeddings or completions
   - Solution: Ensure `OPENAI_API_KEY` is set with a valid API key

### Development Tips

1. Use `console.log("Running in DEVELOPMENT mode")` in the client console to verify the frontend is running in development mode

2. Check the Network tab in browser DevTools to debug API requests/responses

3. Look for warning messages in the terminal when running the application

4. If modifying schema: after updating `shared/schema.ts`, run `npm run db:push` to update the database schema