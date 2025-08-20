# Vibescraper Development Guide

A comprehensive guide to the Vibescraper codebase for development and AI assistance.

## Project Overview

Vibescraper is a modern web scraping and data extraction platform built with a monorepo architecture. It combines web scraping, data extraction, AI-powered assistance, and real-time collaboration features.

### Core Features
- **Web Scraping**: Multiple fetching strategies (fetch, playwright, playwright-stealth, camoufox)
- **Data Extraction**: JavaScript-based extractors with versioning
- **AI Assistant**: Integrated chat interface with project context
- **Real-time Collaboration**: Project sharing and permissions
- **Data Pipeline**: Crawl → Extract → Store workflow
- **Monitoring**: Real-time status tracking and error handling

## Architecture

### Technology Stack
- **Framework**: Astro 5.x with React 19.x
- **Backend**: Hono for API routing
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with multiple providers
- **State Management**: Zustand with Immer
- **Styling**: Tailwind CSS 4.x
- **Runtime**: Bun with TypeScript 5.x
- **Monorepo**: pnpm workspaces with Turbo
- **AI Integration**: Multiple LLM providers via AI SDK

### Monorepo Structure

```
vibescraper/
├── packages/
│   ├── website/              # Main web application
│   ├── shared-types/         # Common TypeScript types
│   ├── html-processor/       # HTML processing utilities
│   ├── playwright-chrome-stealth/ # Stealth browser automation
│   └── playwright-camoufox/  # Camoufox browser integration
├── .env                      # Environment variables
├── pnpm-workspace.yaml       # Workspace configuration
└── turbo.json               # Build orchestration
```

## Key Technologies & Versions

### Runtime & Build Tools
- **Bun**: Primary runtime and package manager alternative
- **pnpm**: Package manager (v10.14.0)
- **Turbo**: Monorepo build system (v2.5.5)
- **TypeScript**: v5.9.2 with strict configuration

### Framework Stack
- **Astro**: v5.12.9 (SSR with standalone adapter)
- **React**: v19.1.1 with React Compiler
- **TanStack Router**: v1.131.2 for client-side routing
- **Hono**: v4.9.0 for API routing

### Database & ORM
- **PostgreSQL**: Primary database
- **Drizzle ORM**: v0.44.4 with migrations
- **@neondatabase/serverless**: v1.0.1 for serverless deployment

### UI & Styling
- **Tailwind CSS**: v4.1.11 (latest version)
- **Radix UI**: Comprehensive component library
- **Lucide React**: Icons
- **Monaco Editor**: Code editor integration
- **shadcn/ui**: UI component patterns

### State Management
- **Zustand**: v5.0.7 with persistence and devtools
- **Immer**: v10.1.1 for immutable updates
- **SWR**: v2.3.4 for server state

### AI & LLM Integration
- **AI SDK**: v5.0.8 (Vercel AI SDK)
- **Multiple Providers**: OpenAI, Anthropic, Google, Bedrock, etc.
- **Streaming**: Real-time AI responses

## Directory Structure

### `/packages/website/src/`

```
src/
├── assistant-llm/           # AI assistant integration
│   ├── tools/              # AI tool definitions
│   └── prompts/            # AI prompts and templates
├── components/             # Reusable React components
│   ├── ui/                # shadcn/ui components
│   └── ai-elements/       # AI-specific UI components
├── db/                     # Database layer
│   ├── schema/            # Drizzle schema definitions
│   └── migrations/        # Database migrations
├── lib/                    # Utility libraries
├── pages/                  # Astro pages and API routes
├── routes/                 # TanStack Router definitions
├── server/                 # Server-side API handlers
├── store/                  # Zustand store slices
├── partials/               # Page-specific components
└── worker/                 # Background job processing
```

### Key Architectural Patterns

#### Database Schema Pattern
- **ULID IDs**: All entities use ULIDs for primary keys
- **Public IDs**: Separate short alphanumeric IDs for public APIs
- **Branded Types**: TypeScript branded types for type safety
- **Versioning**: Schema and extractor versioning system
- **Soft References**: Storage references with graceful degradation

#### API Pattern (Hono + Better Auth)
```typescript
// Server middleware pattern
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({headers: c.req.raw.headers})
  c.set('user', session?.user)
  c.set('session', session?.session)
  return next()
})

// Route definition pattern
const routes = app
  .route('/account', account)
  .route('/projects', projects)
  .route('/storage', storage)
```

#### State Management Pattern (Zustand)
```typescript
// Slice-based architecture
export interface CombinedState {
  assistantSlice: AssistantSlice
  editorSlice: EditorSlice  
  projectSlice: ProjectSlice
}

// Immer-based mutations
const useStore = create<CombinedState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((...api) => ({
          assistantSlice: createAssistantSlice(...api),
          editorSlice: createEditorSlice(...api),
          projectSlice: createProjectSlice(...api)
        }))
      )
    )
  )
)
```

