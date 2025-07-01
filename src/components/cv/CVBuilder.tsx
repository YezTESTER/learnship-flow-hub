
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Plus, Trash2, User, Award, Briefcase, GraduationCap } from 'lucide-react';

interface Experience {
  id: string;
  position: string;
  company: string;
  duration: string;
  responsibilities: string[];
}

interface Education {
  id: string;
  institution: string;
  qualification: string;
  year: string;
}

interface CVData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    id_number: string;
    date_of_birth: string;
    nationality: string;
    gender: string;
    languages: string[];
  };
  education: Education[];
  experience: Experience[];
  skills: string[];
  references: {
    name: string;
    position: string;
    company: string;
    phone: string;
    email: string;
  }[];
}

const CVBuilder = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cvData, setCvData] = useState<CVData>({
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      id_number: '',
      date_of_birth: '',
      nationality: 'South African',
      gender: '',
      languages: ['English']
    },
    education: [],
    experience: [],
    skills: [],
    references: []
  });

  useEffect(() => {
    if (profile && user) {
      setCvData(prev => ({
        ...prev,
        personal_info: {
          ...prev.personal_info,
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone_number || '',
          address: profile.address || '',
          id_number: profile.id_number || '',
          date_of_birth: profile.date_of_birth || ''
        }
      }));
    }
  }, [profile, user]);

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      position: '',
      company: '',
      duration: '',
      responsibilities: ['']
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      qualification: '',
      year: ''
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const addReference = () => {
    const newRef = {
      name: '',
      position: '',
      company: '',
      phone: '',
      email: ''
    };
    setCvData(prev => ({
      ...prev,
      references: [...prev.references, newRef]
    }));
  };

  const generatePDF = () => {
    // This would integrate with a PDF generation library
    toast.info('PDF generation feature coming soon!');
  };

  const saveCVData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Save CV data to documents table as JSON
      const { error } = await supabase
        .from('documents')
        .upsert({
          learner_id: user.id,
          document_type: 'other',
          file_name: 'cv_data.json',
          file_path: `cv/${user.id}/cv_data.json`,
          submission_id: null
        });

      if (error) throw error;
      toast.success('CV data saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save CV data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileText className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              My CV Builder
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Create and manage your professional CV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={cvData.personal_info.full_name}
                  onChange={(e) => setCvData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, full_name: e.target.value }
                  }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={cvData.personal_info.email}
                  disabled
                  className="rounded-xl border-gray-200 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={cvData.personal_info.phone}
                  onChange={(e) => setCvData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, phone: e.target.value }
                  }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  value={cvData.personal_info.nationality}
                  onChange={(e) => setCvData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, nationality: e.target.value }
                  }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input
                  value={cvData.personal_info.gender}
                  onChange={(e) => setCvData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, gender: e.target.value }
                  }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={cvData.personal_info.address}
                  onChange={(e) => setCvData(prev => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, address: e.target.value }
                  }))}
                  className="rounded-xl border-gray-200"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Education
              </h3>
              <Button onClick={addEducation} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
            {cvData.education.map((edu, index) => (
              <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => {
                        const newEducation = [...cvData.education];
                        newEducation[index].institution = e.target.value;
                        setCvData(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualification</Label>
                    <Input
                      value={edu.qualification}
                      onChange={(e) => {
                        const newEducation = [...cvData.education];
                        newEducation[index].qualification = e.target.value;
                        setCvData(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      value={edu.year}
                      onChange={(e) => {
                        const newEducation = [...cvData.education];
                        newEducation[index].year = e.target.value;
                        setCvData(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const newEducation = cvData.education.filter((_, i) => i !== index);
                    setCvData(prev => ({ ...prev, education: newEducation }));
                  }}
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Experience Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Experience
              </h3>
              <Button onClick={addExperience} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>
            {cvData.experience.map((exp, index) => (
              <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={exp.position}
                      onChange={(e) => {
                        const newExperience = [...cvData.experience];
                        newExperience[index].position = e.target.value;
                        setCvData(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => {
                        const newExperience = [...cvData.experience];
                        newExperience[index].company = e.target.value;
                        setCvData(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={exp.duration}
                      onChange={(e) => {
                        const newExperience = [...cvData.experience];
                        newExperience[index].duration = e.target.value;
                        setCvData(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Key Responsibilities</Label>
                  <Textarea
                    value={exp.responsibilities.join('\n')}
                    onChange={(e) => {
                      const newExperience = [...cvData.experience];
                      newExperience[index].responsibilities = e.target.value.split('\n').filter(r => r.trim());
                      setCvData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="rounded-xl border-gray-200"
                    rows={4}
                    placeholder="Enter each responsibility on a new line"
                  />
                </div>
                <Button
                  onClick={() => {
                    const newExperience = cvData.experience.filter((_, i) => i !== index);
                    setCvData(prev => ({ ...prev, experience: newExperience }));
                  }}
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Skills
            </h3>
            <Textarea
              value={cvData.skills.join('\n')}
              onChange={(e) => setCvData(prev => ({
                ...prev,
                skills: e.target.value.split('\n').filter(s => s.trim())
              }))}
              className="rounded-xl border-gray-200"
              rows={4}
              placeholder="Enter each skill on a new line"
            />
          </div>

          {/* References Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">References</h3>
              <Button onClick={addReference} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
            </div>
            {cvData.references.map((ref, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={ref.name}
                      onChange={(e) => {
                        const newReferences = [...cvData.references];
                        newReferences[index].name = e.target.value;
                        setCvData(prev => ({ ...prev, references: newReferences }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={ref.position}
                      onChange={(e) => {
                        const newReferences = [...cvData.references];
                        newReferences[index].position = e.target.value;
                        setCvData(prev => ({ ...prev, references: newReferences }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={ref.company}
                      onChange={(e) => {
                        const newReferences = [...cvData.references];
                        newReferences[index].company = e.target.value;
                        setCvData(prev => ({ ...prev, references: newReferences }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={ref.phone}
                      onChange={(e) => {
                        const newReferences = [...cvData.references];
                        newReferences[index].phone = e.target.value;
                        setCvData(prev => ({ ...prev, references: newReferences }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={ref.email}
                      onChange={(e) => {
                        const newReferences = [...cvData.references];
                        newReferences[index].email = e.target.value;
                        setCvData(prev => ({ ...prev, references: newReferences }));
                      }}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const newReferences = cvData.references.filter((_, i) => i !== index);
                    setCvData(prev => ({ ...prev, references: newReferences }));
                  }}
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button 
              onClick={saveCVData}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? 'Saving...' : 'Save CV Data'}
            </Button>
            <Button 
              onClick={generatePDF}
              variant="outline"
              className="flex-1 rounded-xl py-3 text-lg font-semibold"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVBuilder;
