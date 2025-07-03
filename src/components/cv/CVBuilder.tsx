import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Edit2, Save, Eye, Share, Trash2, AlertTriangle, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CV {
  id: string;
  cv_name: string;
  personal_info: any;
  work_experience: any[];
  education: any[];
  skills: string[];
  additional_info: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface PersonalInfo {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  id_number: string;
  nationality: string;
  gender: string;
  race: string;
  languages: string[];
}

const CVBuilder = () => {
  const { user, profile } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCV, setEditingCV] = useState<CV | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // CV form data
  const [cvName, setCvName] = useState('');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    id_number: '',
    nationality: '',
    gender: '',
    race: '',
    languages: []
  });
  const [workExperience, setWorkExperience] = useState([{ company: '', position: '', duration: '', description: '' }]);
  const [education, setEducation] = useState([{ institution: '', qualification: '', year: '', description: '' }]);
  const [skills, setSkills] = useState(['']);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCVs();
    }
  }, [user]);

  // Auto-populate personal info from profile
  useEffect(() => {
    if (profile && showForm) {
      setPersonalInfo({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        date_of_birth: profile.date_of_birth || '',
        id_number: profile.id_number || '',
        nationality: profile.nationality || '',
        gender: profile.gender || '',
        race: profile.race || '',
        languages: profile.languages || []
      });
    }
  }, [profile, showForm]);

  // Set up navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('learner_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCvs(data || []);
    } catch (error: any) {
      console.error('Error fetching CVs:', error);
      toast.error('Failed to load CVs');
    }
  };

  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  const handleNavigationAttempt = (callback: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => callback);
      setShowExitWarning(true);
    } else {
      callback();
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowExitWarning(false);
    setHasUnsavedChanges(false);
  };

  const cancelNavigation = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

  const resetForm = () => {
    setCvName('');
    setPersonalInfo({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
      date_of_birth: profile?.date_of_birth || '',
      id_number: profile?.id_number || '',
      nationality: profile?.nationality || '',
      gender: profile?.gender || '',
      race: profile?.race || '',
      languages: profile?.languages || []
    });
    setWorkExperience([{ company: '', position: '', duration: '', description: '' }]);
    setEducation([{ institution: '', qualification: '', year: '', description: '' }]);
    setSkills(['']);
    setAdditionalInfo('');
    setIsPublished(false);
    setEditingCV(null);
    setHasUnsavedChanges(false);
  };

  const handleCreateNew = () => {
    handleNavigationAttempt(() => {
      setShowForm(true);
      resetForm();
    });
  };

  const handleEdit = (cv: CV) => {
    handleNavigationAttempt(() => {
      setEditingCV(cv);
      setCvName(cv.cv_name);
      setPersonalInfo(cv.personal_info || personalInfo);
      setWorkExperience(cv.work_experience || [{ company: '', position: '', duration: '', description: '' }]);
      setEducation(cv.education || [{ institution: '', qualification: '', year: '', description: '' }]);
      setSkills(cv.skills || ['']);
      setAdditionalInfo(cv.additional_info || '');
      setIsPublished(cv.is_published || false);
      setShowForm(true);
      setHasUnsavedChanges(false);
    });
  };

  const handleCancel = () => {
    handleNavigationAttempt(() => {
      setShowForm(false);
      resetForm();
    });
  };

  const checkDuplicateName = async (name: string, excludeId?: string) => {
    const { data, error } = await supabase
      .from('cvs')
      .select('id')
      .eq('learner_id', user?.id)
      .eq('cv_name', name)
      .neq('id', excludeId || '');

    if (error) throw error;
    return data.length > 0;
  };

  const handleSave = async () => {
    if (!user || !cvName.trim()) {
      toast.error('Please enter a CV name');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate names
      const isDuplicate = await checkDuplicateName(cvName.trim(), editingCV?.id);
      if (isDuplicate) {
        toast.error('A CV with this name already exists. Please choose a different name.');
        return;
      }

      const cvData = {
        learner_id: user.id,
        cv_name: cvName.trim(),
        personal_info: personalInfo,
        work_experience: workExperience.filter(exp => exp.company || exp.position),
        education: education.filter(edu => edu.institution || edu.qualification),
        skills: skills.filter(skill => skill.trim()),
        additional_info: additionalInfo.trim(),
        is_published: isPublished
      };

      if (editingCV) {
        const { error } = await supabase
          .from('cvs')
          .update(cvData)
          .eq('id', editingCV.id);
        if (error) throw error;
        toast.success('CV updated successfully!');
      } else {
        const { error } = await supabase
          .from('cvs')
          .insert(cvData);
        if (error) throw error;
        toast.success('CV created successfully!');
      }

      // If published, also save as document
      if (isPublished) {
        await saveAsDocument();
      }

      setHasUnsavedChanges(false);
      fetchCVs();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving CV:', error);
      toast.error('Failed to save CV');
    } finally {
      setLoading(false);
    }
  };

  const saveAsDocument = async () => {
    if (!user) return;

    try {
      // Create CV content as blob
      const cvContent = JSON.stringify({
        cv_name: cvName,
        personal_info: personalInfo,
        work_experience: workExperience,
        education: education,
        skills: skills,
        additional_info: additionalInfo
      });

      const blob = new Blob([cvContent], { type: 'application/json' });
      const fileName = `cv_${cvName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
      const filePath = `cvs/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          learner_id: user.id,
          document_type: 'cv_upload',
          file_name: `CV - ${cvName}`,
          file_path: filePath,
          file_size: blob.size
        });

      if (docError) throw docError;
    } catch (error: any) {
      console.error('Error saving CV as document:', error);
    }
  };

  const handleDelete = async (cv: CV) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    try {
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cv.id);

      if (error) throw error;
      toast.success('CV deleted successfully');
      fetchCVs();
    } catch (error: any) {
      toast.error('Failed to delete CV');
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, { company: '', position: '', duration: '', description: '' }]);
    handleFormChange();
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
    handleFormChange();
  };

  const addEducation = () => {
    setEducation([...education, { institution: '', qualification: '', year: '', description: '' }]);
    handleFormChange();
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
    handleFormChange();
  };

  const addSkill = () => {
    setSkills([...skills, '']);
    handleFormChange();
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
    handleFormChange();
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave without saving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelNavigation}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmNavigation} className="bg-red-600 hover:bg-red-700">
                Leave Without Saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CV Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              {editingCV ? 'Edit CV' : 'Create New CV'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CV Name */}
            <div className="space-y-2">
              <Label htmlFor="cv-name">CV Name *</Label>
              <Input
                id="cv-name"
                value={cvName}
                onChange={(e) => {
                  setCvName(e.target.value);
                  handleFormChange();
                }}
                placeholder="Enter CV name"
                className="rounded-xl"
              />
            </div>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>This information is auto-populated from your profile. You can edit it for this CV only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name *</Label>
                    <Input
                      id="full-name"
                      value={personalInfo.full_name}
                      onChange={(e) => {
                        setPersonalInfo({...personalInfo, full_name: e.target.value});
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => {
                        setPersonalInfo({...personalInfo, email: e.target.value});
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone_number}
                      onChange={(e) => {
                        setPersonalInfo({...personalInfo, phone_number: e.target.value});
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-number">ID Number</Label>
                    <Input
                      id="id-number"
                      value={personalInfo.id_number}
                      onChange={(e) => {
                        setPersonalInfo({...personalInfo, id_number: e.target.value});
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) => {
                      setPersonalInfo({...personalInfo, address: e.target.value});
                      handleFormChange();
                    }}
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Work Experience</CardTitle>
                <Button onClick={addWorkExperience} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {workExperience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Experience {index + 1}</h4>
                      {workExperience.length > 1 && (
                        <Button
                          onClick={() => removeWorkExperience(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...workExperience];
                          updated[index].company = e.target.value;
                          setWorkExperience(updated);
                          handleFormChange();
                        }}
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="Position"
                        value={exp.position}
                        onChange={(e) => {
                          const updated = [...workExperience];
                          updated[index].position = e.target.value;
                          setWorkExperience(updated);
                          handleFormChange();
                        }}
                        className="rounded-xl"
                      />
                    </div>
                    <Input
                      placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                      value={exp.duration}
                      onChange={(e) => {
                        const updated = [...workExperience];
                        updated[index].duration = e.target.value;
                        setWorkExperience(updated);
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="Job description and achievements"
                      value={exp.description}
                      onChange={(e) => {
                        const updated = [...workExperience];
                        updated[index].description = e.target.value;
                        setWorkExperience(updated);
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Education</CardTitle>
                <Button onClick={addEducation} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Education {index + 1}</h4>
                      {education.length > 1 && (
                        <Button
                          onClick={() => removeEducation(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Institution Name"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].institution = e.target.value;
                          setEducation(updated);
                          handleFormChange();
                        }}
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="Qualification"
                        value={edu.qualification}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].qualification = e.target.value;
                          setEducation(updated);
                          handleFormChange();
                        }}
                        className="rounded-xl"
                      />
                    </div>
                    <Input
                      placeholder="Year (e.g., 2018-2022)"
                      value={edu.year}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index].year = e.target.value;
                        setEducation(updated);
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="Additional details"
                      value={edu.description}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index].description = e.target.value;
                        setEducation(updated);
                        handleFormChange();
                      }}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Skills</CardTitle>
                <Button onClick={addSkill} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skill
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter a skill"
                      value={skill}
                      onChange={(e) => {
                        const updated = [...skills];
                        updated[index] = e.target.value;
                        setSkills(updated);
                        handleFormChange();
                      }}
                      className="rounded-xl flex-1"
                    />
                    {skills.length > 1 && (
                      <Button
                        onClick={() => removeSkill(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any additional information you'd like to include..."
                  value={additionalInfo}
                  onChange={(e) => {
                    setAdditionalInfo(e.target.value);
                    handleFormChange();
                  }}
                  className="rounded-xl"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Publish Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="publish-cv"
                checked={isPublished}
                onCheckedChange={(checked) => {
                  setIsPublished(checked as boolean);
                  handleFormChange();
                }}
              />
              <Label htmlFor="publish-cv" className="text-sm">
                Publish my CV (make it appear in Documents page)
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save CV'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileText className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              My CV Builder
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Create and manage your professional CVs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateNew} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Create New CV
          </Button>
        </CardContent>
      </Card>

      {/* CVs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cvs.map((cv) => (
          <Card key={cv.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg truncate">{cv.cv_name}</CardTitle>
                  <CardDescription className="text-sm">
                    Created: {new Date(cv.created_at).toLocaleDateString()}
                  </CardDescription>
                  <CardDescription className="text-sm">
                    Updated: {new Date(cv.updated_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-1">
                  {cv.is_published && (
                    <Badge variant="secondary" className="text-xs">
                      <Share className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button onClick={() => handleEdit(cv)} variant="outline" size="sm" className="rounded-lg">
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button onClick={() => handleDelete(cv)} variant="outline" size="sm" className="rounded-lg text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cvs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No CVs yet</h3>
            <p className="text-gray-500 mb-4">Create your first CV to get started</p>
            <Button onClick={handleCreateNew} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create New CV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVBuilder;
