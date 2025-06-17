
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent deadlock in auth state change
          setTimeout(async () => {
            try {
              console.log('Fetching profile for user:', session.user.id);
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); // Use maybeSingle instead of single to handle case where profile doesn't exist
              
              if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist, try to create it
                if (error.code === 'PGRST116') {
                  console.log('Profile not found, attempting to create...');
                  await createUserProfile(session.user);
                }
              } else if (profileData) {
                console.log('Profile fetched successfully:', profileData);
                setProfile(profileData);
              } else {
                console.log('No profile found, attempting to create...');
                await createUserProfile(session.user);
              }
            } catch (error) {
              console.error('Error in profile fetch:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            email: user.email || '',
            role: (user.user_metadata?.role as 'learner' | 'mentor' | 'admin') || 'learner'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('Attempting signup for:', email, 'with userData:', userData);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        console.error('Signup error:', error);
      } else {
        console.log('Signup successful:', data);
        // If email confirmation is disabled, the user will be automatically signed in
        if (data.user && data.session) {
          console.log('User signed in immediately after signup');
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Signup exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting signin for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Signin response:', { data, error });
      
      if (error) {
        console.error('Signin error:', error);
      } else {
        console.log('Signin successful:', data);
      }
      
      return { error };
    } catch (error) {
      console.error('Signin exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
