import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface SearchResult {
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

interface Config {
  ai_service: string;
  openrouter_api_key?: string;
  openai_api_key?: string;
  default_model: string;
  search_directories: string[];
}

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load configuration on startup
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig: Config = await invoke("get_config");
        setConfig(loadedConfig);
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };
    loadConfig();
  }, []);

  // Setup AI response listeners
  useEffect(() => {
    const setupListeners = async () => {
      await listen("ai_response_chunk", (event) => {
        const chunk = event.payload as string;
        setAiResponse((prev) => prev + chunk);
      });

      await listen("ai_response_complete", () => {
        setIsAiStreaming(false);
      });
    };

    setupListeners();
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const searchResults: SearchResult[] = await invoke("search", {
            query,
          });
          setResults(searchResults);
          setSelectedIndex(0);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        }
        setIsLoading(false);
      } else {
        setResults([]);
        setSelectedIndex(0);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        try {
          // For now, just clear the query instead of hiding the window
          // since we don't have global hotkeys implemented yet
          setQuery("");
          setResults([]);
          // await invoke("hide_window");
        } catch (error) {
          console.error("Failed to hide window:", error);
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (results.length > 0 && selectedIndex < results.length) {
          await executeAction(results[selectedIndex]);
        }
      } else if (event.ctrlKey && event.key === ",") {
        // Ctrl+, to open settings
        event.preventDefault();
        setShowSettings(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex]);

  const executeAction = async (result: SearchResult) => {
    try {
      if (result.action_type === "AiResponse") {
        setAiResponse("");
        setIsAiStreaming(true);
        // Clear results to show AI response
        setResults([]);
        setQuery("");
      }

      const response = await invoke("execute_action", { result });
      console.log("Action executed:", response);

      // Clear query and hide window after action (except for AI)
      if (result.action_type !== "AiResponse") {
        setQuery("");
        setResults([]);
      }
      // Optionally hide window: await invoke("hide_window");
    } catch (error) {
      console.error("Failed to execute action:", error);
      setIsAiStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle search submission
    console.log("Search query:", query);
  };

  const saveConfig = async (newConfig: Config) => {
    try {
      await invoke("save_config", { config: newConfig });
      setConfig(newConfig);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  if (showSettings && config) {
    return (
      <div className="app-background">
        <div className="settings-page">
          <div className="settings-container">
            <div className="settings-header">
              <button
                onClick={() => setShowSettings(false)}
                className="back-button"
              >
                ← Back
              </button>
              <h1 className="settings-title">Settings</h1>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">OpenRouter API Key</label>
                <input
                  type="password"
                  value={config.openrouter_api_key || ""}
                  onChange={(e) =>
                    setConfig({ ...config, openrouter_api_key: e.target.value })
                  }
                  placeholder="Enter your OpenRouter API key"
                  className="form-input"
                />
                <p className="form-hint">
                  Get your API key from{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    openrouter.ai
                  </a>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Default Model</label>
                <select
                  value={config.default_model}
                  onChange={(e) =>
                    setConfig({ ...config, default_model: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="anthropic/claude-3.5-sonnet">
                    Claude 3.5 Sonnet
                  </option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                  <option value="meta-llama/llama-3.2-90b-vision-instruct">
                    Llama 3.2 90B
                  </option>
                  <option value="google/gemma-2-9b-it:free">Gemma 2 9B</option>
                </select>
              </div>

              <button
                onClick={() => saveConfig(config)}
                className="save-button"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-background">
      <div className="lumina-container">
        <div className="glass-window">
          {/* Header */}
          <div className="header-area">
            <div className="lumina-logo">
              <div className="lumina-logo-icon">✨</div>
              <span>Lumina</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="settings-button"
              title="Settings (Ctrl+,)"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="search-area">
            <form onSubmit={handleSubmit}>
              <div className="search-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="search-input"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="clear-button"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {/* AI Response Display */}
            {(isAiStreaming || aiResponse) && (
              <div className="ai-response fade-in-up">
                <div className="ai-response-header">
                  <div className="result-icon">🤖</div>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>
                    AI Response
                  </span>
                  {isAiStreaming && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
                <div className="ai-response-content">
                  {aiResponse && (
                    <div style={{ whiteSpace: "pre-wrap" }}>{aiResponse}</div>
                  )}
                  {isAiStreaming && !aiResponse && (
                    <div
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontStyle: "italic",
                      }}
                    >
                      Waiting for response...
                    </div>
                  )}
                </div>
                {aiResponse && !isAiStreaming && (
                  <div className="ai-response-actions">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiResponse);
                      }}
                      className="ai-action-button"
                    >
                      <span>📋</span>
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        setAiResponse("");
                        if (inputRef.current) {
                          inputRef.current.focus();
                        }
                      }}
                      className="ai-action-button"
                    >
                      <span>🔄</span>
                      <span>New Query</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results Area */}
            <div>
              {isLoading ? (
                <div className="loading-container fade-in">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="loading-text">Searching for "{query}"...</div>
                </div>
              ) : results.length > 0 ? (
                <div className="fade-in">
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      className={`result-item ${
                        index === selectedIndex ? "selected" : ""
                      }`}
                      onClick={() => executeAction(result)}
                    >
                      {result.icon && (
                        <div className="result-icon">{result.icon}</div>
                      )}
                      <div className="result-content">
                        <div className="result-title">{result.title}</div>
                        <div className="result-description">
                          {result.description}
                        </div>
                      </div>
                      <div className="action-badge">
                        {result.action_type.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                    </div>
                  ))}
                  <div className="navigation-hint">
                    <div className="shortcut-item">
                      <span className="kbd">↑↓</span>
                      <span>Navigate</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="kbd">Enter</span>
                      <span>Select</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="kbd">Esc</span>
                      <span>Clear</span>
                    </div>
                  </div>
                </div>
              ) : query ? (
                <div className="empty-state fade-in">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No results found</div>
                  <div className="empty-state-subtitle">
                    No matches for "{query}"
                  </div>
                  <div
                    className="empty-state-subtitle"
                    style={{ marginTop: "12px", fontSize: "12px" }}
                  >
                    Try searching for files, apps, math expressions, or ask a
                    question
                  </div>
                </div>
              ) : !isAiStreaming && !aiResponse ? (
                <div className="empty-state fade-in">
                  <div className="empty-state-icon">✨</div>
                  <div className="empty-state-title">Welcome to Lumina</div>
                  <div className="empty-state-subtitle">
                    Start typing to search
                  </div>
                  <div className="empty-state-features">
                    <div>• Files and applications</div>
                    <div>• Math expressions (e.g., "2+2")</div>
                    <div>• AI questions (e.g., "How to center a div?")</div>
                  </div>
                  <div className="empty-state-shortcuts">
                    <div className="shortcut-item">
                      <span className="kbd">Ctrl+,</span>
                      <span>Settings</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="kbd">Escape</span>
                      <span>Clear</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
