import Link from "next/link";
import { auth } from "@/auth";
import { get, list } from "@vercel/blob";
import { redirect } from "next/navigation";

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAllowedViewerEmails() {
  return new Set(
    (process.env.AUTH_LOG_VIEWER_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean)
  );
}

function canViewLogs(email) {
  const allowed = getAllowedViewerEmails();
  return allowed.size > 0 && allowed.has(normalizeEmail(email));
}

async function readBlobText(pathname) {
  const result = await get(pathname, { access: "private" });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  return await new Response(result.stream).text();
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatSize(bytes) {
  if (typeof bytes !== "number") return "";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function renderUserLabel(log) {
  const email = log?.user?.email || "unknown user";
  const name = log?.user?.name;

  return name ? `${name} (${email})` : email;
}

export default async function LogsPage({ searchParams }) {
  const session = await auth();
  const signedInEmail = normalizeEmail(session?.user?.email);

  if (!signedInEmail) {
    redirect("/?tab=assistant");
  }

  if (!canViewLogs(signedInEmail)) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-300 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Not authorized</h1>
          <p className="mt-3 text-sm text-slate-600">
            This page is only for approved log viewers.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Add your email address to AUTH_LOG_VIEWER_EMAILS to allow access.
          </p>
        </div>
      </main>
    );
  }

  const resolvedSearchParams = await searchParams;
  const selectedPath =
    typeof resolvedSearchParams?.path === "string"
      ? resolvedSearchParams.path
      : "";

  const { blobs } = await list({ prefix: "chat-logs/" });

  const logs = [...blobs].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  let selectedRaw = null;
  let selectedJson = null;

  if (selectedPath) {
    selectedRaw = await readBlobText(selectedPath);

    if (selectedRaw) {
      try {
        selectedJson = JSON.parse(selectedRaw);
      } catch {
        selectedJson = null;
      }
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Chat logs</h1>
          <p className="text-sm text-slate-600">
            Private viewer for saved assistant sessions.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Saved sessions</h2>
              <p className="text-xs text-slate-500">
                New logs will appear under chat-logs/&lt;user-email&gt;/...
              </p>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No saved logs found.
                </div>
              ) : (
                logs.map((blob) => {
                  const selected = selectedPath === blob.pathname;

                  return (
                    <Link
                      key={blob.pathname}
                      href={`/logs?path=${encodeURIComponent(blob.pathname)}`}
                      className={`block rounded-2xl border p-4 transition ${
                        selected
                          ? "border-slate-900 bg-slate-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-mono text-[11px] leading-5 break-all text-slate-800">
                        {blob.pathname}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {formatDate(blob.uploadedAt)} · {formatSize(blob.size)}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm">
            {!selectedPath ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Select a log on the left.
              </div>
            ) : !selectedRaw ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Could not load that log.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-semibold break-all">{selectedPath}</h2>

                  {selectedJson ? (
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div>
                        <span className="font-medium text-slate-900">User:</span>{" "}
                        {renderUserLabel(selectedJson)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Session ID:</span>{" "}
                        {selectedJson.sessionId}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Created:</span>{" "}
                        {formatDate(selectedJson.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Updated:</span>{" "}
                        {formatDate(selectedJson.updatedAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Messages:</span>{" "}
                        {selectedJson.messageCount ?? selectedJson.messages?.length ?? 0}
                      </div>
                    </div>
                  ) : null}
                </div>

                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-800">
                  {selectedJson
                    ? JSON.stringify(selectedJson, null, 2)
                    : selectedRaw}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
