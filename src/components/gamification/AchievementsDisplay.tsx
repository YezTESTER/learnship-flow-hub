
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Award, Star, Trophy, Target, Calendar, FileText, Upload, CheckCircle, Gift } from 'lucide-react';

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

interface BadgeCategory {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  achievements: Achievement[];
}

const AchievementsDisplay = () => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

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
      setTotalPoints(data?.reduce((sum, achievement) => sum + achievement.points_awarded, 0) || 0);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'award': <Award className="h-6 w-6" />,
      'star': <Star className="h-6 w-6" />,
      'trophy': <Trophy className="h-6 w-6" />,
      'target': <Target className="h-6 w-6" />,
      'calendar': <Calendar className="h-6 w-6" />,
      'file-text': <FileText className="h-6 w-6" />,
      'file': <Upload className="h-6 w-6" />,
      'check-circle': <CheckCircle className="h-6 w-6" />,
      'gift': <Gift className="h-6 w-6" />
    };
    return iconMap[iconName] || <Award className="h-6 w-6" />;
  };

  const groupAchievementsByCategory = (): BadgeCategory[] => {
    const categories: BadgeCategory[] = [
      {
        type: 'monthly_submission',
        name: 'Monthly Reports',
        description: 'Achievements for consistent monthly feedback submissions',
        icon: <Calendar className="h-5 w-5" />,
        color: '#10B981',
        achievements: []
      },
      {
        type: 'document_upload',
        name: 'Document Management',
        description: 'Achievements for uploading and managing documents',
        icon: <FileText className="h-5 w-5" />,
        color: '#8B5CF6',
        achievements: []
      },
      {
        type: 'progress_milestone',
        name: 'Progress Milestones',
        description: 'Achievements for reaching learning milestones',
        icon: <Target className="h-5 w-5" />,
        color: '#F59E0B',
        achievements: []
      },
      {
        type: 'special_recognition',
        name: 'Special Recognition',
        description: 'Special achievements and honors',
        icon: <Trophy className="h-5 w-5" />,
        color: '#EF4444',
        achievements: []
      }
    ];

    achievements.forEach(achievement => {
      const category = categories.find(cat => cat.type === achievement.badge_type);
      if (category) {
        category.achievements.push(achievement);
      } else {
        // Add to special recognition if no specific category
        categories[3].achievements.push(achievement);
      }
    });

    return categories;
  };

  const getPointsLevel = (points: number) => {
    if (points >= 500) return { level: 'Expert', color: '#8B5CF6', progress: 100 };
    if (points >= 250) return { level: 'Advanced', color: '#10B981', progress: (points / 500) * 100 };
    if (points >= 100) return { level: 'Intermediate', color: '#F59E0B', progress: (points / 250) * 100 };
    if (points >= 50) return { level: 'Beginner', color: '#3B82F6', progress: (points / 100) * 100 };
    return { level: 'Starter', color: '#6B7280', progress: (points / 50) * 100 };
  };

  const categories = groupAchievementsByCategory();
  const pointsLevel = getPointsLevel(totalPoints);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#122ec0]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Points Overview */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Your Achievements
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Track your progress and celebrate your learnership milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Points */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="flex items-center justify-center mb-3">
                  <div 
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${pointsLevel.color}20`, color: pointsLevel.color }}
                  >
                    <Star className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{totalPoints}</h3>
                <p className="text-gray-600">Total Points</p>
              </div>
            </div>

            {/* Current Level */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="flex items-center justify-center mb-3">
                  <div 
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${pointsLevel.color}20`, color: pointsLevel.color }}
                  >
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">{pointsLevel.level}</h3>
                <p className="text-gray-600">Current Level</p>
                <div className="mt-3">
                  <Progress value={pointsLevel.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(pointsLevel.progress)}% to next level
                  </p>
                </div>
              </div>
            </div>

            {/* Total Badges */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-gradient-to-r from-[#122ec0] to-[#e16623] text-white">
                    <Award className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{achievements.length}</h3>
                <p className="text-gray-600">Badges Earned</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      {categories.map((category) => (
        <Card key={category.type}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.icon}
              </div>
              <div>
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {category.achievements.length}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {category.achievements.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}10` }}
                >
                  {category.icon}
                </div>
                <h4 className="font-medium text-gray-700 mb-2">No badges earned yet</h4>
                <p className="text-sm text-gray-500">Complete activities to earn your first badge in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${achievement.badge_color}20`, color: achievement.badge_color }}
                      >
                        {getBadgeIcon(achievement.badge_icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-800 truncate">{achievement.badge_name}</h4>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: achievement.badge_color, color: achievement.badge_color }}
                          >
                            +{achievement.points_awarded}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-xs text-gray-400">
                          Earned on {new Date(achievement.earned_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Upcoming Challenges */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <Target className="h-5 w-5" />
            <span>Upcoming Challenges</span>
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Complete these activities to earn more points and badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Monthly Consistency</h4>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                Submit feedback for 3 consecutive months
              </p>
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                +25 points
              </Badge>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Document Master</h4>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                Upload 10 different documents
              </p>
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                +30 points
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementsDisplay;
