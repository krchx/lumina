use crate::models::{ActionType, SearchResult};
use evalexpr::eval;

pub async fn calculate(query: &str) -> Result<SearchResult, String> {
    // Check if the query looks like a math expression
    let math_chars = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
        '+', '-', '*', '/', '(', ')', '.', ' ',
    ];

    if is_math_expression(query, &math_chars) {
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

fn is_math_expression(query: &str, math_chars: &[char]) -> bool {
    query.chars().all(|c| math_chars.contains(&c)) && 
    query.chars().any(|c| "+-*/".contains(c))
}
