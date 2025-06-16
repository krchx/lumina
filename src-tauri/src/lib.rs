// Module declarations
pub mod actions;
pub mod ai;
pub mod config;
pub mod models;
pub mod search;
pub mod window;

// Re-exports for convenience
pub use models::*;

use tauri::{Emitter, Manager, PhysicalPosition};
use window::{setup_window_event_handlers, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("New instance with args: {:?}, cwd: {}", argv, cwd);
            if argv.contains(&"--toggle-visibility".to_string()) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("toggle_window_event", ());
                }
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            window::show_window,
            window::hide_window,
            window::toggle_window,
            window::resize_window,
            search::search,
            actions::execute_action,
            config::get_config,
            config::save_config,
            ai::ai_request,
            window::set_focus_hiding_disabled
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Initial positioning
            if let Some(monitor) = window.current_monitor().unwrap_or(None) {
                let monitor_size = monitor.size();
                let window_width = DEFAULT_WINDOW_WIDTH;
                let window_height = DEFAULT_WINDOW_HEIGHT;

                let x =
                    (monitor_size.width as i32 - window_width as i32) / 2 + monitor.position().x;
                let y =
                    (monitor_size.height as i32 - window_height as i32) / 3 + monitor.position().y;

                window.set_position(PhysicalPosition::new(x, y)).ok();
            }

            // Setup window event handlers
            let handle = app.handle().clone();
            setup_window_event_handlers(&window, handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
