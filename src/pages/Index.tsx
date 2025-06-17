
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, FileText, Trophy, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#122ec0] via-blue-400 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#122ec0] via-blue-400 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
            Learnership Portal
          </h1>
          <p className="text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Streamline your learnership compliance with our modern, intelligent platform designed for learners, mentors, and administrators.
          </p>
          <Button 
            size="lg" 
            className="bg-[#e16623] hover:bg-[#d55a1f] text-white px-8 py-4 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
            onClick={() => window.location.href = '/auth'}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Smart Compliance Tracking</h3>
              <p className="text-gray-600">
                Automated tracking of monthly submissions, compliance scores, and deadline management with intelligent reminders.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Role-Based Access</h3>
              <p className="text-gray-600">
                Customized experiences for learners, mentors, and administrators with appropriate permissions and dashboards.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Document Management</h3>
              <p className="text-gray-600">
                Secure upload and management of learnership documents, assessments, and compliance paperwork.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Gamification System</h3>
              <p className="text-gray-600">
                Earn points and badges for completing tasks on time, maintaining compliance, and achieving milestones.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Analytics & Reporting</h3>
              <p className="text-gray-600">
                Comprehensive reports and analytics for tracking progress, compliance trends, and performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-gradient-to-r from-[#122ec0] to-[#e16623] rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Feedback</h3>
              <p className="text-gray-600">
                Streamlined monthly feedback forms with mentor reviews and automated compliance scoring.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learnership Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations already using our platform to streamline their learnership compliance and boost success rates.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 px-8 py-4 text-lg rounded-full"
            onClick={() => window.location.href = '/auth'}
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
