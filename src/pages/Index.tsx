import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"learner" | "mentor" | "admin">("learner");
  const [adminCode, setAdminCode] = useState("");

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (role === 'admin') {
          if (!email.endsWith('@whitepaperconcepts.co.za')) {
            toast({
              variant: "destructive",
              title: "Invalid Admin Email",
              description: "Admin accounts must use a @whitepaperconcepts.co.za email address.",
            });
            setIsLoading(false);
            return;
          }
        }

        await signUp(email, password, {
          full_name: fullName,
          role: role,
        });
        // SignUp success is handled in AuthContext (toast + redirect if needed)
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      // Error handling is mostly done in AuthContext, but we can add extra safety here
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset form
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("learner");
    setAdminCode("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">
      {/* Left Side - Hero Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10" />
        <img
          src="/WPS-portal-login-page.png"
          alt="WPS Portal Background"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div>
            <img
              src="/WpsLogo.png"
              alt="WPS Logo"
              className="h-10 w-auto mb-8"
            />
          </div>

          <div className="space-y-6 max-w-xl">
            <h1 className="text-5xl font-bold leading-tight">
              Empowering your <br />
              <span className="text-blue-400">future career</span>
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed">
              Join our comprehensive learnership management platform. Track your progress,
              submit assessments, and connect with mentors all in one place.
            </p>

            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">Streamlined Learning</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">Real-time Tracking</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            © 2024 White Paper Concepts. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col relative bg-white h-screen">
        {/* Top Navigation */}
        <div className="absolute top-0 right-0 p-6 z-20">
          <Button
            variant="ghost"
            onClick={toggleMode}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 font-medium"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex flex-col py-12 px-8 sm:px-12 lg:px-24">
            <div className="mx-auto w-full max-w-md my-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8">
                <img
                  src="/WpsLogo.png"
                  alt="WPS Logo"
                  className="h-10 w-auto"
                />
              </div>

              <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? "Create an Account" : "Welcome to the WPS Portal"}
                </h2>
                <p className="text-gray-500">
                  {isSignUp
                    ? "Enter your details to get started with your journey."
                    : "Please enter your credentials to access your dashboard."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>I am joining as a:</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div
                          className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${role === 'learner' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}
                          onClick={() => setRole('learner')}
                        >
                          <div className="font-medium text-sm">Learner</div>
                        </div>
                        <div
                          className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${role === 'mentor' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}
                          onClick={() => setRole('mentor')}
                        >
                          <div className="font-medium text-sm">Mentor</div>
                        </div>
                        <div
                          className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${role === 'admin' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}
                          onClick={() => setRole('admin')}
                        >
                          <div className="font-medium text-sm">Admin</div>
                        </div>
                      </div>
                    </div>

                    {/* Role Info Card */}
                    <Alert className="bg-blue-50 border-blue-100">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 font-medium ml-2">
                        {role === 'learner' && "Learner Access"}
                        {role === 'mentor' && "Mentor Access"}
                        {role === 'admin' && "Administrator Access"}
                      </AlertTitle>
                      <AlertDescription className="text-blue-600 text-xs mt-1 ml-6">
                        {role === 'learner' && "Access learning materials, submit assessments, and track your progress."}
                        {role === 'mentor' && "Manage learners, review submissions, and provide feedback."}
                        {role === 'admin' && "Full system control. Requires a @whitepaperconcepts.co.za email address."}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
