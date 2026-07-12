import { useState, useRef, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import { ASSISTANT } from "../lib/endpoints";
import { newSessionId } from "../lib/api";

/* ===================================================================
   ASSISTANT — the landing page.

   A general, open-ended chat. No lesson, no subject picker, no session
   scoring — you land here and start typing.

   Distinct from pages/Chat.jsx (Sirāj), which is bound to a specific
   lesson and does MCQ-adjacent tutoring against it.

   This page talks to a REAL n8n webhook. It does not mock. If the
   webhook is unreachable, the error surfaces here rather than the page
   quietly faking a reply.
=================================================================== */

const SUGGESTIONS = [
  "assistant.s1",
  "assistant.s2",
  "assistant.s3",
];

export default function Assistant() {
  const { t } = useI18n();
  const { token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId] = useState(() => newSessionId());

  const areaRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    areaRef.current?.scrollTo({
      top: areaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;

    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setBusy(true);

    try {
      const res = await api.sendAssistantMessage({
        message,
        sessionId,
        token,
      });
      // n8n workflows vary in what they name the output field — accept
      // the common ones rather than forcing one shape.
      const reply = res.output ?? res.text ?? res.message ?? res.reply;
      setMessages((m) => [
        ...m,
        { role: "bot", text: reply || t("assistant.err_empty") },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "err", text: `${t("assistant.err_send")} (${err.message})` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const bubble = (role) => {
    if (role === "user") return { background: "var(--brand)", color: "#fff" };
    if (role === "err") return { background: "#FDE8E8", color: "var(--bad)" };
    return { background: "var(--msg-bot-bg)", color: "var(--msg-bot-text)" };
  };

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      {/* ---------- empty state doubles as the welcome ---------- */}
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "var(--accent)", color: "var(--brand)" }}
          >
            <i className="ti ti-sparkles" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-xl font-bold">{t("assistant.welcome")}</h1>
          <p
            className="mb-7 max-w-sm text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("assistant.welcome_sub")}
          </p>

          <div className="flex w-full flex-col gap-2">
            {SUGGESTIONS.map((key) => (
              <button
                key={key}
                onClick={() => send(t(key))}
                className="rounded-2xl border px-4 py-3 text-start text-sm transition"
                style={{
                  background: "var(--surface-primary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                <i
                  className="ti ti-arrow-up-right me-2 text-xs"
                  style={{ color: "var(--brand)" }}
                  aria-hidden="true"
                />
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={areaRef} className="flex-1 space-y-3 overflow-y-auto py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className="max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={bubble(m.role)}
              >
                {m.text}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--msg-bot-bg)" }}
              >
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{
                        background: "var(--text-tertiary)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- composer ---------- */}
      <div className="flex gap-2 pt-3">
        <input
          ref={inputRef}
          className="field-input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t("assistant.placeholder")}
          disabled={busy}
        />
        <button
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          aria-label={t("chat.send")}
          className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center !px-0 !py-0"
        >
          <i className="ti ti-send" aria-hidden="true" />
        </button>
      </div>

      {/*
        This page has no mock. If the webhook isn't set, say so plainly
        rather than letting the user type into a void.
      */}
      {!ASSISTANT.CHAT_URL.includes("localhost") ? null : (
        <p
          className="pt-2 text-center text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {t("assistant.not_configured")}
        </p>
      )}
    </div>
  );
}
