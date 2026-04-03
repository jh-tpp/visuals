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

  const copyLabel =
    copyStatus === "copied"
      ? "Copied"
      : copyStatus === "error"
      ? "Copy failed"
      : "Copy all";

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

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={handleCopyAll}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Download .txt
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Print
        </button>
      </div>

      <div className="rounded-3xl border border-slate-300 bg-slate-50 p-4">
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
