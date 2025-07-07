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
  MapPin
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
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', description: '' });
  const [messageData, setMessageData] = useState({ title: '', message: '' });
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
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const openLearnerProfile = (learner: ExtendedProfile) => {
    setSelectedLearner(learner);
    setShowLearnerProfile(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Learners Management</h2>
          <p className="text-muted-foreground">Manage all learners and their categories</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
          >
            {viewMode === 'list' ? <Grid3x3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {viewMode === 'list' ? 'Kanban' : 'List'}
          </Button>
          
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
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
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="cv">CV</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                    </div>
                    <div className="space-y-2">
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
                    <CardTitle>Achievements & Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Points</span>
                        <span className="text-2xl font-bold text-primary">{selectedLearner.points || 0}</span>
                      </div>
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
    </div>
  );
};

export default LearnersManagement;