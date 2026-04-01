import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'blogger' | 'seller';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  telegram_id: string | null;
  avatar_url: string | null;
  role: AppRole;
  trust_score: number | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (!projectId) return null;

  const storageKey = `sb-${projectId}-auth-token`;
  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as
      | { refresh_token?: string; currentSession?: { refresh_token?: string } }
      | Array<{ refresh_token?: string; currentSession?: { refresh_token?: string } }>;

    if (Array.isArray(parsed)) {
      const firstEntry = parsed[0];
      return firstEntry?.refresh_token ?? firstEntry?.currentSession?.refresh_token ?? null;
    }

    return parsed.refresh_token ?? parsed.currentSession?.refresh_token ?? null;
  } catch {
    return rawValue.includes('refresh_token') ? 'refresh_token_exists' : null;
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) setProfile(data as unknown as Profile);
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initializing = true;

    // Safety timeout: if session restore hangs (bad network), stop loading
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth bootstrap timed out, proceeding without session');
        initializing = false;
        setLoading(false);
      }
    }, 4000);

    const applySession = async (session: Session | null) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    };

    // Listener stays active for sign-in/sign-out/token refresh after bootstrap
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || initializing) return;

      setLoading(true);
      let nextSession = session;

      if (!nextSession && getStoredRefreshToken()) {
        const { data: refreshedData } = await supabase.auth.refreshSession();
        nextSession = refreshedData.session ?? null;
      }

      await applySession(nextSession);
      if (mounted) setLoading(false);
    });

    const bootstrapSession = async () => {
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        let nextSession = session;

        if (!nextSession && getStoredRefreshToken()) {
          const { data: refreshedData } = await supabase.auth.refreshSession();
          nextSession = refreshedData.session ?? null;
        }

        await applySession(nextSession);
      } catch (e) {
        console.error('Failed to restore session', e);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          initializing = false;
          setLoading(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
