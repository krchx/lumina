import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import SearchBar from "./components/SearchBar";
import SearchResultItem from "./components/SearchResultItem";
import AiResponseDisplay from "./components/AiResponseDisplay";
import { SearchResult, Config } from "./types";

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
  const [showContent, setShowContent] = useState(false);

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
        // Clean chunk before adding to prevent repeated text
        const cleanChunk = chunk.replace(/\r/g, "");
        setAiResponse((prev) => {
          // Prevent duplicate chunks by checking if the chunk is already at the end
          if (prev.endsWith(cleanChunk)) {
            return prev;
          }
          return prev + cleanChunk;
        });
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
        setShowContent(true);
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
        if (!aiResponse && !isAiStreaming) {
          setShowContent(false);
        }
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, aiResponse, isAiStreaming]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Refocus input when query is cleared to allow continuous typing
  useEffect(() => {
    if (!query && inputRef.current) {
      inputRef.current.focus();
    }
  }, [query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        try {
          setQuery("");
          setResults([]);
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
        setShowContent(true);
        setResults([]);
        setQuery("");
      }

      const response = await invoke("execute_action", { result });
      console.log("Action executed:", response);

      if (result.action_type !== "AiResponse") {
        setQuery("");
        setResults([]);
        setShowContent(false);
      }
    } catch (error) {
      console.error("Failed to execute action:", error);
      setIsAiStreaming(false);
    }
  };

  const handleNewAiQuery = () => {
    setAiResponse("");
    setIsAiStreaming(false);
    setShowContent(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (
      result.action_type === "OpenUrl" ||
      result.action_type === "OpenFile" ||
      result.action_type === "OpenApp"
    ) {
      invoke("open_path", { path: result.action_data });
    } else if (result.action_type === "CopyToClipboard") {
      navigator.clipboard.writeText(result.action_data);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.startsWith("/")) {
      setIsLoading(true);
      setIsAiStreaming(true);
      setAiResponse("");
      setShowContent(true);
      try {
        await invoke("ai_request", { query: query.substring(1) });
      } catch (error) {
        console.error("AI request failed:", error);
        setAiResponse("Error: Could not process AI request.");
        setIsAiStreaming(false);
      }
    } else if (results.length > 0 && selectedIndex < results.length) {
      const selectedResult = results[selectedIndex];
      if (selectedResult) {
        handleResultClick(selectedResult);
      }
    }
    inputRef.current?.focus();
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
      <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-300 hover:text-white transition-colors p-2 rounded-md hover:bg-slate-700/50 text-sm flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-white">Settings</h1>
            <div className="w-12"></div>
          </div>

          <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={config.openrouter_api_key || ""}
                  onChange={(e) =>
                    setConfig({ ...config, openrouter_api_key: e.target.value })
                  }
                  placeholder="Enter your OpenRouter API key"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 shadow-sm"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Get your API key from{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    openrouter.ai
                  </a>
                </p>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Default Model
                </label>
                <select
                  value={config.default_model}
                  onChange={(e) =>
                    setConfig({ ...config, default_model: e.target.value })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 shadow-sm"
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
                  <option value="deepseek/deepseek-chat-v3-0324:free">
                    DeepSeek Chat V3
                  </option>
                </select>
              </div>

              <button
                onClick={() => saveConfig(config)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
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
    <div className="flex w-full flex-col h-screen bg-transparent text-white">
      <div className="w-full max-w-2xl mx-auto flex flex-col space-y-0">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleFormSubmit}
          inputRef={inputRef}
          isInitialEmptyState={!showContent && !query}
          onSettingsClick={() => setShowSettings(true)}
        />

        {isLoading && !isAiStreaming && (
          <div className="text-center p-4">Loading...</div>
        )}

        {showContent && (
          <div className="overflow-y-auto p-2 flex-grow mt-2 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-2xl max-h-[calc(100vh-200px)]">
            {isAiStreaming || aiResponse ? (
              <AiResponseDisplay
                aiResponse={aiResponse}
                isAiStreaming={isAiStreaming}
                onCopy={() => {
                  navigator.clipboard.writeText(aiResponse);
                }}
                onNewQuery={handleNewAiQuery}
              />
            ) : (
              results.length > 0 && (
                <ul className="space-y-px">
                  {results.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      isSelected={index === selectedIndex}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </ul>
              )
            )}
            {!isLoading &&
              !isAiStreaming &&
              !aiResponse &&
              results.length === 0 &&
              query && (
                <div className="p-4 text-center text-slate-400">
                  No results found.
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
