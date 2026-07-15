import { useState, useRef, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";
import LessonPicker from "../components/LessonPicker";

/**
 * Chat — the landing page. Shows the lesson picker until a lesson is
 * chosen, then the conversation. Supports typed and spoken questions;
 * voice is recorded with MediaRecorder and posted as base64 to the same
 * webhook, which transcribes, answers, and can speak the reply back.
 */
export default function Chat() {
  const { t, lang, pick } = useI18n();
  const { token } = useAuth();
  const { lesson, sessionId } = useStudy();

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ended, setEnded] = useState(false);

  const areaRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Greet once the session opens.
  useEffect(() => {
    if (started && messages.length === 0) {
      setMessages([{ role: "bot", text: t("chat.greeting") }]);
    }
  }, [started, messages.length, t]);

  // Keep the newest message in view.
  useEffect(() => {
    areaRef.current?.scrollTo({ top: areaRef.current.scrollHeight });
  }, [messages]);

  const push = (role, text) => setMessages((m) => [...m, { role, text }]);

  const ask = async (text) => {
    if (!text.trim() || busy) return;
    push("user", text);
    setInput("");
    setBusy(true);
    try {
      const res = await api.sendChatMessage({
        input: text,
        sessionId,
        lang,
        token,
      });
      push("bot", res.output || res.text || "...");
      if (res.audio_clips?.length) playClips(res.audio_clips);
    } catch {
      push("err", t("chat.err_send"));
    } finally {
      setBusy(false);
    }
  };

  const playClips = (clips) => {
    let i = 0;
    const audio = new Audio();
    const next = () => {
      if (i >= clips.length) return;
      audio.src = `data:audio/mp3;base64,${clips[i++]}`;
      audio.play().catch(next);
    };
    audio.onended = next;
    audio.onerror = next;
    next();
  };

  const toggleMic = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      push("err", t("chat.err_unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType });
      recorderRef.current = rec;
      chunksRef.current = [];
      setRecording(true);

      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((tr) => tr.stop());
        if (!chunksRef.current.length) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });

        push("user", "🎤 ...");
        setBusy(true);
        try {
          const res = await api.sendVoiceMessage({
            audioBase64: base64,
            mimeType,
            sessionId,
            lang,
            token,
          });
          push("bot", res.output || "...");
          if (res.audio_clips?.length) playClips(res.audio_clips);
        } catch {
          push("err", t("chat.err_send"));
        } finally {
          setBusy(false);
        }
      };
      rec.start();
    } catch {
      setRecording(false);
      push("err", t("chat.err_mic"));
    }
  };

  const end = async () => {
    setEnded(true);
    push("bot", t("chat.ended"));
    try {
      const res = await api.endSession({ sessionId, lang, token });
      if (res.summary_text) push("bot", res.summary_text);
    } catch {
      /* summary is best-effort */
    }
  };

  if (!started) {
    return (
      <div className="h-full min-h-0 overflow-y-auto">
        <LessonPicker
          onStart={async () => {
            await api.ensureSession({
              sessionId,
              lessonId: lesson?.id,
              mode: "chatbot",
            });
            setStarted(true);
          }}
        />
      </div>
    );
  }

  const bubbleStyle = (role) => {
    if (role === "user")
      return { background: "var(--brand)", color: "#fff" };
    if (role === "err")
      return { background: "#FDE8E8", color: "var(--bad)" };
    return { background: "var(--msg-bot-bg)", color: "var(--msg-bot-text)" };
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="mb-3 flex items-center justify-between border-b pb-3"
        style={{ borderColor: "var(--border-secondary)" }}
      >
        <div>
          <h2 className="page-title">{t("chat.title")}</h2>
          {lesson && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {pick(lesson.name)}
            </p>
          )}
        </div>
        <button onClick={end} disabled={ended} className="btn-ghost text-xs">
          {t("chat.end")}
        </button>
      </div>

      <div
        ref={areaRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={bubbleStyle(m.role)}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            •••
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-3">
        <input
          className="field-input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder={recording ? t("chat.listening") : t("chat.placeholder")}
          disabled={ended}
        />
        <button
          onClick={toggleMic}
          disabled={ended}
          aria-label={t("chat.mic")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition"
          style={{
            background: recording ? "var(--bad)" : "var(--input-bg)",
            color: recording ? "#fff" : "var(--text-secondary)",
          }}
        >
          <i className="ti ti-microphone" aria-hidden="true" />
        </button>
        <button
          onClick={() => ask(input)}
          disabled={ended || busy}
          aria-label={t("chat.send")}
          className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center !px-0 !py-0"
        >
          <i className="ti ti-send" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}