import React from "react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isInitialEmptyState?: boolean;
  onSettingsClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSubmit,
  inputRef,
  onSettingsClick,
}) => {
  return (
    <div
      className={`relative px-2 py-2 bg-slate-600 backdrop-blur-md rounded-xl shadow-2xl`}
    >
      <form onSubmit={onSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search anything or type '/' for AI"
            className={`w-full bg-slate-700 bg-opacity-30 border border-slate-600 border-opacity-70 text-white placeholder-slate-400 text-base font-normal py-3 px-4 pr-16 outline-none transition-all duration-300 ease-out shadow-md hover:border-slate-500 hover:border-opacity-80 focus:border-gray-900 focus:border-opacity-70 focus:bg-slate-700 focus:bg-opacity-60 focus:shadow-xl focus:ring-1 focus:ring-gray-900 focus:ring-opacity-40 rounded-md`}
            autoComplete="off"
          />
          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  onQueryChange("");
                  inputRef.current?.focus();
                }}
                className="bg-slate-600 bg-opacity-50 hover:bg-slate-500 hover:bg-opacity-60 text-slate-300 hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors text-xs"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={onSettingsClick}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-600/50 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
