use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, Window};
use tokio_stream::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub ai_service: String,
    pub openrouter_api_key: Option<String>,
    pub openai_api_key: Option<String>,
    pub default_model: String,
    pub search_directories: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            ai_service: "openrouter".to_string(),
            openrouter_api_key: None,
            openai_api_key: None,
            default_model: "anthropic/claude-3.5-sonnet".to_string(),
            search_directories: vec![
                dirs::home_dir()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                "/usr/share/applications".to_string(),
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub description: String,
    pub icon: Option<String>,
    pub action_type: ActionType,
    pub action_data: String,
    pub score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    OpenFile,
    OpenApp,
    OpenUrl,
    CopyToClipboard,
    AiResponse,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<Message>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    delta: Option<Delta>,
    #[allow(dead_code)]
    message: Option<Message>,
}

#[derive(Debug, Deserialize)]
struct Delta {
    content: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn search(query: String) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();

    if query.trim().is_empty() {
        return Ok(results);
    }

    // File search
    if let Ok(file_results) = search_files(&query).await {
        results.extend(file_results);
    }

    // Calculator
    if let Ok(calc_result) = calculate(&query).await {
        results.push(calc_result);
    }

    // AI Integration - if no specific results found or query seems like a question
    if results.is_empty() || is_ai_query(&query) {
        if let Ok(ai_result) = create_ai_search_result(&query).await {
            results.push(ai_result);
        }
    }

    // Sort by score (highest first)
    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Limit to top 10 results
    results.truncate(10);

    Ok(results)
}

fn is_ai_query(query: &str) -> bool {
    let ai_indicators = [
        "what", "how", "why", "when", "where", "who", "explain", "tell me", "help", "?",
    ];
    let query_lower = query.to_lowercase();
    ai_indicators
        .iter()
        .any(|&indicator| query_lower.contains(indicator))
        || query.ends_with('?')
}

async fn create_ai_search_result(query: &str) -> Result<SearchResult, String> {
    Ok(SearchResult {
        id: "ai_response".to_string(),
        title: format!("Ask AI: {}", query),
        description: "Get an AI response to your query".to_string(),
        icon: Some("🤖".to_string()),
        action_type: ActionType::AiResponse,
        action_data: query.to_string(),
        score: 0.7,
    })
}

#[tauri::command]
async fn get_config() -> Result<Config, String> {
    Ok(load_config().await.unwrap_or_default())
}

#[tauri::command]
async fn save_config(config: Config) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("lumina");

    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_path = config_dir.join("config.json");
    let config_json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;

    std::fs::write(config_path, config_json).map_err(|e| e.to_string())?;

    Ok(())
}

async fn load_config() -> Result<Config, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("lumina");

    let config_path = config_dir.join("config.json");

    if !config_path.exists() {
        return Ok(Config::default());
    }

    let config_content = std::fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: Config = serde_json::from_str(&config_content).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
