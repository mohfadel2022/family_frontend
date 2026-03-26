"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { PageHeader } from '@/components/ui/PageHeader';
import { APP_ICONS } from '@/lib/icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getAuthHeader, SUB_BASE } from '@/lib/api';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

const AUTH_HEADER = getAuthHeader();

export default function SubscriptionPivotSummaryReport() {
    const theme = usePageTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);
    const [yearBounds, setYearBounds] = useState<{ min: number; max: number } | null>(null);

    // Filters
    const [yearFrom, setYearFrom] = useState<string>('');
    const [yearTo, setYearTo] = useState<string>('');
    const [entityId, setEntityId] = useState<string>('');

    // Fetch year bounds on mount (unfiltered)
    useEffect(() => {
        axios.get(`${SUB_BASE}/reports/pivot-summary`, AUTH_HEADER)
            .then(r => {
                const years: number[] = r.data.map((row: any) => row.year);
                if (years.length > 0) setYearBounds({ min: Math.min(...years), max: Math.max(...years) });
            })
            .catch(() => {});
    }, []);

    // Fetch entities for dropdown
    useEffect(() => {
        axios.get(`${SUB_BASE}/entities`, AUTH_HEADER)
            .then(r => setEntities(r.data))
            .catch(() => {});
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (yearFrom) params.yearFrom = yearFrom;
            if (yearTo) params.yearTo = yearTo;
            if (entityId) params.entityId = entityId;
            const res = await axios.get(`${SUB_BASE}/reports/pivot-summary`, { ...AUTH_HEADER, params });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("فشل في تحميل ملخص الاشتراكات");
        } finally {
            setLoading(false);
        }
    }, [yearFrom, yearTo, entityId]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleReset = () => {
        setYearFrom('');
        setYearTo('');
        setEntityId('');
    };

    const handleExportExcel = () => {
        const headers = ['السنة', 'إجمالي الأعضاء', 'منتسبون جدد', 'متوقفون', 'متوفون', 'الفرق', 'إجمالي النشطاء'];
        const keys = ['year', 'totalMembers', 'new', 'inactive', 'deceased', 'difference', 'cumulative'];
        exportToExcel(data, `Pivot_Summary_${new Date().toISOString().split('T')[0]}`, headers, keys);
    };

    const handleExportPDF = () => {
        const headers = ['السنة', 'إجمالي الأعضاء', 'منتسبون جدد', 'متوقفون', 'متوفون', 'الفرق', 'إجمالي النشطاء'];
        const keys = ['year', 'totalMembers', 'new', 'inactive', 'deceased', 'difference', 'cumulative'];
        exportToPDF(data, `Pivot_Summary_${new Date().toISOString().split('T')[0]}`, 'ملخص التغيرات السنوية للأعضاء', headers, keys);
    };

    const totals = data.reduce(
        (acc, row) => ({ new: acc.new + row.new, inactive: acc.inactive + row.inactive, deceased: acc.deceased + row.deceased }),
        { new: 0, inactive: 0, deceased: 0 }
    );
    const lastCumulative = data.length > 0 ? data[data.length - 1].cumulative : 0;
    const lastTotalMembers = data.length > 0 ? data[data.length - 1].totalMembers : 0;
    const netTotal = totals.new - totals.inactive - totals.deceased;

    // Year range options from data bounds
    const yearOptions = yearBounds
        ? Array.from({ length: yearBounds.max - yearBounds.min + 1 }, (_, i) => yearBounds.min + i)
        : [];

    const selectClass = "h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full";

    return (
        <ProtectedRoute permission="REPORTS_SUBSCRIPTIONS_VIEW">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
                <PageHeader
                    icon={APP_ICONS.REPORTS.SUBSCRIPTION_PIVOT}
                    title="ملخص التغيرات السنوية"
                    description="التغيرات السنوية في عضوية الصندوق: منتسبون جدد، متوقفون، ومتوفون لكل سنة"
                >
                    <div className="flex items-center gap-3">
                        <CustomButton onClick={handleExportPDF} variant="outline"
                            className={cn("h-11 rounded-2xl gap-2 font-bold", theme.muted, "text-rose-600 border-rose-200 hover:bg-rose-50")}>
                            <APP_ICONS.ACTIONS.EXPORT size={20} /> PDF
                        </CustomButton>
                        <CustomButton onClick={handleExportExcel} variant="outline"
                            className={cn("h-11 rounded-2xl gap-2 font-bold", theme.muted, "text-emerald-600 border-emerald-200 hover:bg-emerald-50")}>
                            <APP_ICONS.ACTIONS.SPREADSHEET size={20} /> Excel
                        </CustomButton>
                    </div>
                </PageHeader>

                {/* Filter Panel */}
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm" dir="rtl">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm font-bold">
                        <APP_ICONS.ACTIONS.FILTER size={16} />
                        <span>تصفية النتائج</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Year From */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">من سنة</label>
                            <select value={yearFrom} onChange={e => setYearFrom(e.target.value)} className={selectClass}>
                                <option value="">الكل</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        {/* Year To */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">إلى سنة</label>
                            <select value={yearTo} onChange={e => setYearTo(e.target.value)} className={selectClass}>
                                <option value="">الكل</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        {/* Entity */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">الجهة</label>
                            <select value={entityId} onChange={e => setEntityId(e.target.value)} className={selectClass}>
                                <option value="">جميع الجهات</option>
                                {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        {/* Reset */}
                        <CustomButton onClick={handleReset} variant="outline"
                            className="h-10 rounded-xl text-muted-foreground border-border hover:bg-muted/50 gap-2 font-bold">
                            <APP_ICONS.ACTIONS.UNDO size={16} />
                            إعادة تعيين
                        </CustomButton>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                            <p className="text-muted-foreground/80 font-bold animate-pulse">جاري التحميل...</p>
                        </div>
                    ) : (
                        <Table dir="rtl">
                            <TableHeader className="bg-muted/50 border-b-2 border-border">
                                <TableRow>
                                    <TableHead className="text-right text-foreground/90 font-black py-5 px-8">السنة</TableHead>
                                    <TableHead className="text-center text-foreground font-black bg-muted/30">إجمالي الأعضاء</TableHead>
                                    <TableHead className="text-center text-emerald-600 font-extrabold">منتسبون جدد</TableHead>
                                    <TableHead className="text-center text-amber-600 font-extrabold">متوقفون</TableHead>
                                    <TableHead className="text-center text-rose-600 font-extrabold">متوفون</TableHead>
                                    <TableHead className="text-center text-indigo-600 font-extrabold">الفرق</TableHead>
                                    <TableHead className="text-center text-violet-600 font-extrabold">إجمالي النشطاء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                            لا توجد بيانات متاحة
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data.map((row) => (
                                    <TableRow key={row.year} className="hover:bg-muted/30 transition-colors border-b border-border/50 group">
                                        <TableCell className="py-5 px-8 font-black text-lg text-foreground/70">{row.year}</TableCell>
                                        <TableCell className="text-center font-black text-lg text-foreground bg-muted/20 group-hover:bg-muted/30">
                                            {row.totalMembers}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-emerald-600 bg-emerald-50/5 group-hover:bg-emerald-50/20">
                                            {row.new > 0 ? `+${row.new}` : row.new}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-amber-600 bg-amber-50/5 group-hover:bg-amber-50/20">
                                            {row.inactive > 0 ? `-${row.inactive}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-rose-600 bg-rose-50/5 group-hover:bg-rose-50/20">
                                            {row.deceased > 0 ? `-${row.deceased}` : '—'}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-center font-black text-lg",
                                            row.difference > 0 ? "text-indigo-600" : row.difference < 0 ? "text-rose-700" : "text-muted-foreground"
                                        )}>
                                            {row.difference > 0 ? `+${row.difference}` : row.difference}
                                        </TableCell>
                                        <TableCell className="text-center font-black text-lg text-violet-600 bg-violet-50/5 group-hover:bg-violet-50/20">
                                            {row.cumulative}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.length > 0 && (
                                    <TableRow className="border-t-2 border-border bg-muted/30 font-black">
                                        <TableCell className="py-4 px-8 font-black text-foreground">المجموع</TableCell>
                                        <TableCell className="text-center font-black text-lg text-foreground">{lastTotalMembers}</TableCell>
                                        <TableCell className="text-center text-emerald-700 font-black">+{totals.new}</TableCell>
                                        <TableCell className="text-center text-amber-700 font-black">-{totals.inactive}</TableCell>
                                        <TableCell className="text-center text-rose-700 font-black">-{totals.deceased}</TableCell>
                                        <TableCell className={cn("text-center font-black text-lg", netTotal >= 0 ? "text-indigo-700" : "text-rose-700")}>
                                            {netTotal > 0 ? '+' : ''}{netTotal}
                                        </TableCell>
                                        <TableCell className="text-center font-black text-lg text-violet-700">
                                            {lastCumulative}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 p-6 rounded-3xl">
                        <h4 className="text-emerald-800 font-black text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />منتسبون جدد
                        </h4>
                        <p className="text-emerald-700/70 text-xs font-bold leading-relaxed">عدد الأعضاء الذين انتسبوا إلى الصندوق في تلك السنة تحديدًا.</p>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100/50 p-6 rounded-3xl">
                        <h4 className="text-amber-800 font-black text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />المتوقفون والمتوفون
                        </h4>
                        <p className="text-amber-700/70 text-xs font-bold leading-relaxed">الأعضاء الذين توقفوا أو توفوا في تلك السنة وخرجوا من عضوية الصندوق.</p>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-3xl">
                        <h4 className="text-indigo-800 font-black text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />الفرق والإجمالي
                        </h4>
                        <p className="text-indigo-700/70 text-xs font-bold leading-relaxed">الفرق = الجدد − (المتوقفون + المتوفون). الإجمالي = العدد التراكمي للأعضاء النشطين.</p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
