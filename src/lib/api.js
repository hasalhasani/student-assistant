import {
  AUTH,
  HISTORY,
  ASSISTANT,
  STUDY,
  PLANNER,
  SUPABASE,
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
 * @param name      Human label, shown in the dev panel.
 * @param url       The configured endpoint.
 * @param payload   What we'd POST.
 * @param mockFn    Async fallback used when mocking or unconfigured.
 * @param token     Optional bearer token.
 * @param forceReal Skip mocking entirely — always hit the network, even
 *                  when USE_MOCKS is on. For endpoints that have a live
 *                  backend and no mock to fall back to.
 */
async function call({ name, url, payload, mockFn, token, forceReal }) {
  const mocked = !forceReal && (USE_MOCKS || !isConfigured(url));
  const entry = logCall({ name, url, payload, mocked });

  try {
    let result;
    if (mocked) {
      result = await mockFn();
    } else {
      if (!url) throw new Error(`No URL configured for ${name}`);
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

/* ---------- General assistant ---------- */

/**
 * The open-ended chat on the landing page.
 *
 * Unlike study.chat, this carries no lesson context — it's a general
 * assistant. It also has NO MOCK: forceReal makes it hit the network
 * even while USE_MOCKS is on, because a live n8n workflow is attached.
 * If the webhook isn't reachable, the page shows the error rather than
 * pretending to work.
 */
export function sendAssistantMessage({ message, sessionId, token }) {
  return call({
    name: "assistant.chat",
    url: ASSISTANT.CHAT_URL,
    payload: { message, session_id: sessionId },
    token,
    forceReal: true,
  });
}

/* ---------- Content (Supabase) ---------- */

/*
  Subjects and lessons come straight from Supabase, not n8n or mocks —
  same as the original vanilla-JS prototype. USE_MOCKS is intentionally
  NOT checked here: if Supabase is configured, always use it, since
  there's no meaningful "mock database" to demo against once real
  content exists. Falls back to mock data only if Supabase isn't
  configured at all, so the UI stays clickable before the DB is wired.
*/

async function supabaseSelect(table, query) {
  const url = `${SUPABASE.URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE.ANON_KEY,
      Authorization: `Bearer ${SUPABASE.ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${table} fetch failed (${res.status})`);
  return res.json();
}

function supabaseConfigured() {
  return Boolean(SUPABASE.URL) && Boolean(SUPABASE.ANON_KEY);
}

/**
 * Upsert a row into study_sessions BEFORE any n8n workflow tries to
 * insert into a table that has a foreign key on session_id (e.g.
 * generated_items). Without this, those inserts fail with a foreign
 * key violation, since nothing in study_sessions matches the session
 * id yet. Ported from the original vanilla-JS prototype's
 * ensureSession().
 */
export async function ensureSession({ sessionId, lessonId, mode }) {
  if (!supabaseConfigured()) return;
  const url = `${SUPABASE.URL}/rest/v1/study_sessions?on_conflict=id`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE.ANON_KEY,
      Authorization: `Bearer ${SUPABASE.ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: sessionId, lesson_id: lessonId, mode }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ensureSession failed (${res.status}) ${text}`);
  }
}

export async function fetchSubjects(lang) {
  if (!supabaseConfigured()) {
    await wait(250);
    return mock.mockSubjects;
  }
  const data = await supabaseSelect("subjects", "order=sort_order.asc");
  return (data || []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: lang === "en" ? s.name_en || s.name_ar : s.name_ar,
    description: "",
    icon: "book",
    available: s.is_available,
    soon: !s.is_available,
  }));
}

export async function fetchLessons(subjectId, lang) {
  if (!supabaseConfigured()) {
    await wait(250);
    return mock.mockLessons[subjectId] || [];
  }
  const data = await supabaseSelect(
    "lessons",
    `subject_id=eq.${subjectId}&is_available=eq.true&order=sort_order.asc`
  );
  return (data || []).map((l) => ({
    id: l.id,
    name: lang === "en" ? l.name_en || l.name_ar : l.name_ar,
  }));
}

/* ---------- Study ---------- */

export function generateMCQ({ lessonId, sessionId, lang, token }) {
  return call({
    name: "study.mcq",
    url: STUDY.MCQ_URL,
    payload: { lesson_id: lessonId, session_id: sessionId, lang },
    token,
    mockFn: mock.mockMCQ,
  });
}

export function generateFlashcards({ lessonId, sessionId, lang, token }) {
  return call({
    name: "study.flashcards",
    url: STUDY.FLASHCARD_URL,
    payload: { lesson_id: lessonId, session_id: sessionId, lang },
    token,
    mockFn: mock.mockFlashcards,
  });
}

export function sendChatMessage({ input, sessionId, lang, token }) {
  return call({
    name: "study.chat",
    url: STUDY.CHAT_URL,
    payload: { chatInput: input, session_id: sessionId, lang },
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
      lang,
    },
    token,
    mockFn: () => mock.mockChat("[voice]", lang),
  });
}

export function endSession({ sessionId, lang, token }) {
  return call({
    name: "study.end_session",
    url: STUDY.END_SESSION_URL,
    payload: { session_id: sessionId, lang },
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
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older Safari, non-HTTPS).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}