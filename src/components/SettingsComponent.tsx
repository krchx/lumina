import React from "react";
import { Config } from "../types";

interface SettingsComponentProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  onSave: (config: Config) => void;
  onClose: () => void;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({
  config,
  onConfigChange,
  onSave,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md glass-panel-enhanced rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/15 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="glass-button-stable text-gray-600 hover:text-gray-800 p-2 rounded-xl text-sm flex items-center gap-2"
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
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
          <div className="w-12"></div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {/* API Key Field */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={config.openrouter_api_key || ""}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    openrouter_api_key: e.target.value,
                  })
                }
                placeholder="Enter your OpenRouter API key"
                className="w-full glass-input text-gray-800 placeholder-gray-500 text-sm rounded-2xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300/50 p-3 transition-all duration-300"
              />
              <p className="mt-2 text-xs text-gray-600">
                Get your API key from{" "}
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  openrouter.ai
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <select
                value={config.default_model}
                onChange={(e) =>
                  onConfigChange({ ...config, default_model: e.target.value })
                }
                className="w-full glass-input text-gray-800 text-sm rounded-2xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300/50 p-3 transition-all duration-300"
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

            {/* Save Button */}
            <button
              onClick={() => onSave(config)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
