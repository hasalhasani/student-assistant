import {
  AUTH,
  HISTORY,
  STUDY,
  PLANNER,
  USE_MOCKS,
  isConfigured,
} from "./endpoints";
import * as mock from "./mocks";
import { logCall } from "./webhookLog";

/* ===================================================================
   API — the single place the app talks to a network.

   Every call goes through call(), which decides mock vs real and
   records the attempt in the webhook log either way. The log therefore
   shows the same sequence of calls whether or not the backends exist —
   so the wiring can be verified now, and USE_MOCKS flipped later
   without touching anything else.
=================================================================== */

/**
 * Run one backend call.
 *
 * @param name    Human label, shown in the dev panel.
 * @param url     The configured endpoint.
 * @param payload What we'd POST.
 * @param mockFn  Async fallback used when mocking or unconfigured.
 * @param token   Optional bearer token.
 */
async function call({ name, url, payload, mockFn, token }) {
  const mocked = USE_MOCKS || !isConfigured(url);
  const entry = logCall({ name, url, payload, mocked });

  try {
    let result;
    if (mocked) {
      result = await mockFn();
    } else {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      result = await res.json();
    }
    entry.done(result);
    return result;
  } catch (err) {
    entry.fail(err.message || err);
    throw err;
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Auth ---------- */

/*
  The password is sent to your n8n webhook over HTTPS. The workflow on
  the other end must hash it (bcrypt or argon2) before storing it —
  never save a plaintext password. That step is yours to implement in
  n8n; the frontend cannot do it safely.

  Note the payloads below log "***" instead of the real password. The
  password still goes over the wire to n8n; it just never lands in the
  dev panel or the browser console.
*/

export function signup({ name, email, password, grade }) {
  return call({
    name: "auth.signup",
    url: AUTH.SIGNUP_URL,
    payload: { name, email, password, grade },
    mockFn: async () => {
      await wait(700);
      return { token: "mock-token", user: { id: "u1", name, grade } };
    },
  });
}

export function login({ email, password }) {
  return call({
    name: "auth.login",
    url: AUTH.LOGIN_URL,
    payload: { email, password },
    mockFn: async () => {
      await wait(700);
      return {
        token: "mock-token",
        user: { id: "u1", name: email.split("@")[0], grade: "5" },
      };
    },
  });
}

export function loginAsGuest() {
  return {
    token: null,
    user: { id: "guest", name: null, grade: "5", isGuest: true },
  };
}

/* ---------- History ---------- */

/**
 * Load what the user did previously: past study sessions, their active
 * plan, and aggregate stats.
 *
 * Fired immediately after login resolves, in parallel with rendering
 * the app — the UI never waits on it. If it fails, the user still gets
 * in; they just start with an empty history.
 */
export function loadUserHistory({ userId, token }) {
  return call({
    name: "user.history",
    url: HISTORY.LOAD_URL,
    payload: { user_id: userId },
    token,
    mockFn: () => mock.mockUserHistory(),
  });
}

/* ---------- Content ---------- */

export async function fetchSubjects() {
  await wait(250);
  return mock.mockSubjects;
}

export async function fetchLessons(subjectId) {
  await wait(250);
  return mock.mockLessons[subjectId] || [];
}

/* ---------- Study ---------- */

export function generateMCQ({ lessonId, sessionId, token }) {
  return call({
    name: "study.mcq",
    url: STUDY.MCQ_URL,
    payload: { lesson_id: lessonId, session_id: sessionId },
    token,
    mockFn: mock.mockMCQ,
  });
}

export function generateFlashcards({ lessonId, sessionId, token }) {
  return call({
    name: "study.flashcards",
    url: STUDY.FLASHCARD_URL,
    payload: { lesson_id: lessonId, session_id: sessionId },
    token,
    mockFn: mock.mockFlashcards,
  });
}

export function sendChatMessage({ input, sessionId, lang, token }) {
  return call({
    name: "study.chat",
    url: STUDY.CHAT_URL,
    payload: { chatInput: input, session_id: sessionId },
    token,
    mockFn: () => mock.mockChat(input, lang),
  });
}

export function sendVoiceMessage({
  audioBase64,
  mimeType,
  sessionId,
  lang,
  token,
}) {
  return call({
    name: "study.chat (voice)",
    url: STUDY.CHAT_URL,
    payload: {
      audio_base64: audioBase64,
      mime_type: mimeType,
      session_id: sessionId,
    },
    token,
    mockFn: () => mock.mockChat("[voice]", lang),
  });
}

export function endSession({ sessionId, lang, token }) {
  return call({
    name: "study.end_session",
    url: STUDY.END_SESSION_URL,
    payload: { session_id: sessionId },
    token,
    mockFn: () => mock.mockSessionSummary(lang),
  });
}

/* ---------- Planner ---------- */

export function generatePlan({ courses, hoursPerDay, days, token }) {
  return call({
    name: "planner.generate",
    url: `${PLANNER.BASE_URL}/generate-plan`,
    payload: { courses, hours_per_day: hoursPerDay, study_days: days },
    token,
    mockFn: () => mock.mockPlan(courses, hoursPerDay, days),
  });
}

export function newSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
