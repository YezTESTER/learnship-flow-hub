
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  ArrowRight, 
  Users, 
  FileText, 
  Award, 
  Shield, 
  Smartphone,
  BarChart3,
  Clock,
  CheckCircle,
  Star
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

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

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Smart Feedback Engine",
      description: "Monthly questionnaires with auto-reminders and compliance tracking",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Role-Based Access",
      description: "Learners, mentors, and administrators each get tailored experiences",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Gamification System",
      description: "Earn points and badges for completing tasks and staying compliant",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Reporting",
      description: "Generate compliance reports that meet SETA requirements",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Platform",
      description: "Enterprise-grade security with role-based permissions",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Optimized",
      description: "Access your learnership portal from any device, anywhere",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const benefits = [
    { icon: <Clock className="h-5 w-5" />, text: "Automated deadline tracking" },
    { icon: <CheckCircle className="h-5 w-5" />, text: "Real-time compliance monitoring" },
    { icon: <Star className="h-5 w-5" />, text: "Gamified engagement system" },
    { icon: <FileText className="h-5 w-5" />, text: "Streamlined document management" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#122ec0] via-blue-400 to-white min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              ✨ Modern Learnership Management Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
              Learnership Portal
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline compliance tracking, automate feedback collection, and enhance learnership outcomes with our comprehensive management platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#e16623] to-orange-600 hover:from-orange-600 hover:to-[#e16623] text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-4 text-lg font-semibold backdrop-blur-sm"
              >
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-orange-300">
                    {benefit.icon}
                  </div>
                  <span className="text-white text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage learnership programs effectively and ensure SETA compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#122ec0] to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learnership Program?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join forward-thinking organizations using our platform to streamline compliance and enhance learner outcomes
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-[#e16623] to-orange-600 hover:from-orange-600 hover:to-[#e16623] text-white rounded-xl px-12 py-4 text-xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
            onClick={() => window.location.href = '/auth'}
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
            Learnership Portal
          </h3>
          <p className="text-gray-400 mb-6">
            Empowering learnership excellence through technology
          </p>
          <p className="text-sm text-gray-500">
            © 2024 White Paper Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
