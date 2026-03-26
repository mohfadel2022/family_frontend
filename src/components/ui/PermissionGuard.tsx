"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
    permission: string;
    children: React.ReactNode;
    /** When true, renders nothing instead of the lock message (for buttons/actions) */
    silent?: boolean;
    /** Custom fallback element */
    fallback?: React.ReactNode;
}

/**
 * Wraps content that requires a specific permission.
 * - isAdmin bypasses all checks (admin sees everything).
 * - Pass `silent` to simply hide the element without rendering a fallback.
 */
export const PermissionGuard = ({ permission, children, silent = false, fallback }: PermissionGuardProps) => {
    const { checkPermission, loading } = useAuth();

    if (loading) return null;
    if (checkPermission(permission)) return <>{children}</>;
    if (silent) return null;
    if (fallback) return <>{fallback}</>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center">
                <Lock size={36} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-foreground/90">وصول مقيّد</h2>
            <p className="text-muted-foreground/60 font-bold max-w-sm text-sm leading-relaxed">
                ليس لديك الصلاحية الكافية للوصول إلى هذا القسم. تواصل مع مدير النظام لطلب الوصول.
            </p>
            <code className="text-[10px] bg-accent text-muted-foreground/60 px-3 py-1 rounded-lg font-mono">
                {permission}
            </code>
        </div>
    );
};

export default PermissionGuard;
