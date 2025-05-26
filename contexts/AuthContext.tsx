"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Adjusted import path
import type { User, AuthError, SupabaseClient } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  supabase: SupabaseClient | null; // Expose client if needed by components, though typically not
  signUp: (email: string, password: string, firstName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Get Supabase client instance (client-side)
  // This should use the client from @/utils/supabase/client
  const supabaseClient = createClient();

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Handle specific auth events if needed
      // For example, redirect on SIGNED_IN or SIGNED_OUT
      // if (event === 'SIGNED_IN') router.push('/dashboard');
      // if (event === 'SIGNED_OUT') router.push('/login');
    });

    // Perform initial session check
    const checkUser = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setUser(session?.user ?? null);
        setIsLoading(false);
    };
    checkUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseClient.auth, router]);

  const signUp = async (email: string, password: string, firstName?: string) => {
    setIsLoading(true);
    // Include firstName in options.data if you want to store it during sign-up
    // This requires appropriate table setup in Supabase (e.g., a 'profiles' table with a trigger)
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName, // Supabase typically uses snake_case for metadata
        },
      },
    });
    // User will be set by onAuthStateChange
    // Navigation can be handled by the calling component or useEffect based on user state
    setIsLoading(false);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    // User will be set by onAuthStateChange
    setIsLoading(false);
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabaseClient.auth.signOut();
    // User will be set by onAuthStateChange, which should trigger redirect via useEffect if setup
    // Or redirect here explicitly after sign out if preferred
    // router.push('/login'); 
    setIsLoading(false);
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, supabase: supabaseClient, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
