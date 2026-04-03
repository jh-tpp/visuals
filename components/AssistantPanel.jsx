"use client";

import { useState } from "react";

const EXAMPLE_QUESTIONS = [
  "What is this project about?",
  "What does the system visualization show?",
  "How should I interpret the scatterplot?",
  "What are the main ideas behind this work?",
];

function makeMockReply(message) {
  return `Mock reply for now: you asked "${message}". The next step is to connect this panel to a real backend route and then to your document set.`;
}

export default function AssistantPanel() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome. This is the early assistant shell. Ask a question or start with one of the example prompts below.",
    },
  ]);
  const [input, setInput] = useState("");

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: makeMockReply(trimmed) },
    ]);

    setInput("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Assistant</h2>
        <p className="text-sm text-slate-600 max-w-3xl">
          Early chat shell for the research assistant. This version is frontend-only and
          uses mock replies so we can get the interface right first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => sendMessage(question)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
        />
        <button
          type="submit"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Send
        </button>
      </form>
    </div>
  );
}
