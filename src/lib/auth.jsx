import { createContext, useContext, useState, useCallback } from "react";
import * as api from "./api";

/* ===================================================================
   AUTH — session state, held in memory only.

   The token lives in React state, not localStorage. A page refresh
   therefore signs the user out. That's the safer default: nothing on
   disk for an XSS to steal. If you want sessions to survive a reload,
   an httpOnly cookie set by the server is the right mechanism.

   ON LOGIN, TWO WEBHOOKS FIRE:
     1. auth.login    — validates credentials, returns { token, user }
     2. user.history  — loads past sessions, plan, and stats

   History is kicked off the moment login resolves and is NOT awaited:
   the user lands in the app immediately while history streams in
   behind them. `historyLoading` reflects that, so a page can show a
   skeleton without blocking the whole app. If history fails, the user
   is still signed in — they just start with nothing restored.

   (Login has to resolve first because it produces the token that
   history is authenticated with. If your history webhook doesn't
   require auth, these could be a true Promise.all — see the note in
   the README.)
=================================================================== */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  /**
   * Fire the history webhook. Deliberately not awaited by the caller —
   * a slow history load must never hold the login screen hostage.
   */
  const fetchHistory = useCallback((userId, authToken) => {
    setHistoryLoading(true);
    setHistoryError(null);

    api
      .loadUserHistory({ userId, token: authToken })
      .then(setHistory)
      .catch((err) => {
        // Non-fatal: the user is in, just without their past data.
        setHistoryError(err.message);
        console.warn("History load failed:", err);
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  const signIn = useCallback(
    async (credentials) => {
      setBusy(true);
      setError(null);
      try {
        const res = await api.login(credentials);
        setUser(res.user);
        setToken(res.token);

        // Kick off history immediately — no await, so the app renders now.
        fetchHistory(res.user.id, res.token);

        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [fetchHistory]
  );

  const signUp = useCallback(
    async (details) => {
      setBusy(true);
      setError(null);
      try {
        const res = await api.signup(details);
        setUser(res.user);
        setToken(res.token);

        // A new account has no history, but we still call — the webhook
        // is the source of truth for what a fresh user starts with.
        fetchHistory(res.user.id, res.token);

        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [fetchHistory]
  );

  const continueAsGuest = useCallback(() => {
    const res = api.loginAsGuest();
    setUser(res.user);
    setToken(res.token);
    // Guests have no history to load, and nothing is persisted for them.
    setHistory(null);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    setHistory(null);
    setHistoryError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        busy,
        error,
        isGuest: Boolean(user?.isGuest),
        history,
        historyLoading,
        historyError,
        signIn,
        signUp,
        continueAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
