
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Building, Award, Mail, Phone, MapPin, Save } from 'lucide-react';

const ProfileManager = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    id_number: '',
    learnership_program: '',
    employer_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (profile && user) {
      setFormData({
        full_name: profile.full_name || '',
        email: user.email || '',
        id_number: profile.id_number || '',
        learnership_program: profile.learnership_program || '',
        employer_name: profile.employer_name || '',
        phone: '',
        address: ''
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
    <div className="max-w-2xl mx-auto space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  className="rounded-xl border-gray-200 bg-gray-50"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>ID Number</span>
                </Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  placeholder="Enter your ID number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learnership_program" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Learnership Program</span>
                </Label>
                <Input
                  id="learnership_program"
                  value={formData.learnership_program}
                  onChange={(e) => setFormData(prev => ({ ...prev, learnership_program: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  placeholder="e.g., Business Administration NQF4"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="employer_name" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Employer/Host Company</span>
                </Label>
                <Input
                  id="employer_name"
                  value={formData.employer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, employer_name: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  placeholder="Enter your employer name"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Role Information</h3>
              <p className="text-blue-700 text-sm">
                <strong>Current Role:</strong> {profile?.role?.toUpperCase()}
              </p>
              <p className="text-blue-700 text-sm">
                <strong>Points:</strong> {profile?.points || 0}
              </p>
              <p className="text-blue-700 text-sm">
                <strong>Compliance Score:</strong> {profile?.compliance_score || 0}%
              </p>
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
