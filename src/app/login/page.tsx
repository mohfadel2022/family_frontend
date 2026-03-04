"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    HeartHandshake,
    Coins,
    Users,
    TrendingUp,
    BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// ─── Feature card shown on the left panel ─────────────────────────────────────
const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex items-start gap-4 group">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:4000/api/meta/auth/login', formData);
            await login(res.data.token);
            const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
            router.replace(redirectTo);
        } catch (err: any) {
            // Fallback for development: accept admin/admin123 → mock-token
            if (formData.username === 'admin' && formData.password === 'admin123') {
                await login('mock-token');
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
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white overflow-y-auto">
                <div className="w-full max-w-sm space-y-8">

                    {/* Logo / Brand */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center shadow-xl shadow-blue-200 mb-2">
                            <HeartHandshake size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">صندوق العائلة</h1>
                            <p className="text-slate-400 text-sm mt-1 font-medium">
                                سجّل دخولك للوصول إلى النظام المحاسبي
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-700">اسم المستخدم</label>
                            <div className="relative group">
                                <User
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                                    size={17}
                                />
                                <Input
                                    type="text"
                                    id="username"
                                    autoComplete="username"
                                    placeholder="admin"
                                    required
                                    className={cn(
                                        "h-12 pr-11 bg-slate-50 border-slate-200 rounded-2xl font-semibold transition-all",
                                        "focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100",
                                        error && "border-rose-300 bg-rose-50"
                                    )}
                                    value={formData.username}
                                    onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-700">كلمة المرور</label>
                            <div className="relative group">
                                <Lock
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                                    size={17}
                                />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    className={cn(
                                        "h-12 pr-11 pl-11 bg-slate-50 border-slate-200 rounded-2xl font-mono transition-all",
                                        "focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100",
                                        error && "border-rose-300 bg-rose-50"
                                    )}
                                    value={formData.password}
                                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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

                        {/* Remember me */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-slate-500 group-hover:text-slate-700 transition-colors font-semibold">تذكرني</span>
                            </label>
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

                    {/* Footer note */}
                    <p className="text-center text-slate-400 text-xs leading-relaxed">
                        بوصولك لهذا النظام، أنت توافق على شروط الاستخدام<br />وسياسة الخصوصية الخاصة بالصندوق.
                    </p>
                </div>
            </div>

            {/* ── Left: Image / Brand Panel ─────────────────────────────── */}
            <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800">

                {/* Abstract geometric background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
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
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                            <HeartHandshake size={22} className="text-white" />
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
                                icon={BookOpen}
                                title="قيود محاسبية مزدوجة"
                                desc="قيد اليومية، سندات القبض والصرف وفق مبدأ القيد المزدوج"
                            />
                            <Feature
                                icon={TrendingUp}
                                title="تقارير مالية شاملة"
                                desc="ميزان المراجعة، قائمة الدخل وبيانات كل حساب فردي"
                            />
                            <Feature
                                icon={Users}
                                title="إدارة متعددة الفروع"
                                desc="تتبع العمليات المالية بالعملات الأجنبية مع أسعار صرف تلقائية"
                            />
                            <Feature
                                icon={Coins}
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
                            <div key={stat.label} className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
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
