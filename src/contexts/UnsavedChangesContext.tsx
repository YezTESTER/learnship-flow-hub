import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  pendingNavigation: (() => void) | null;
  setPendingNavigation: (action: (() => void) | null) => void;
  showNavigationWarning: boolean;
  setShowNavigationWarning: (show: boolean) => void;
  checkUnsavedChanges: (navigationAction: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
};

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export const UnsavedChangesProvider: React.FC<UnsavedChangesProviderProps> = ({ children }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);

  const checkUnsavedChanges = (navigationAction: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationAction);
      setShowNavigationWarning(true);
    } else {
      navigationAction();
    }
  };

  const value = {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    pendingNavigation,
    setPendingNavigation,
    showNavigationWarning,
    setShowNavigationWarning,
    checkUnsavedChanges,
  };

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};