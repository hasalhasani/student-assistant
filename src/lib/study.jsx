import { createContext, useContext, useState, useCallback } from "react";
import * as api from "./api";

/* ===================================================================
   STUDY — shared state across features.

   Subject/lesson choice is shared, so picking a lesson in Quiz carries
   over to Chat and Flashcards without re-selecting. The generated plan
   lives here too, so the Dashboard can read what the Planner produced.
=================================================================== */

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [subject, setSubject] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [sessionId, setSessionId] = useState(() => api.newSessionId());
  const [plan, setPlan] = useState(null);

  const selectSubject = useCallback((s) => {
    setSubject(s);
    setLesson(null); // lesson list changes with the subject
  }, []);

  const selectLesson = useCallback((l) => {
    setLesson(l);
    setSessionId(api.newSessionId()); // a new lesson is a new session
  }, []);

  const toggleSessionDone = useCallback((id) => {
    setPlan((p) => {
      if (!p) return p;
      return {
        ...p,
        sessions: p.sessions.map((s) =>
          s.id === id ? { ...s, done: !s.done } : s
        ),
      };
    });
  }, []);

  return (
    <StudyContext.Provider
      value={{
        subject,
        lesson,
        sessionId,
        plan,
        selectSubject,
        selectLesson,
        setPlan,
        toggleSessionDone,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
