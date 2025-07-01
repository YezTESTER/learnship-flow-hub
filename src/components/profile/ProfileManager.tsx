
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Building, Award, Mail, Phone, MapPin, Save, Calendar, AlertCircle, Camera, Upload } from 'lucide-react';

const ProfileManager = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    id_number: '',
    learnership_program: '',
    employer_name: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    start_date: '',
    end_date: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile && user) {
      setFormData({
        full_name: profile.full_name || '',
        email: user.email || '',
        id_number: profile.id_number || '',
        learnership_program: profile.learnership_program || '',
        employer_name: profile.employer_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        date_of_birth: profile.date_of_birth || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        start_date: profile.start_date || '',
        end_date: profile.end_date || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be smaller than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // First, remove old avatar if it exists
      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('documents')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          id_number: formData.id_number,
          learnership_program: formData.learnership_program,
          employer_name: formData.employer_name,
          phone_number: formData.phone_number,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-6">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-[#122ec0]" />
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              My Profile
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-sm sm:text-base">
            Manage your personal information and learnership details
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Profile Photo Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Profile Photo
              </h3>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <Label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photo (Max 2MB)
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={photoUploading}
                    className="rounded-xl border-gray-200 text-sm"
                  />
                  {photoUploading && (
                    <p className="text-sm text-blue-600 mt-2">Uploading photo...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number" className="text-sm">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Enter your ID number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-sm">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Enter your full address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact" className="text-sm">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Full name of emergency contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_phone" className="text-sm">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Emergency contact phone number"
                  />
                </div>
              </div>
            </div>

            {/* Learnership Information Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Learnership Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="learnership_program" className="text-sm">Learnership Program</Label>
                  <Input
                    id="learnership_program"
                    value={formData.learnership_program}
                    onChange={(e) => setFormData(prev => ({ ...prev, learnership_program: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="e.g., Business Administration NQF4"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="employer_name" className="text-sm">Employer/Host Company</Label>
                  <Input
                    id="employer_name"
                    value={formData.employer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_name: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder="Enter your employer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm">Expected End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Role Information Section */}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-4 text-sm sm:text-base">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <strong className="text-blue-700">Current Role:</strong>
                  <p className="text-blue-600 uppercase font-medium">{profile?.role}</p>
                </div>
                <div>
                  <strong className="text-blue-700">Points:</strong>
                  <p className="text-blue-600 font-medium">{profile?.points || 0}</p>
                </div>
                <div>
                  <strong className="text-blue-700">Compliance Score:</strong>
                  <p className="text-blue-600 font-medium">{profile?.compliance_score || 0}%</p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-2 sm:py-3 text-sm sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                'Updating...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Update Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileManager;
