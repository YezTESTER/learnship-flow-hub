
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const Index = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('learner');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#122ec0] via-blue-400 to-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          full_name: fullName,
          role: role
        });
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#122ec0] via-blue-400 to-white p-4">
      <div className="w-full max-w-md">
        {/* Company Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            WPS Learnership Portal
          </h1>
          <p className="text-blue-100 text-lg">
            White Paper Systems - Internal Platform
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              {isSignUp ? 'Student Registration' : 'Portal Access'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp 
                ? 'Register as a new learner or admin' 
                : 'Sign in to access your dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#122ec0] bg-white"
                      required
                    >
                      <option value="learner">Learner / Student</option>
                      <option value="mentor">Mentor / Supervisor</option>
                      <option value="admin">WPS Administrator</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#122ec0] hover:text-[#e16623] transition-colors font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need to register? Create account'}
              </button>
            </div>

            {isSignUp && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>For Learners:</strong> Select "Learner / Student" to access your learning dashboard.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>For WPS Staff:</strong> Select "WPS Administrator" for full management access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-100 text-sm">
            © 2024 White Paper Systems (Pty) Ltd
          </p>
          <p className="text-blue-200 text-xs mt-1">
            Learnership Management & Compliance Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
