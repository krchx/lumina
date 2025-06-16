use std::sync::{Arc, Mutex, OnceLock};
use tauri::{command, Manager, PhysicalPosition, PhysicalSize, UserAttentionType, Window, WebviewWindow};
use tokio::time::{sleep, Duration};

// Constants for window dimensions
pub const DEFAULT_WINDOW_WIDTH: u32 = 700;
pub const DEFAULT_WINDOW_HEIGHT: u32 = 600;
const COMPACT_WINDOW_HEIGHT: u32 = 110; // Height when only search bar is shown

// Global state to track if focus hiding should be disabled
static FOCUS_HIDING_DISABLED: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();

fn get_focus_hiding_disabled() -> &'static Arc<Mutex<bool>> {
    FOCUS_HIDING_DISABLED.get_or_init(|| Arc::new(Mutex::new(false)))
}

#[command]
pub async fn show_window(window: Window) {
    if !window.is_visible().unwrap_or(false) {
        position_window_center(&window);
        setup_window_display(&window).await;
    } else {
        focus_existing_window(&window).await;
    }
}

#[command]
pub async fn hide_window(window: Window) {
    if window.is_visible().unwrap_or(false) {
        window.hide().ok();
    }
}

#[command]
pub async fn toggle_window(window: Window) {
    if window.is_visible().unwrap_or(false) {
        window.hide().ok();
    } else {
        position_window_center(&window);
        setup_window_display(&window).await;
    }
}

#[command]
pub async fn resize_window(window: Window, compact: bool) {
    let height = if compact {
        COMPACT_WINDOW_HEIGHT
    } else {
        DEFAULT_WINDOW_HEIGHT
    };

    // Set the new size
    if let Err(e) = window.set_size(PhysicalSize::new(DEFAULT_WINDOW_WIDTH, height)) {
        eprintln!("Error resizing window: {}", e);
    }
}

#[command]
pub async fn set_focus_hiding_disabled(disabled: bool) {
    if let Ok(mut focus_disabled) = get_focus_hiding_disabled().lock() {
        *focus_disabled = disabled;
    }
}

fn position_window_center(window: &Window) {
    if let Some(monitor) = window.current_monitor().unwrap_or(None) {
        let monitor_size = monitor.size();
        let window_width = DEFAULT_WINDOW_WIDTH;
        let window_height = DEFAULT_WINDOW_HEIGHT;

        let x = (monitor_size.width as i32 - window_width as i32) / 2 + monitor.position().x;
        let y = (monitor_size.height as i32 - window_height as i32) / 3 + monitor.position().y; // Position slightly higher than center

        window.set_position(PhysicalPosition::new(x, y)).ok();
    }
}

async fn setup_window_display(window: &Window) {
    window.set_always_on_top(true).ok();
    window.show().ok();
    sleep(Duration::from_millis(50)).await; // Small delay
    
    if let Err(e) = window.set_focus() {
        eprintln!("Error setting focus on window '{}': {}", window.label(), e);
    }
    
    window
        .request_user_attention(Some(UserAttentionType::Informational))
        .ok();
}

async fn focus_existing_window(window: &Window) {
    sleep(Duration::from_millis(50)).await; // Small delay even if already visible
    
    if let Err(e) = window.set_focus() {
        eprintln!(
            "Error setting focus on already visible window '{}': {}",
            window.label(),
            e
        );
    }
    
    window
        .request_user_attention(Some(UserAttentionType::Informational))
        .ok();
}

pub fn setup_window_event_handlers(window: &WebviewWindow, handle: tauri::AppHandle) {
    let handle_clone = handle.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(focused) = event {
            if !focused {
                handle_window_unfocus(&handle_clone);
            }
        }
    });
}

fn handle_window_unfocus(handle: &tauri::AppHandle) {
    // Check if focus hiding is disabled (e.g., when settings are open)
    let should_hide = get_focus_hiding_disabled()
        .lock()
        .map(|disabled| !*disabled)
        .unwrap_or(true);

    if should_hide {
        if let Some(main_window) = handle.get_webview_window("main") {
            if main_window.is_visible().unwrap_or(false) {
                // Add a delay to see if focus returns quickly (e.g. for dropdowns, popups)
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(150));
                    // Only hide if still not focused after the delay
                    if !main_window.is_focused().unwrap_or(true) {
                        main_window.hide().ok();
                    }
                });
            }
        }
    }
}
