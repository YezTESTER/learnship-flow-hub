import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthDiagnostic = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const diagnoseAuth = async () => {
      try {
        // Check current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', sessionData);
        console.log('Session error:', sessionError);
        
        // Check user
        const user = supabase.auth.getUser();
        console.log('User promise:', user);
        
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('User data:', userData);
        console.log('User error:', userError);
        
        // Try to get profile
        if (userData?.user?.id) {
          console.log('Trying to fetch profile for user:', userData.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single();
          
          console.log('Profile data:', profile);
          console.log('Profile error:', profileError);
          
          setProfileData(profile);
          if (profileError) {
            setError(`Profile error: ${profileError.message}`);
          }
        }
        
        setAuthState({
          session: sessionData,
          user: userData,
          sessionError,
          userError
        });
      } catch (err) {
        console.error('Diagnostic error:', err);
        setError(`Diagnostic error: ${err}`);
      }
    };
    
    diagnoseAuth();
  }, []);
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h2 className="text-xl font-bold mb-2">Authentication Diagnostic - Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!authState) {
    return <div className="p-4">Loading authentication diagnostic...</div>;
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-2">Authentication Diagnostic</h2>
      
      <div className="mb-4">
        <h3 className="font-bold">Session Info:</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(authState.session, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">User Info:</h3>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(authState.user, null, 2)}
        </pre>
      </div>
      
      {profileData && (
        <div className="mb-4">
          <h3 className="font-bold">Profile Data:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-2 bg-yellow-100 rounded">
        <p className="text-sm">
          <strong>Note:</strong> If session/user info shows null or empty, the issue is with Supabase authentication.
          If profile data is missing but session/user exist, the issue is with RLS policies.
        </p>
      </div>
    </div>
  );
};

export default AuthDiagnostic;