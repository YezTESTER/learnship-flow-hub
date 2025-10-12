
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, FileText, Upload, Award, Bell, Settings, Users, BarChart3, LogOut, User, BookOpen, Menu, X, Clock } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection
}) => {
  const { profile, signOut } = useAuth();
  const { checkUnsavedChanges } = useUnsavedChanges();
  const { unreadCount } = useUnreadNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const lastScrollY = useRef(0);

  const handleMobileScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setShowMobileHeader(false);
    } else {
      setShowMobileHeader(true);
    }
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    if (isMobile) {
      window.addEventListener('scroll', handleMobileScroll);
    } else {
      window.removeEventListener('scroll', handleMobileScroll);
    }
    return () => {
      window.removeEventListener('scroll', handleMobileScroll);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  const handleNavigation = (sectionId: string) => {
    const navigate = () => {
      // Update URL hash
      window.location.hash = sectionId;
      setActiveSection(sectionId);
      if (isMobile) {
        setIsMenuOpen(false);
      }
    };

    if (activeSection === 'cv-builder' && sectionId !== 'cv-builder') {
      checkUnsavedChanges(navigate);
    } else {
      navigate();
    }
  };

  const learnerMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'feedback', label: 'Monthly Feedback', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'cv-builder', label: 'My CV', icon: BookOpen },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account-settings', label: 'Account Settings', icon: Settings },
  ];

  const mentorMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'learners', label: 'My Learners', icon: Users },
    { id: 'feedback-review', label: 'Review Feedback', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account-settings', label: 'Account Settings', icon: Settings },
  ];

  interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    link?: string;
  }

  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'learners', label: 'All Learners', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'feedback-review', label: 'Manage Feedback', icon: FileText },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'comms', label: 'Communications', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account-settings', label: 'Account Settings', icon: Settings },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'mentor': return mentorMenuItems;
      case 'admin': return adminMenuItems;
      default: return learnerMenuItems;
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-4">
          Learnership Portal
        </h1>
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
            <AvatarFallback className="bg-white/20 text-white font-semibold">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-sm">Welcome,</p>
            <p className="text-white font-medium truncate">{profile?.full_name}</p>
            <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full inline-block mt-1">
              {profile?.role?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {getMenuItems().map(item => {
          const Icon = item.icon;
          const isNotifications = item.id === 'notifications';
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.link) {
                  window.location.href = item.link;
                } else {
                  handleNavigation(item.id);
                }
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 transform hover:scale-105 text-sm ${
                activeSection === item.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium truncate">{item.label}</span>
              {isNotifications && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <Button
          onClick={signOut}
          variant="outline"
          className="w-full border-white/30 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/50"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className={`md:hidden fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showMobileHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="p-4 bg-gradient-to-r from-[#122ec0] to-blue-600 text-white flex justify-between items-center">
          <h1 className="text-lg font-bold">Learnership Portal</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => {
              window.location.hash = 'notifications';
              handleNavigation('notifications');
            }} className="relative">
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className={`fixed top-4 right-4 z-50 transition-opacity duration-300 ${!showMobileHeader ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-gradient-to-r from-[#122ec0] to-blue-600 text-white hover:from-[#122ec0] hover:to-blue-700">
            <Menu size={24} />
          </Button>
        </div>
      )}

      {isMobile && isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#122ec0] to-blue-600 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out z-50
          ${isMobile ? (isMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 static'}
        `}
      >
        {sidebarContent}
      </div>
      
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-1 bg-gradient-to-b from-[#122ec0] to-blue-600 text-white">
            {sidebarContent}
          </div>
      </div>
    </>
  );
};

export default Sidebar;
