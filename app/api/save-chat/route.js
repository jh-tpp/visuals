import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const POST = auth(async function POST(request) {
  if (!request.auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = body?.sessionId;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const createdAt = body?.createdAt || new Date().toISOString();
    const updatedAt = new Date().toISOString();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9-_]/g, "_");
    const stamp = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
    const pathname = `chat-logs/${stamp}_${safeSessionId}.json`;

    const payload = {
      sessionId,
      createdAt,
      updatedAt,
      messages,
    };

    const blob = await put(pathname, JSON.stringify(payload, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });

    return NextResponse.json({
      ok: true,
      pathname: blob.pathname,
      url: blob.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown save error",
      },
      { status: 500 }
    );
  }
});
