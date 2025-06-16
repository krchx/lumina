use crate::models::{ActionType, SearchResult};

pub fn is_ai_query(query: &str) -> bool {
    let ai_indicators = [
        "what", "how", "why", "when", "where", "who", 
        "explain", "tell me", "help", "?",
    ];
    let query_lower = query.to_lowercase();
    ai_indicators
        .iter()
        .any(|&indicator| query_lower.contains(indicator))
        || query.ends_with('?')
}

pub async fn create_ai_search_result(query: &str) -> Result<SearchResult, String> {
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
