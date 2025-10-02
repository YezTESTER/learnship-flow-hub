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
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {year} Monthly Feedback Overview
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-muted-foreground">Submitted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-muted-foreground">Missing</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2.5">
          {months.map((monthName, index) => {
            const monthNum = index + 1;
            const status = getMonthStatus(monthNum);
            const isSelected = selectedMonth === monthNum;

            return (
              <button
                key={monthNum}
                onClick={() => onMonthClick(monthNum)}
                className={cn(
                  "relative px-3 py-3.5 rounded-md border transition-all duration-200",
                  "flex flex-col items-start justify-center gap-1",
                  "hover:shadow-sm active:scale-[0.98]",
                  getStatusColor(status),
                  isSelected && "ring-2 ring-primary shadow-sm scale-[1.02]"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  {getStatusIcon(status)}
                  <span className="font-medium text-sm">{monthName}</span>
                </div>
                {status?.hasSubmission && status.submittedAt && (
                  <span className="text-xs text-muted-foreground ml-7">
                    {new Date(status.submittedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
