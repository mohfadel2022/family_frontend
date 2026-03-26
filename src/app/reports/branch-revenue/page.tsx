"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { TotalSummary } from '@/components/ui/TotalSummary';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;

const BranchRevenuePage = () => {
    const theme = usePageTheme();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                axios.get(`${API_BASE}/branches`, getAuthHeader()),
                axios.get(`${API_BASE}/currencies`, getAuthHeader())
            ]);

            const branchData = results[0].status === 'fulfilled' ? results[0].value.data : [];
            const currData = results[1].status === 'fulfilled' ? results[1].value.data : [];

            setBaseCurrency(currData.find((c: any) => c.isBase) || { code: '---' });

            const branchDetailsPromises = await Promise.allSettled(branchData.map(async (branch: any) => {
                const res = await axios.get(`${API_BASE}/reports/income-statement`, {
                    params: {
                        branchId: branch.id,
                        startDate: dateRange.start,
                        endDate: dateRange.end
                    },
                    ...getAuthHeader()
                });
                return {
                    ...branch,
                    revenue: res.data.totalRevenue,
                    details: res.data.revenues
                };
            }));

            setBranches(branchDetailsPromises.filter((r: any) => r.status === 'fulfilled').map((r: any) => r.value));
        } catch (error) {
            console.error('Error fetching branch revenue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);

    if (loading && branches.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold text-sm">جاري تحليل إيرادات الجهات...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission={['REPORTS_BRANCH_REVENUE_VIEW', 'reportes_branch_revenue_view']}>
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <PageHeader
                icon={APP_ICONS.REPORTS.BRANCH_REVENUE}
                title="إيرادات الجهات"
                description={`تحليل مقارن لمصادر الدخل لكل فرع (${baseCurrency?.code || '---'})`}
                iconSize={24}
            >
                <div className="flex gap-2">
                    <WithPermission permission="REPORTS_BRANCH_REVENUE_EXPORT">
                        <CustomButton
                            variant="outline"
                            onClick={() => {
                                import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                    const exportData = branches.map(b => ({
                                        BranchCode: b.code || '---',
                                        BranchName: b.name,
                                        TotalRevenue: b.revenue
                                    }));
                                    exportData.push({ BranchCode: '', BranchName: 'الإجمالي العام', TotalRevenue: totalRevenue });
                                    exportToExcel(
                                        exportData,
                                        'Branch_Revenue_Report',
                                        ['كود الفرع', 'اسم الفرع', 'إجمالي الإيرادات'],
                                        ['BranchCode', 'BranchName', 'TotalRevenue']
                                    );
                                });
                            }}
                            className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-input text-foreground/80 hover:bg-muted/50 font-black text-xs transition-all"
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={16} className="text-emerald-500" />
                            Excel
                        </CustomButton>
                    </WithPermission>
                    <WithPermission permission="REPORTS_BRANCH_REVENUE_EXPORT">
                        <CustomButton
                            onClick={() => {
                                import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                    const subtitle = dateRange.start && dateRange.end
                                        ? `الفترة من ${dateRange.start} إلى ${dateRange.end}`
                                        : 'كافة الفروع';

                                    exportToPDF(
                                        branches.map(b => ({
                                            BranchCode: b.code || '---',
                                            BranchName: b.name,
                                            TotalRevenue: Number(b.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        })),
                                        'Branch_Revenue_Report',
                                        'إيرادات الجهات',
                                        ['كود الفرع', 'اسم الفرع', 'إجمالي الإيرادات'],
                                        ['BranchCode', 'BranchName', 'TotalRevenue'],
                                        subtitle,
                                        {
                                            TotalRevenue: totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        }
                                    );
                                });
                            }}
                            variant="primary"
                            className="h-11 px-4 text-xs"
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={16} className="text-rose-400" />
                            PDF
                        </CustomButton>
                    </WithPermission>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-muted-foreground font-black text-xs">
                    <APP_ICONS.ACTIONS.CALENDAR size={18} className={theme.accent} />
                    <span>فترة التحليل:</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border h-11">
                    <Input
                        type="date"
                        className={cn("bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-foreground/80 border-none shadow-none focus-visible:ring-0 max-w-[140px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-muted-foreground/40">-</span>
                    <Input
                        type="date"
                        className={cn("bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-foreground/80 border-none shadow-none focus-visible:ring-0 max-w-[140px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
                <CustomButton
                    onClick={fetchData}
                    variant="primary"
                    className="h-11 px-6"
                >
                    <APP_ICONS.ACTIONS.REFRESH size={16} />
                    تحديث المقارنة
                </CustomButton>
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                    <div key={branch.id} className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                        <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl transition-colors", theme.muted, "opacity-20 group-hover:opacity-40")}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2.5 rounded-xl transition-all", theme.muted, theme.accent)}>
                                <APP_ICONS.ACTIONS.GROWTH size={20} />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 transition-colors", theme.accent)}>Branch Revenue</span>
                        </div>

                        <h3 className="text-lg font-black text-foreground/90 mb-1">{branch.name}</h3>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase mb-6">{branch.code || '---'}</p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-border/50 pb-4">
                                <span className="text-xs font-bold text-muted-foreground/80 italic">إجمالي الإيرادات</span>
                                <h2 className="text-2xl font-black font-mono text-emerald-600 leading-none">
                                    {branch.revenue.toLocaleString()}
                                </h2>
                            </div>

                            <div className="pt-2">
                                <p className="text-[9px] font-black text-muted-foreground/60 uppercase mb-3">تفاصيل الإيرادات</p>
                                <div className="space-y-2">
                                    {branch.details.slice(0, 3).map((det: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] font-bold">
                                            <span className="text-muted-foreground">{det.name}</span>
                                            <span className="text-foreground font-mono">{det.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {branch.details.length > 3 && (
                                        <p className="text-[9px] text-muted-foreground/40 italic text-center pt-2">+{branch.details.length - 3} حسابات أخرى</p>
                                    )}
                                    {branch.details.length === 0 && (
                                        <p className="text-[10px] text-muted-foreground/40 italic py-2">لا توجد إيرادات مسجلة</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", theme.primary)}
                                    style={{ width: `${totalRevenue > 0 ? (branch.revenue / totalRevenue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className={cn("text-[10px] font-black mr-4 shrink-0", theme.accent)}>
                                {totalRevenue > 0 ? Math.round((branch.revenue / totalRevenue) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total Footer */}
            <TotalSummary
                icon={APP_ICONS.ACTIONS.GROWTH}
                title="إجمالي إيرادات الصندوق"
                subtitle="Consolidated Family Fund Revenue"
                amount={totalRevenue}
                amountLabel={`Total Base Income (${baseCurrency?.code || '---'})`}
                accentColorClassName={theme.accent}
                borderColorClassName={theme.border}
                shadowColorClassName={theme.shadow}
                iconClassName={cn(theme.primary, theme.shadow)}
            />
        </div>
        </ProtectedRoute>
    );
};

export default BranchRevenuePage;
