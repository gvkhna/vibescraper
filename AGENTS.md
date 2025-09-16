# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` + `turbo` under `packages/*`.
- Key packages:
  - `packages/website` — Astro + React app (DB via Drizzle), public assets in `public/`.
  - `packages/html-processor`, `packages/storage-service`, `packages/json-tree-table`, `packages/playwright-*`, `packages/shared-types` — TypeScript libraries.
  - `packages/integration-tests` — Vitest + Testcontainers.
- Root config: `eslint.config.mjs`, `.prettierrc.cjs`, `tsconfig*.json`, `turbo.json`, `pnpm-workspace.yaml`, `.env*`.

## Build, Test, and Development Commands
- Install: `pnpm install` (uses versions in `.tool-versions`).
- Build all: `bun run build` (runs `turbo run build`).
- Dev (website): `bun run dev` or `bun run dev:all` to run all dev tasks.
- Lint: `bun run lint` (use `--filter` to target a package).
- Typecheck: `bun run typecheck`.
- Tests (unit): `bun run test`.
- Tests (integration): `bun run test:integration` (requires Docker; honors `TESTCONTAINERS_*`).
- Website-only: inside `packages/website` — `bun run dev`, `bun run build`, `bun run db:migrate`, `bun run test:vitest`, `bun run test:coverage`.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM only). Prefer `node:*` imports for Node built-ins.
- Formatting: Prettier config in `.prettierrc.cjs` (single quotes, no semicolons, width 110). Run via your editor; fix ESLint with `bun turbo run lint -- --fix`.
- Indentation: 2 spaces. Filenames: kebab-case for files, `PascalCase` for React components, `camelCase` for variables/functions.
- Avoid dynamic `import()`, `require`, and direct `process` usage; use `import.meta.env` where applicable.

## Testing Guidelines
- Framework: Vitest across packages; tests live beside source (`*.test.ts`) or under `tests/`.
- Run fast unit tests with `bun run test`; heavy/integration in `packages/integration-tests`.
- If UI-affecting changes in `website`, run `bun run test:vitest` and consider `bun run test:coverage`.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject; optional body with rationale. Link issues (`#123`) when relevant.
- Before PR: run build, lint, typecheck, and tests locally.
- PRs: clear description, scope limited to one concern; include screenshots for UI changes and notes on env/migrations.

## Security & Configuration Tips
- Copy env: `cp .env.example .env`; never commit secrets. Update `DATABASE_URL` for local Postgres.
- Integration tests need Docker; set `TESTCONTAINERS_RYUK_DISABLED=1` if your setup requires it.

## Agent-Specific Instructions
- Only modify code within the relevant package; keep changes minimal and ESM-compliant.
- Respect Turbo tasks and package scripts; do not add global build steps.
- Follow ESLint restrictions (no dynamic imports, prefer `node:*`). Run `lint`, `typecheck`, and targeted tests before proposing changes.
