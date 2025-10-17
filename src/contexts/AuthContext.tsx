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
    refreshProfile: () => Promise<void>;
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
            setTimeout(async () => {
              try {
                console.log('Fetching profile for user:', session.user.id);
                
                // TEMPORARY: Try multiple approaches to fetch profile
                console.log('TEMP: Trying direct fetch...');
                const { data: profileData1, error: error1 } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                if (profileData1) {
                  console.log('TEMP: Direct fetch successful:', profileData1);
                  setProfile(profileData1);
                  return;
                }
                
                console.log('TEMP: Direct fetch failed, trying relaxed fetch...');
                const { data: profileData2, error: error2 } = await supabase
                  .from('profiles')
                  .select('*')
                  .limit(10);
                
                console.log('TEMP: Relaxed fetch result:', { data: profileData2, error: error2 });
                
                // Try to find our profile in the results
                const ourProfile = profileData2?.find(p => p.id === session.user.id);
                if (ourProfile) {
                  console.log('TEMP: Found our profile in relaxed fetch:', ourProfile);
                  setProfile(ourProfile);
                  return;
                }
                
                if (error1) {
                  console.error('Error fetching profile:', error1);
                  if (error1.code === 'PGRST116') {
                    console.log('Profile not found, attempting to create...');
                    await createUserProfile(session.user);
                  }
                } else if (profileData1) {
                  console.log('Profile fetched successfully:', profileData1);
                  setProfile(profileData1);
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
        console.log('Creating profile for user:', user.id, 'with metadata:', user.user_metadata);
        
        const userData = user.user_metadata || {};
        const role = userData.role || 'learner';
        
        const { data, error } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: userData.full_name || user.email?.split('@')[0] || 'New User',
              email: user.email || '',
              role: role as 'learner' | 'mentor' | 'admin'
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating profile:', error);
          throw error;
        } else {
          console.log('Profile created successfully:', data);
          setProfile(data);
          
          // Create welcome notification for new users
          if (data.role === 'learner') {
            await supabase.rpc('create_notification', {
              target_user_id: user.id,
              notification_title: 'Welcome to WPS Learnership Portal!',
              notification_message: 'Complete your profile and start submitting monthly feedback to track your progress.',
              notification_type: 'success'
            });
          }
        }
      } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
    };

    const signUp = async (email: string, password: string, userData?: any) => {
      console.log('Attempting signup for:', email, 'with userData:', userData);
      
      // Client-side validation for admin accounts
      if (userData?.role === 'admin' && !email.endsWith('@whitepaperconcepts.co.za')) {
        return { 
          error: { 
            message: 'WPS Administrator accounts can only be created with @whitepaperconcepts.co.za email addresses' 
          } 
        };
      }
      
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
        }
        
        return { error };
      } catch (error) {
        console.error('Signup exception:', error);
        return { error };
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

    const refreshProfile = async () => {
      if (!user) return;
      
      try {
        console.log('Refreshing profile for user:', user.id);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error refreshing profile:', error);
        } else if (profileData) {
          console.log('Profile refreshed successfully:', profileData);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error in refreshProfile:', error);
      }
    };

    return (
      <AuthContext.Provider value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile
      }}>
        {children}
      </AuthContext.Provider>
    );
  };
