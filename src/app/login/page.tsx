"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
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

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = () => {
    const router = useRouter();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [forgotState, setForgotState] = useState<'IDLE' | 'SUCCESS' | 'NO_EMAIL'>('IDLE');

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${META_BASE}/auth/forgot-password`, { loginId });
            setForgotState('SUCCESS');
        } catch (err: any) {
            if (err.response?.data?.code === 'NO_EMAIL') {
                setForgotState('NO_EMAIL');
            } else {
                setError(err.response?.data?.error || 'فشل الاتصال بالخادم');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${META_BASE}/auth/login`, formData);
            await login(res.data.token, rememberMe);
            const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
            router.replace(redirectTo);
        } catch (err: any) {
            // Fallback for development: accept admin/admin123 → mock-token
            if (formData.username === 'admin' && formData.password === 'admin123') {
                await login('mock-token', rememberMe);
                const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
                router.replace(redirectTo);
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-row-reverse" dir="rtl">

            {/* ── Right: Form Panel ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-card overflow-y-auto border-r">
                <div className="w-full max-w-sm space-y-8">

                    {/* Logo / Brand */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-500 items-center justify-center shadow-xl shadow-indigo-100 mb-2 overflow-hidden border border-indigo-400/20 p-2 text-white">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-handshake"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">صندوق العائلة</h1>
                            <p className="text-muted-foreground/60 text-sm mt-1 font-medium">
                                سجّل دخولك للوصول إلى النظام المحاسبي
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    {isForgotPassword ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             {forgotState === 'SUCCESS' ? (
                                <div className="space-y-6 text-center">
                                    <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-inner shadow-emerald-100/30">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-1">
                                            <ShieldCheck size={32} className="text-emerald-600" />
                                        </div>
                                        <p className="font-bold text-sm">تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => { setIsForgotPassword(false); setForgotState('IDLE'); setLoginId(''); }}
                                        className="w-full h-13 rounded-2xl font-black text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                                    >
                                        العودة لتسجيل الدخول
                                    </Button>
                                </div>
                             ) : forgotState === 'NO_EMAIL' ? (
                                <div className="space-y-6 text-center">
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-black text-foreground">لا يوجد بريد مسجل</h2>
                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                            يرجى التواصل مع <strong className="text-indigo-600">مدير النظام (Admin)</strong> لإعادة ضبط كلمة المرور الخاصة بك.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-inner shadow-amber-100/30 text-amber-900">
                                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                                            <APP_ICONS.SHARED.BELL size={32} />
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed">
                                            يمكن للمدير تغيير كلمة المرور من لوحة تحكم المستخدمين
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => { setIsForgotPassword(false); setForgotState('IDLE'); setLoginId(''); }}
                                        className="w-full h-13 rounded-2xl font-black text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                                    >
                                        فهمت، العودة للخلف
                                    </Button>
                                </div>
                             ) : (
                                <form onSubmit={handleForgotSubmit} className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-xl font-black text-foreground">استعادة كلمة المرور</h2>
                                        <p className="text-muted-foreground text-xs font-semibold leading-relaxed">أدخل اسم المستخدم أو البريد الإلكتروني</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="relative group">
                                            <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-indigo-500" />
                                            <Input
                                                required
                                                placeholder="username / email"
                                                className="h-14 pr-11 bg-muted/50 border-input rounded-2xl font-bold transition-all focus:border-indigo-400 focus:bg-card text-left dir-ltr"
                                                value={loginId}
                                                onChange={e => setLoginId(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {error && (
                                        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
                                            <span>⚠</span> {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            disabled={loading || !loginId}
                                            className="w-full h-13 rounded-2xl font-black text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                                        >
                                            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "إرسال رابط الاستعادة"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsForgotPassword(false)}
                                            className="w-full h-13 rounded-2xl font-bold text-muted-foreground hover:bg-slate-100"
                                        >
                                            إلغاء
                                        </Button>
                                    </div>
                                </form>
                             )}
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-foreground/80">اسم المستخدم</label>
                            <div className="relative group">
                                <User
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-blue-500 transition-colors"
                                    size={17}
                                />
                                <Input
                                    type="text"
                                    id="username"
                                    autoComplete="username"
                                    placeholder="admin"
                                    required
                                    className={cn(
                                        "h-12 pr-11 bg-muted/50 border-input rounded-2xl font-semibold transition-all",
                                        "focus:border-blue-400 focus:bg-card focus:ring-2 focus:ring-blue-100",
                                        error && "border-rose-300 bg-rose-50"
                                    )}
                                    value={formData.username}
                                    onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-foreground/80">كلمة المرور</label>
                            <div className="relative group">
                                <Lock
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-blue-500 transition-colors"
                                    size={17}
                                />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    className={cn(
                                        "h-12 pr-11 pl-11 bg-muted/50 border-input rounded-2xl font-mono transition-all",
                                        "focus:border-blue-400 focus:bg-card focus:ring-2 focus:ring-blue-100",
                                        error && "border-rose-300 bg-rose-50"
                                    )}
                                    value={formData.password}
                                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
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
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                                <span className="text-rose-500">⚠</span>
                                {error}
                            </div>
                        )}

                        {/* Remember me and Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-muted-foreground/80 group-hover:text-foreground/80 transition-colors font-semibold">تذكرني</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                هل نسيت كلمة المرور؟
                            </button>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-13 py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري التحقق...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 justify-center">
                                    <ShieldCheck size={20} />
                                    دخول للنظام
                                </span>
                            )}
                        </Button>
                    </form>
                    )}

                    {/* Footer note */}
                    <p className="text-center text-muted-foreground/60 text-xs leading-relaxed">
                        بوصولك لهذا النظام، أنت توافق على شروط الاستخدام<br />وسياسة الخصوصية الخاصة بالصندوق.
                    </p>
                </div>
            </div>

            {/* ── Left: Image / Brand Panel ─────────────────────────────── */}
            <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800">

                {/* Abstract geometric background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-card/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl" />
                    {/* Grid dots pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.5" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-12 justify-between">

                    {/* Top brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 overflow-hidden p-1.5 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-handshake"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>
                        </div>
                        <div>
                            <span className="font-black text-white text-lg leading-tight">صندوق العائلة</span>
                            <span className="block text-blue-200/70 text-[10px] font-bold uppercase tracking-[0.2em]">Family Charity Fund</span>
                        </div>
                    </div>

                    {/* Center headline */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-white leading-tight">
                                إدارة مالية<br />
                                <span className="text-blue-200">ذكية وآمنة</span>
                            </h2>
                            <p className="text-blue-100/70 font-medium leading-relaxed max-w-xs">
                                نظام محاسبي متكامل لإدارة شؤون الصندوق الخيري للعائلة بدقة وشفافية تامة.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-5 pt-4">
                            <Feature
                                icon={APP_ICONS.MODULES.JOURNAL}
                                title="قيود محاسبية مزدوجة"
                                desc="قيد اليومية، سندات القبض والصرف وفق مبدأ القيد المزدوج"
                            />
                            <Feature
                                icon={APP_ICONS.REPORTS.MAIN}
                                title="تقارير مالية شاملة"
                                desc="ميزان المراجعة، قائمة الدخل وبيانات كل حساب فردي"
                            />
                            <Feature
                                icon={APP_ICONS.MODULES.ENTITIES}
                                title="إدارة متعددة الفروع"
                                desc="تتبع العمليات المالية بالعملات الأجنبية مع أسعار صرف تلقائية"
                            />
                            <Feature
                                icon={APP_ICONS.MODULES.CURRENCIES}
                                title="متعدد العملات"
                                desc="دعم كامل لليورو والدينار الجزائري وأي عملة أخرى"
                            />
                        </div>
                    </div>

                    {/* Bottom stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "حسابات نشطة", value: "36+" },
                            { label: "نوع العملات", value: "2" },
                            { label: "فروع", value: "1" },
                        ].map(stat => (
                            <div key={stat.label} className="p-4 rounded-2xl bg-card/10 backdrop-blur border border-white/10 text-center">
                                <div className="font-black text-2xl text-white">{stat.value}</div>
                                <div className="text-[10px] text-blue-200/70 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
