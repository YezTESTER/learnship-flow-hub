import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, Star, Award } from 'lucide-react';

interface MonthlyComplianceData {
  id: string;
  month: number;
  year: number;
  feedback_score: number;
  timesheet_score: number;
  document_score: number;
  engagement_score: number;
  overall_compliance_percent: number;
  feedback_points: number;
  timesheet_points: number;
  document_points: number;
  engagement_points: number;
  total_monthly_points: number;
}

interface MonthlyComplianceCardsProps {
  monthlyHistory: MonthlyComplianceData[];
  lifetimePoints: number;
}

const MonthlyComplianceCards: React.FC<MonthlyComplianceCardsProps> = ({
  monthlyHistory,
  lifetimePoints
}) => {
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getTrendIcon = (currentScore: number, previousScore: number | null) => {
    if (!previousScore) return <Minus className="h-4 w-4" />;
    if (currentScore > previousScore) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (currentScore < previousScore) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Lifetime Score Card */}
      <Card className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white border-0 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              Overall Lifetime Score
            </span>
            <Star className="h-8 w-8" />
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-6xl font-bold">{lifetimePoints.toLocaleString()}</span>
            <span className="text-2xl text-white/80">points</span>
          </div>
          <p className="text-white/90 text-sm">
            Your cumulative achievement points earned throughout your learnership journey.
          </p>
        </CardContent>
      </Card>

      {/* Monthly Compliance History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Compliance Tracking (Last 3 Months)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthlyHistory.map((monthData, index) => {
            const previousMonth = monthlyHistory[index + 1];
            const trend = getTrendIcon(
              monthData.overall_compliance_percent,
              previousMonth?.overall_compliance_percent || null
            );

            return (
              <Card
                key={monthData.id}
                className="hover:shadow-xl transition-all duration-300 border-2"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="font-semibold">
                      {getMonthName(monthData.month)} {monthData.year}
                    </span>
                    <div className="flex items-center gap-1">
                      {trend}
                      <Badge
                        variant="secondary"
                        className={`bg-gradient-to-r ${getComplianceColor(monthData.overall_compliance_percent)} text-white border-0`}
                      >
                        {monthData.overall_compliance_percent.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Overall Compliance</span>
                      <span className="text-muted-foreground">
                        {monthData.overall_compliance_percent.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={monthData.overall_compliance_percent}
                      className="h-3"
                    />
                  </div>

                  {/* Points Breakdown */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Points Earned</span>
                      <Badge variant="outline" className="font-bold">
                        {monthData.total_monthly_points}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Feedback:</span>
                        <span className="font-medium">{monthData.feedback_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timesheets:</span>
                        <span className="font-medium">{monthData.timesheet_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Documents:</span>
                        <span className="font-medium">{monthData.document_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engagement:</span>
                        <span className="font-medium">{monthData.engagement_points}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Feedback</span>
                      <span className="font-medium">{monthData.feedback_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Timesheets</span>
                      <span className="font-medium">{monthData.timesheet_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Documents</span>
                      <span className="font-medium">{monthData.document_score.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-medium">{monthData.engagement_score.toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyComplianceCards;
