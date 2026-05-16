import { useState } from 'react';
import type { IntelligentSession } from '../features/pulse/types';

const SESSION_KEY = 'linka.pulse.session';

function readSession(): IntelligentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as IntelligentSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: IntelligentSession | null): void {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

export function usePulseSession() {
  const [session, setSession] = useState<IntelligentSession | null>(readSession);

  const updateSession = (patch: Partial<IntelligentSession>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      writeSession(next);
      return next;
    });
  };

  const setNewSession = (s: IntelligentSession) => {
    writeSession(s);
    setSession(s);
  };

  const clearSession = () => {
    writeSession(null);
    setSession(null);
  };

  return { session, updateSession, setNewSession, clearSession };
}
