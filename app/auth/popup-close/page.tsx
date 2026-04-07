"use client";

import { useEffect } from "react";

export default function PopupClosePage() {
  useEffect(() => {
    const tab =
      new URLSearchParams(window.location.search).get("tab") || "assistant";

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: "auth-success", tab },
        window.location.origin
      );

      window.close();
      return;
    }

    window.location.href = `/?tab=${encodeURIComponent(tab)}`;
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-slate-700">
      Finishing sign-in…
    </main>
  );
}
