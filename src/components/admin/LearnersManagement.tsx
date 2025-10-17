import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Clock,
  Download,
  Eye
} from 'lucide-react';
import { AdminCVPreviewDialog } from './AdminCVPreviewDialog';
import { adminPdfGenerator } from '@/lib/adminPdfGenerator';
import { CVData } from '../cv/CVBuilder';

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

interface LearnersManagementProps {
  isMentorView?: boolean;
}

const LearnersManagement: React.FC<LearnersManagementProps> = ({ isMentorView = false }) => {
  const { profile } = useAuth();
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
  const [showCVPreview, setShowCVPreview] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null);
  const [isGeneratingProfilePDF, setIsGeneratingProfilePDF] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLearners();
  }, [learners, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      let learnersQuery = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'learner');

      // If this is a mentor view, only fetch learners assigned to this mentor
      if (isMentorView && profile?.id) {
        learnersQuery = learnersQuery.eq('mentor_id', profile.id);
      }

      // First fetch learners with their related data
      const { data: learnersData } = await learnersQuery;

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
      const { data, error } = await supabase
        .from('learner_categories')
        .insert([{
          name: newCategory.name,
          color: newCategory.color,
          description: newCategory.description,
          created_by: profile?.id || '' // Add required field
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategory({ name: '', color: '#3B82F6', description: '' });
      setShowCategoryDialog(false);
      toast({
        title: "Success",
        description: "Category created successfully"
      });
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
      if (categoryId === 'none') {
        // Remove category assignment
        const { error } = await supabase
          .from('learner_category_assignments')
          .delete()
          .eq('learner_id', learnerId);

        if (error) throw error;
      } else {
        // Update or create category assignment
        const { error } = await supabase
          .from('learner_category_assignments')
          .upsert({
            learner_id: learnerId,
            category_id: categoryId,
            assigned_by: profile?.id || '', // Add required field
            assigned_at: new Date().toISOString() // Add required field
          }, {
            onConflict: 'learner_id'
          });

        if (error) throw error;
      }

      // Refresh data to show updated category
      fetchData();
      toast({
        title: "Success",
        description: "Learner category updated"
      });
    } catch (error) {
      console.error('Error assigning category:', error);
      toast({
        title: "Error",
        description: "Failed to update learner category",
        variant: "destructive"
      });
    }
  };

  const openLearnerProfile = (learner: ExtendedProfile) => {
    setSelectedLearner(learner);
    setShowLearnerProfile(true);
  };

  const sendMessageToLearner = async () => {
    if (!selectedLearner || !messageData.title.trim() || !messageData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all message fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: selectedLearner.id,
          title: messageData.title,
          message: messageData.message,
          type: 'message'
        }]);

      if (error) throw error;

      setMessageData({ title: '', message: '' });
      setShowMessageDialog(false);
      toast({
        title: "Success",
        description: "Message sent to learner"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const awardPoints = async () => {
    if (!selectedLearner || pointsData.points <= 0 || !pointsData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all point award fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points: (selectedLearner.points || 0) + pointsData.points 
        })
        .eq('id', selectedLearner.id);

      if (updateError) throw updateError;

      const { error: achievementError } = await supabase
        .from('achievements')
        .insert([{
          learner_id: selectedLearner.id,
          badge_type: pointsData.category,
          badge_name: pointsData.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: pointsData.reason,
          points_awarded: pointsData.points
        }]);

      if (achievementError) throw achievementError;

      // Refresh learner data
      fetchData();
      setPointsData({ points: 0, reason: '', category: 'manual_award' });
      setShowPointsDialog(false);
      toast({
        title: "Success",
        description: `Awarded ${pointsData.points} points to ${selectedLearner.full_name}`
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive"
      });
    }
  };

  const generateProfilePDF = async () => {
    if (!selectedLearner) return;
    
    setIsGeneratingProfilePDF(true);
    try {
      await adminPdfGenerator.generateProfilePDF(selectedLearner);
      toast({
        title: "Success",
        description: "Profile PDF generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingProfilePDF(false);
    }
  };

  const getMessageHistory = async (learnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', learnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessageHistory(data || []);
    } catch (error) {
      console.error('Error fetching message history:', error);
      setMessageHistory([]);
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
          
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Documents</span>
            <span className="font-medium">{learner.documents?.length || 0}</span>
          </div>
        </div>

        <div className="flex space-x-2 mt-3">
          <Button 
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isMentorView ? 'My Learners' : 'All Learners'}
          </h1>
          <p className="text-muted-foreground">
            {isMentorView 
              ? 'Manage learners assigned to you' 
              : 'Manage all learners and their categories'}
          </p>
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
              <Button size="sm" className="w-full sm:w-auto" disabled={isMentorView}>
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
                    placeholder="e.g., High Priority, At Risk"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{newCategory.color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
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
        <div className="space-y-6">
          {categories.filter(cat => 
            filteredLearners.some(l => l.category?.id === cat.id)
          ).map(category => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge 
                  className="text-sm py-1 px-3"
                  style={{ backgroundColor: category.color + '20', color: category.color }}
                >
                  {category.name}
                </Badge>
                <Badge variant="secondary">
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedLearner?.avatar_url || ''} alt={selectedLearner?.full_name} />
                  <AvatarFallback>
                    {selectedLearner?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl font-bold">{selectedLearner?.full_name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedLearner?.email}</p>
                </div>
              </div>
              
              <Button 
                onClick={generateProfilePDF} 
                disabled={isGeneratingProfilePDF}
                variant="outline"
                size="sm"
              >
                {isGeneratingProfilePDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          {selectedLearner && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.phone_number || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLearner.address || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedLearner.date_of_birth 
                            ? new Date(selectedLearner.date_of_birth).toLocaleDateString() 
                            : 'Not provided'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Program Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Learnership Program</p>
                        <p className="font-medium">{selectedLearner.learnership_program || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employer</p>
                        <p className="font-medium">{selectedLearner.employer_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Compliance Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={selectedLearner.compliance_score || 0} className="flex-1" />
                          <span className="text-sm font-medium w-10">{(selectedLearner.compliance_score || 0).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Points</p>
                        <p className="font-medium">{selectedLearner.points || 0} points</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold">{selectedLearner.documents?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedLearner.feedback_submissions?.filter(fs => fs.status === 'approved').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Approved Feedback</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Award className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                      <p className="text-2xl font-bold">{selectedLearner.achievements?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Achievements</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex space-x-2">
                  <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => getMessageHistory(selectedLearner.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message to {selectedLearner.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Subject</label>
                          <Input
                            value={messageData.title}
                            onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Message subject"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message</label>
                          <Textarea
                            value={messageData.message}
                            onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Your message..."
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={sendMessageToLearner}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={isMentorView}>
                        <Award className="w-4 h-4 mr-2" />
                        Award Points
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Award Points to {selectedLearner.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Points</label>
                          <Input
                            type="number"
                            value={pointsData.points}
                            onChange={(e) => setPointsData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Category</label>
                          <Select value={pointsData.category} onValueChange={(value) => setPointsData(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual_award">Manual Award</SelectItem>
                              <SelectItem value="early_submission">Early Submission</SelectItem>
                              <SelectItem value="excellent_performance">Excellent Performance</SelectItem>
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
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <div className="space-y-4">
                  {selectedLearner.documents && selectedLearner.documents.length > 0 ? (
                    selectedLearner.documents.map(document => (
                      <Card key={document.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="font-medium">{document.file_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(document.uploaded_at || '').toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const fileUrl = supabase.storage.from('documents').getPublicUrl(document.file_path).data.publicUrl;
                                window.open(fileUrl, '_blank');
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="mt-6">
                <div className="space-y-4">
                  {selectedLearner.feedback_submissions && selectedLearner.feedback_submissions.length > 0 ? (
                    selectedLearner.feedback_submissions.map(submission => (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {submission.month}/{submission.year} Feedback
                            </CardTitle>
                            <Badge 
                              variant={
                                submission.status === 'approved' ? 'secondary' :
                                submission.status === 'submitted' ? 'default' :
                                submission.status === 'overdue' ? 'destructive' : 'outline'
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Submitted:</span> 
                              {submission.submitted_at 
                                ? new Date(submission.submitted_at).toLocaleDateString() 
                                : 'Not yet submitted'}
                            </p>
                            {submission.mentor_rating && (
                              <p className="text-sm">
                                <span className="font-medium">Mentor Rating:</span> {submission.mentor_rating}/5
                              </p>
                            )}
                            {submission.mentor_feedback && (
                              <div>
                                <p className="font-medium text-sm">Mentor Feedback:</p>
                                <p className="text-sm text-muted-foreground">{submission.mentor_feedback}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No feedback submissions</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <div className="space-y-4">
                  {selectedLearner.achievements && selectedLearner.achievements.length > 0 ? (
                    selectedLearner.achievements.map(achievement => (
                      <Card key={achievement.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <div>
                              <p className="font-medium">{achievement.badge_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(achievement.earned_at || '').toLocaleDateString()} - 
                                {achievement.points_awarded} points
                              </p>
                              {achievement.description && (
                                <p className="text-sm mt-1">{achievement.description}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No achievements earned</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Message History Dialog */}
      <Dialog open={messageHistory.length > 0} onOpenChange={() => setMessageHistory([])}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {messageHistory.length > 0 ? (
              messageHistory.map(message => (
                <Card key={message.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{message.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{message.message}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No messages</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Points to {selectedLearner?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Points</label>
              <Input
                type="number"
                value={pointsData.points}
                onChange={(e) => setPointsData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={pointsData.category} onValueChange={(value) => setPointsData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_award">Manual Award</SelectItem>
                  <SelectItem value="early_submission">Early Submission</SelectItem>
                  <SelectItem value="excellent_performance">Excellent Performance</SelectItem>
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

      {/* CV Preview Dialog */}
      {selectedCV && (
        <AdminCVPreviewDialog
          open={showCVPreview}
          onOpenChange={setShowCVPreview}
          cv={selectedCV}
          learnerName={selectedLearner?.full_name || ''}
        />
      )}
    </div>
  );
};

export default LearnersManagement;