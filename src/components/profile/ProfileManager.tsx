
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Building, Award, Mail, Phone, MapPin, Save, Calendar, AlertCircle } from 'lucide-react';

const ProfileManager = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
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
    end_date: ''
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
        end_date: profile.end_date || ''
      });
    }
  }, [profile, user]);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <User className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              My Profile
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Manage your personal information and learnership details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    className="rounded-xl border-gray-200 bg-gray-50"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Enter your ID number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Full name of emergency contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Emergency contact phone number"
                  />
                </div>
              </div>
            </div>

            {/* Learnership Information Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Learnership Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="learnership_program">Learnership Program</Label>
                  <Input
                    id="learnership_program"
                    value={formData.learnership_program}
                    onChange={(e) => setFormData(prev => ({ ...prev, learnership_program: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="e.g., Business Administration NQF4"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="employer_name">Employer/Host Company</Label>
                  <Input
                    id="employer_name"
                    value={formData.employer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_name: e.target.value }))}
                    className="rounded-xl border-gray-200"
                    placeholder="Enter your employer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Expected End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Role Information Section */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
              className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                'Updating...'
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
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
