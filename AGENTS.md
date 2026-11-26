<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## E-Gudang project rules

- Read `docs/PRD.md`, `docs/DESIGN.md` and `docs/PROJECT_STRUCTURE.md` before implementing features.
- Keep App Router in root `app/`; no `src/`, separate backend, or unnecessary abstraction.
- Design values live in `styles/tokens.css` and semantic typography in `styles/typography.css`. Tailwind mappings live in `app/globals.css`.
- Reuse existing shadcn/ui Radix Nova primitives and shared components; do not duplicate components or hardcode per-page theme values.
- Maintain accessible keyboard navigation, visible focus, responsive layout and light/dark parity.
- Keep database operations server-side. Never commit secrets, real warehouse data, or generated Prisma client.
- Do not expand the current phase into unrelated business functionality or dependency upgrades.
- Before review run `npx next typegen`, `npx tsc --noEmit`, `npx eslint .`, and `npm run build`. Report any checks not run.
