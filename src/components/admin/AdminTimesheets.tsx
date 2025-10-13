import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  ExternalLink,
  MoreHorizontal,
  Check,
  X,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BarChart3,
  Users,
  AlertTriangle,
  Lock
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
  expiration_date?: string;
  download_count?: number;
  is_expired?: boolean;
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
  const [sortBy, setSortBy] = useState<'learner' | 'date' | 'status' | 'absent'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'submitted' | 'pending' | 'overdue' | 'expired'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [absentDaysFilter, setAbsentDaysFilter] = useState<'all' | '0' | '1+' | 'none'>('all');

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    filterAndSortSchedules();
  }, [timesheetSchedules, searchTerm, selectedMonth, selectedStatus, absentDaysFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Update select all state when filtered schedules change
    if (selectedItems.length === filteredSchedules.length && filteredSchedules.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, filteredSchedules]);

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

  const filterAndSortSchedules = () => {
    let filtered = [...timesheetSchedules];
    
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
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(schedule => {
        // Check if timesheet is expired
        const isExpired = schedule.submission?.is_expired || 
          (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
        
        if (selectedStatus === 'expired') {
          return isExpired;
        } else if (selectedStatus === 'submitted') {
          return !!schedule.submission && !isExpired;
        } else if (selectedStatus === 'pending') {
          return !schedule.submission && new Date(schedule.due_date) >= new Date();
        } else if (selectedStatus === 'overdue') {
          return !schedule.submission && new Date(schedule.due_date) < new Date();
        }
        return true;
      });
    }
    
    // Apply absent days filter
    if (absentDaysFilter !== 'all') {
      filtered = filtered.filter(schedule => {
        if (!schedule.submission) return absentDaysFilter === 'none';
        if (absentDaysFilter === '0') return schedule.submission.absent_days === 0;
        if (absentDaysFilter === '1+') return (schedule.submission.absent_days || 0) > 0;
        if (absentDaysFilter === 'none') return schedule.submission.absent_days === undefined;
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'learner':
          const nameA = a.learner?.full_name?.toLowerCase() || '';
          const nameB = b.learner?.full_name?.toLowerCase() || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'status':
          const statusA = getSubmissionStatusValue(a);
          const statusB = getSubmissionStatusValue(b);
          comparison = statusA - statusB;
          break;
        case 'absent':
          const absentA = a.submission?.absent_days || 0;
          const absentB = b.submission?.absent_days || 0;
          comparison = absentA - absentB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredSchedules(filtered);
  };

  const getSubmissionStatusValue = (schedule: ExtendedTimesheetSchedule): number => {
    // Check if timesheet is expired
    const isExpired = schedule.submission?.is_expired || 
      (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
    
    if (isExpired) return 4; // Expired
    if (schedule.submission) return 1; // Submitted
    const dueDate = new Date(schedule.due_date);
    const isOverdue = dueDate < new Date();
    return isOverdue ? 3 : 2; // Overdue: 3, Pending: 2
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
    // Check if timesheet is expired
    const isExpired = submission.is_expired || 
      (submission.expiration_date && new Date(submission.expiration_date) < new Date());
    
    if (isExpired) {
      toast.error("This timesheet has expired and is no longer available for viewing.");
      return;
    }
    
    // Check if file path exists
    if (!submission.file_path) {
      toast.error("Timesheet file is no longer available.");
      return;
    }
    
    try {
      // Increment download count
      await (supabase as any).rpc('increment_timesheet_download', {
        schedule_id: submission.schedule_id
      });
      
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
    // Check if timesheet is expired
    const isExpired = submission.is_expired || 
      (submission.expiration_date && new Date(submission.expiration_date) < new Date());
    
    if (isExpired) {
      toast.error("This timesheet has expired and is no longer available for download.");
      return;
    }
    
    // Check if file path exists
    if (!submission.file_path) {
      toast.error("Timesheet file is no longer available.");
      return;
    }
    
    try {
      // Increment download count
      await (supabase as any).rpc('increment_timesheet_download', {
        schedule_id: submission.schedule_id
      });
      
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
    // Check if timesheet is expired
    const isExpired = schedule.submission?.is_expired || 
      (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
    
    if (isExpired) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        <Lock className="w-3 h-3 mr-1" />
        Expired
      </Badge>;
    }
    
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
    
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>;
  };

  const getAbsentDaysInfo = (schedule: ExtendedTimesheetSchedule) => {
    // Check if timesheet is expired
    const isExpired = schedule.submission?.is_expired || 
      (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
    
    if (isExpired) {
      return <span className="text-gray-400 italic">Expired</span>;
    }
    
    if (!schedule.submission || schedule.submission.absent_days === undefined) {
      return <span className="text-gray-500">N/A</span>;
    }
    
    if (schedule.submission.absent_days === 0) {
      return (
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
          <span className="font-medium text-green-600">0 days</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-orange-600">
        <AlertCircle className="w-4 h-4 mr-1" />
        <span>{schedule.submission.absent_days} day(s)</span>
      </div>
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredSchedules.map(schedule => schedule.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const exportSelectedData = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one timesheet to export');
      return;
    }
    
    const selectedSchedules = filteredSchedules.filter(schedule => selectedItems.includes(schedule.id));
    const csvContent = [
      ['Learner Name', 'Email', 'Month', 'Year', 'Period', 'Due Date', 'Submitted Date', 'Status', 'Absent Days', 'Expiration Date', 'Download Count'],
      ...selectedSchedules.map(schedule => {
        // Check if timesheet is expired
        const isExpired = schedule.submission?.is_expired || 
          (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
        
        return [
          schedule.learner?.full_name || '',
          schedule.learner?.email || '',
          getMonthName(schedule.month),
          schedule.year.toString(),
          schedule.period.toString(),
          new Date(schedule.due_date).toLocaleDateString(),
          schedule.submission ? new Date(schedule.submission.uploaded_at).toLocaleDateString() : '',
          isExpired ? 'Expired' : (schedule.submission ? 'Submitted' : new Date(schedule.due_date) < new Date() ? 'Overdue' : 'Pending'),
          schedule.submission?.absent_days?.toString() || '',
          schedule.submission?.expiration_date ? new Date(schedule.submission.expiration_date).toLocaleDateString() : '',
          schedule.submission?.download_count?.toString() || '0'
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedItems.length} timesheet records`);
  };

  const exportAllData = () => {
    const csvContent = [
      ['Learner Name', 'Email', 'Month', 'Year', 'Period', 'Due Date', 'Submitted Date', 'Status', 'Absent Days', 'Expiration Date', 'Download Count'],
      ...filteredSchedules.map(schedule => {
        // Check if timesheet is expired
        const isExpired = schedule.submission?.is_expired || 
          (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
        
        return [
          schedule.learner?.full_name || '',
          schedule.learner?.email || '',
          getMonthName(schedule.month),
          schedule.year.toString(),
          schedule.period.toString(),
          new Date(schedule.due_date).toLocaleDateString(),
          schedule.submission ? new Date(schedule.submission.uploaded_at).toLocaleDateString() : '',
          isExpired ? 'Expired' : (schedule.submission ? 'Submitted' : new Date(schedule.due_date) < new Date() ? 'Overdue' : 'Pending'),
          schedule.submission?.absent_days?.toString() || '',
          schedule.submission?.expiration_date ? new Date(schedule.submission.expiration_date).toLocaleDateString() : '',
          schedule.submission?.download_count?.toString() || '0'
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_timesheets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredSchedules.length} timesheet records`);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredSchedules.length;
    const submitted = filteredSchedules.filter(s => {
      const isExpired = s.submission?.is_expired || 
        (s.submission?.expiration_date && new Date(s.submission.expiration_date) < new Date());
      return s.submission && !isExpired;
    }).length;
    const pending = filteredSchedules.filter(s => !s.submission && new Date(s.due_date) >= new Date()).length;
    const overdue = filteredSchedules.filter(s => !s.submission && new Date(s.due_date) < new Date()).length;
    const expired = filteredSchedules.filter(s => {
      const isExpired = s.submission?.is_expired || 
        (s.submission?.expiration_date && new Date(s.submission.expiration_date) < new Date());
      return s.submission && isExpired;
    }).length;
    const perfectAttendance = filteredSchedules.filter(s => s.submission?.absent_days === 0).length;
    
    return {
      total,
      submitted,
      pending,
      overdue,
      expired,
      perfectAttendance,
      submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0
    };
  }, [filteredSchedules]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Learner Timesheet Submissions</h2>
          <p className="text-gray-600">View and manage all Timesheet Submissions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-800">{summaryStats.total}</p>
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
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-gray-800">{summaryStats.submitted}</p>
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
                <p className="text-2xl font-bold text-gray-800">{summaryStats.pending}</p>
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
                <p className="text-2xl font-bold text-gray-800">{summaryStats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Lock className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-800">{summaryStats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Perfect Attendance</p>
                <p className="text-2xl font-bold text-gray-800">{summaryStats.perfectAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
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
            
            <div className="flex flex-wrap gap-2">
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
              
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={absentDaysFilter} 
                onValueChange={(value) => setAbsentDaysFilter(value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Absent Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Absent Days</SelectItem>
                  <SelectItem value="0">Perfect Attendance</SelectItem>
                  <SelectItem value="1+">1+ Absent Days</SelectItem>
                  <SelectItem value="none">No Record</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Due Date (Newest)
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Due Date (Oldest)
                    </div>
                  </SelectItem>
                  <SelectItem value="learner-asc">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Learner (A-Z)
                    </div>
                  </SelectItem>
                  <SelectItem value="learner-desc">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Learner (Z-A)
                    </div>
                  </SelectItem>
                  <SelectItem value="status-asc">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Status (Pending first)
                    </div>
                  </SelectItem>
                  <SelectItem value="status-desc">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Status (Submitted first)
                    </div>
                  </SelectItem>
                  <SelectItem value="absent-asc">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Absent Days (Lowest)
                    </div>
                  </SelectItem>
                  <SelectItem value="absent-desc">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Absent Days (Highest)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
              <div className="flex items-center text-sm text-gray-600">
                <span>{selectedItems.length} selected</span>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="ml-2 h-6 px-2">
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={exportSelectedData}>
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timesheet List */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            All Timesheet Submissions ({filteredSchedules.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportAllData}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learner
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent Days
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => {
                    // Check if timesheet is expired
                    const isExpired = schedule.submission?.is_expired || 
                      (schedule.submission?.expiration_date && new Date(schedule.submission.expiration_date) < new Date());
                    
                    return (
                      <tr 
                        key={`${schedule.id}-${schedule.learner?.id}`} 
                        className={`hover:bg-gray-50 ${selectedItems.includes(schedule.id) ? 'bg-blue-50' : ''} ${isExpired ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Checkbox
                            checked={selectedItems.includes(schedule.id)}
                            onCheckedChange={() => toggleSelectItem(schedule.id)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={schedule.learner?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {schedule.learner?.full_name?.split(' ').map(n => n[0]).join('') || 'L'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
                                {schedule.learner?.full_name}
                              </div>
                              <div className="text-xs text-gray-500 max-w-[150px] truncate">
                                {schedule.learner?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getMonthName(schedule.month)} {schedule.year}
                          </div>
                          <div className="text-xs text-gray-500">
                            Period {schedule.period}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(schedule.due_date).toLocaleDateString()}
                          </div>
                          {schedule.submission && (
                            <div className="text-xs text-gray-500">
                              Uploaded: {new Date(schedule.submission.uploaded_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getSubmissionStatus(schedule)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getAbsentDaysInfo(schedule)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {schedule.submission ? (
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewTimesheet(schedule.submission!)}
                                disabled={isExpired || !schedule.submission.file_path}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadTimesheet(schedule.submission!)}
                                disabled={isExpired || !schedule.submission.file_path}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">No submission</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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