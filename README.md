# Sirāj — AI Study Companion

Merges both trainee projects into one React app: the Arabic study
assistant (chat, quiz, flashcards) and the English study planner
(dashboard, plan generation).

Runs in **mock mode** by default — the whole UI is clickable with sample
data before any backend exists.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the build locally
```

## Structure

```
index.html
src/
  main.jsx            mounts providers → App
  App.jsx             sidebar shell, lazy-loads each feature
  index.css           theme tokens, light + dark
  lib/
    endpoints.js      ← ALL backend URLs live here
    api.js            mock/real routing
    mocks.js          sample data
    i18n.jsx          translation + RTL
    auth.jsx          session state
    study.jsx         shared subject/lesson/plan state
  locales/
    en.json  ar.json  translation strings
  components/
    LessonPicker.jsx  shared by chat/quiz/flashcards
  pages/
    Login.jsx  Chat.jsx  Quiz.jsx
    Flashcards.jsx  Dashboard.jsx  Planner.jsx
```

Each page is a separate chunk (`React.lazy`), fetched on first visit.

## Sidebar

- **Study** — Chat (landing page), Quiz, Flashcards
- **Planning** — Dashboard, Study Plan

Subject and lesson selection is shared: pick a lesson in Quiz and Chat
already knows about it.

## Language

Detected from the browser on first load, with a toggle in the top bar.
Arabic sets `dir="rtl"`; the layout mirrors automatically because the CSS
uses logical properties (`border-inline-end`, `text-start`) rather than
`left`/`right`.

Adding a language: drop a JSON file in `src/locales/`, register it in
the `BUNDLES` map in `lib/i18n.jsx`, and add it to `RTL_LANGS` if needed.

## Wiring up the backends

Every URL is in **`src/lib/endpoints.js`**. Nothing else hardcodes one.

1. Copy `.env.example` to `.env`
2. Fill in your n8n webhook URLs and planner API URL
3. Set `VITE_USE_MOCKS=false`

Expected shapes:

| Endpoint | Sends | Expects back |
|---|---|---|
| `SIGNUP_URL` | `{name, email, password, grade}` | `{token, user:{id,name,grade}}` |
| `LOGIN_URL` | `{email, password}` | `{token, user:{id,name,grade}}` |
| `HISTORY_URL` | `{user_id}` | `{sessions:[...], plan, stats}` |
| `MCQ_URL` | `{lesson_id, session_id}` | `{questions:[...]}` |
| `FLASHCARD_URL` | `{lesson_id, session_id}` | `{questions:[...]}` |
| `CHAT_URL` | `{chatInput \| audio_base64, session_id}` | `{output, audio_clips?}` |
| `END_SESSION_URL` | `{session_id}` | `{summary_text}` |

### What fires on login

Signing in triggers **two webhooks**:

```
auth.login  ──►  { token, user }
                      │
                      └──►  user.history  ──►  { sessions, plan, stats }
```

`user.history` starts the moment login resolves and is **not awaited** —
the user lands in the app immediately while history streams in behind
them. A spinner in the top bar shows it's still loading. If it fails,
the user is still signed in; they just start with nothing restored.

Login has to resolve first because it produces the token that history
authenticates with. If your history webhook doesn't need auth, the two
can be a true `Promise.all` — see `signIn` in `src/lib/auth.jsx`.

Guests skip history entirely: nothing is saved for them.

A restored plan is handed to `StudyContext`, so the Dashboard shows it
without the user regenerating anything.

### Watching the calls

A **webhook log** sits at the bottom of the screen. Every backend call
appears there — mock or real — with its payload, response, and timing.
Sign in and you'll see `auth.login` and `user.history` fire in sequence.

It's a development aid. Remove `<DevPanel />` from `src/App.jsx` before
a real launch.

### Two things to get right

**Password hashing.** The frontend posts the password to your n8n
webhook over HTTPS. Your workflow must hash it (bcrypt/argon2) before
storing — never save plaintext. A browser cannot do this safely; it has
to happen server-side.

**`VITE_*` variables are public.** Vite inlines them into the built JS.
Anyone can read them in DevTools. Only public values belong there — the
Supabase *anon* key is fine **if Row Level Security is enabled on your
tables**; without RLS that key lets anyone read and write your data.
Never put a service-role key or API secret in a frontend build.

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
3. Build settings:

   | Field | Value |
   |---|---|
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Output directory | `dist` |

4. Add your `VITE_*` variables under **Settings → Environment variables**
5. Deploy

You get `your-project.pages.dev` free — no domain needed, TLS included.
Every branch push also gets its own preview URL.

## Notes

- Sessions are in-memory: a refresh signs you out. That's deliberate —
  tokens in `localStorage` are readable by any XSS. For persistent
  sessions, use an httpOnly cookie set by the server.
- Guest mode works fully but saves nothing.
- Voice input needs Chrome (or any browser with `MediaRecorder`) and
  microphone permission.
