/* ===================================================================
   ENDPOINTS — every backend URL in the app lives here.

   Nothing else in the codebase hardcodes a URL. To point the app at
   real backends, either edit the defaults below or set the matching
   VITE_* variables (see .env.example).

   IMPORTANT: Vite inlines VITE_* variables into the built JavaScript.
   They are visible to anyone who opens the bundle. Only put public
   values here — never a service-role key, an API secret, or a
   password. Anything secret belongs on the server side (inside your
   n8n workflow), not in a frontend build.
=================================================================== */

const env = import.meta.env;

/**
 * Mock mode. When true, the app serves canned data instead of calling
 * the network, so the whole UI is demoable before any backend exists.
 *
 * Defaults to ON. Set VITE_USE_MOCKS=false to hit the real endpoints.
 */
export const USE_MOCKS = env.VITE_USE_MOCKS !== "false";

/* ---------- Auth (n8n) ---------- */
export const AUTH = {
  // POST { name, email, password } -> { token, user: { id, name, grade } }
  SIGNUP_URL: env.VITE_N8N_SIGNUP_URL || "http://localhost:5678/webhook/signup",
  // POST { email, password }        -> { token, user: { id, name, grade } }
  LOGIN_URL: env.VITE_N8N_LOGIN_URL || "http://localhost:5678/webhook/login",
};

/* ---------- User history (n8n) ---------- */
export const HISTORY = {
  // POST { user_id } -> { sessions: [...], plan: {...} | null, stats: {...} }
  // Fired right after a successful login, alongside the login call.
  LOAD_URL:
    env.VITE_N8N_HISTORY_URL || "http://localhost:5678/webhook/user-history",
};

/* ---------- Study features (n8n) ---------- */
export const STUDY = {
  // POST { lesson_id, session_id } -> { questions: [...] }
  MCQ_URL: env.VITE_N8N_MCQ_URL || "http://localhost:5678/webhook/generate-mcq",
  // POST { lesson_id, session_id } -> { questions: [...] }
  FLASHCARD_URL:
    env.VITE_N8N_FLASHCARD_URL ||
    "http://localhost:5678/webhook/generate-flashcards",
  // POST { chatInput | audio_base64, session_id } -> { output, audio_clips }
  CHAT_URL:
    env.VITE_N8N_CHAT_URL || "http://localhost:5678/webhook/rivision-chat",
  // POST { session_id } -> { summary_text }
  END_SESSION_URL:
    env.VITE_N8N_END_SESSION_URL ||
    "http://localhost:5678/webhook/evaluate-session",
};

/* ---------- Study planner (REST API) ---------- */
export const PLANNER = {
  BASE_URL: env.VITE_PLANNER_API_URL || "http://localhost:8000",
};

/* ---------- Content source (Supabase) ---------- */
/*
   The anon/publishable key is designed to be exposed in a browser, but
   ONLY when Row Level Security is enabled on your tables. Without RLS,
   this key lets anyone read and write your data. Verify RLS is on
   before deploying anywhere public.
*/
export const SUPABASE = {
  URL: env.VITE_SUPABASE_URL || "",
  ANON_KEY: env.VITE_SUPABASE_ANON_KEY || "",
};

/** A URL is "configured" if it isn't empty and isn't pointing at localhost. */
export function isConfigured(url) {
  return Boolean(url) && !url.includes("localhost");
}
