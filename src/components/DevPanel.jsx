import { useState, useEffect } from "react";
import { subscribe, getEntries, clearLog } from "../lib/webhookLog";

/* ===================================================================
   DEV PANEL — a live view of every backend call the app makes.

   Exists so the wiring can be verified before the backends do. Sign in
   and you should see auth.login and user.history fire together.

   Purely a development aid; hide or remove it for a real deployment.
=================================================================== */

const STATUS_COLOR = {
  pending: "var(--text-tertiary)",
  ok: "var(--ok)",
  error: "var(--bad)",
};

export default function DevPanel() {
  const [entries, setEntries] = useState(getEntries);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => subscribe(setEntries), []);

  const pending = entries.filter((e) => e.status === "pending").length;

  return (
    <div
      className="fixed bottom-0 z-50 w-full max-w-md"
      style={{ insetInlineEnd: 0 }}
      dir="ltr"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-t px-4 py-2 text-xs font-medium"
        style={{
          background: "var(--surface-secondary)",
          borderColor: "var(--border-secondary)",
          color: "var(--text-secondary)",
        }}
      >
        <span className="flex items-center gap-2">
          <i className="ti ti-webhook" aria-hidden="true" />
          Webhook log ({entries.length})
          {pending > 0 && (
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "var(--brand)" }}
            />
          )}
        </span>
        <i className={`ti ti-chevron-${open ? "down" : "up"}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="max-h-80 overflow-y-auto border-t"
          style={{
            background: "var(--surface-primary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          {entries.length === 0 ? (
            <p
              className="p-6 text-center text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              No calls yet. Sign in to see auth.login and user.history fire.
            </p>
          ) : (
            <>
              <button
                onClick={clearLog}
                className="w-full px-4 py-1.5 text-start text-[11px] underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Clear
              </button>
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="border-t px-4 py-2 text-[11px]"
                  style={{ borderColor: "var(--border-tertiary)" }}
                >
                  <button
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    className="flex w-full items-center gap-2 text-start"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: STATUS_COLOR[e.status] }}
                    />
                    <code className="font-mono font-bold">{e.name}</code>
                    {e.mocked && (
                      <span
                        className="rounded px-1 py-0.5 text-[9px]"
                        style={{ background: "#FAEEDA", color: "#633806" }}
                      >
                        MOCK
                      </span>
                    )}
                    <span
                      className="ms-auto shrink-0 font-mono"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {e.ms != null ? `${e.ms}ms` : "..."}
                    </span>
                  </button>

                  {expanded === e.id && (
                    <pre
                      className="mt-2 overflow-x-auto rounded-lg p-2 font-mono text-[10px] leading-relaxed"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                      }}
                    >
{`POST ${e.url}
${JSON.stringify(e.payload, null, 2)}

→ ${e.status === "error" ? e.error : JSON.stringify(e.result, null, 2)}`}
                    </pre>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
