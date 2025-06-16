use crate::models::SearchResult;
use crate::ai::ai_request;
use tauri::{command, Window};

#[command]
pub async fn execute_action(result: SearchResult, window: Window) -> Result<String, String> {
    match result.action_type {
        crate::models::ActionType::OpenFile | crate::models::ActionType::OpenApp => {
            open_with_system(&result.action_data)
        }
        crate::models::ActionType::OpenUrl => {
            open_with_system(&result.action_data)
        }
        crate::models::ActionType::CopyToClipboard => {
            copy_to_clipboard(&result.action_data)
        }
        crate::models::ActionType::AiResponse => {
            handle_ai_response(result.action_data, window).await
        }
    }
}

fn open_with_system(path: &str) -> Result<String, String> {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok("Opened".to_string())
}

fn copy_to_clipboard(text: &str) -> Result<String, String> {
    use arboard::Clipboard;
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard
        .set_text(text)
        .map_err(|e| e.to_string())?;
    Ok("Copied to clipboard".to_string())
}

async fn handle_ai_response(query: String, window: Window) -> Result<String, String> {
    // Start AI response
    tokio::spawn(async move {
        if let Err(e) = ai_request(query, window).await {
            eprintln!("AI response error: {}", e);
        }
    });
    Ok("AI response started".to_string())
}
