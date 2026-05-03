# Sidecar binaries

Tauri's `externalBin` mechanism (configured in `../tauri.conf.json`) bundles
binaries from this directory into `LifeOps.app/Contents/Resources/`.

## Naming convention (load-bearing)

Tauri auto-resolves the `<name>-<target-triple>` suffix. For an `externalBin`
entry of `binaries/pc`:

| Runner / target              | Required filename              |
| ---------------------------- | ------------------------------ |
| macos-14 (Apple Silicon)     | `pc-aarch64-apple-darwin`      |
| macos-13 (Intel, not used)   | `pc-x86_64-apple-darwin`       |
| Universal binary             | `pc-universal-apple-darwin`    |

LifeOps ships Apple-Silicon-only per spec §P9 — so only the
`aarch64-apple-darwin` variant is required.

## Current state (Sprint 1 W1)

`pc-aarch64-apple-darwin` is a shell-script stub that prints a JSON sentinel.
It exists so the Tauri bundler doesn't fail at build time. The real
`pc` CLI (Bun-compiled standalone executable) replaces this in **E3-T9**:

```bash
# In E3-T9, the GHA workflow will run before tauri-action:
bun build apps/cli/src/pc.ts \
  --compile --target=bun-darwin-arm64 \
  --outfile apps/desktop/src-tauri/binaries/pc-aarch64-apple-darwin
```
