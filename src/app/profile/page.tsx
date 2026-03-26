"use client";

import React, { useState } from 'react';
import {
    User,
    Lock,
    Loader2,
    Save,
    ShieldCheck,
    KeyRound,
    Eye,
    EyeOff,
    UserCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { META_BASE, getAuthHeader } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [profileLoading, setProfileLoading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const requirements = [
        { label: '8 أحرف على الأقل', test: (p: string) => p.length >= 8 },
        { label: 'حرف كبير (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'حرف صغير (a-z)', test: (p: string) => /[a-z]/.test(p) },
        { label: 'رقم (0-9)', test: (p: string) => /[0-9]/.test(p) },
        { label: 'رمز خاص (@#$!)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];

    const isPasswordValid = requirements.every(req => req.test(newPassword));

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            await axios.put(`${META_BASE}/me`, { name, username }, getAuthHeader());
            toast.success("تم تحديث الملف الشخصي بنجاح");
            await refreshUser();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "فشل تحديث الملف الشخصي");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("كلمات المرور الجديدة غير متطابقة");
        }
        if (!isPasswordValid) {
            return toast.error("يرجى استيفاء جميع متطلبات كلمة المرور");
        }
        setPasswordLoading(true);
        try {
            await axios.put(`${META_BASE}/me/password`, { currentPassword, newPassword }, getAuthHeader());
            toast.success("تم تغيير كلمة المرور بنجاح");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "فشل تغيير كلمة المرور");
        } finally {
            setPasswordLoading(false);
        }
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <PageHeader
                icon={UserCircle}
                title="الملف الشخصي"
                description="Manage your account details and security credentials"
            >
                <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100">
                    <ShieldCheck className="text-blue-600" size={20} />
                    <span className="text-blue-700 font-black text-sm">بياناتك الشخصية مؤمنة</span>
                </div>
            </PageHeader>

            {/* Avatar Banner */}
            <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-[2.5rem] p-4 flex items-center gap-6 shadow-2xl shadow-blue-200">
                <div className="w-14 h-14 rounded-[1.5rem] bg-card/20 backdrop-blur flex items-center justify-center text-white font-black text-xl border-2 border-white/30 shadow-inner">
                    {userInitial}
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white">{user?.name || 'مستخدم النظام'}</h3>
                    <p className="text-blue-200 font-bold text-sm mt-1">@{user?.username || 'username'}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 bg-card/20 px-3 py-1 rounded-full text-xs font-bold text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {user?.role || 'مستخدم'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* Profile Info Section */}
                <section className="bg-card rounded-[2.5rem] border border-border shadow-xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-border/50 flex items-center gap-4 bg-gradient-to-l from-blue-50/50 to-transparent">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-sm border border-blue-200/50">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground/90">البيانات الشخصية</h2>
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Personal Information</p>
                        </div>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">الاسم الكامل</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="أدخل اسمك الكامل"
                                    className="h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-blue-500 font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">اسم المستخدم</label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="اسم المستخدم"
                                    className="h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-blue-500 font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <CustomButton
                                type="submit"
                                isLoading={profileLoading}
                                variant="primary"
                                className="h-12 px-8"
                            >
                                {!profileLoading && <Save size={18} />}
                                حفظ التغييرات
                            </CustomButton>
                        </div>
                    </form>
                </section>

                {/* Password Section */}
                <section className="bg-card rounded-[2.5rem] border border-rose-50 shadow-xl shadow-rose-100/50 overflow-hidden">
                    <div className="p-8 border-b border-rose-50 flex items-center gap-4 bg-gradient-to-l from-rose-50/60 to-transparent">
                        <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shadow-sm border border-rose-200/50">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground/90">تغيير كلمة المرور</h2>
                            <p className="text-xs text-rose-400 font-bold uppercase tracking-tighter">Security & Credentials</p>
                        </div>
                    </div>
                    <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">كلمة المرور الحالية</label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-rose-500 font-bold pl-12"
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-rose-500 font-bold pl-12"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Password Requirements Grid */}
                                {newPassword && (
                                    <div className="grid grid-cols-2 gap-2 mt-4 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {requirements.map((req, idx) => {
                                            const met = req.test(newPassword);
                                            return (
                                                <div key={idx} className={cn(
                                                    "flex items-center gap-2 text-[10px] font-bold transition-all",
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
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-rose-500 font-bold pl-12 ${confirmPassword && newPassword !== confirmPassword ? 'border-rose-400 bg-rose-50/30' : ''
                                            }`}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-rose-500 font-bold">كلمات المرور غير متطابقة</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <CustomButton
                                type="submit"
                                isLoading={passwordLoading}
                                disabled={Boolean((confirmPassword && newPassword !== confirmPassword) || (newPassword && !isPasswordValid))}
                                variant="danger"
                                className="h-12 px-8"
                            >
                                {!passwordLoading && <Lock size={18} />}
                                تحديث كلمة المرور
                            </CustomButton>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default ProfilePage;
