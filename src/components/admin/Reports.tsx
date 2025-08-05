import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  FileText, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Award
} from 'lucide-react';

type Profile = Tables<'profiles'>;
type FeedbackSubmission = Tables<'feedback_submissions'>;
type Document = Tables<'documents'>;
type Achievement = Tables<'achievements'>;
type LearnerCategory = Tables<'learner_categories'>;

interface ExtendedProfile extends Profile {
  category?: LearnerCategory;
  feedback_submissions?: FeedbackSubmission[];
  documents?: Document[];
  achievements?: Achievement[];
  monthlyCompliance?: MonthlyComplianceData[];
}

interface MonthlyComplianceData {
  month: number;
  year: number;
  status: 'submitted' | 'approved' | 'overdue' | 'pending';
  submittedAt?: string;
  dueDate: string;
  onTime: boolean;
}

interface ComplianceStats {
  totalSubmissions: number;
  onTimeSubmissions: number;
  overdueSubmissions: number;
  pendingSubmissions: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
}

const Reports: React.FC = () => {
  const [learners, setLearners] = useState<ExtendedProfile[]>([]);
  const [categories, setCategories] = useState<LearnerCategory[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<ExtendedProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLearner, setSelectedLearner] = useState<ExtendedProfile | null>(null);
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
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
      // Fetch learners
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
        const enrichedLearners = await Promise.all(
          learnersData.map(async (learner) => {
            const [feedbackData, documentsData, achievementsData, assignmentData] = await Promise.all([
              supabase
                .from('feedback_submissions')
                .select('*')
                .eq('learner_id', learner.id)
                .order('year', { ascending: false })
                .order('month', { ascending: false }),
              supabase
                .from('documents')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('achievements')
                .select('*')
                .eq('learner_id', learner.id),
              supabase
                .from('learner_category_assignments')
                .select('*')
                .eq('learner_id', learner.id)
                .maybeSingle()
            ]);

            // Get category
            let category = null;
            if (assignmentData.data?.category_id) {
              const categoryResult = await supabase
                .from('learner_categories')
                .select('*')
                .eq('id', assignmentData.data.category_id)
                .maybeSingle();
              category = categoryResult.data;
            }

            // Calculate monthly compliance
            const monthlyCompliance = feedbackData.data?.map(submission => ({
              month: submission.month,
              year: submission.year,
              status: submission.status as any,
              submittedAt: submission.submitted_at,
              dueDate: submission.due_date,
              onTime: submission.submitted_at ? 
                new Date(submission.submitted_at) <= new Date(submission.due_date) : false
            })) || [];

            return {
              ...learner,
              feedback_submissions: feedbackData.data || [],
              documents: documentsData.data || [],
              achievements: achievementsData.data || [],
              category: category,
              monthlyCompliance
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
        description: "Failed to fetch reports data",
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

  const getComplianceStatus = (learner: ExtendedProfile) => {
    const score = learner.compliance_score || 0;
    if (score >= 80) return { status: 'good', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 60) return { status: 'warning', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { status: 'poor', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const calculateComplianceStats = (learner: ExtendedProfile): ComplianceStats => {
    const submissions = learner.feedback_submissions || [];
    const totalSubmissions = submissions.length;
    const onTimeSubmissions = submissions.filter(s => 
      s.submitted_at && new Date(s.submitted_at) <= new Date(s.due_date)
    ).length;
    const overdueSubmissions = submissions.filter(s => s.status === 'overdue').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    
    const averageScore = learner.compliance_score || 0;
    
    // Simple trend calculation based on recent submissions
    const recentSubmissions = submissions.slice(0, 3);
    const olderSubmissions = submissions.slice(3, 6);
    const recentOnTime = recentSubmissions.filter(s => 
      s.submitted_at && new Date(s.submitted_at) <= new Date(s.due_date)
    ).length;
    const olderOnTime = olderSubmissions.filter(s => 
      s.submitted_at && new Date(s.submitted_at) <= new Date(s.due_date)
    ).length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentSubmissions.length > 0 && olderSubmissions.length > 0) {
      const recentRate = recentOnTime / recentSubmissions.length;
      const olderRate = olderOnTime / olderSubmissions.length;
      if (recentRate > olderRate) trend = 'up';
      else if (recentRate < olderRate) trend = 'down';
    }

    return {
      totalSubmissions,
      onTimeSubmissions,
      overdueSubmissions,
      pendingSubmissions,
      averageScore,
      trend
    };
  };

  const openComplianceReport = (learner: ExtendedProfile) => {
    setSelectedLearner(learner);
    setComplianceStats(calculateComplianceStats(learner));
    setShowComplianceReport(true);
  };

  const generateReport = async () => {
    if (!selectedLearner) return;
    
    // This would typically generate a PDF or export data
    toast({
      title: "Report Generated",
      description: `Compliance report for ${selectedLearner.full_name} has been generated`,
    });
  };

  const LearnerCard = ({ learner }: { learner: ExtendedProfile }) => {
    const compliance = getComplianceStatus(learner);
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
          compliance.status === 'poor' ? 'border-red-500 bg-red-50' : ''
        }`}
        onClick={() => openComplianceReport(learner)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={learner.avatar_url || ''} alt={learner.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {learner.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm truncate ${
                compliance.status === 'poor' ? 'text-red-700' : ''
              }`}>
                {learner.full_name}
                {compliance.status === 'poor' && (
                  <AlertTriangle className="w-4 h-4 text-red-500 inline ml-2" />
                )}
              </h3>
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
              <span className="text-muted-foreground">Compliance Score</span>
              <span className={`font-medium ${compliance.textColor}`}>
                {(learner.compliance_score || 0).toFixed(0)}%
              </span>
            </div>
            <Progress value={learner.compliance_score || 0} className="h-2" />
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{learner.feedback_submissions?.length || 0} reports</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>{learner.points || 0} pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Compliance Reports</h2>
          <p className="text-muted-foreground">Monitor learner compliance and generate reports</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Learners</p>
                <p className="text-2xl font-bold">{filteredLearners.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Good Compliance</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLearners.filter(l => (l.compliance_score || 0) >= 80).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredLearners.filter(l => (l.compliance_score || 0) >= 60 && (l.compliance_score || 0) < 80).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Poor Compliance</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredLearners.filter(l => (l.compliance_score || 0) < 60).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learners by Category */}
      <div className="space-y-6">
        {/* Uncategorized Learners */}
        {filteredLearners.filter(l => !l.category).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Uncategorized</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLearners.filter(l => !l.category).map(learner => (
                <LearnerCard key={learner.id} learner={learner} />
              ))}
            </div>
          </div>
        )}
        
        {/* Categorized Learners */}
        {categories.map(category => {
          const categoryLearners = filteredLearners.filter(l => l.category?.id === category.id);
          if (categoryLearners.length === 0) return null;
          
          return (
            <div key={category.id}>
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {categoryLearners.length} learners
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryLearners.map(learner => (
                  <LearnerCard key={learner.id} learner={learner} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Report Dialog */}
      <Dialog open={showComplianceReport} onOpenChange={setShowComplianceReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedLearner?.avatar_url || ''} alt={selectedLearner?.full_name} />
                  <AvatarFallback>
                    {selectedLearner?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedLearner?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Compliance Report</p>
                </div>
              </div>
              <Button size="sm" onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedLearner && complianceStats && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="monthly">Monthly Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {complianceStats.averageScore.toFixed(0)}%
                        </p>
                        <Progress value={complianceStats.averageScore} className="mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Reports</p>
                        <p className="text-2xl font-bold">{complianceStats.totalSubmissions}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">On Time</p>
                        <p className="text-2xl font-bold text-green-600">{complianceStats.onTimeSubmissions}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{complianceStats.overdueSubmissions}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Compliance Trend</span>
                      {complianceStats.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                      {complianceStats.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {complianceStats.trend === 'stable' && <span className="text-yellow-500">→</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {complianceStats.trend === 'up' && 'Compliance is improving'}
                      {complianceStats.trend === 'down' && 'Compliance is declining'}
                      {complianceStats.trend === 'stable' && 'Compliance is stable'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Compliance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLearner.monthlyCompliance?.map((month, index) => (
                        <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due: {new Date(month.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              month.status === 'submitted' || month.status === 'approved' ? 'default' :
                              month.status === 'overdue' ? 'destructive' : 'outline'
                            }>
                              {month.status}
                            </Badge>
                            {month.onTime && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
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
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{document.file_name}</p>
                              <p className="text-xs text-muted-foreground">{document.document_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {document.uploaded_at && new Date(document.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
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
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;