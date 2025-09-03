# Development Setup

## Prerequisites

Install asdf: https://asdf-vm.com/

## Setup

```sh
# Install system dependencies (macOS)
brew install glib vips

# Install asdf plugins
asdf plugin add nodejs
asdf plugin add pnpm
asdf plugin add bun
asdf install

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL (adjust for your setup)
brew services start postgresql
# OR docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17-alpine

# Update .env with your database URL
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vibescraper

# Build all packages
bun run build

# Run migrations
cd packages/website
bun run db:migrate
# Start development server
bun run dev
```

Go to http://localhost:4321

## Scripts

```sh
bun run dev              # Start dev server
bun run build            # Build all packages
bun run lint             # Lint codebase
bun run typecheck        # TypeScript check
```
