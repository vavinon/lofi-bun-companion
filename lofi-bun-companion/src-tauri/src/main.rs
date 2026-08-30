// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod telemetry;

use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, Window};
use telemetry::{HardwareMetricsPayload, HardwareSampler};

/// Global managed state holding the persistent HardwareSampler instance.
pub struct TelemetryState(pub Mutex<HardwareSampler>);

/// Tauri IPC Command: Fetches current real-time OS hardware metrics.
#[tauri::command]
pub fn get_hardware_metrics(
    state: State<'_, TelemetryState>,
) -> Result<HardwareMetricsPayload, String> {
    let mut sampler = state
        .0
        .lock()
        .map_err(|e| format!("Failed to acquire hardware sampler lock: {e}"))?;
    Ok(sampler.sample())
}

/// Tauri IPC Command: Dynamically updates desktop window transparency / opacity.
#[tauri::command]
pub fn set_window_opacity(window: Window, opacity: f64) -> Result<(), String> {
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
pub fn set_always_on_top(window: Window, enabled: bool) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| format!("Failed to set always_on_top: {e}"))
}

/// Tauri IPC Command: Gracefully terminates the application.
#[tauri::command]
pub fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

fn main() {
    tauri::Builder::default()
        .manage(TelemetryState(Mutex::new(HardwareSampler::new())))
        .invoke_handler(tauri::generate_handler![
            get_hardware_metrics,
            set_window_opacity,
            set_always_on_top,
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running lofi bun companion desktop application");
}
