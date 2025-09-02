import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Grid3x3, 
  List, 
  Plus, 
  Search, 
  Filter, 
  MessageCircle, 
  FileText, 
  Upload,
  Award,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock
} from 'lucide-react';

type Profile = Tables<'profiles'>;
type FeedbackSubmission = Tables<'feedback_submissions'>;
type Document = Tables<'documents'>;
type Achievement = Tables<'achievements'>;
type Notification = Tables<'notifications'>;
type CV = Tables<'cvs'>;
type LearnerCategory = Tables<'learner_categories'>;
type CategoryAssignment = Tables<'learner_category_assignments'>;

interface ExtendedProfile extends Profile {
  category?: LearnerCategory;
  feedback_submissions?: FeedbackSubmission[];
  documents?: Document[];
  achievements?: Achievement[];
  cvs?: CV[];
}

const LearnersManagement: React.FC = () => {
  const [learners, setLearners] = useState<ExtendedProfile[]>([]);
  const [categories, setCategories] = useState<LearnerCategory[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<ExtendedProfile[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLearner, setSelectedLearner] = useState<ExtendedProfile | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showLearnerProfile, setShowLearnerProfile] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', description: '' });
  const [messageData, setMessageData] = useState({ title: '', message: '' });
  const [pointsData, setPointsData] = useState({ points: 0, reason: '', category: 'manual_award' });
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLearners();
  }, [learners, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      // First fetch learners with their related data
      const { data: learnersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'learner');

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('learner_categories')
        .select('*')
        .order('name');

      if (learnersData) {
        // Fetch related data for each learner
        const enrichedLearners = await Promise.all(
          learnersData.map(async (learner) => {
            const [feedbackData, documentsData, achievementsData, cvsData, assignmentData] = await Promise.all([
              supabase
                .from('feedback_submissions')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('documents')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('achievements')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('cvs')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('learner_category_assignments')
                .select('*')
                .eq('learner_id', learner.id)
                .maybeSingle()
            ]);

            // Get category separately if assignment exists
            let category = null;
            if (assignmentData.data?.category_id) {
              const categoryResult = await supabase
                .from('learner_categories')
                .select('*')
                .eq('id', assignmentData.data.category_id)
                .maybeSingle();
              
              category = categoryResult.data;
            }

            return {
              ...learner,
              feedback_submissions: feedbackData.data || [],
              documents: documentsData.data || [],
              achievements: achievementsData.data || [],
              cvs: cvsData.data || [],
              category: category
            };
          })
        );

        setLearners(enrichedLearners as ExtendedProfile[]);
      }

      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch learners data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLearners = () => {
    let filtered = learners;

    if (searchTerm) {
      filtered = filtered.filter(learner =>
        learner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.employer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        filtered = filtered.filter(learner => !learner.category);
      } else {
        filtered = filtered.filter(learner => learner.category?.id === selectedCategory);
      }
    }

    setFilteredLearners(filtered);
  };

  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('learner_categories')
        .insert({
          name: newCategory.name,
          color: newCategory.color,
          description: newCategory.description,
          created_by: userData.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully"
      });

      setNewCategory({ name: '', color: '#3B82F6', description: '' });
      setShowCategoryDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const assignLearnerToCategory = async (learnerId: string, categoryId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Remove existing assignment
      await supabase
        .from('learner_category_assignments')
        .delete()
        .eq('learner_id', learnerId);

      // Add new assignment if category is not 'none'
      if (categoryId !== 'none') {
        const { error } = await supabase
          .from('learner_category_assignments')
          .insert({
            learner_id: learnerId,
            category_id: categoryId,
            assigned_by: userData.user?.id
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Learner category updated successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error assigning category:', error);
      toast({
        title: "Error",
        description: "Failed to update learner category",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedLearner || !messageData.title.trim() || !messageData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all message fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedLearner.id,
          title: messageData.title,
          message: messageData.message,
          type: 'message',
          message_type: 'admin_message',
          sender_id: userData.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully"
      });

      setMessageData({ title: '', message: '' });
      setShowMessageDialog(false);
      
      // Refresh message history
      if (selectedLearner) {
        const messages = await checkMessageReadStatus(selectedLearner.id);
        setMessageHistory(messages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const checkMessageReadStatus = async (learnerId: string) => {
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', learnerId)
        .eq('message_type', 'admin_message')
        .order('created_at', { ascending: false })
        .limit(10);

      return notifications?.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        created_at: notif.created_at,
        read_at: notif.read_at,
        isRead: !!notif.read_at
      })) || [];
    } catch (error) {
      console.error('Error fetching message status:', error);
      return [];
    }
  };

  const openLearnerProfile = async (learner: ExtendedProfile) => {
    setSelectedLearner(learner);
    setShowLearnerProfile(true);
    
    // Load message history for this learner
    const messages = await checkMessageReadStatus(learner.id);
    setMessageHistory(messages);
  };

  const awardPoints = async () => {
    if (!selectedLearner || !pointsData.points || !pointsData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Create achievement record with admin-awarded points
      const { error: achievementError } = await supabase
        .from('achievements')
        .insert({
          learner_id: selectedLearner.id,
          badge_type: pointsData.category,
          badge_name: `Admin Award: ${pointsData.category.replace('_', ' ').toUpperCase()}`,
          description: pointsData.reason,
          points_awarded: pointsData.points,
          badge_color: '#FFD700',
          badge_icon: 'crown'
        });

      if (achievementError) throw achievementError;

      // Update learner's total points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: (selectedLearner.points || 0) + pointsData.points
        })
        .eq('id', selectedLearner.id);

      if (updateError) throw updateError;

      // Create notification to learner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedLearner.id,
          title: `🎉 You've been awarded ${pointsData.points} points!`,
          message: `Admin awarded you ${pointsData.points} points for: ${pointsData.reason}`,
          type: 'achievement',
          message_type: 'admin_message',
          sender_id: userData.user?.id
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Success",
        description: `Awarded ${pointsData.points} points to ${selectedLearner.full_name}!`
      });

      setPointsData({ points: 0, reason: '', category: 'manual_award' });
      setShowPointsDialog(false);
      
      // Refresh data to show updated points
      fetchData();
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive"
      });
    }
  };

  const LearnerCard = ({ learner }: { learner: ExtendedProfile }) => (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={learner.avatar_url || ''} alt={learner.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {learner.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{learner.full_name}</h3>
            <p className="text-xs text-muted-foreground truncate">{learner.employer_name}</p>
            <p className="text-xs text-muted-foreground truncate">{learner.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          {learner.category && (
            <Badge 
              className="text-xs"
              style={{ backgroundColor: learner.category.color + '20', color: learner.category.color }}
            >
              {learner.category.name}
            </Badge>
          )}
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compliance</span>
            <span className="font-medium">{(learner.compliance_score || 0).toFixed(0)}%</span>
          </div>
          <Progress value={learner.compliance_score || 0} className="h-1" />
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Award className="w-3 h-3" />
            <span>{learner.achievements?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>{learner.feedback_submissions?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Upload className="w-3 h-3" />
            <span>{learner.documents?.length || 0}</span>
          </div>
        </div>

        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              openLearnerProfile(learner);
            }}
          >
            View Profile
          </Button>
          <Select onValueChange={(value) => assignLearnerToCategory(learner.id, value)}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading learners...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-muted-foreground">Manage all learners and their categories</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="w-full sm:w-auto"
          >
            {viewMode === 'list' ? <Grid3x3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {viewMode === 'list' ? 'Kanban' : 'List'}
          </Button>
          
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category Name</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCategory}>Create Category</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search learners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLearners.map(learner => (
            <LearnerCard key={learner.id} learner={learner} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Uncategorized */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-muted-foreground">Uncategorized</h3>
            <div className="space-y-3">
              {filteredLearners.filter(l => !l.category).map(learner => (
                <LearnerCard key={learner.id} learner={learner} />
              ))}
            </div>
          </div>
          
          {/* Categories */}
          {categories.map(category => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredLearners.filter(l => l.category?.id === category.id).length}
                </Badge>
              </div>
              <div className="space-y-3">
                {filteredLearners.filter(l => l.category?.id === category.id).map(learner => (
                  <LearnerCard key={learner.id} learner={learner} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Learner Profile Dialog */}
      <Dialog open={showLearnerProfile} onOpenChange={setShowLearnerProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedLearner?.avatar_url || ''} alt={selectedLearner?.full_name} />
                <AvatarFallback>
                  {selectedLearner?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{selectedLearner?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedLearner?.email}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowMessageDialog(true);
                }}
                className="ml-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedLearner && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="cv">CV</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.phone_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.address || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Date of Birth:</span>
                        <span className="text-sm ml-2">{selectedLearner.date_of_birth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Gender:</span>
                        <span className="text-sm ml-2">{selectedLearner.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Race:</span>
                        <span className="text-sm ml-2">{selectedLearner.race || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Nationality:</span>
                        <span className="text-sm ml-2">{selectedLearner.nationality || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Area of Residence:</span>
                        <span className="text-sm ml-2">{selectedLearner.area_of_residence || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Languages:</span>
                        <span className="text-sm ml-2">
                          {selectedLearner.languages && selectedLearner.languages.length > 0 
                            ? selectedLearner.languages.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium">ID Number:</span>
                        <span className="text-sm ml-2">{selectedLearner.id_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Program:</span>
                        <span className="text-sm ml-2">{selectedLearner.learnership_program || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Employer:</span>
                        <span className="text-sm ml-2">{selectedLearner.employer_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Start Date:</span>
                        <span className="text-sm ml-2">{selectedLearner.start_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">End Date:</span>
                        <span className="text-sm ml-2">{selectedLearner.end_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Has Disability:</span>
                        <span className="text-sm ml-2">{selectedLearner.has_disability ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedLearner.has_disability && selectedLearner.disability_description && (
                        <div>
                          <span className="text-sm font-medium">Disability Description:</span>
                          <span className="text-sm ml-2">{selectedLearner.disability_description}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium">Has Driver's License:</span>
                        <span className="text-sm ml-2">{selectedLearner.has_drivers_license ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedLearner.has_drivers_license && selectedLearner.license_codes && selectedLearner.license_codes.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">License Codes:</span>
                          <span className="text-sm ml-2">{selectedLearner.license_codes.join(', ')}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium">Has Own Transport:</span>
                        <span className="text-sm ml-2">{selectedLearner.has_own_transport ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Emergency Contact:</span>
                      <span className="text-sm ml-2">{selectedLearner.emergency_contact || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Emergency Phone:</span>
                      <span className="text-sm ml-2">{selectedLearner.emergency_phone || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Transport Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transport Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Has Own Transport:</span>
                      <span className="text-sm ml-2">{selectedLearner.has_own_transport ? 'Yes' : 'No'}</span>
                    </div>
                    {!selectedLearner.has_own_transport && selectedLearner.public_transport_types && selectedLearner.public_transport_types.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Public Transport Types:</span>
                        <span className="text-sm ml-2">{selectedLearner.public_transport_types.join(', ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Receives Stipend:</span>
                      <span className="text-sm ml-2">{selectedLearner.receives_stipend ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedLearner.receives_stipend && selectedLearner.stipend_amount && (
                      <div>
                        <span className="text-sm font-medium">Stipend Amount:</span>
                        <span className="text-sm ml-2">R{selectedLearner.stipend_amount}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Compliance Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Compliance Score:</span>
                        <span className="text-lg font-bold text-primary">{(selectedLearner.compliance_score || 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedLearner.compliance_score || 0} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{selectedLearner.feedback_submissions?.length || 0}</div>
                          <div className="text-xs text-muted-foreground">Feedback Forms</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{selectedLearner.documents?.length || 0}</div>
                          <div className="text-xs text-muted-foreground">Documents</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{selectedLearner.achievements?.length || 0}</div>
                          <div className="text-xs text-muted-foreground">Achievements</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Feedback Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLearner.feedback_submissions?.map(submission => (
                        <div key={submission.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                              {new Date(submission.year, submission.month - 1).toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </span>
                            <Badge variant={
                              submission.status === 'submitted' ? 'default' :
                              submission.status === 'approved' ? 'secondary' :
                              submission.status === 'overdue' ? 'destructive' : 'outline'
                            }>
                              {submission.status}
                            </Badge>
                          </div>
                          {submission.submitted_at && (
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLearner.documents?.map(document => (
                        <div key={document.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-medium text-sm">{document.file_name}</p>
                            <p className="text-xs text-muted-foreground">{document.document_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {document.uploaded_at && new Date(document.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Achievements & Points
                      <Button
                        size="sm"
                        onClick={() => setShowPointsDialog(true)}
                        className="ml-auto"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Award Points
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold">Total Points</span>
                        <span className="text-3xl font-bold text-primary">{selectedLearner.points || 0}</span>
                      </div>
                      <Progress value={(selectedLearner.points || 0) / 10} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Points reflect performance and compliance</p>
                    </div>
                    <div className="space-y-3">
                      {selectedLearner.achievements?.map(achievement => (
                        <div key={achievement.id} className="flex items-center space-x-3 border rounded-lg p-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: achievement.badge_color || '#3B82F6' }}
                          >
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{achievement.badge_name}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {achievement.earned_at && new Date(achievement.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            +{achievement.points_awarded} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cv" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Published CVs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLearner.cvs?.filter(cv => cv.is_published).map(cv => (
                        <div key={cv.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-medium text-sm">{cv.cv_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated: {new Date(cv.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            View CV
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Message History
                      <Button
                        size="sm"
                        onClick={() => setShowMessageDialog(true)}
                        className="ml-auto"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send New Message
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {messageHistory.length > 0 ? (
                        messageHistory.map(message => (
                          <div key={message.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{message.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {message.message}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {message.isRead ? (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span className="text-xs">Read</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-orange-600">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span className="text-xs">Unread</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>
                                Sent: {new Date(message.created_at).toLocaleDateString()} at{' '}
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {message.read_at && (
                                <span>
                                  Read: {new Date(message.read_at).toLocaleDateString()} at{' '}
                                  {new Date(message.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No messages sent to this learner yet.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMessageDialog(true)}
                            className="mt-3"
                          >
                            Send First Message
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {selectedLearner?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={messageData.title}
                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter message subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Points to {selectedLearner?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Points to Award</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={pointsData.points}
                onChange={(e) => setPointsData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                placeholder="Enter points amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={pointsData.category} onValueChange={(value) => setPointsData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_award">Manual Award</SelectItem>
                  <SelectItem value="exceptional_performance">Exceptional Performance</SelectItem>
                  <SelectItem value="early_submission">Early Submission</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="initiative">Initiative</SelectItem>
                  <SelectItem value="compliance_bonus">Compliance Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={pointsData.reason}
                onChange={(e) => setPointsData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why these points are being awarded"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={awardPoints}>
                <Award className="w-4 h-4 mr-2" />
                Award Points
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnersManagement;