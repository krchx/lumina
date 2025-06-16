use crate::models::{ActionType, SearchResult};
use std::path::PathBuf;
use walkdir::WalkDir;

pub async fn search_files(query: &str) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();

    // Search in common directories
    let search_dirs = get_search_directories();

    for base_dir in &search_dirs {
        if !base_dir.exists() {
            continue;
        }

        let walker = WalkDir::new(base_dir)
            .max_depth(get_max_depth(base_dir))
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
                            action_type: determine_action_type(path),
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

fn get_search_directories() -> Vec<PathBuf> {
    vec![
        dirs::home_dir().unwrap_or_else(|| PathBuf::from("/")),
        PathBuf::from("/usr/share/applications"),
        PathBuf::from("/var/lib/flatpak/exports/share/applications"),
        PathBuf::from("/home")
            .join(std::env::var("USER").unwrap_or_default())
            .join(".local/share/applications"),
    ]
}

fn get_max_depth(base_dir: &PathBuf) -> usize {
    if base_dir.to_string_lossy().contains("applications") {
        2
    } else {
        3
    }
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

fn determine_action_type(path: &std::path::Path) -> ActionType {
    if path.extension().map_or(false, |ext| ext == "desktop") {
        ActionType::OpenApp
    } else {
        ActionType::OpenFile
    }
}

pub fn get_file_icon(path: &std::path::Path) -> Option<String> {
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
