
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, FileText, Upload, Award, Bell, Settings, Users, BarChart3, LogOut, User, BookOpen } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection
}) => {
  const {
    profile,
    signOut
  } = useAuth();

  const learnerMenuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'feedback',
    label: 'Monthly Feedback',
    icon: FileText
  }, {
    id: 'documents',
    label: 'Documents',
    icon: Upload
  }, {
    id: 'cv-builder',
    label: 'My CV',
    icon: BookOpen
  }, {
    id: 'achievements',
    label: 'Achievements',
    icon: Award
  }, {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  }, {
    id: 'profile',
    label: 'Profile',
    icon: User
  }, {
    id: 'account-settings',
    label: 'Account Settings',
    icon: Settings
  }];

  const mentorMenuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'learners',
    label: 'My Learners',
    icon: Users
  }, {
    id: 'feedback-review',
    label: 'Review Feedback',
    icon: FileText
  }, {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  }, {
    id: 'profile',
    label: 'Profile',
    icon: User
  }, {
    id: 'account-settings',
    label: 'Account Settings',
    icon: Settings
  }];

  const adminMenuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'learners',
    label: 'All Learners',
    icon: Users
  }, {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3
  }, {
    id: 'feedback-review',
    label: 'Manage Feedback',
    icon: FileText
  }, {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  }, {
    id: 'account-settings',
    label: 'Account Settings',
    icon: Settings
  }, {
    id: 'settings',
    label: 'System Settings',
    icon: Settings
  }];

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'mentor':
        return mentorMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return learnerMenuItems;
    }
  };

  return <div className="w-64 bg-gradient-to-b from-[#122ec0] to-blue-600 text-white h-screen flex flex-col">
      <div className="p-3 sm:p-4">
        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-3">
          Learnership Portal
        </h1>
        
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
            <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-xs sm:text-sm">Welcome,</p>
            <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
            <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full inline-block mt-1">
              {profile?.role?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 sm:px-3 overflow-y-auto">
        {getMenuItems().map(item => {
        const Icon = item.icon;
        return <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-xl mb-1 transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm ${activeSection === item.id ? 'bg-white/20 text-white shadow-lg' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium truncate">{item.label}</span>
            </button>;
      })}
      </nav>

      <div className="p-2 sm:p-3">
        <Button onClick={signOut} variant="outline" className="w-full border-white/30 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/50 text-xs sm:text-sm py-2">
          <LogOut size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
          Sign Out
        </Button>
      </div>
    </div>;
};

export default Sidebar;
