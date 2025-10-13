import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  FileText, 
  Download,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from "sonner";

type Profile = Tables<'profiles'>;

interface TimesheetSubmission {
  id: string;
  schedule_id: string;
  file_name: string;
  file_path: string;
  absent_days?: number;
  uploaded_at: string;
}

interface ExtendedTimesheetSchedule {
  id: string;
  learner_id: string;
  month: number;
  year: number;
  period: number;
  work_timesheet_uploaded: boolean;
  class_timesheet_uploaded: boolean;
  due_date: string;
  uploaded_at: string | null;
  created_at: string;
  learner?: Profile;
  submission?: TimesheetSubmission;
}

const AdminTimesheets: React.FC = () => {
  const [learners, setLearners] = useState<Profile[]>([]);
  const [timesheetSchedules, setTimesheetSchedules] = useState<ExtendedTimesheetSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ExtendedTimesheetSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    filterSchedules();
  }, [timesheetSchedules, searchTerm, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching learners...');
      
      // Fetch all learners with full profile data (like other admin components)
      const { data: learnersData, error: learnersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'learner')
        .order('full_name');
      
      if (learnersError) throw learnersError;
      
      console.log('Fetched learners:', learnersData?.length || 0);
      
      if (learnersData) {
        setLearners(learnersData);
        
        console.log('Fetching timesheet schedules for year:', selectedYear);
        
        // Fetch timesheet schedules for all learners for the selected year
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('timesheet_schedules')
          .select('*')
          .in('learner_id', learnersData.map(l => l.id))
          .eq('year', selectedYear)
          .order('month', { ascending: false })
          .order('period', { ascending: false });
        
        if (schedulesError) throw schedulesError;
        
        console.log('Fetched schedules:', schedulesData?.length || 0);
        
        // Fetch submissions for these schedules
        if (schedulesData && schedulesData.length > 0) {
          const scheduleIds = schedulesData.map(s => s.id);
          
          console.log('Fetching submissions for schedule IDs:', scheduleIds.length);
          
          // Using raw SQL since timesheet_submissions is not in the generated types
          const { data: submissionsData, error: submissionsError }: any = await (supabase as any)
            .from('timesheet_submissions')
            .select('*')
            .in('schedule_id', scheduleIds);
          
          if (submissionsError) throw submissionsError;
          
          console.log('Fetched submissions:', submissionsData?.length || 0);
          
          // Combine schedules with learner info and submissions
          const enrichedSchedules = schedulesData.map(schedule => {
            const learner = learnersData.find(l => l.id === schedule.learner_id);
            const submission = submissionsData?.find((s: any) => s.schedule_id === schedule.id);
            
            console.log('Processing schedule:', schedule.id, 'learner found:', !!learner, 'submission found:', !!submission);
            
            return {
              ...schedule,
              learner: learner || undefined,
              submission: submission || undefined
            };
          });
          
          console.log('Setting timesheet schedules:', enrichedSchedules.length);
          setTimesheetSchedules(enrichedSchedules);
        } else {
          console.log('No schedules found, setting empty array');
          setTimesheetSchedules([]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timesheet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = timesheetSchedules;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.learner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply month filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(schedule => schedule.month === selectedMonth);
    }
    
    setFilteredSchedules(filtered);
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 2; year--) {
      years.push(year);
    }
    return years;
  };

  const getMonthName = (month: number) => {
    return new Date(2023, month - 1).toLocaleString('default', { month: 'long' });
  };

  const handleViewTimesheet = async (submission: TimesheetSubmission) => {
    try {
      const { data, error } = await supabase.storage
        .from('office-documents')
        .download(submission.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error viewing timesheet:', err);
      toast.error("Could not load document.");
    }
  };

  const handleDownloadTimesheet = async (submission: TimesheetSubmission) => {
    try {
      const { data, error } = await supabase.storage
        .from('office-documents')
        .download(submission.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = submission.file_name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const getSubmissionStatus = (schedule: ExtendedTimesheetSchedule) => {
    if (schedule.submission) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="w-3 h-3 mr-1" />
        Submitted
      </Badge>;
    }
    
    const dueDate = new Date(schedule.due_date);
    const isOverdue = dueDate < new Date();
    
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <AlertCircle className="w-3 h-3 mr-1" />
        Overdue
      </Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-8800 hover:bg-yellow-100">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>;
  };

  const getAbsentDaysInfo = (schedule: ExtendedTimesheetSchedule) => {
    if (!schedule.submission || schedule.submission.absent_days === undefined) {
      return null;
    }
    
    if (schedule.submission.absent_days === 0) {
      return (
        <div className="mt-2 flex items-center text-sm">
          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
          <span className="font-medium text-green-600">Perfect Attendance (+10 pts)</span>
        </div>
      );
    }
    
    return (
      <div className="mt-2 flex items-center text-sm text-gray-600">
        <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
        <span>Absent: {schedule.submission.absent_days} day(s)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Learner Timesheet Submissions</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </Button>
        </div>
      </div>
      <p className="text-gray-600">View and manage all Timesheet Submissions</p>

      {/* Filters */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search learners..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedMonth === 'all' ? 'all' : selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => 12 - i).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredSchedules.filter(s => s.submission).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredSchedules.filter(s => 
                    s.submission && 
                    s.submission.uploaded_at && 
                    new Date(s.submission.uploaded_at) <= new Date(s.due_date)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredSchedules.filter(s => 
                    !s.submission && 
                    new Date(s.due_date) >= new Date()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredSchedules.filter(s => 
                    !s.submission && 
                    new Date(s.due_date) < new Date()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet List */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            All Timesheet Submissions ({filteredSchedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No timesheets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learner
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => (
                    <tr key={`${schedule.id}-${schedule.learner?.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={schedule.learner?.avatar_url || ''} />
                            <AvatarFallback>
                              {schedule.learner?.full_name?.split(' ').map(n => n[0]).join('') || 'L'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.learner?.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getMonthName(schedule.month)} {schedule.year} - Period {schedule.period}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMonthName(schedule.month)} {schedule.year}
                        </div>
                        <div className="text-sm text-gray-500">
                          Period {schedule.period}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(schedule.due_date).toLocaleDateString()}
                        </div>
                        {schedule.submission && (
                          <div className="text-sm text-gray-500">
                            Uploaded: {new Date(schedule.submission.uploaded_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getSubmissionStatus(schedule)}
                          {schedule.submission && schedule.submission.absent_days === 0 && (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                          )}
                        </div>
                        {schedule.submission && schedule.submission.absent_days !== undefined && schedule.submission.absent_days > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            Absent: {schedule.submission.absent_days} day(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {schedule.submission ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTimesheet(schedule.submission!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadTimesheet(schedule.submission!)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500">No submission</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTimesheets;