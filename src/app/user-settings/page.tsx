"use client";

import React, { useEffect, useState } from 'react';
import {
    Sun,
    Moon,
    Monitor,
    Globe,
    Palette,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { APP_ICONS } from '@/lib/icons';

const UserSettingsPage = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const themes = [
        { id: 'light', icon: Sun, label: 'فاتح', desc: 'Light Mode', color: 'amber' },
        { id: 'dark', icon: Moon, label: 'داكن', desc: 'Dark Mode', color: 'indigo' },
        { id: 'system', icon: Monitor, label: 'تلقائي', desc: 'System Default', color: 'slate' },
    ];

    if (!mounted) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
            <PageHeader
                icon={SlidersHorizontal}
                title="إعدادات المستخدم"
                description="Personalize your experience — themes, language and display preferences"
                iconClassName="bg-gradient-to-br from-violet-600 to-purple-700 shadow-violet-200"
            >
                <div className="flex items-center gap-3 bg-violet-50 px-5 py-3 rounded-2xl border border-violet-100">
                    <Sparkles className="text-violet-600" size={20} />
                    <span className="text-violet-700 font-black text-sm">تخصيص تجربة المستخدم</span>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 gap-10">
                {/* Theme Selection */}
                <section className="bg-card rounded-[2.5rem] border border-border shadow-xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-border/50 flex items-center gap-4 bg-gradient-to-l from-violet-50/50 to-transparent">
                        <div className="p-3 bg-violet-100 rounded-2xl text-violet-600 shadow-sm border border-violet-200/50">
                            <Palette size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground/90">مظهر النظام</h2>
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Display Theme</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-bold shadow-sm animate-in slide-in-from-top-2 duration-500">
                             <APP_ICONS.STATE.WARNING size={16} className="shrink-0" />
                             تنبيه: تم إيقاف تغيير المظهر مؤقتاً لإجراء تحسينات تقنية.
                        </div>
                        <p className="text-sm text-muted-foreground/80 font-medium opacity-50 pointer-events-none">اختر المظهر الذي يناسبك. سيتم تطبيقه فوراً على كافة صفحات النظام.</p>
                        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none grayscale-[0.5]">
                            {themes.map((t) => {
                                const isActive = theme === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        disabled
                                        className={cn(
                                            "relative p-6 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-3 group",
                                            isActive
                                                ? "border-violet-500 bg-violet-50/60 shadow-lg shadow-violet-100"
                                                : "border-border bg-muted/50/20"
                                        )}
                                    >
                                        {isActive && (
                                            <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-violet-500 shadow-md shadow-violet-300" />
                                        )}
                                        <div className={cn(
                                            "p-4 rounded-2xl transition-all",
                                            isActive ? "bg-violet-100 text-violet-600" : "bg-accent text-muted-foreground/60"
                                        )}>
                                            <t.icon size={28} />
                                        </div>
                                        <div className="text-center">
                                            <span className={cn("font-black text-sm block", isActive ? "text-violet-700" : "text-muted-foreground")}>{t.label}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide">{t.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold transition-all opacity-40 grayscale",
                            theme === 'light' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                theme === 'dark' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                    "bg-muted/50 text-muted-foreground border border-border"
                        )}>
                            {theme === 'light' && <><Sun size={16} className="shrink-0" /> الوضع الفاتح: مناسب للاستخدام في بيئات مضاءة.</>}
                            {theme === 'dark' && <><Moon size={16} className="shrink-0" /> الوضع الداكن: يحمي عينيك في الأماكن المعتمة ويوفر الطاقة.</>}
                            {theme === 'system' && <><Monitor size={16} className="shrink-0" /> تلقائي: يتبع إعدادات جهازك تلقائياً.</>}
                            {!theme && <><Monitor size={16} className="shrink-0" /> اختر مظهراً من الخيارات أعلاه.</>}
                        </div>
                    </div>
                </section>

                {/* Language Selection */}
                <section className="bg-card rounded-[2.5rem] border border-border shadow-xl shadow-slate-900/5 overflow-hidden">
                    <div className="p-8 border-b border-border/50 flex items-center gap-4 bg-gradient-to-l from-emerald-50/50 to-transparent">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm border border-emerald-200/50">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground/90">اللغة والمنطقة</h2>
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Language & Region</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-sm text-muted-foreground/80 font-medium">حدد اللغة المفضلة لعرض واجهة النظام.</p>
                        <div className="space-y-3">
                            <label className="text-sm font-black text-foreground/80">لغة الواجهة</label>
                            <Select defaultValue="ar">
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-input font-bold transition-all text-right" dir="rtl">
                                    <SelectValue placeholder="اختر اللغة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="ar">
                                        <span className="flex items-center gap-2 font-bold">🇸🇦 العربية</span>
                                    </SelectItem>
                                    <SelectItem value="en" disabled>
                                        <span className="flex items-center gap-2 font-bold text-muted-foreground/60">🇬🇧 English — قريباً</span>
                                    </SelectItem>
                                    <SelectItem value="fr" disabled>
                                        <span className="flex items-center gap-2 font-bold text-muted-foreground/60">🇫🇷 Français — قريباً</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground/60 font-bold italic">
                                ⚡ سيتم دعم لغات إضافية في الإصدارات القادمة من النظام.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default UserSettingsPage;
