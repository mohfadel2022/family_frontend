"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    permission?: string | string[];
    roles?: string[];
    children: React.ReactNode;
}

export const ProtectedRoute = ({ permission, roles, children }: ProtectedRouteProps) => {
    const { user, loading, checkPermission, hasPermission } = useAuth();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            let authorized = true;
            
            if (!user) {
                authorized = false;
            } else if (permission && !checkPermission(permission)) {
                authorized = false;
            } else if (roles && roles.length > 0 && !hasPermission(roles)) {
                authorized = false;
            }

            setIsAuthorized(authorized);
            setIsChecking(false);
        }
    }, [user, loading, permission, roles, checkPermission, hasPermission]);

    if (loading || isChecking) {
       return (
           <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
               <p className="text-muted-foreground/80 font-black animate-pulse">جاري التحقق من الصلاحيات...</p>
           </div>
       );
    }

    if (!isAuthorized) {
        return <UnauthorizedAccess />;
    }

    return <>{children}</>;
};
