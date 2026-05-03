# LifeOps release pipeline

This repo ships LifeOps via two GitHub Actions workflows:

| Workflow                              | Trigger                            | Runner          | Purpose                                          |
| ------------------------------------- | ---------------------------------- | --------------- | ------------------------------------------------ |
| `.github/workflows/ci.yml`            | every push + PR to `main`          | `ubuntu-latest` | Fast typecheck + test gate (~2 min)              |
| `.github/workflows/release.yml`       | `git push --tags v*` + manual      | `macos-14`      | Build + bundle macOS arm64 `.app` and `.dmg`     |

---

## Cutting a release (Sprint 1 + 2 — unsigned)

```bash
# bump versions in apps/desktop/package.json + src-tauri/Cargo.toml + tauri.conf.json
git tag v0.0.1
git push --tags
```

The `release.yml` workflow will:

1. Build the Vite frontend.
2. Compile the Rust backend (Tauri 2.x) for `aarch64-apple-darwin`.
3. Bundle into `LifeOps.app` + `LifeOps.dmg`.
4. Upload the `.dmg` as a workflow artifact (always).
5. If triggered by a tag push, also create a **draft** GitHub Release with the `.dmg` attached.

The resulting `.dmg` is **unsigned**. To install on a Mac:

```bash
# 1. Drag LifeOps.app from the .dmg to /Applications
# 2. Right-click LifeOps.app → Open (do NOT double-click — Gatekeeper will block).
# 3. If macOS still complains, clear the quarantine attribute:
xattr -cr /Applications/LifeOps.app
```

This is **expected and acceptable** for Sprint 1 + 2 — Anand is the only user
and the app runs only on his own Macs. See spec §P9 for the rationale on
deferring paid Apple Developer enrollment to the Sprint 3 launch gate.

---

## Flipping to signed + notarized (Sprint 3, ticket E8-T2)

Add **seven** GitHub Secrets to the repository (Settings → Secrets and variables → Actions):

| Secret                       | Source                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| `APPLE_CERTIFICATE`          | base64 of the `Developer ID Application` `.p12` export      |
| `APPLE_CERTIFICATE_PASSWORD` | password set when exporting the `.p12`                      |
| `APPLE_SIGNING_IDENTITY`     | full identity string, e.g. `Developer ID Application: Anand Satchidanandam (TEAMID)` |
| `APPLE_ID`                   | Apple ID email enrolled in the Apple Developer Program      |
| `APPLE_PASSWORD`             | App-Store-Connect-API-key-based notarytool password OR an app-specific password |
| `APPLE_TEAM_ID`              | 10-char Apple Developer Team ID                             |
| `KEYCHAIN_PASSWORD`          | any random string — used by tauri-action to lock the temp build keychain |

Generate the base64 cert:

```bash
base64 -i DeveloperIDApplication.p12 | pbcopy
```

**Once those secrets exist, no YAML changes are required.** `release.yml` has
two explicit `if:`-gated build steps — the unsigned step runs when
`APPLE_CERTIFICATE` is empty, the signed+notarized step runs when it is
populated. Adding the seven secrets above flips which path runs, with zero
YAML edits. The signed step has `tauri-action` automatically:

- imports the cert into a fresh keychain,
- code-signs `LifeOps.app` with hardened runtime + the `entitlements.plist` we already ship,
- submits to Apple notarization service via `notarytool`,
- staples the notarization ticket to the `.dmg`.

Verify with:

```bash
spctl --assess --verbose /Applications/LifeOps.app
codesign --verify --deep --strict --verbose=2 /Applications/LifeOps.app
xcrun stapler validate /Applications/LifeOps.dmg
```

---

## Sidecar (`pc`) note

`apps/desktop/src-tauri/binaries/pc-aarch64-apple-darwin` is currently a
shell-script stub (E1-T6). The real Bun-compiled `pc` CLI lands in **E3-T9**,
which adds a `bun build … --compile --target=bun-darwin-arm64` step to
`release.yml` *before* the `tauri-action` invocation, overwriting the stub
with the real binary.

The Tauri bundler embeds whatever file is at that path into
`LifeOps.app/Contents/Resources/`, so once E3-T9 lands, no further config
changes are required.
