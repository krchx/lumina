import React from "react";
import ReactMarkdown from "react-markdown";

interface AiResponseDisplayProps {
  aiResponse: string;
  isAiStreaming: boolean;
  onCopy: () => void;
  onNewQuery: () => void;
}
const cleanAiResponse = (text: string) => {
  if (!text) return "";

  return text
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(.)\1{10,}/g, "$1")
    .trim();
};

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({
  aiResponse,
  isAiStreaming,
  onCopy,
  onNewQuery,
}) => {
  if (!isAiStreaming && !aiResponse) {
    return null;
  }

  return (
    <div
      className={`glass-panel border-green-200/30 rounded-2xl p-6 mb-5 relative overflow-hidden animate-fadeInUp ${
        isAiStreaming ? "ai-streaming" : ""
      }`}
    >
      {/* Modern Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="white"
              className="w-5 h-5"
            >
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.896 28.896 0 003.105 2.289z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-base">
              AI Assistant
            </span>
            {isAiStreaming && (
              <div className="flex items-center gap-2 mt-1">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="text-xs text-gray-600">
                  Generating response...
                </span>
              </div>
            )}
          </div>
        </div>
        {aiResponse && !isAiStreaming && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="glass-button-stable flex items-center gap-2 text-gray-700 hover:text-gray-800 text-xs px-4 py-2 rounded-xl state-transition micro-bounce"
              title="Copy response"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.12L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
              </svg>
              Copy
            </button>
            <button
              onClick={onNewQuery}
              className="glass-button-stable flex items-center gap-2 text-gray-700 hover:text-gray-800 text-xs px-4 py-2 rounded-xl state-transition micro-bounce"
              title="Start new query"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 4 18h12a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4Zm2.25 8.5a.75.75 0 0 1 .75-.75h2.25V7.5a.75.75 0 0 1 1.5 0v2.25H13a.75.75 0 0 1 0 1.5h-2.25V13.5a.75.75 0 0 1-1.5 0v-2.25H7a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
              New Query
            </button>
          </div>
        )}
      </div>
      {/* Enhanced Content Area */}
      <div className="text-gray-800 text-sm leading-relaxed break-words selection:bg-blue-400/30 selection:text-blue-800 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {aiResponse && (
          <div className={isAiStreaming ? "content-fade-in" : ""}>
            <ReactMarkdown
              components={{
                // Enhanced components for better styling
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0 text-gray-800 border-b border-gray-200/50 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mt-5 mb-3 first:mt-0 text-gray-800">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-gray-800">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 text-gray-700 leading-relaxed">
                    {children}
                  </p>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <pre className="bg-gray-50/80 border border-gray-200/60 p-4 rounded-xl text-sm overflow-auto my-4 backdrop-blur-sm shadow-sm">
                        <code className="text-gray-800 font-mono">
                          {children}
                        </code>
                      </pre>
                    );
                  }
                  return (
                    <code className="bg-gray-100/70 border border-gray-200/50 px-2 py-1 rounded-lg text-sm text-gray-800 backdrop-blur-sm font-mono">
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-2 text-gray-700 pl-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-2 text-gray-700 pl-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="mb-1 text-gray-700 leading-relaxed">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-300/60 pl-4 italic my-4 text-gray-600 bg-blue-50/50 py-3 rounded-r-lg backdrop-blur-sm">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-800">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700">{children}</em>
                ),
              }}
            >
              {cleanAiResponse(aiResponse)}
            </ReactMarkdown>
          </div>
        )}
        {isAiStreaming && !aiResponse && (
          <div className="flex items-center gap-3 text-gray-600 italic py-4">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span>Waiting for AI response...</span>
          </div>
        )}
      </div>

      {/* Streaming indicator overlay */}
      {isAiStreaming && aiResponse && (
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center gap-2 glass-panel px-3 py-2 rounded-full">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span className="text-xs text-gray-600">Streaming...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiResponseDisplay;
