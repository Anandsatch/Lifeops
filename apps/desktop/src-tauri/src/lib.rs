// LifeOps desktop — Tauri commands + filesystem watcher.
//
// W2 contract:
//   - load_personal_context(): returns the raw YAML string the React app
//     should parse + Zod-validate. Source precedence:
//       1. ~/.personal-context.yaml if present (real user data)
//       2. bundled example-amex-gold.yaml (W2 demo data)
//   - watcher: notify::RecommendedWatcher with a 150ms debounce on
//     ~/.personal-context.yaml; emits the "context-changed" event with
//     the new raw string each time the file settles.
//
// Why notify in Rust instead of context-io's chokidar: chokidar is a
// Node-native module and does not run inside the Tauri WebView. The
// debounce window (150ms) and idempotency contract (re-derive UI from
// raw YAML each tick) match watcher.ts exactly so the React side can
// later swap to context-io without any state-shape churn.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

use notify_debouncer_mini::{
    new_debouncer, notify::RecursiveMode, DebounceEventResult, Debouncer,
};
use tauri::{AppHandle, Emitter, Manager, State};

const CONTEXT_FILENAME: &str = ".personal-context.yaml";
const BUNDLED_DEMO: &str = "resources/example-amex-gold.yaml";
const CONTEXT_CHANGED_EVENT: &str = "context-changed";
const DEBOUNCE_MS: u64 = 150;

/// Resolves ~/.personal-context.yaml. Returns None only when no home dir
/// is discoverable (extremely rare; a user with $HOME unset).
fn user_context_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(CONTEXT_FILENAME))
}

/// Resolves the bundled demo YAML inside the .app's Resources directory.
/// In dev (`tauri dev`) this resolves to apps/desktop/src-tauri/resources/.
fn bundled_demo_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve(BUNDLED_DEMO, tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("failed to resolve bundled demo: {e}"))
}

/// Reads the resolved context. Falls back to the bundled demo when the
/// user file is missing — first-launch UX shows real-feeling data
/// immediately without forcing the user to run `pc init` first.
fn read_active_context(app: &AppHandle) -> Result<String, String> {
    if let Some(path) = user_context_path() {
        if path.exists() {
            return std::fs::read_to_string(&path)
                .map_err(|e| format!("read {path:?}: {e}"));
        }
    }
    let demo = bundled_demo_path(app)?;
    std::fs::read_to_string(&demo).map_err(|e| format!("read demo {demo:?}: {e}"))
}

#[tauri::command]
fn load_personal_context(app: AppHandle) -> Result<LoadedContext, String> {
    let yaml = read_active_context(&app)?;
    let source = if user_context_path().map(|p| p.exists()).unwrap_or(false) {
        ContextSource::User
    } else {
        ContextSource::Demo
    };
    Ok(LoadedContext { yaml, source })
}

/// Holds the live debouncer so it isn't dropped (which would stop watching).
/// Wrapped in a Mutex<Option<…>> so re-invoking start_context_watcher
/// during HMR replaces the prior watcher cleanly.
struct WatcherState(Mutex<Option<Debouncer<notify::RecommendedWatcher>>>);

#[tauri::command]
fn start_context_watcher(
    app: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    let Some(path) = user_context_path() else {
        // No home dir → nothing watchable. Still successful; demo data
        // remains in effect until the user creates the file.
        return Ok(());
    };

    // notify can watch a non-existent path's PARENT for create events.
    // We watch the home directory (non-recursive) and filter on filename.
    let Some(parent) = path.parent().map(PathBuf::from) else {
        return Err("home dir has no parent? aborting watcher".into());
    };
    let target = path.clone();
    let app_for_event = app.clone();

    let mut debouncer = new_debouncer(
        Duration::from_millis(DEBOUNCE_MS),
        move |res: DebounceEventResult| {
            // notify-debouncer-mini groups events into a Vec; we only care
            // that *something* happened to the watched file, then we
            // re-read it and emit. Idempotent by design.
            let Ok(events) = res else { return };
            let touched = events
                .iter()
                .any(|ev| ev.path == target);
            if !touched {
                return;
            }
            match std::fs::read_to_string(&target) {
                Ok(yaml) => {
                    // Best-effort emit; if it fails the next change will retry.
                    let _ = app_for_event.emit(
                        CONTEXT_CHANGED_EVENT,
                        LoadedContext {
                            yaml,
                            source: ContextSource::User,
                        },
                    );
                }
                Err(_) => {
                    // File may have been deleted; tell the frontend to
                    // fall back to the bundled demo via a re-load call.
                    let _ = app_for_event.emit(CONTEXT_CHANGED_EVENT, ());
                }
            }
        },
    )
    .map_err(|e| format!("failed to construct debouncer: {e}"))?;

    debouncer
        .watcher()
        .watch(&parent, RecursiveMode::NonRecursive)
        .map_err(|e| format!("failed to watch {parent:?}: {e}"))?;

    *state.0.lock().expect("watcher state poisoned") = Some(debouncer);
    Ok(())
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "lowercase")]
enum ContextSource {
    /// ~/.personal-context.yaml — the user's real data.
    User,
    /// Bundled example-amex-gold.yaml — first-launch fallback.
    Demo,
}

#[derive(Debug, Clone, serde::Serialize)]
struct LoadedContext {
    yaml: String,
    source: ContextSource,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(WatcherState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            load_personal_context,
            start_context_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
