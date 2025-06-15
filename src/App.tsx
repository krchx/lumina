import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event"; // Removed emit, appWindow
import "./App.css";
import SearchBar from "./components/SearchBar";
import SearchResultItem from "./components/SearchResultItem";
import AiResponseDisplay from "./components/AiResponseDisplay";
import SettingsComponent from "./components/SettingsComponent";
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

  // Listen for window toggle events from the backend (e.g., single-instance plugin)
  useEffect(() => {
    const unlistenPromise = listen("toggle_window_event", async () => {
      try {
        console.log("toggle_window_event received in frontend");
        await invoke("toggle_window");
      } catch (error) {
        console.error("Failed to toggle window from event:", error);
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        setShowContent(true);

        // Minimum loading time to prevent flickering
        const searchStartTime = Date.now();
        const minLoadingTime = 200;

        try {
          const searchResults: SearchResult[] = await invoke("search", {
            query,
          });

          // Ensure minimum loading time has passed
          const elapsedTime = Date.now() - searchStartTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

          setTimeout(() => {
            setResults(searchResults);
            setSelectedIndex(0);
            setIsLoading(false);
          }, remainingTime);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setSelectedIndex(0);
        if (!aiResponse && !isAiStreaming) {
          setShowContent(false);
        }
      }
    }, 500); // Increased delay from 300ms to 500ms for better UX

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
          setAiResponse("");
          setIsAiStreaming(false);
          setShowContent(false);
          await invoke("hide_window");
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
      <SettingsComponent
        config={config}
        onConfigChange={setConfig}
        onSave={saveConfig}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="flex w-full flex-col h-screen bg-transparent text-gray-800 relative">
      <div className="w-full h-full m-3 max-w-2xl mx-auto flex flex-col space-y-0 relative">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleFormSubmit}
          inputRef={inputRef}
          isInitialEmptyState={!showContent && !query}
          onSettingsClick={() => setShowSettings(true)}
        />

        {/* {isLoading && !isAiStreaming && (
          <div className="text-center p-4 text-gray-600 loading-fade-in">
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-300"></div>
              <span className="ml-2">Searching...</span>
            </div>
          </div>
        )} */}

        {showContent && (
          <div className="overflow-y-auto p-3 flex-grow mt-3 glass-panel-enhanced rounded-3xl max-h-[calc(100vh-120px)] content-fade-in">
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
                <ul className="space-y-2">
                  {results.map((result, index) => (
                    <li
                      key={result.id}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        animation: "fadeInUp 0.3s ease-out forwards",
                      }}
                    >
                      <SearchResultItem
                        result={result}
                        isSelected={index === selectedIndex}
                        onClick={() => handleResultClick(result)}
                      />
                    </li>
                  ))}
                </ul>
              )
            )}
            {!isLoading &&
              !isAiStreaming &&
              !aiResponse &&
              results.length === 0 &&
              query && (
                <div className="p-4 text-center text-gray-500 loading-fade-in">
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
