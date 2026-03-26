import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface WithPermissionProps {
    permission: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const WithPermission = ({ permission, children, fallback = null }: WithPermissionProps) => {
    const { checkPermission, loading } = useAuth();

    if (loading) return null;

    if (checkPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
