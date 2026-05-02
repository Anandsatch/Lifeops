# Prompt for next session — Sprint 1 W1 kickoff

> **When to use:** Spin up a new Conductor workspace from `main`, branch as `Anandsatch/sprint-1-w1`. Paste the prompt below into the new session as your first message. The agent will work from the planning artifacts already on `main` (this PR's contents).

---

## The prompt

```
You are taking over LifeOps Sprint 1 Weekend 1. The planning is done; this session
is for execution.

Read these artifacts FIRST (in this order):
1. WORKBACK.md — execution plan, focus on §7 epics E1 + E2, §10 critical path,
   §13 solo execution variant
2. design/DESIGN.md — locked design system; you will reference this in W2 not W1
3. outputs/competitor-scan.md — strategic context; the schema you build today is
   the moat (per E8-T0)
4. ~/All_Projects/Knowledge/projects/lifeops/2026-04-30-design-v2-revised.md — spec
   v2.2 (the canonical product spec; all decisions trace back to this)

Sprint 1 W1 deliverable: a notarized empty .dmg + packages/context-io passing
property-based race tests. Nothing user-visible — that's intentional. The
foundation is the deliverable.

**Track A — Foundation & Pipeline (highest schedule risk per spec):**
- E1-T1 Repo scaffold: pnpm workspace with apps/desktop, apps/cli, apps/skill,
  packages/schema, packages/context-io, packages/benefit-packs
- E1-T2 Notarized hello world .dmg via tauri-action@v0 with Personal Team
  signing (NOT paid Apple Dev — deferred per v2.2 §P9). Empty Tauri shell
  with embedded pc sidecar stub. Use /superpowers:writing-plans BEFORE writing
  the GHA workflow YAML — multi-step infra deserves a plan.
- E1-T3 GitHub Actions CI on macos-14 runners
- After Track A lands: run /codex:rescue --consult "review GHA tauri-action
  workflow for first-release pitfalls" before merging E1-T2

**Track B — Schema & I/O Core (load-bearing per spec):**
- E2-T1 packages/schema Zod schemas (benefit_definitions, credit_instances,
  loyalty, cards, service_credits, _meta). Three cadences only: monthly,
  annual, anniversary.
- E2-T2 packages/context-io atomic write (lock + tmp + fsync + rename + parent
  fsync). Use /superpowers:test-driven-development. TDD is non-negotiable here.
- E2-T3 atomic read (parse retry, partial-parse rejection)
- E2-T4 file-watcher (chokidar, 150ms debounce)
- E2-T5 field-level merge protocol (pure function: human > gmail-receipt >
  gmail-statement > benefit-pack-default)
- E2-T6 fast-check property-based race tests (ALL of E2 reviewed by
  /codex:rescue --challenge "try to break atomicWrite under concurrent writes,
  partial fsync, ENOSPC, kill -9")

**Parallelization opportunities:**
1. Track A and Track B are INDEPENDENT after E1-T1 lands. Spawn one
   subagent for each via the Agent tool. Track A is wall-clock-bound by
   tauri-action build times (~5-8 min per CI run); Track B is CPU-bound on
   property tests. Run them in parallel, not sequence.
2. Within Track B, E2-T2 (atomic write) and the Zod schema (E2-T1) overlap:
   E2-T1 can be drafted first, but E2-T2 can begin against a stub interface
   while E2-T1 is being reviewed.
3. The competitor research (outputs/competitor-scan.md) revealed that
   E8-T0 (publish personal-context-schema as standalone MIT OSS repo) is
   strategically critical and depends only on E2-T1. Once E2-T1 lands, you
   can dispatch a third subagent to draft the OSS repo README + JSON Schema
   export + examples/ dir while Tracks A and B continue. This puts LifeOps
   in position to publish the schema repo end of Sprint 1 W3, before any
   competitor (especially MaxRewards) ships an MCP.

**Workflow per ticket (NEVER skip):**
1. Implement (you)
2. Adversarial review — different model family. Claude code → /codex:rescue
   --challenge. Codex code → /superpowers:requesting-code-review.
3. QA — for non-UI W1 work, /gstack-qa-only (report-only, no fix loop)
4. Pre-merge review — /gstack-review on the diff against base branch
5. Ship — /gstack-ship for individual tickets; one PR per epic for clarity

**Important constraints:**
- DO NOT write any product code (UI, screens, branding) in W1. The W1
  deliverable is plumbing only. UI starts W2.
- DO NOT use paid Apple Developer Program. Use free Personal Team signing.
  Cert won't work cross-machine; that's fine for Sprint 1 dogfood.
- DO NOT update spec v2.2; if you discover a schema gap, FLAG it for me, do
  not silently change.
- Property-based tests are the QA for E2. Don't ship E2 without them passing.

**Session ground rules:**
- Use TodoWrite (TaskCreate / TaskUpdate) to track ticket state. Mark each
  ticket complete as soon as it lands; don't batch.
- Be terse in narration. Use the Explanatory mode insight callouts only when
  there's something codebase-specific worth teaching.
- For long codex runs or fast-check property tests, run in background and
  pick up next ticket while waiting.

**At end of session:**
- Run /gstack-context-save so the next session can pick up cleanly
- Update WORKBACK.md ticket statuses (Todo → Done) and commit
- If P4a gate is blocked because real data isn't populated yet (it will be
  in W1), note that — the gate runs in W3, not W1

The branch is Anandsatch/sprint-1-w1. Push the .gitignore-able outputs to
.context/. Ship to GitHub via /gstack-ship at end of each epic.

Today's date is 2026-05-03 (Sat). Start with Track A and Track B in parallel
after E1-T1 lands.
```

---

## How to use this prompt

1. **In Conductor:** create a new workspace from `main` (assumes PR #1 is merged or you spin from the branch directly). Name it `sprint-1-w1`.
2. **First message:** copy everything between the triple backticks above into the new session.
3. **Wait for the agent to read the artifacts** — it will spend 2-3 minutes loading WORKBACK + DESIGN + spec + competitor-scan before doing anything.
4. **Then it will dispatch parallel subagents** for Track A and Track B per the parallelization callouts.
5. **Your job during the session:** approve the PRs as they come in (one per epic). Don't try to context-switch into doing the work yourself — the agent has more context than re-loading would give you.

## Parallelization map (the critical detail)

```
SESSION KICKOFF
   │
   ▼
E1-T1 Repo scaffold (~1h, single agent)
   │
   ├──────────────────┬──────────────────┐
   ▼                  ▼                  ▼
TRACK A (subagent 1)  TRACK B (subagent 2)  TRACK C (after E2-T1)
─────────────────     ──────────────────     ──────────────────
E1-T2 Hello world     E2-T1 Zod schema       E8-T0 Schema OSS repo
E1-T3 CI              E2-T2 Atomic write      └─ README, JSON Schema
                      E2-T3 Atomic read          export, examples/
                      E2-T4 File watcher
                      E2-T5 Merge protocol
                      E2-T6 Race tests
   │                  │                       │
   └──────────────────┴───────────────────────┘
                      │
                      ▼
                  W1 COMPLETE
                  (notarized .dmg + context-io + race tests passing
                   + personal-context-schema repo drafted)
```

**Three parallel tracks running simultaneously after E1-T1.** Track A waits on CI; Track B is interactive TDD; Track C is documentation work that can absorb async time. None blocks the others until end-of-W1 integration.

## What's NOT in this prompt (deliberately)

- **Sprint 1 W2 work** (Tauri shell + UI) — separate session, separate prompt. Don't let the W1 agent start UI.
- **Sprint 2 work** (MCP, provenance, Gmail refresh) — out of scope.
- **Apple Dev Program enrollment** — wall-clock dependency only, not code work.
- **The competitive research updates to spec v2.2 → v2.3** — flagged for your review separately.

## When to spin up the next session AFTER this one

After Sprint 1 W1 ships (notarized .dmg + context-io passing race tests), spin up another conductor workspace named `sprint-1-w2` for the UI work. That session's prompt will reference `design/` directly and instruct the agent to `@import` tokens.css + components.css rather than rebuild the visual language.
