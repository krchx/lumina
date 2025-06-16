use crate::config::load_config;
use crate::models::{Message, OpenRouterRequest, OpenRouterResponse};
use tauri::{command, Emitter, Window};
use tokio_stream::StreamExt;

#[command]
pub async fn ai_request(query: String, window: Window) -> Result<(), String> {
    let config = load_config().await.unwrap_or_default();

    let api_key = match config.ai_service.as_str() {
        "openrouter" => config.openrouter_api_key.clone(),
        "openai" => config.openai_api_key.clone(),
        _ => None,
    };

    let api_key = api_key.ok_or("API key not configured")?;

    let client = reqwest::Client::new();

    // Create a comprehensive system prompt to give context to the AI
    let system_prompt = create_system_prompt();

    let request_body = OpenRouterRequest {
        model: config.default_model.clone(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: query,
            },
        ],
        stream: true,
    };

    let url = get_api_url(&config.ai_service)?;

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

    process_ai_stream(response, window).await
}

fn create_system_prompt() -> String {
    "You are Lumina, an intelligent desktop search assistant integrated into a user's Linux desktop environment.
        
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
                
        Format your responses with markdown when appropriate. Be helpful, accurate, and concise.".to_string()
}

fn get_api_url(service: &str) -> Result<&'static str, String> {
    match service {
        "openrouter" => Ok("https://openrouter.ai/api/v1/chat/completions"),
        "openai" => Ok("https://api.openai.com/v1/chat/completions"),
        _ => Err("Unsupported AI service".to_string()),
    }
}

async fn process_ai_stream(response: reqwest::Response, window: Window) -> Result<(), String> {
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
