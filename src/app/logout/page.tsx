"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            // Clear all session data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            // Expire the auth cookie so middleware blocks protected routes
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict';

            await new Promise(resolve => setTimeout(resolve, 600));
            toast.success('تم تسجيل الخروج بنجاح');
            router.replace('/login');
        };

        logout();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="p-4 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <p className="text-slate-500 font-black animate-pulse">جاري تسجيل الخروج بأمان...</p>
        </div>
    );
}
