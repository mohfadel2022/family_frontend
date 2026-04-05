"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { META_BASE } from '@/lib/api';
import { APP_ICONS } from '@/lib/icons';

// ─── Feature card shown on the left panel ─────────────────────────────────────
const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex items-start gap-4 group">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-card/10 flex items-center justify-center group-hover:bg-card/20 transition-colors">
            <Icon size={18} className="text-white/80" />
        </div>
        <div>
            <p className="font-black text-white text-sm">{title}</p>
            <p className="text-blue-200/70 text-xs mt-0.5 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('ERROR');
                setErrorMessage('رابط غير صالح أو مفقود. يرجى طلب رابط جديد.');
                return;
            }

            try {
                await axios.get(`${META_BASE}/auth/verify-token?token=${token}`);
                setStatus('IDLE');
            } catch (err: any) {
                setStatus('ERROR');
                setErrorMessage(err.response?.data?.error || 'الرمز غير صالح أو انتهت صلاحيته');
            }
        };

        verifyToken();
    }, [token]);

    const requirements = [
        { label: '8 أحرف على الأقل', test: (p: string) => p.length >= 8 },
        { label: 'حرف كبير (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'حرف صغير (a-z)', test: (p: string) => /[a-z]/.test(p) },
        { label: 'رقم (0-9)', test: (p: string) => /[0-9]/.test(p) },
        { label: 'رمز خاص (@#$!)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];

    const isPasswordValid = requirements.every(req => req.test(newPassword));

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setErrorMessage('يرجى استيفاء جميع متطلبات كلمة المرور');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('كلمات المرور غير متطابقة');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            await axios.post(`${META_BASE}/auth/reset-password`, {
                token,
                newPassword
            });
            setStatus('SUCCESS');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMessage(err.response?.data?.error || 'حدث خطأ أثناء تحديث كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6 text-center">
                    <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-inner shadow-emerald-100/30">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-1">
                            <ShieldCheck size={32} className="text-emerald-600" />
                        </div>
                        <p className="font-bold text-sm">تم تحديث كلمة المرور بنجاح!</p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full h-13 rounded-2xl font-black text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                    >
                        العودة لتسجيل الدخول
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
            <div className="text-center space-y-3">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-500 items-center justify-center shadow-xl shadow-indigo-100 mb-2 overflow-hidden border border-indigo-400/20 p-2 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-handshake"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">تعيين كلمة المرور</h1>
                    <p className="text-muted-foreground/60 text-sm mt-1 font-medium">
                        يرجى إدخال كلمة المرور الجديدة لحسابك
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5 text-right">
                        <label className="text-sm font-black text-foreground/80">كلمة المرور الجديدة</label>
                        <div className="relative group">
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-blue-500 transition-colors" size={17} />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-12 pr-11 pl-11 bg-muted/50 border-input rounded-2xl font-mono transition-all focus:border-blue-400 focus:bg-card"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(''); }}
                                required
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>

                        {/* Password Requirements Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-4 px-1">
                            {requirements.map((req, idx) => {
                                const met = req.test(newPassword);
                                return (
                                    <div key={idx} className={cn(
                                        "flex items-center gap-2 text-[10px] font-bold transition-colors",
                                        met ? "text-emerald-500" : "text-muted-foreground/40"
                                    )}>
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            met ? "bg-emerald-500" : "bg-muted-foreground/20"
                                        )} />
                                        <span>{req.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                        <label className="text-sm font-black text-foreground/80">تأكيد كلمة المرور</label>
                        <div className="relative group">
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-blue-500 transition-colors" size={17} />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-12 pr-11 bg-muted/50 border-input rounded-2xl font-mono transition-all focus:border-blue-400 focus:bg-card"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
                                required
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="text-rose-500">⚠</span>
                        {errorMessage}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full h-13 py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            جاري التحديث...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 justify-center">
                            <ShieldCheck size={20} />
                            تحديث كلمة المرور
                        </span>
                    )}
                </Button>

                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 justify-center mx-auto"
                    >
                        <ShieldCheck size={16} />
                        <span>العودة لتسجيل الدخول</span>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-card overflow-y-auto border-r">
                <div className="w-full max-w-sm space-y-8">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-muted-foreground/40 animate-pulse font-medium text-sm">جاري التحميل...</p>
                        </div>
                    }>
                        <ResetPasswordContent />
                    </Suspense>

                    {/* Footer note */}
                    <p className="text-center text-muted-foreground/60 text-xs leading-relaxed mt-8">
                        بوصولك لهذا النظام، أنت توافق على شروط الاستخدام<br />وسياسة الخصوصية الخاصة بالصندوق.
                    </p>
                </div>
            </div>

    );
}
