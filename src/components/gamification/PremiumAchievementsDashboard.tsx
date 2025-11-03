import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Award,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useMonthlyCompliance } from '@/hooks/useMonthlyCompliance';

interface Achievement {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string;
  points_awarded: number;
  earned_at: string;
  badge_color: string;
  badge_icon: string;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const PremiumAchievementsDashboard = () => {
  const { user } = useAuth();
  const { monthlyHistory, lifetimePoints, loading: complianceLoading } = useMonthlyCompliance();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('learner_id', user?.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const pointsByCategory = achievements.reduce((acc, achievement) => {
    const category = achievement.badge_type;
    acc[category] = (acc[category] || 0) + achievement.points_awarded;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(pointsByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  // Monthly points trend
  const monthlyPointsTrend = monthlyHistory.map(month => ({
    month: new Date(month.year, month.month - 1).toLocaleString('default', { month: 'short' }),
    points: month.total_monthly_points,
    compliance: month.overall_compliance_percent
  })).reverse();

  // Points by month for area chart
  const achievementsByMonth = achievements.reduce((acc, achievement) => {
    const date = new Date(achievement.earned_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + achievement.points_awarded;
    return acc;
  }, {} as Record<string, number>);

  const areaChartData = Object.entries(achievementsByMonth)
    .sort()
    .slice(-6)
    .map(([key, points]) => {
      const [year, month] = key.split('-');
      return {
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' }),
        points
      };
    });

  // Level calculation
  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 'Diamond', color: '#60A5FA', progress: 100 };
    if (points >= 500) return { level: 'Platinum', color: '#8B5CF6', progress: (points / 1000) * 100 };
    if (points >= 250) return { level: 'Gold', color: '#F59E0B', progress: (points / 500) * 100 };
    if (points >= 100) return { level: 'Silver', color: '#10B981', progress: (points / 250) * 100 };
    return { level: 'Bronze', color: '#6B7280', progress: (points / 100) * 100 };
  };

  const currentLevel = getLevel(lifetimePoints);
  const avgMonthlyPoints = monthlyHistory.length > 0
    ? Math.round(monthlyHistory.reduce((sum, m) => sum + m.total_monthly_points, 0) / monthlyHistory.length)
    : 0;

  if (loading || complianceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Points */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8" />
              <Trophy className="h-12 w-12 opacity-20" />
            </div>
            <div className="text-4xl font-bold mb-1">{lifetimePoints.toLocaleString()}</div>
            <div className="text-sm text-white/80">Total Points</div>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-8 w-8" />
              <Target className="h-12 w-12 opacity-20" />
            </div>
            <div className="text-4xl font-bold mb-1">{currentLevel.level}</div>
            <div className="text-sm text-white/80">Current Level</div>
            <Progress value={currentLevel.progress} className="mt-2 h-2 bg-white/20" />
          </CardContent>
        </Card>

        {/* Total Achievements */}
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8" />
              <Zap className="h-12 w-12 opacity-20" />
            </div>
            <div className="text-4xl font-bold mb-1">{achievements.length}</div>
            <div className="text-sm text-white/80">Achievements Unlocked</div>
          </CardContent>
        </Card>

        {/* Avg Monthly Points */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8" />
              <BarChart3 className="h-12 w-12 opacity-20" />
            </div>
            <div className="text-4xl font-bold mb-1">{avgMonthlyPoints}</div>
            <div className="text-sm text-white/80">Avg Monthly Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Points Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Performance
                </CardTitle>
                <CardDescription>Points earned and compliance % by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyPointsTrend}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="points"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorPoints)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="compliance"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorCompliance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cumulative Points Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Points Growth Over Time
                </CardTitle>
                <CardDescription>Historical points accumulation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={areaChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points by Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Points by Category
                </CardTitle>
                <CardDescription>Distribution of earned points</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Comparison
                </CardTitle>
                <CardDescription>Points earned per activity type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pieChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6">
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle>Category Statistics</CardTitle>
              <CardDescription>Detailed breakdown of points by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pieChartData.map((category, index) => (
                  <div
                    key={category.name}
                    className="p-4 rounded-lg border-2"
                    style={{ borderColor: COLORS[index % COLORS.length] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                          color: 'white'
                        }}
                      >
                        {category.value} pts
                      </Badge>
                    </div>
                    <Progress
                      value={(category.value / lifetimePoints) * 100}
                      className="h-2"
                      style={{
                        // @ts-ignore
                        '--progress-background': COLORS[index % COLORS.length]
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {((category.value / lifetimePoints) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                All Achievements ({achievements.length})
              </CardTitle>
              <CardDescription>Complete history of your earned achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div
                      className="p-3 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: `${achievement.badge_color}20`,
                        color: achievement.badge_color
                      }}
                    >
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold truncate">{achievement.badge_name}</h4>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: achievement.badge_color,
                            color: achievement.badge_color
                          }}
                        >
                          +{achievement.points_awarded}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Earned on {new Date(achievement.earned_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {achievements.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
                    <p className="text-muted-foreground">
                      Start completing activities to earn your first achievement!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumAchievementsDashboard;
