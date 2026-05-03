# LifeOps

> Local-first personal context layer for credit cards, loyalty, and benefits.
> Your wallet's rules and live state, in a YAML file you control, queryable by Claude/ChatGPT/Codex via Skill or MCP.

**Status:** Sprint 1 W1 (foundation) — not yet usable. See [`WORKBACK.md`](./WORKBACK.md) for the execution plan.

## What this is

A reference data model + tooling for "the credits CardPointers can't see" — stateful, partial-usage credit instances with field-level provenance, expressed as YAML on your local disk. The schema is the moat (see [`outputs/competitor-scan.md`](./outputs/competitor-scan.md)); the app and Skill are the showcase.

## Repo layout

```
apps/
  desktop/        # Tauri 2.x + Vite + React 19 + TS native macOS app
  cli/            # `pc` Bun-bundled CLI (init, query, validate, add, demo)
  skill/          # SKILL.md + bash helpers for Claude/ChatGPT/Codex
packages/
  schema/         # Zod schemas — single source of truth for shape
  context-io/     # Atomic read/write + file-watch + merge protocol
  benefit-packs/  # Curated JSON for Amex/Chase/Citi/Capital One products
design/           # Locked design system (tokens.css + components.css + DESIGN.md)
outputs/          # Strategic research artifacts (competitor scan, etc.)
```

## Reference docs (locked)

- **Product spec v2.2:** `~/All_Projects/Knowledge/projects/lifeops/2026-04-30-design-v2-revised.md`
- **Workback plan:** [`WORKBACK.md`](./WORKBACK.md)
- **Design system:** [`design/DESIGN.md`](./design/DESIGN.md)
- **Competitive moat thesis:** [`outputs/competitor-scan.md`](./outputs/competitor-scan.md)

## Toolchain

- Node ≥20, pnpm ≥9, Bun ≥1.3, Rust (for Tauri).
- macOS-first; Tauri targets `macos-14` arm64 in CI.
- Tests: Vitest + `fast-check` (property-based race tests for `context-io`).

## License

MIT. The schema in `packages/schema/` is intended to be republished as the standalone `personal-context-schema` repo (see WORKBACK §E8-T0).
