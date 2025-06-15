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
  return (
    <div
      className={`group flex items-center gap-3 p-4 m-1 rounded-2xl glass-button-stable cursor-pointer ease-out hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50 animate-fadeInUp ${
        isSelected
          ? "bg-blue-100/40 border-blue-300/50 ring-2 ring-blue-400/30 shadow-lg scale-[1.02]"
          : ""
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
        <div className="w-8 h-8 flex items-center justify-center text-lg rounded-xl bg-white/30 group-hover:bg-white/40 transition-colors backdrop-blur-sm">
          {result.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-800 truncate group-hover:text-gray-900 transition-colors">
          {result.title}
        </div>
        <div className="text-xs text-gray-600 truncate group-hover:text-gray-700 transition-colors">
          {result.description}
        </div>
      </div>
      <div className="ml-2 px-3 py-1.5 rounded-xl bg-white/30 border border-white/20 text-[10px] font-semibold uppercase tracking-wider text-gray-700 group-hover:text-gray-800 group-hover:bg-white/40 transition-all whitespace-nowrap backdrop-blur-sm">
        {result.action_type.replace(/([A-Z])/g, " $1").trim()}
      </div>
    </div>
  );
};

export default SearchResultItem;
