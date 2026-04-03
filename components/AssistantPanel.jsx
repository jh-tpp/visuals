"use client";

import { useState } from "react";

const EXAMPLE_QUESTIONS = [
  "What is this project about?",
  "What does the system visualization show?",
  "How should I interpret the scatterplot?",
  "What are the main ideas behind this work?",
];

export default function AssistantPanel() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome. This is the early assistant shell. Ask a question or start with one of the example prompts below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Error: Something went wrong.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Assistant</h2>
        <p className="text-sm text-slate-600 max-w-3xl">
          Early live assistant. This version has real model replies but is not yet connected
          to your document set.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
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

      <div className="rounded-3xl border border-slate-300 bg-slate-50 p-4">
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-white text-slate-800 border border-slate-200"
              }`}
            >
              {message.content}
            </div>
          ))}

          {isLoading && (
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 bg-white text-slate-500 border border-slate-200">
              Thinking...
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-3"
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
