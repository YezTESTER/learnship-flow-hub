import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Clock, UserX } from "lucide-react";

const WaitingHall = () => {
    const { signOut, profile } = useAuth();

    const isRejected = profile?.status === 'rejected';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center shadow-xl border-0">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        {isRejected ? (
                            <UserX className="h-8 w-8 text-red-500" />
                        ) : (
                            <Clock className="h-8 w-8 text-blue-600" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {isRejected ? 'Application Declined' : 'Waiting for Approval'}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Hello, <span className="font-semibold text-gray-900">{profile?.full_name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <p className="text-gray-600 leading-relaxed">
                            {isRejected
                                ? "We regret to inform you that your application has been declined. Please contact the administrator for more information."
                                : "Your account is currently pending administrator approval. You will be notified once your access has been granted."
                            }
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={signOut}
                            className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WaitingHall;
