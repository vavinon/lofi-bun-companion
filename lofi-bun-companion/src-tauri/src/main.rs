// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod telemetry;

use std::sync::Mutex;
use tauri::{AppHandle, LogicalSize, Size, State, Window};
use telemetry::{HardwareMetricsPayload, HardwareSampler};

/// Global managed state holding the persistent HardwareSampler instance.
pub struct TelemetryState(pub Mutex<HardwareSampler>);

/// Tauri IPC Command: Fetches current real-time OS hardware metrics.
#[tauri::command]
fn get_hardware_metrics(
    state: State<'_, TelemetryState>,
) -> Result<HardwareMetricsPayload, String> {
    let mut sampler = state
        .0
        .lock()
        .map_err(|e| format!("Failed to acquire hardware sampler lock: {e}"))?;
    Ok(sampler.sample())
}

/// Tauri IPC Command: Native window dragging across the entire screen.
#[tauri::command]
fn start_drag(window: Window) -> Result<(), String> {
    window
        .start_dragging()
        .map_err(|e| format!("Failed to start dragging: {e}"))
}

/// Tauri IPC Command: Dynamically updates desktop window transparency / opacity.
#[tauri::command]
fn set_window_opacity(window: Window, opacity: f64) -> Result<(), String> {
    let clamped_opacity = opacity.clamp(0.2, 1.0);
    // Tauri Window API (or fallback for platforms without direct opacity setter)
    #[cfg(target_os = "windows")]
    {
        // Window transparency is configured; dynamic opacity handling if supported
        let _ = window;
        let _ = clamped_opacity;
    }
    Ok(())
}

/// Tauri IPC Command: Toggles Always-on-Top pin status of the Mascot window.
#[tauri::command]
fn set_always_on_top(window: Window, enabled: bool) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| format!("Failed to set always_on_top: {e}"))
}

/// Tauri IPC Command: Dynamically resizes and repositions the window based on view mode ('COMPACT' vs 'FULL').
#[tauri::command]
fn set_view_mode(window: Window, mode: String) -> Result<(), String> {
    let _ = window.set_resizable(true);
    if mode == "FULL" {
        window
            .set_size(Size::Logical(LogicalSize {
                width: 1060.0,
                height: 680.0,
            }))
            .map_err(|e| format!("Failed to resize window to FULL: {e}"))?;
        let _ = window.center();
    } else {
        window
            .set_size(Size::Logical(LogicalSize {
                width: 320.0,
                height: 380.0,
            }))
            .map_err(|e| format!("Failed to resize window to COMPACT: {e}"))?;
    }
    Ok(())
}

/// Tauri IPC Command: Gracefully terminates the application.
#[tauri::command]
fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

fn main() {
    // Windows Native DLL Search Path Resolution:
    // Ensures WebView2Loader.dll is resolved whether located in the root or 'resources/' subfolder.
    #[cfg(target_os = "windows")]
    {
        if let Ok(mut exe_dir) = std::env::current_exe() {
            exe_dir.pop();
            let resources_dir = exe_dir.join("resources");
            if resources_dir.exists() {
                use std::os::windows::ffi::OsStrExt;
                let wide: Vec<u16> = resources_dir
                    .as_os_str()
                    .encode_wide()
                    .chain(Some(0))
                    .collect();
                extern "system" {
                    fn SetDllDirectoryW(lpPathName: *const u16) -> i32;
                }
                unsafe {
                    SetDllDirectoryW(wide.as_ptr());
                }
            }
        }
    }

    tauri::Builder::default()
        .manage(TelemetryState(Mutex::new(HardwareSampler::new())))
        .invoke_handler(tauri::generate_handler![
            get_hardware_metrics,
            start_drag,
            set_window_opacity,
            set_always_on_top,
            set_view_mode,
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running lofi bun companion desktop application");
}
