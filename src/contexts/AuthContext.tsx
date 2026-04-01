import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/async-safe';

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
  role: AppRole | null;
  authLoading: boolean;
  profileLoading: boolean;
  /** @deprecated use authLoading instead */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  authLoading: true,
  profileLoading: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, user_id, name, telegram_id, avatar_url, role, trust_score')
          .eq('user_id', userId)
          .single(),
        6000
      );
      if (error) throw error;
      return data as unknown as Profile;
    } catch (e) {
      console.warn('[AuthContext] fetchProfile failed:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    // Safety timeout — guarantee we never hang forever
    const safetyTimer = setTimeout(() => {
      if (alive && authLoading) {
        console.warn('[AuthContext] safety timeout — forcing authLoading=false');
        setAuthLoading(false);
      }
    }, 8000);

    const bootstrap = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          6000
        );
        if (!alive) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Extract role from metadata as fast path
        const metaRole = (currentUser?.app_metadata?.role ?? currentUser?.user_metadata?.role) as AppRole | undefined;
        if (metaRole) setRole(metaRole);

        // Unblock routing immediately — profile loads in background
        setAuthLoading(false);

        if (currentUser) {
          setProfileLoading(true);
          const p = await fetchProfile(currentUser.id);
          if (!alive) return;
          setProfile(p);
          if (p?.role) setRole(p.role);
          else if (!metaRole) setRole('blogger'); // fallback
          setProfileLoading(false);
        }
      } catch (e) {
        console.error('[AuthContext] bootstrap failed:', e);
        if (alive) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Non-blocking profile refresh
        setProfileLoading(true);
        fetchProfile(currentUser.id).then(p => {
          if (!alive) return;
          setProfile(p);
          if (p?.role) setRole(p.role);
          setProfileLoading(false);
        });
      } else {
        setProfile(null);
        setRole(null);
        setProfileLoading(false);
      }
    });

    bootstrap();

    return () => {
      alive = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      authLoading,
      profileLoading,
      loading: authLoading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
