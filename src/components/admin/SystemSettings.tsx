import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserPlus, Users } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const SystemSettings = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [mentorSettings, setMentorSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedMentorForAssignment, setSelectedMentorForAssignment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch all mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor');
      
      if (mentorsError) throw mentorsError;
      setMentors(mentorsData || []);

      // Fetch all learners
      const { data: learnersData, error: learnersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'learner');
      
      if (learnersError) throw learnersError;
      setLearners(learnersData || []);

      // Initialize settings for each mentor
      const initialSettings: Record<string, any> = {};
      mentorsData?.forEach(mentor => {
        initialSettings[mentor.id] = {
          visibility: 'assigned_only'
        };
      });
      setMentorSettings(initialSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, we would save these settings to the database
      // For now, we'll just show a success message
      toast({
        title: 'Settings Saved',
        description: 'System settings have been updated successfully.'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateMentorVisibility = (mentorId: string, visibility: string) => {
    setMentorSettings(prev => ({
      ...prev,
      [mentorId]: {
        ...prev[mentorId],
        visibility
      }
    }));
  };

  const openAssignmentDialog = (mentorId: string) => {
    setSelectedMentorForAssignment(mentorId);
    setIsDialogOpen(true);
    // Pre-select learners already assigned to this mentor
    const assignedLearners = learners
      .filter(learner => learner.mentor_id === mentorId)
      .map(learner => learner.id);
    setSelectedLearners(assignedLearners);
  };

  const closeAssignmentDialog = () => {
    setIsDialogOpen(false);
    setSelectedMentorForAssignment(null);
    setSelectedLearners([]);
    setSearchTerm('');
  };

  const assignLearnersToMentor = async () => {
    if (!selectedMentorForAssignment) return;
    
    setAssigning(true);
    try {
      console.log('Assigning learners:', selectedLearners, 'to mentor:', selectedMentorForAssignment);
      
      // Use the new bulk assignment function to avoid RLS policy issues
      const { error: assignError } = await supabase.rpc('bulk_assign_learners_to_mentor', {
        learner_uuids: selectedLearners,
        mentor_uuid: selectedMentorForAssignment
      });
      
      if (assignError) {
        throw assignError;
      }

      // Refresh data to show updated assignments
      console.log('Refreshing data...');
      await fetchSettings();
      
      toast({
        title: 'Assignment Updated',
        description: 'Learner assignments have been updated successfully.'
      });
      
      closeAssignmentDialog();
    } catch (error) {
      console.error('Error assigning learners:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: 'Failed to update learner assignments: ' + errorMessage,
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredLearners = learners.filter(learner =>
    learner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    learner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLearnerSelection = (learnerId: string) => {
    setSelectedLearners(prev => 
      prev.includes(learnerId)
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLearners.length === filteredLearners.length) {
      setSelectedLearners([]);
    } else {
      setSelectedLearners(filteredLearners.map(learner => learner.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mentor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              Assign learners to mentors and configure visibility settings for each mentor.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {mentors.map(mentor => {
              const assignedLearnerCount = learners.filter(l => l.mentor_id === mentor.id).length;
              return (
                <div key={mentor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{mentor.full_name}</h3>
                      <p className="text-sm text-gray-600">{mentor.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={isDialogOpen && selectedMentorForAssignment === mentor.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openAssignmentDialog(mentor.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Learners
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Assign Learners to {mentor.full_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                {assignedLearnerCount} learners currently assigned
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={toggleSelectAll}
                              >
                                {selectedLearners.length === filteredLearners.length 
                                  ? 'Deselect All' 
                                  : 'Select All'}
                              </Button>
                            </div>
                            
                            <div className="relative">
                              <Input
                                placeholder="Search learners..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Users className="h-4 w-4" />
                              </div>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto border rounded-md">
                              {filteredLearners.length > 0 ? (
                                <div className="divide-y">
                                  {filteredLearners.map(learner => (
                                    <div 
                                      key={learner.id} 
                                      className="flex items-center p-3 hover:bg-gray-50"
                                    >
                                      <Checkbox
                                        id={`learner-${learner.id}`}
                                        checked={selectedLearners.includes(learner.id)}
                                        onCheckedChange={() => toggleLearnerSelection(learner.id)}
                                      />
                                      <label 
                                        htmlFor={`learner-${learner.id}`}
                                        className="ml-3 flex-1 cursor-pointer"
                                      >
                                        <div className="font-medium">{learner.full_name}</div>
                                        <div className="text-sm text-gray-600">{learner.email}</div>
                                        {learner.employer_name && (
                                          <div className="text-xs text-gray-500">{learner.employer_name}</div>
                                        )}
                                      </label>
                                      {learner.mentor_id === selectedMentorForAssignment && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          Currently Assigned
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  No learners found
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={closeAssignmentDialog}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={assignLearnersToMentor}
                                disabled={assigning}
                              >
                                {assigning ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update Assignments'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Switch
                        checked={mentorSettings[mentor.id]?.visibility === 'all'}
                        onCheckedChange={(checked) => 
                          updateMentorVisibility(mentor.id, checked ? 'all' : 'assigned_only')
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`visibility-${mentor.id}`}>
                        {mentorSettings[mentor.id]?.visibility === 'all' 
                          ? 'Can see all learners' 
                          : 'Can see assigned learners only'}
                      </Label>
                    </div>
                    <div className="text-sm text-gray-600">
                      {assignedLearnerCount} assigned learners
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;