## Development Patterns

### Environment Management
- **Public vars**: `/src/vars.public.ts` - Client-side environment
- **Private vars**: `/src/vars.private.ts` - Server-side secrets
- **Environment resolution**: Zod-based validation and parsing

### Type Safety
- **Branded types**: Database IDs are branded for type safety
- **Strict TypeScript**: `noImplicitAny`, `strictNullChecks`
- **Shared types**: Common types in `@vibescraper/shared-types`

### API Client Pattern
```typescript
// Type-safe API client with Hono
import type {AppType} from '@/server'
import {hc} from 'hono/client'

export const {api} = hc<AppType>(PUBLIC_VARS.PUBLIC_HOSTNAME, {
  fetch: (input, init) => globalThis.fetch(input, {
    ...init,
    credentials: 'include'
  })
})
```

### Authentication Pattern
- **Better Auth**: Session-based with multiple providers
- **Middleware integration**: Automatic session resolution
- **Permission system**: CASL-based authorization

### Database Patterns

#### Schema Definition
```typescript
export const project = pgTable('project', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<ProjectId>(),
  publicId: text()
    .unique()
    .notNull()
    .$defaultFn(() => alphanumericShortPublicId())
    .$type<ProjectPublicId>(),
  // ...other fields
  ...TIMESTAMPS_SCHEMA
})
```

#### DTO Pattern
```typescript
export type ProjectDTOType = {
  project: StrictOmit<typeof project.$inferSelect, 'id' | 'subjectPolicyId' | 'userId'>
  subjectPolicy: SubjectPolicyDTOType
  chats: ProjectChatDTOType[]
  chatsPageInfo: PaginationEntityState<ProjectChatCursor>
}
```

## State Management Details

### Zustand Store Architecture
- **Slice-based**: Separate slices for different domains
- **Immer integration**: Immutable updates with mutable syntax
- **Persistence**: Selective localStorage persistence
- **DevTools**: Redux DevTools integration
- **Subscriptions**: Fine-grained reactive subscriptions

### Store Slices
1. **AssistantSlice**: AI chat state and project context
2. **EditorSlice**: UI state (panels, tabs, editor config)  
3. **ProjectSlice**: Current project data and settings

### Persistence Strategy
```typescript
partialize: (state) => ({
  assistantSlice: {
    selectedProjectChat: state.assistantSlice.selectedProjectChat,
    projectComponentIdempotencyKeys: state.assistantSlice.projectComponentIdempotencyKeys
  },
  projectSlice: {
    project: state.projectSlice.project
  },
  editorSlice: {
    rightPanelSize: state.editorSlice.rightPanelSize,
    rightPanelOpen: state.editorSlice.rightPanelOpen,
    activeTab: state.editorSlice.activeTab
  }
})
```

## TypeScript Configuration

### Strict Configuration
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "strictNullChecks": true,
  "exactOptionalPropertyTypes": false,
  "verbatimModuleSyntax": true
}
```

### Module Resolution
- **bundler**: Modern module resolution
- **ESNext**: Target and module format
- **Node.js prefix**: Required for built-in modules (`node:fs`, `node:path`)

## Linting Rules & Code Standards

### Key ESLint Rules
- **Node.js imports**: Must use `node:` prefix
- **Global restrictions**: No `__dirname`, `__filename`, `require`
- **React patterns**: Hooks rules, no inline comments
- **TypeScript**: Strict type checking, no `any` warnings
- **Import restrictions**: Enforce proper module imports

### Code Quality Rules
```javascript
'@typescript-eslint/no-unused-vars': 'off',
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/prefer-optional-chain': 'warn',
'react-compiler/react-compiler': 'error',
'curly': ['error', 'all'],
'no-console': ['warn']
```

## Database Patterns

### Entity Relationships
```
[projects] → [projectCommit] (settings & active versions)
         → [projectUrls] (scraping targets)  
         → [projectSchemas] (data schemas, versioned)
         → [extractors] (extraction scripts, versioned)
         → [crawlRuns] (execution history)

