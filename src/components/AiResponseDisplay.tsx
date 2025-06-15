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
    <div className="glass-panel border-green-200/30 rounded-2xl p-6 mb-5 relative overflow-hidden animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">🤖</div>
          <span className="font-semibold text-green-700">AI Response</span>
          {isAiStreaming && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-0"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-300"></span>
              </div>
              <span>Thinking...</span>
            </div>
          )}
        </div>
        {aiResponse && !isAiStreaming && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="glass-button-stable flex items-center gap-1.5 text-gray-700 hover:text-gray-800 text-xs px-3 py-2 rounded-xl"
              title="Copy"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.12L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
              </svg>
              Copy
            </button>
            <button
              onClick={onNewQuery}
              className="glass-button-stable flex items-center gap-1.5 text-gray-700 hover:text-gray-800 text-xs px-3 py-2 rounded-xl"
              title="New Query"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
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
      <div className="text-gray-800 text-sm leading-relaxed break-words selection:bg-blue-400/30 selection:text-blue-800 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {aiResponse && (
          <ReactMarkdown
            components={{
              // Custom components for better styling
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-4 mb-2 first:mt-0 text-gray-800">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-4 mb-2 first:mt-0 text-gray-800">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-gray-800">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 text-gray-700">{children}</p>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <pre className="bg-gray-100/80 border border-gray-200/50 p-3 rounded-xl text-sm overflow-auto my-2 backdrop-blur-sm">
                      <code className="text-gray-800">{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-gray-100/60 border border-gray-200/40 px-2 py-1 rounded-lg text-sm text-gray-800 backdrop-blur-sm">
                    {children}
                  </code>
                );
              },
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="mb-1 text-gray-700">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600 bg-gray-50/50 py-2 rounded-r-lg backdrop-blur-sm">
                  {children}
                </blockquote>
              ),
            }}
          >
            {cleanAiResponse(aiResponse)}
          </ReactMarkdown>
        )}
        {isAiStreaming && !aiResponse && (
          <div className="text-gray-600 italic">Waiting for response...</div>
        )}
      </div>
    </div>
  );
};

export default AiResponseDisplay;
