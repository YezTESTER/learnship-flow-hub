import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import LearnerDashboard from '@/components/dashboard/LearnerDashboard';
import MentorDashboard from '@/components/dashboard/MentorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import MonthlyFeedbackForm from '@/components/feedback/MonthlyFeedbackForm';
import DocumentUpload from '@/components/documents/DocumentUpload';
import AchievementsDisplay from '@/components/gamification/AchievementsDisplay';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import ProfileManager from '@/components/profile/ProfileManager';
import AccountSettings from '@/components/profile/AccountSettings';
import CVBuilder from '@/components/cv/CVBuilder';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import NavigationWarningDialog from '@/components/ui/navigation-warning-dialog';
import LearnersManagement from '@/components/admin/LearnersManagement';
import Reports from '@/components/admin/Reports';

const Dashboard = () => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    // Check if user needs onboarding (new user or incomplete profile)
    if (profile && profile.role === 'learner') {
      const isNewUser = !profile.learnership_program || !profile.employer_name;
      const hasLowProfileCompletion = checkProfileCompletion() < 50;
      if (isNewUser || hasLowProfileCompletion) {
        setShowOnboarding(true);
      }
    }
  }, [profile]);
  const checkProfileCompletion = () => {
    if (!profile) return 0;
    const requiredFields = ['full_name', 'id_number', 'learnership_program', 'employer_name', 'phone_number', 'address', 'date_of_birth', 'emergency_contact', 'emergency_phone', 'start_date', 'end_date'];
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && value.toString().trim() !== '';
    }).length;
    return Math.round(completedFields / requiredFields.length * 100);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#122ec0] via-blue-400 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect non-admin users away from admin sections
  const adminOnlySections = ['reports', 'settings', 'learners'];
  if (profile?.role !== 'admin' && adminOnlySections.includes(activeSection)) {
    setActiveSection('dashboard');
  }
  const renderContent = () => {
    if (activeSection === 'dashboard') {
      switch (profile?.role) {
        case 'mentor':
          return <MentorDashboard setActiveSection={setActiveSection} />;
        case 'admin':
          return <AdminDashboard setActiveSection={setActiveSection} />;
        default:
          return <LearnerDashboard setActiveSection={setActiveSection} />;
      }
    }
    switch (activeSection) {
      case 'feedback':
        return <MonthlyFeedbackForm />;
      case 'documents':
        return <DocumentUpload />;
      case 'cv-builder':
        return <CVBuilder />;
      case 'achievements':
        return <AchievementsDisplay />;
      case 'notifications':
        return <NotificationCenter />;
      case 'profile':
        return <ProfileManager />;
      case 'account-settings':
        return <AccountSettings />;
      case 'learners':
        if (profile?.role === 'admin' || profile?.role === 'mentor') {
          return <LearnersManagement />;
        }
        return <Navigate to="/dashboard" replace />;
      case 'reports':
        if (profile?.role === 'admin') {
          return <Reports />;
        }
        return <Navigate to="/dashboard" replace />;
      case 'feedback-review':
        if (profile?.role === 'admin' || profile?.role === 'mentor') {
          return <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Feedback Review</h2>
              <p className="text-gray-500">Review and approve learner feedback submissions</p>
            </div>;
        }
        return <Navigate to="/dashboard" replace />;
      case 'settings':
        if (profile?.role === 'admin') {
          return <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">System Settings</h2>
              <p className="text-gray-500">Configure system settings and preferences</p>
            </div>;
        }
        return <Navigate to="/dashboard" replace />;
      default:
        return <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>
              <p className="text-gray-500">This section is coming soon!</p>
            </div>
          </div>;
    }
  };
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return `${profile?.role?.charAt(0).toUpperCase()}${profile?.role?.slice(1)} Dashboard`;
      case 'feedback':
        return 'Monthly Feedback';
      case 'documents':
        return 'Document Upload';
      case 'cv-builder':
        return 'My CV Builder';
      case 'achievements':
        return 'Achievements';
      case 'notifications':
        return 'Notifications';
      case 'profile':
        return 'Profile Settings';
      case 'account-settings':
        return 'Account Settings';
      case 'learners':
        return 'Learner Management';
      case 'reports':
        return 'Compliance Reports';
      case 'feedback-review':
        return 'Feedback Review';
      case 'settings':
        return 'System Settings';
      default:
        return activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    }
  };
  return <UnsavedChangesProvider>
      <div className="relative min-h-screen md:flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8 px-[17px]">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
                {getSectionTitle()}
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {profile?.full_name}! Here's your {profile?.role} overview.
              </p>
            </div>
            
            {renderContent()}
          </div>
        </main>

        {/* Onboarding Tour */}
        <OnboardingTour isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={() => setShowOnboarding(false)} />

        {/* Navigation Warning Dialog */}
        <NavigationWarningDialog />
      </div>
    </UnsavedChangesProvider>;
};
export default Dashboard;