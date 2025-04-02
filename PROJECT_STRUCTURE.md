ragguide/                       # Root of the repository
├── apps/                              # Turborepo "apps" that run independently
│   ├── frontend/                      # React + Vite for UI
│   │   # Reasoning: Previously 'client/'.
│   │   # Now placed under `apps/` to separate concerns.
│   │   ├── public/                    # Static assets (icons, images)
│   │   ├── src/
│   │   │   ├── components/            # UI components
│   │   │   ├── contexts/              # React contexts for state management
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── lib/                   # Client utilities/services
│   │   │   ├── pages/                 # Page components (routing)
│   │   │   ├── graphVisualizer/       # Knowledge graph visualization UI
│   │   │   └── App.tsx                # Main application component
│   │   ├── index.html                 # HTML template
│   │   ├── tailwind.config.ts         # Tailwind config
│   │   ├── tsconfig.json              # TypeScript config for the frontend
│   │   ├── vite.config.ts             # Vite bundler config
│   │   └── package.json               # Dependencies & scripts for frontend
│   │       # e.g. dev, build, preview tasks
│   │
│   └── backend/                       # Express.js server for RAG logic
│       # Reasoning: Previously 'server/'.
│       # Now under `apps/` for clarity & isolation in Turborepo.
│       ├── src/
│       │   ├── routes.ts             # API routes (upload, search, etc.)
│       │   ├── controllers/          # Request handlers
│       │   ├── services/             # Business logic, e.g. chunking, embeddings
│       │   │   ├── ingestionService.ts         # PDF/TXT ingestion & chunking
│       │   │   ├── vectorSearchService.ts      # Vector DB config & search calls
│       │   │   ├── llmChainService.ts          # LLM calls combined with vector results
│       │   │   ├── knowledgeGraphService.ts    # Handling Neo4j schema, node/edge updates
│       │   │   └── ...
│       │   ├── utils/                # Utility functions (logging, error handling)
│       │   ├── index.ts              # Server entry point (Express setup)
│       │   └── pg-storage.ts         # (If originally using PostgreSQL, may remove or rename
│       │                             #  if fully replaced by Neo4j; here for reference)
│       ├── uploads/                  # Directory for uploaded files
│       ├── Dockerfile                # Docker image for backend
│       ├── tsconfig.json             # TypeScript config for backend
│       └── package.json              # Dependencies & scripts (OpenAI, Neo4j driver, etc.)
│
├── infra/                            # Infrastructure & ops
│   # Reasoning: Central place for Docker, AWS, and other config
│   ├── docker-compose.yml            # Compose to run Neo4j, backend, frontend
│   ├── .env                          # Shared env variables (embedding model, chunk size, etc.)
│   ├── neo4j/                        # Self-hosted Neo4j config & scripts
│   │   ├── import/                   # CSV/data import for Neo4j
│   │   ├── plugins/                  # Neo4j plugins (APOC, n10s)
│   │   └── README.md                 # Docs on running Neo4j in AWS
│   └── aws/                          # AWS-related config (S3, backups, etc.)
│       ├── s3-bucket-setup.md        # Scripts/steps to manage S3 bucket
│       └── backup-config.md          # Guidance on snapshotting data to S3
│
├── packages/                         # Shared libraries across apps
│   # Reasoning: Replaces old 'shared/' directory.
│   # We can store cross-cutting code, e.g. config, types, or chain logic.
│   ├── schema/                       # If you still want a Drizzle or Type definitions
│   │   # Reasoning: If you keep a partial PG setup or store domain models,
│   │   # place them here. Or rename for more general `domain/`.
│   │   ├── src/
│   │   └── package.json
│   ├── vector-config/                # Possibly shared types for vector settings
│   ├── rag-chains/                   # Reusable chain logic if multiple apps need it
│   └── ...
│
├── scripts/                          # Helper scripts / CLI automation
│   # Reasoning: Replaces ad-hoc scripts in old server or root
│   ├── seed-neo4j.ts                 # Seeding Neo4j with sample data
│   ├── chunk-processor.ts            # Possibly for local doc chunking
│   └── s3-ops.sh                     # S3 upload/download, if needed
│
├── turbo.json                        # Turborepo config (pipelines, caching, concurrency)
├── tsconfig.base.json                # Base TS config for entire monorepo
├── package.json                      # Root-level scripts/devDependencies
├── .gitignore                        # Node modules, build artifacts, secrets
└── README.md                         # Overall project documentation
