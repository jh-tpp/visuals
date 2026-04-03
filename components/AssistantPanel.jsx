"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_QUESTIONS = [
  "What is this project about?",
  "What does the system visualization show?",
  "How should I interpret the scatterplot?",
  "What are the main ideas behind this work?",
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
      return `${speaker}: ${message.content}`;
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
          "Welcome. This is the early assistant shell. Ask a question or start with one of the example prompts below.",
      },
    ];
  });

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
        throw new Error(data?.error || "Request failed");
      }

      const finalMessages = [
        ...nextMessages,
        { role: "assistant", content: data.content },
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
      <div className="space-y-2 print:hidden">
        <h2 className="text-xl font-semibold text-slate-900">Assistant</h2>
        <p className="text-sm text-slate-600 max-w-3xl">
          Early live assistant. This version has real model replies but is not yet connected
          to your document set.
        </p>
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
              {message.content}
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
