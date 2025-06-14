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
      className={`group flex items-center gap-3 p-3.5 m-1.5 rounded-xl border border-slate-700/80 bg-slate-800/50 backdrop-blur-sm cursor-pointer transition-all duration-200 ease-out hover:bg-slate-700/70 hover:border-slate-600/90 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected
          ? "bg-indigo-600/30 border-indigo-500/70 ring-1 ring-indigo-500/50 shadow-xl -translate-y-0.5"
          : ""
      }`}
      onClick={onClick}
    >
      {result.icon && (
        <div className="w-7 h-7 flex items-center justify-center text-lg rounded-md bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors">
          {result.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-slate-100 truncate group-hover:text-white transition-colors">
          {result.title}
        </div>
        <div className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">
          {result.description}
        </div>
      </div>
      <div className="ml-2 px-2.5 py-1 rounded-md bg-slate-700/60 border border-slate-600/70 text-[10px] font-semibold uppercase tracking-wider text-slate-300 group-hover:text-slate-200 transition-colors whitespace-nowrap">
        {result.action_type.replace(/([A-Z])/g, " $1").trim()}
      </div>
    </div>
  );
};

export default SearchResultItem;
