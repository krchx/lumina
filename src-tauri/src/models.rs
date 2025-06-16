use serde::{Deserialize, Serialize};

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
pub struct OpenRouterRequest {
    pub model: String,
    pub messages: Vec<Message>,
    pub stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct OpenRouterResponse {
    pub choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub delta: Option<Delta>,
    #[allow(dead_code)]
    pub message: Option<Message>,
}

#[derive(Debug, Deserialize)]
pub struct Delta {
    pub content: Option<String>,
}
