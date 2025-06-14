export interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon?: string;
  action_type:
    | "OpenFile"
    | "OpenApp"
    | "OpenUrl"
    | "CopyToClipboard"
    | "AiResponse";
  action_data: string;
  score: number;
}

export interface Config {
  ai_service: string;
  openrouter_api_key?: string;
  openai_api_key?: string;
  default_model: string;
  search_directories: string[];
}
