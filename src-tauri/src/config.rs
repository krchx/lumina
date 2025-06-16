use crate::models::Config;
use tauri::command;

#[command]
pub async fn get_config() -> Result<Config, String> {
    Ok(load_config().await.unwrap_or_default())
}

#[command]
pub async fn save_config(config: Config) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("lumina");

    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_path = config_dir.join("config.json");
    let config_json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;

    std::fs::write(config_path, config_json).map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn load_config() -> Result<Config, String> {
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
