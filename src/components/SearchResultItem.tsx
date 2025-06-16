import React from "react";
import { SearchResult } from "../types"; // Adjusted import path

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  onClick,
}) => {
  const isAiResult = result.action_type === "AiResponse";

  if (isAiResult) {
    return (
      <div
        className={`ai-search-result group relative overflow-hidden p-6 rounded-3xl cursor-pointer focus:outline-none transition-all duration-500 ease-out ${
          isSelected
            ? "ai-selected scale-[1.02] shadow-xl"
            : "hover:scale-[1.01] hover:shadow-lg"
        }`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`${result.title} - ${result.description}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-emerald-500/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/70 backdrop-blur-xl"></div>

        {/* Shimmer effect */}
        <div className="shimmer-overlay"></div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-3xl border border-white/40 group-hover:border-white/60 transition-all duration-300"></div>

        {/* Content */}
        <div className="relative flex items-center gap-5">
          {/* Modern AI Icon */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-7 h-7 relative z-10"
              >
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            {/* Floating particles effect */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce delay-100"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce delay-200"></div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                Ask AI
              </h3>
              <div className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
                <span className="text-xs font-medium text-blue-700">Beta</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200 leading-relaxed">
              Get an AI-powered response to your query:{" "}
              <span className="font-medium text-gray-800">
                "{result.action_data}"
              </span>
            </p>
          </div>

          {/* Call-to-action */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/30 group-hover:from-blue-500/20 group-hover:to-purple-500/20 group-hover:border-blue-300/50 transition-all duration-300">
            <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
              Ask Now
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform duration-200"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Regular search result
  return (
    <div
      className={`search-result-item group flex items-center gap-4 p-4 rounded-2xl glass-button-stable cursor-pointer focus:outline-none state-transition ${
        isSelected ? "selected" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${result.title} - ${result.description}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {result.icon && (
        <div className="w-10 h-10 flex items-center justify-center text-lg rounded-xl bg-white/40 group-hover:bg-white/60 state-transition backdrop-blur-sm border border-white/20 modern-shadow">
          {result.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base text-gray-800 truncate group-hover:text-gray-900 state-transition-fast mb-1">
          {result.title}
        </div>
        <div className="text-sm text-gray-600 truncate group-hover:text-gray-700 state-transition-fast">
          {result.description}
        </div>
      </div>
      <div className="ml-3 px-3 py-2 rounded-xl bg-gradient-to-r from-white/40 to-white/30 border border-white/30 text-xs font-medium text-gray-700 group-hover:text-gray-800 group-hover:from-white/60 group-hover:to-white/50 state-transition whitespace-nowrap backdrop-blur-sm modern-shadow">
        {result.action_type.replace(/([A-Z])/g, " $1").trim()}
      </div>
    </div>
  );
};

export default SearchResultItem;
