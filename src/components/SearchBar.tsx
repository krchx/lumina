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
    <div className="relative">
      <div className="relative px-3 py-3 glass-panel-enhanced rounded-3xl">
        <form onSubmit={onSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search anything or type '/' for AI"
              className="w-full glass-input text-gray-800 placeholder-gray-500 text-base font-normal py-4 px-5 pr-20 outline-none transition-all duration-300 ease-out rounded-2xl focus:shadow-lg focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300/50"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange("");
                    inputRef.current?.focus();
                  }}
                  className="glass-button-stable hover:bg-red-100/30 text-gray-600 hover:text-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm animate-fadeInUp modern-button"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={onSettingsClick}
                className="glass-button-stable text-gray-600 hover:text-gray-800 p-2 rounded-xl flex items-center justify-center modern-button"
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
    </div>
  );
};

export default SearchBar;