[crawlRuns] + [projectUrls] → [httpResponses] (raw data)
[httpResponses] + [extractors] → [extractionRuns] → [extractionItems] (processed data)
```

### Migration Strategy  
- **Timestamp-based**: `drizzle-kit` with timestamp prefixes
- **Schema versioning**: Entities have version numbers
- **Soft deletes**: Important entities use soft deletion

### JSONB Usage
- **Settings**: Complex configuration objects
- **Payloads**: Extracted data items
- **Headers**: HTTP response metadata

## Common Pitfalls & Best Practices

### Type Safety
❌ **DON'T**: Return raw database objects from APIs
```typescript
// BAD - exposes internal IDs
return c.json(dbProject)
```

✅ **DO**: Use DTO types and omit internal fields
```typescript  
// GOOD - clean public API
return c.json({
  project: omit(dbProject, ['id', 'userId']),
  // ...other fields
})
```

### API Response Structure
❌ **DON'T**: Return arrays directly
```typescript
return c.json(projects) // BAD
```

✅ **DO**: Wrap in objects
```typescript
return c.json({projects}) // GOOD
```

### Environment Variables
❌ **DON'T**: Use `process.env` directly
```typescript
const apiKey = process.env.API_KEY // BAD
```

✅ **DO**: Use validated environment schemas
```typescript
const apiKey = PRIVATE_VARS.API_KEY // GOOD
```

### Global Usage
❌ **DON'T**: Use global variables
```typescript
const doc = document // BAD
const win = window // BAD
```

✅ **DO**: Use globalThis prefix
```typescript  
const doc = globalThis.document // GOOD
const win = globalThis.window // GOOD
```

### State Updates
❌ **DON'T**: Mutate state directly
```typescript
state.items.push(newItem) // BAD (without Immer)
```

✅ **DO**: Use Immer or immutable patterns
```typescript
// GOOD (with Immer middleware)
state.items.push(newItem)
```

## Development Workflow

### Package Scripts
```bash
# Development
bun dev                    # Start all services
bun dev:website           # Start website only

# Building  
bun build                 # Build all packages
bun build:website         # Build website only

# Code Quality
bun lint                  # Lint all packages
bun typecheck            # TypeScript checking
bun test                 # Run tests

# Database
bun db:generate          # Generate migrations
bun db:migrate           # Run migrations
bun db:seed              # Seed database

# Worker & Services
bun worker               # Start background worker
bun maildev              # Start mail development server
```

### Environment Setup
1. **Copy environment**: `cp .env.example .env`
2. **Database**: Set `DATABASE_URL` for PostgreSQL
3. **SMTP**: Configure mail settings for development
4. **Auth**: Set `BETTER_AUTH_SECRET` and `CRYPT_SECRET_KEY`
5. **AI**: Configure preferred LLM provider

### Development Server
- **Website**: http://localhost:4321
- **API**: http://localhost:4321/api
- **Mail Dev**: http://localhost:1080 (if using maildev)

## AI Assistant Integration

### Tool System
- **Extraction tools**: AI-powered data extraction
- **Project context**: Automatic project information injection
- **Streaming responses**: Real-time AI interaction
- **Multiple providers**: OpenAI, Anthropic, Google, etc.

### Prompt Engineering
- **System prompts**: Located in `/src/assistant-llm/prompts/`
- **Tool descriptions**: Defined in `/src/assistant-llm/tools/`
- **Context injection**: Automatic project and schema context

### UI Components
- **Chat interface**: Real-time messaging
- **Tool results**: Structured tool output display
- **Code blocks**: Syntax highlighting
- **Citations**: Source attribution

## Performance Considerations

### Bundle Optimization
- **Code splitting**: Automatic with TanStack Router
- **Tree shaking**: ESM modules throughout
- **Dynamic imports**: Lazy loading of heavy components

### Database Optimization  
- **Indexed queries**: Strategic index placement
- **Connection pooling**: Configured for serverless
- **Query optimization**: Drizzle query builder

### State Management
- **Selective persistence**: Only critical state persisted
- **Memoization**: React.memo and useMemo usage
- **Subscription granularity**: Fine-grained state subscriptions

## Deployment

### Build Process
1. **Type checking**: Ensure no TypeScript errors
2. **Linting**: Pass all ESLint rules
3. **Building**: All packages build successfully
4. **Database**: Migrations applied

### Environment Variables
- **Production**: Set all required `PRIVATE_VARS`
- **Database**: PostgreSQL connection string
- **Storage**: S3-compatible storage configuration
- **AI**: Production LLM API keys

### Monitoring
- **Health endpoint**: `/api/` for basic health checks
- **Error tracking**: Structured error handling
- **Performance**: Built-in timing and metrics

## Security

### Authentication
- **Session-based**: Secure HTTP-only cookies
- **CSRF protection**: Built into Better Auth
- **Password hashing**: Secure bcrypt hashing

### Authorization
- **CASL integration**: Policy-based permissions
- **Resource-level**: Project and organization access
- **Role-based**: User, admin, organization roles

### Data Protection
- **Input validation**: Zod schemas throughout
- **SQL injection**: Drizzle ORM prevents injection
- **XSS protection**: React's built-in XSS prevention

---

This guide covers the essential patterns and practices for working with the Vibescraper codebase. Always refer to the latest code for the most up-to-date implementations and patterns.