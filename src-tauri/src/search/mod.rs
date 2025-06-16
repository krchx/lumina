use crate::models::SearchResult;
use tauri::command;

pub mod ai_search;
pub mod calculator;
pub mod files;

pub use ai_search::{create_ai_search_result, is_ai_query};
pub use calculator::calculate;
pub use files::search_files;

#[command]
pub async fn search(query: String) -> Result<Vec<SearchResult>, String> {
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
