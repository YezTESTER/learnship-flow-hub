import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthStatus {
  month: number;
  hasSubmission: boolean;
  status?: 'submitted' | 'approved' | 'pending' | 'overdue';
  submittedAt?: string;
}

interface YearlyFeedbackOverviewProps {
  year: number;
  monthStatuses: MonthStatus[];
  onMonthClick: (month: number) => void;
  selectedMonth?: number;
}

export const YearlyFeedbackOverview: React.FC<YearlyFeedbackOverviewProps> = ({
  year,
  monthStatuses,
  onMonthClick,
  selectedMonth
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthStatus = (monthNum: number) => {
    return monthStatuses.find(m => m.month === monthNum);
  };

  const getStatusIcon = (status: MonthStatus | undefined) => {
    if (!status || !status.hasSubmission) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    
    switch (status.status) {
      case 'submitted':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getStatusColor = (status: MonthStatus | undefined) => {
    if (!status || !status.hasSubmission) {
      return 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10';
    }
    
    switch (status.status) {
      case 'submitted':
      case 'approved':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      case 'overdue':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      default:
        return 'border-green-200 bg-green-50 hover:bg-green-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {year} Monthly Feedback Overview
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Submitted</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Missing</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map((monthName, index) => {
            const monthNum = index + 1;
            const status = getMonthStatus(monthNum);
            const isSelected = selectedMonth === monthNum;

            return (
              <button
                key={monthNum}
                onClick={() => onMonthClick(monthNum)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200",
                  "flex flex-col items-center justify-center gap-2",
                  "hover:scale-105 hover:shadow-md",
                  getStatusColor(status),
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="font-medium text-sm">{monthName}</span>
                </div>
                {status?.hasSubmission && status.submittedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(status.submittedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
                {isSelected && (
                  <Badge variant="default" className="absolute -top-2 -right-2 text-xs">
                    Selected
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
