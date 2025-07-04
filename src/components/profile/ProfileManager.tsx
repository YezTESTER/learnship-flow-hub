import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCropper from './ImageCropper';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  id_number: string;
  learnership_program: string;
  employer_name: string;
  start_date: string;
  end_date: string;
  emergency_contact: string;
  emergency_phone: string;
  gender: string;
  race: string;
  nationality: string;
  languages: string[];
  avatar_url: string;
}

const ProfileManager = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [full_name, setFullName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [date_of_birth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [id_number, setIdNumber] = useState('');
  const [learnership_program, setLearnershipProgram] = useState('');
  const [employer_name, setEmployerName] = useState('');
  const [start_date, setStartDate] = useState<Date | undefined>(undefined);
  const [end_date, setEndDate] = useState<Date | undefined>(undefined);
  const [emergency_contact, setEmergencyContact] = useState('');
  const [emergency_phone, setEmergencyPhone] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [nationality, setNationality] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setAddress(profile.address || '');
      setDateOfBirth(profile.date_of_birth ? new Date(profile.date_of_birth) : undefined);
      setIdNumber(profile.id_number || '');
      setLearnershipProgram(profile.learnership_program || '');
      setEmployerName(profile.employer_name || '');
      setStartDate(profile.start_date ? new Date(profile.start_date) : undefined);
      setEndDate(profile.end_date ? new Date(profile.end_date) : undefined);
      setEmergencyContact(profile.emergency_contact || '');
      setEmergencyPhone(profile.emergency_phone || '');
      setGender(profile.gender || '');
      setRace(profile.race || '');
      setNationality(profile.nationality || '');
      setLanguages(profile.languages || []);
    }
  }, [profile]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset form values
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setAddress(profile.address || '');
      setDateOfBirth(profile.date_of_birth ? new Date(profile.date_of_birth) : undefined);
      setIdNumber(profile.id_number || '');
      setLearnershipProgram(profile.learnership_program || '');
      setEmployerName(profile.employer_name || '');
      setStartDate(profile.start_date ? new Date(profile.start_date) : undefined);
      setEndDate(profile.end_date ? new Date(profile.end_date) : undefined);
      setEmergencyContact(profile.emergency_contact || '');
      setEmergencyPhone(profile.emergency_phone || '');
      setGender(profile.gender || '');
      setRace(profile.race || '');
      setNationality(profile.nationality || '');
      setLanguages(profile.languages || []);
    }
  };

  const handleSaveClick = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone_number,
          address,
          date_of_birth: date_of_birth ? format(date_of_birth, 'yyyy-MM-dd') : null,
          id_number,
          learnership_program,
          employer_name,
          start_date: start_date ? format(start_date, 'yyyy-MM-dd') : null,
          end_date: end_date ? format(end_date, 'yyyy-MM-dd') : null,
          emergency_contact,
          emergency_phone,
          gender,
          race,
          nationality,
          languages
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      // Profile will be updated in context automatically
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropClose = () => {
    setShowImageCropper(false);
    setSelectedImage(null);
  };

  const handleAvatarUpload = async (croppedImageBlob: Blob) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Delete old avatar if it exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('documents')
            .remove([`avatars/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, croppedImageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Profile will be updated in context automatically
      toast.success('Profile photo updated successfully!');
      setShowImageCropper(false);
      setSelectedImage(null);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Update your profile photo</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback>{profile?.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              {uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
            </Label>
            <Input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={uploadingAvatar}
            />
            <p className="text-sm text-gray-500 mt-1">Click to upload a new photo</p>
          </div>
        </CardContent>
      </Card>

      {/* Image Cropper */}
      <ImageCropper
        isOpen={showImageCropper}
        onClose={handleCropClose}
        onCropComplete={handleAvatarUpload}
        imageSrc={selectedImage || ''}
      />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <DatePicker
                date={date_of_birth}
                onSelect={(date) => setDateOfBirth(date)}
                disabled={!isEditing}
                placeholder="Select date"
                className="w-full"
              />
            </div>

            {/* ID Number */}
            <div className="space-y-2">
              <Label htmlFor="id_number">ID Number</Label>
              <Input
                id="id_number"
                value={id_number}
                onChange={(e) => setIdNumber(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learnership Program */}
            <div className="space-y-2">
              <Label htmlFor="learnership_program">Learnership Program</Label>
              <Input
                id="learnership_program"
                value={learnership_program}
                onChange={(e) => setLearnershipProgram(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            {/* Employer Name */}
            <div className="space-y-2">
              <Label htmlFor="employer_name">Employer Name</Label>
              <Input
                id="employer_name"
                value={employer_name}
                onChange={(e) => setEmployerName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <DatePicker
                date={start_date}
                onSelect={(date) => setStartDate(date)}
                disabled={!isEditing}
                placeholder="Select date"
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <DatePicker
                date={end_date}
                onSelect={(date) => setEndDate(date)}
                disabled={!isEditing}
                placeholder="Select date"
                className="w-full"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={emergency_contact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            {/* Emergency Phone */}
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Emergency Phone</Label>
              <Input
                id="emergency_phone"
                value={emergency_phone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender} disabled={!isEditing}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Race */}
          <div className="space-y-2">
            <Label htmlFor="race">Race</Label>
            <Select value={race} onValueChange={setRace} disabled={!isEditing}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select race" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="asian">Asian</SelectItem>
                <SelectItem value="hispanic">Hispanic</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label htmlFor="languages">Languages (comma-separated)</Label>
            <Input
              id="languages"
              value={languages.join(',')}
              onChange={(e) => setLanguages(e.target.value.split(',').map(lang => lang.trim()))}
              disabled={!isEditing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelClick}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveClick}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={handleEditClick}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileManager;
