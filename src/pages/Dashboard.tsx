
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import LearnerDashboard from '@/components/dashboard/LearnerDashboard';
import MentorDashboard from '@/components/dashboard/MentorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#122ec0] via-blue-400 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderContent = () => {
    if (activeSection === 'dashboard') {
      switch (profile?.role) {
        case 'mentor':
          return <MentorDashboard />;
        case 'admin':
          return <AdminDashboard />;
        default:
          return <LearnerDashboard />;
      }
    }
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
          <p className="text-gray-500">This section is coming soon!</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              {activeSection === 'dashboard' ? 'Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {profile?.full_name}! Here's your overview.
            </p>
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
