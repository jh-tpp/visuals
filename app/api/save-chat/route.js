import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function sanitizePathPart(value, fallback = "unknown") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  return cleaned || fallback;
}

export const POST = auth(async function POST(request) {
  if (!request.auth?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = body?.sessionId;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const rawCreatedAt = body?.createdAt;
    const createdAtDate = rawCreatedAt ? new Date(rawCreatedAt) : new Date();
    const createdAt = Number.isNaN(createdAtDate.getTime())
      ? new Date().toISOString()
      : createdAtDate.toISOString();
    const updatedAt = new Date().toISOString();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const userName =
      typeof request.auth.user.name === "string" ? request.auth.user.name : null;
    const userEmail = normalizeEmail(request.auth.user.email);

    if (!userEmail) {
      return NextResponse.json(
        { error: "Authenticated user email is missing" },
        { status: 400 }
      );
    }

    const safeSessionId = sanitizePathPart(sessionId, "session");
    const safeUserEmail = sanitizePathPart(userEmail, "unknown-user");
    const stamp = createdAt.replace(/[:.]/g, "-");

    const pathname = `chat-logs/${safeUserEmail}/${stamp}_${safeSessionId}.json`;

    const payload = {
      sessionId,
      createdAt,
      updatedAt,
      user: {
        name: userName,
        email: userEmail,
      },
      messageCount: messages.length,
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
