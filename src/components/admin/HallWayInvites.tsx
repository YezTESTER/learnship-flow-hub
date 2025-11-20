import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, User, Mail, Calendar } from 'lucide-react';

interface PendingUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    status: string;
}

const HallWayInvites = () => {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPendingUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingUsers(data || []);
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'rejected', userName: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            // Send notification to user (if we had a notification system for this)
            // For now just update UI

            toast({
                title: newStatus === 'active' ? "User Approved" : "User Rejected",
                description: `${userName} has been ${newStatus === 'active' ? 'approved' : 'rejected'}.`,
                variant: newStatus === 'active' ? "default" : "destructive",
            });

            fetchPendingUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            toast({
                title: "Error",
                description: "Failed to update user status.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading pending applications...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                {pendingUsers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            No pending applications found.
                        </CardContent>
                    </Card>
                ) : (
                    pendingUsers.map((user) => (
                        <Card key={user.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="h-4 w-4" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                Applied: {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="pt-1">
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role} Application
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <Button
                                            variant="outline"
                                            className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleStatusUpdate(user.id, 'rejected', user.full_name)}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Decline
                                        </Button>
                                        <Button
                                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleStatusUpdate(user.id, 'active', user.full_name)}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default HallWayInvites;
