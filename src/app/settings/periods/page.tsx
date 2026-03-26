"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { APP_ICONS } from '@/lib/icons';
import { usePageTheme } from '@/hooks/usePageTheme';
import axios from 'axios';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ActionModal } from '@/components/ui/ActionModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const PeriodsPage = () => {
    const theme = usePageTheme();
    const { isAdmin, checkPermission } = useAuth();
    const canViewPeriods = checkPermission('PERIODS_VIEW');

    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPeriod, setNewPeriod] = useState({ name: '', startDate: '', endDate: '' });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPeriods = async () => {
        try {
            const res = await axios.get(`${API_BASE}/periods`, AUTH_HEADER);
            setPeriods(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const toggleLock = async (id: string) => {
        setActionLoading(id);
        try {
            await axios.post(`${API_BASE}/periods/${id}/toggle-lock`, {}, AUTH_HEADER);
            await fetchPeriods();
            toast.success('تم تغيير حالة القفل بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل تغيير حالة القفل');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/periods`, newPeriod, AUTH_HEADER);
            setIsModalOpen(false);
            setNewPeriod({ name: '', startDate: '', endDate: '' });
            await fetchPeriods();
            toast.success('تم إنشاء الفترة المالية بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل إنشاء الفترة');
            setLoading(false);
        }
    };

    if (loading && periods.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
            <p className="text-muted-foreground/80 font-black text-sm animate-pulse">جاري تحميل الفترات المالية...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="PERIODS_VIEW">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Standard Premium Header */}
                <PageHeader
                    icon={APP_ICONS.MODULES.PERIODS}
                    title="إغلاق الفترات"
                    description="Fiscal Management & Data Integrity"
                >
                    <WithPermission permission="PERIODS_CREATE">
                        <CustomButton
                            onClick={() => setIsModalOpen(true)}
                            variant="primary"
                            className="h-12 px-6"
                        >
                            <APP_ICONS.ACTIONS.ADD size={18} />
                            فتح فترة جديدة
                        </CustomButton>
                    </WithPermission>
                </PageHeader>

                {/* Compact Warning Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-5 rounded-3xl flex gap-4 items-center relative overflow-hidden group">
                    <div className="p-2.5 bg-card rounded-xl text-amber-600 shadow-sm border border-amber-100 group-hover:scale-110 transition-transform shrink-0">
                        <APP_ICONS.ACTIONS.SHIELD_ALERT size={22} />
                    </div>
                    <div>
                        <h4 className="font-black text-amber-900 text-sm">تحذير الرقابة الداخلية</h4>
                        <p className="text-amber-800/80 font-bold text-[11px] leading-relaxed">
                            تأمين الفترات يمنع التلاعب بالبيانات التاريخية. يرجى التأكد من مطابقة الأرصدة قبل "إغلاق" أي فترة، حيث سيتم تجميد كافة العمليات المرتبطة بها نهائياً.
                        </p>
                    </div>
                </div>

                {/* Periods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {periods.map((period) => (
                        <div key={period.id} className={cn(
                            "group relative bg-card p-5 rounded-[2rem] border transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
                            period.isLocked
                                ? "border-border shadow-sm opacity-90"
                                : cn(theme.border, theme.shadow)
                        )}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                    period.isLocked ? "bg-muted/50 text-muted-foreground/40" : cn(theme.muted, theme.accent)
                                )}>
                                    {period.isLocked ? <APP_ICONS.ACTIONS.LOCK size={20} /> : <APP_ICONS.ACTIONS.UNLOCK size={20} />}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm",
                                    period.isLocked
                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                )}>
                                    {period.isLocked ? 'مغلقة' : 'نشطة'}
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-foreground/90 mb-3">{period.name}</h3>

                            <div className="space-y-2.5 mb-6">
                                <div className="flex items-center gap-2.5 text-muted-foreground/80 font-bold text-[11px]">
                                    <APP_ICONS.ACTIONS.CALENDAR size={14} className={theme.accent.replace('700', '400')} />
                                    <span className="font-mono">{new Date(period.startDate).toLocaleDateString('ar-AR')}</span>
                                    <APP_ICONS.ACTIONS.CHEVRON_LEFT size={12} className="opacity-30" />
                                    <span className="font-mono">{new Date(period.endDate).toLocaleDateString('ar-AR')}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-muted-foreground/60 font-bold text-[10px] uppercase">
                                    <APP_ICONS.ACTIONS.CLOCK size={14} />
                                    <span>{new Date(period.startDate).getFullYear()} السنة المالية</span>
                                </div>
                            </div>

                            <WithPermission permission="PERIODS_EDIT">
                                <CustomButton
                                    onClick={() => toggleLock(period.id)}
                                    isLoading={actionLoading === period.id}
                                    variant={period.isLocked ? "primary" : "danger"}
                                    className="w-full h-11"
                                >
                                    {period.isLocked ? <APP_ICONS.ACTIONS.UNLOCK size={16} /> : <APP_ICONS.ACTIONS.LOCK size={16} />}
                                    {period.isLocked ? 'فتح الفترة' : 'إغلاق الفترة'}
                                </CustomButton>
                            </WithPermission>
                        </div>
                    ))}
                </div>

                {/* Modal - Modern & Compact */}
                <ActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="فترة مالية جديدة"
                    description="إدارة وفتح دورة محاسبية جديدة لتدفق البيانات"
                    icon={APP_ICONS.ACTIONS.ADD}
                    iconClassName="bg-blue-600 text-white shadow-blue-100"
                    maxWidth="max-w-md"
                >
                    <form onSubmit={handleCreatePeriod} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-foreground/80 mr-1">اسم الفترة</label>
                            <Input
                                required
                                placeholder="مثال: الربع الأول 2024"
                                className={cn("w-full px-4 h-12 rounded-xl bg-muted/50 border-input outline-none transition-all font-bold text-sm", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                value={newPeriod.name}
                                onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-foreground/80 mr-1 block">البداية</label>
                                <Input
                                    type="date"
                                    required
                                    className="w-full px-4 h-12 rounded-xl bg-muted/50 border-input focus-visible:ring-blue-500 outline-none transition-all font-mono font-bold text-sm"
                                    value={newPeriod.startDate}
                                    onChange={e => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-foreground/80 mr-1 block">النهاية</label>
                                <Input
                                    type="date"
                                    required
                                    className="w-full px-4 h-12 rounded-xl bg-muted/50 border-input focus-visible:ring-blue-500 outline-none transition-all font-mono font-bold text-sm"
                                    value={newPeriod.endDate}
                                    onChange={e => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-border/50">
                            <CustomButton
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-12"
                            >
                                إلغاء
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                isLoading={loading}
                                variant="primary"
                                className="flex-[2] h-12"
                            >
                                {loading ? 'جاري الحفظ...' : 'اعتماد الفترة'}
                            </CustomButton>
                        </div>
                    </form>
                </ActionModal>
            </div>
        </ProtectedRoute>
    );
};

export default PeriodsPage;
