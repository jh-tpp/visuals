"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { signIn } from "next-auth/react";

const EXAMPLE_QUESTIONS = [
  "What is CSP?",
  "What is the guide about",
  "What is The Impact Frontier paper about?"
];

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatTranscript(messages) {
  return messages
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";

      let citationBlock = "";

      if (
        message.role === "assistant" &&
        Array.isArray(message.citations) &&
        message.citations.length > 0
      ) {
        citationBlock =
          "\n\nSources:\n" +
          message.citations
            .map((c) => {
              const pagePart = c.page ? `, page ${c.page}` : "";
              const snippetPart = c.snippet ? `\n  ${c.snippet}` : "";
              return `- ${c.source}${pagePart}${snippetPart}`;
            })
            .join("\n");
      }

      return `${speaker}: ${message.content}${citationBlock}`;
    })
    .join("\n\n");
}

function IconButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mb-3 text-lg font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 text-base font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.95em]">{children}</code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

export default function AssistantPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("assistant-messages");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }

    return [
      {
        role: "assistant",
        content:
          "Welcome. This is an early prototype just to spark discussion. It has limited context and memory.",
      },
    ];
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
    
    async function handleGoogleSignInPopup() {
      try {
        setIsAuthLoading(true);
    
        const result = await signIn("google", {
          redirect: false,
          redirectTo: "/?tab=assistant",
        });
    
        if (!result?.url) {
          throw new Error("Could not start Google sign-in.");
        }
    
        const popup = window.open(
          result.url,
          "google-sign-in",
          "popup=yes,width=520,height=740,left=100,top=80"
        );
    
        if (!popup) {
          window.location.href = result.url;
          return;
        }
    
        const timer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(timer);
            window.location.href = "/?tab=assistant";
          }
        }, 500);
      } catch (error) {
        console.error(error);
        alert("Could not start Google sign-in.");
      } finally {
        setIsAuthLoading(false);
      }
    }

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("idle");
  const copyTimeoutRef = useRef(null);

  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const existing = sessionStorage.getItem("assistant-session-id");
      if (existing) return existing;
    }
    return createSessionId();
  });

  const [createdAt] = useState(() => {
    if (typeof window !== "undefined") {
      const existing = sessionStorage.getItem("assistant-created-at");
      if (existing) return existing;
    }
    return new Date().toISOString();
  });

  const transcriptText = useMemo(() => formatTranscript(messages), [messages]);

  useEffect(() => {
    sessionStorage.setItem("assistant-session-id", sessionId);
    sessionStorage.setItem("assistant-created-at", createdAt);
    sessionStorage.setItem("assistant-messages", JSON.stringify(messages));
  }, [sessionId, createdAt, messages]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  async function persistTranscript(nextMessages) {
    try {
      await fetch("/api/save-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          createdAt,
          messages: nextMessages,
        }),
      });
    } catch (error) {
      console.error("Failed to save chat transcript", error);
    }
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated. Use the 'Sign in with Google' button above.");
        }

        throw new Error(data?.error || "Request failed");
      }

      const finalMessages = [
        ...nextMessages,
        {
          role: "assistant",
          content: data.content,
          citations: Array.isArray(data.citations) ? data.citations : [],
        },
      ];

      setMessages(finalMessages);
      await persistTranscript(finalMessages);
    } catch (error) {
      const finalMessages = [
        ...nextMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Error: Something went wrong.",
          citations: [],
        },
      ];

      setMessages(finalMessages);
      await persistTranscript(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopyStatus("copied");

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus("idle");
      }, 1600);
    } catch (error) {
      console.error("Copy failed", error);
      setCopyStatus("error");

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    }
  }

  function handleDownload() {
    const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `assistant-chat-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Assistant</h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Early prototype 'talk with the research' assistant. Has limited context and memory.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignInPopup}
          disabled={isAuthLoading}
          className="inline-flex items-center justify-center rounded-2xl border border-[#7C3AED] bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:border-[#6D28D9] hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAuthLoading ? "Opening Google..." : "Sign in with Google"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {EXAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => sendMessage(question)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            disabled={isLoading}
          >
            {question}
          </button>
        ))}
      </div>

<div className="rounded-3xl border border-slate-300 bg-slate-50 overflow-hidden">
  <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-100/80 px-4 py-3 print:hidden">
    <IconButton
      onClick={handleCopyAll}
      title={copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy all"}
    >
      {copyStatus === "copied" ? <CheckIcon /> : <CopyIcon />}
    </IconButton>

    <IconButton onClick={handleDownload} title="Download .txt">
      <DownloadIcon />
    </IconButton>

    <IconButton onClick={handlePrint} title="Print">
      <PrintIcon />
    </IconButton>
  </div>

  <div className="p-4">
    <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        return (
          <div key={index} className="space-y-1">
            <div
              className={`text-xs font-medium uppercase tracking-wide ${
                isUser ? "text-right text-slate-500" : "text-slate-500"
              }`}
            >
              {isUser ? "User" : "Assistant"}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                isUser
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-white text-slate-800 border border-slate-200"
              }`}
            >
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {!isUser &&
                Array.isArray(message.citations) &&
                message.citations.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                    {message.citations.map((citation, citationIndex) => (
                      <div key={citationIndex} className="space-y-1">
                        <div className="font-medium text-slate-600">
                          {citation.source}
                          {citation.page ? `, page ${citation.page}` : ""}
                        </div>
                        {citation.snippet && (
                          <div className="italic text-slate-500">{citation.snippet}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Assistant
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 bg-white text-slate-500 border border-slate-200">
            Thinking...
          </div>
        </div>
      )}
    </div>
  </div>
</div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-3 print:hidden"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the work..."
          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