async fn ai_request(query: String, window: Window) -> Result<(), String> {
    let config = load_config().await.unwrap_or_default();

    let api_key = match config.ai_service.as_str() {
        "openrouter" => config.openrouter_api_key.clone(),
        "openai" => config.openai_api_key.clone(),
        _ => None,
    };

    let api_key = api_key.ok_or("API key not configured")?;

    let client = reqwest::Client::new();

    // Create a comprehensive system prompt to give context to the AI
    let system_prompt = format!(
        "You are Lumina, an intelligent desktop search assistant integrated into a user's Linux desktop environment. \
        
Your role is to:
- Help users find information, answer questions, and assist with various tasks
- Provide practical, actionable advice when users ask for help
- Answer questions about technology, programming, general knowledge, and daily tasks
- Keep responses concise but comprehensive when needed
- Use proper markdown formatting for better readability (headings, lists, code blocks, etc.)
- Focus on being helpful and accurate
- When discussing files, applications, or system tasks, consider that the user is on a Linux system
        
The user is searching from their desktop launcher, so they may ask about:
- How to use applications or system features
- Technical questions about programming, computers, or software
- General knowledge questions
- Task-specific help and tutorials
- File management and system administration
        
Format your responses with markdown when appropriate. Be helpful, accurate, and concise."
    );

    let request_body = OpenRouterRequest {
        model: config.default_model.clone(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            Message {
                role: "user".to_string(),
                content: query,
            }
        ],
        stream: true,
    };

    let url = match config.ai_service.as_str() {
        "openrouter" => "https://openrouter.ai/api/v1/chat/completions",
        "openai" => "https://api.openai.com/v1/chat/completions",
        _ => return Err("Unsupported AI service".to_string()),
    };

    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API request failed: {}", error_text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        buffer.push_str(&chunk_str);

        // Process complete lines
        let mut start = 0;
        while let Some(newline_pos) = buffer[start..].find('\n') {
            let absolute_pos = start + newline_pos;
            let line = buffer[start..absolute_pos].trim();
            start = absolute_pos + 1;

            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    break;
                }

                if let Ok(response) = serde_json::from_str::<OpenRouterResponse>(data) {
                    if let Some(choice) = response.choices.first() {
                        if let Some(delta) = &choice.delta {
                            if let Some(content) = &delta.content {
                                // Clean content before sending
                                let cleaned_content = content.replace("\r", "");
                                if !cleaned_content.is_empty() {
                                    window
                                        .emit("ai_response_chunk", &cleaned_content)
                                        .map_err(|e| e.to_string())?;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Remove processed part of buffer
        if start > 0 {
            buffer = buffer[start..].to_string();
        }
    }

    // Emit completion event
    window
        .emit("ai_response_complete", ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

async fn search_files(query: &str) -> Result<Vec<SearchResult>, String> {
    use walkdir::WalkDir;
    let mut results = Vec::new();

    // Search in common directories
    let search_dirs = [
        dirs::home_dir().unwrap_or_else(|| PathBuf::from("/")),
        PathBuf::from("/usr/share/applications"),
        PathBuf::from("/var/lib/flatpak/exports/share/applications"),
        PathBuf::from("/home")
            .join(std::env::var("USER").unwrap_or_default())
            .join(".local/share/applications"),
    ];

    for base_dir in &search_dirs {
        if !base_dir.exists() {
            continue;
        }

        let walker = WalkDir::new(base_dir)
            .max_depth(if base_dir.to_string_lossy().contains("applications") {
                2
            } else {
                3
            })
            .into_iter()
            .filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();

            if let Some(file_name) = path.file_name() {
                let name = file_name.to_string_lossy().to_lowercase();
                let query_lower = query.to_lowercase();

                if name.contains(&query_lower) {
                    let score = calculate_file_score(&name, &query_lower);

                    if score > 0.1 {
                        let result = SearchResult {
                            id: format!("file_{}", results.len()),
                            title: file_name.to_string_lossy().to_string(),
                            description: path.to_string_lossy().to_string(),
                            icon: get_file_icon(path),
                            action_type: if path.extension().map_or(false, |ext| ext == "desktop") {
                                ActionType::OpenApp
                            } else {
                                ActionType::OpenFile
                            },
                            action_data: path.to_string_lossy().to_string(),
                            score,
                        };
                        results.push(result);
                    }
                }
            }
        }
    }

    Ok(results)
}

fn calculate_file_score(name: &str, query: &str) -> f32 {
    if name == query {
        return 1.0;
    }
    if name.starts_with(query) {
        return 0.8;
    }
    if name.contains(query) {
        return 0.6;
    }
    0.0
}

fn get_file_icon(path: &std::path::Path) -> Option<String> {
    if let Some(ext) = path.extension() {
        match ext.to_str()? {
            "rs" => Some("🦀".to_string()),
            "js" | "ts" | "jsx" | "tsx" => Some("⚡".to_string()),
            "py" => Some("🐍".to_string()),
            "desktop" => Some("🚀".to_string()),
            "txt" | "md" => Some("📄".to_string()),
            "pdf" => Some("📕".to_string()),
            "png" | "jpg" | "jpeg" | "gif" => Some("🖼️".to_string()),
            _ => Some("📁".to_string()),
        }
    } else {
        Some("📁".to_string())
    }
}

async fn calculate(query: &str) -> Result<SearchResult, String> {
    use evalexpr::eval;

    // Check if the query looks like a math expression
    let math_chars = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '(', ')', '.', ' ',
    ];

    if query.chars().all(|c| math_chars.contains(&c)) && query.chars().any(|c| "+-*/".contains(c)) {
        match eval(query) {
            Ok(result) => {
                let result_str = result.to_string();
                Ok(SearchResult {
                    id: "calculator".to_string(),
                    title: format!("{} = {}", query, result_str),
                    description: "Press Enter to copy result to clipboard".to_string(),
                    icon: Some("🧮".to_string()),
                    action_type: ActionType::CopyToClipboard,
                    action_data: result_str,
                    score: 0.9,
                })
            }
            Err(_) => Err("Invalid math expression".to_string()),
        }
    } else {
        Err("Not a math expression".to_string())
    }
}

#[tauri::command]
async fn execute_action(result: SearchResult, window: Window) -> Result<String, String> {
    match result.action_type {
        ActionType::OpenFile | ActionType::OpenApp => {
            std::process::Command::new("xdg-open")
                .arg(&result.action_data)
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok("Opened".to_string())
        }
        ActionType::OpenUrl => {
            std::process::Command::new("xdg-open")
                .arg(&result.action_data)
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok("Opened URL".to_string())
        }
        ActionType::CopyToClipboard => {
            use arboard::Clipboard;
            let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
            clipboard
                .set_text(&result.action_data)
                .map_err(|e| e.to_string())?;
            Ok("Copied to clipboard".to_string())
        }
        ActionType::AiResponse => {
            // Start AI response
            tokio::spawn(async move {
                if let Err(e) = ai_request(result.action_data, window).await {
                    eprintln!("AI response error: {}", e);
                }
            });
            Ok("AI response started".to_string())
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn show_window(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn hide_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn toggle_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().map_err(|e| e.to_string())? {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            show_window,
            hide_window,
            toggle_window,
            search,
            execute_action,
            get_config,
            save_config,
            ai_request
        ])
        .setup(|app| {
            // Show the window on startup
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();

                let window_width = 700;
                let window_height = 600;
                
                if let Ok(monitor) = window.current_monitor() {
                    if let Some(monitor) = monitor {
                        let monitor_size = monitor.size();
                        
                        // Center horizontally
                        let x = (monitor_size.width as i32 - window_width) / 2;
                        
                        // Position vertically between top and center (at 1/4 of screen height)
                        let y = monitor_size.height as i32 / 4;
                        
                        println!("Monitor size: {:?}", monitor_size);
                        println!("Positioning window at: x={}, y={}", x, y);
                        
                        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
