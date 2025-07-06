import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { AlertTriangle } from 'lucide-react';

const NavigationWarningDialog = () => {
  const { 
    showNavigationWarning, 
    setShowNavigationWarning, 
    pendingNavigation, 
    setPendingNavigation,
    setHasUnsavedChanges
  } = useUnsavedChanges();

  const handleConfirm = () => {
    if (pendingNavigation) {
      setHasUnsavedChanges(false);
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowNavigationWarning(false);
  };

  const handleCancel = () => {
    setPendingNavigation(null);
    setShowNavigationWarning(false);
  };

  return (
    <AlertDialog open={showNavigationWarning} onOpenChange={setShowNavigationWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes in your CV. If you navigate away now, your changes will be lost. 
            Are you sure you want to continue without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Stay and Save
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Leave Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NavigationWarningDialog;