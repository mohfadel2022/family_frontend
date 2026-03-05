"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Calendar,
    Lock,
    Unlock,
    Plus,
    History,
    ShieldAlert,
    Clock,
    Loader2,
    ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const PeriodsPage = () => {
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
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-black text-sm animate-pulse">جاري تحميل الفترات المالية...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Standard Premium Header */}
            <PageHeader
                icon={History}
                title="إغلاق الفترات"
                description="Fiscal Management & Data Integrity"
                iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
            >
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative flex items-center gap-2 bg-slate-900 text-white px-6 w-auto h-12 rounded-2xl font-black transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-slate-200 text-xs"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    فتح فترة جديدة
                </Button>
            </PageHeader>

            {/* Compact Warning Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-5 rounded-3xl flex gap-4 items-center relative overflow-hidden group">
                <div className="p-2.5 bg-white rounded-xl text-amber-600 shadow-sm border border-amber-100 group-hover:scale-110 transition-transform shrink-0">
                    <ShieldAlert size={22} />
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
                        "group relative bg-white p-5 rounded-[2rem] border transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
                        period.isLocked
                            ? "border-slate-100 shadow-sm opacity-90"
                            : "border-blue-100 shadow-lg shadow-blue-500/5"
                    )}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                period.isLocked ? "bg-slate-50 text-slate-300" : "bg-blue-50 text-blue-600"
                            )}>
                                {period.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
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

                        <h3 className="text-lg font-black text-slate-800 mb-3">{period.name}</h3>

                        <div className="space-y-2.5 mb-6">
                            <div className="flex items-center gap-2.5 text-slate-500 font-bold text-[11px]">
                                <Calendar size={14} className="text-blue-400" />
                                <span className="font-mono">{new Date(period.startDate).toLocaleDateString('ar-SA')}</span>
                                <ChevronLeft size={12} className="opacity-30" />
                                <span className="font-mono">{new Date(period.endDate).toLocaleDateString('ar-SA')}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[10px] uppercase">
                                <Clock size={14} />
                                <span>{new Date(period.startDate).getFullYear()} السنة المالية</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => toggleLock(period.id)}
                            disabled={actionLoading === period.id}
                            className={cn(
                                "w-full h-11 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm",
                                period.isLocked
                                    ? "bg-slate-900 text-white hover:bg-black"
                                    : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                            )}
                        >
                            {actionLoading === period.id ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    {period.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                    {period.isLocked ? 'فتح الفترة' : 'إغلاق الفترة'}
                                </>
                            )}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Modal - Modern & Compact */}
            {isModalOpen && (
                <Dialog open={true} onOpenChange={(open) => !open && setIsModalOpen(false)}>
                    <DialogContent className="max-w-md bg-white p-0 overflow-hidden border-slate-100 rounded-[2rem] gap-0" dir="rtl">
                        <DialogHeader className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex flex-col items-start space-y-0 !text-right">
                            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-3 w-full">
                                <Plus className="text-blue-600" size={20} />
                                فترة مالية جديدة
                            </DialogTitle>
                            <p className="text-slate-400 font-bold text-[10px] mt-1.5 uppercase tracking-tight">Create New Accounting Period</p>
                        </DialogHeader>
                        <form onSubmit={handleCreatePeriod} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-700 mr-1">اسم الفترة</label>
                                <Input
                                    required
                                    placeholder="مثال: الربع الأول 2024"
                                    className="w-full px-4 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 outline-none transition-all font-bold text-sm"
                                    value={newPeriod.name}
                                    onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 mr-1 block">البداية</label>
                                    <Input
                                        type="date"
                                        required
                                        className="w-full px-4 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 outline-none transition-all font-mono font-bold text-sm"
                                        value={newPeriod.startDate}
                                        onChange={e => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 mr-1 block">النهاية</label>
                                    <Input
                                        type="date"
                                        required
                                        className="w-full px-4 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 outline-none transition-all font-mono font-bold text-sm"
                                        value={newPeriod.endDate}
                                        onChange={e => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-12 rounded-xl border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all text-xs"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'اعتماد الفترة'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default PeriodsPage;
