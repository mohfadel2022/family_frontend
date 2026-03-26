"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const ExchangeReportPage = () => {
    const theme = usePageTheme();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/exchange-report`, {
                    params: { startDate: dateRange.start, endDate: dateRange.end },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/currencies`, AUTH_HEADER)
            ]);
            setReport(reportRes.data);
            setBaseCurrency(currRes.data.find((c: any) => c.isBase) || { code: '---' });
        } catch (error) {
            console.error('Error fetching exchange report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const currencyCode = baseCurrency?.code || '---';

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => (
                <span className="font-mono text-muted-foreground/80 text-[11px] font-bold">
                    {new Date(row.original.date).toLocaleDateString('ar-AR')}
                </span>
            )
        },
        {
            accessorKey: 'description',
            header: 'البيان والشرح',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-foreground/90">{row.original.description}</span>
            )
        },
        {
            accessorKey: 'accountName',
            header: 'الحساب المتأثر',
            cell: ({ row }) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all",
                    theme.muted,
                    Number(row.original.amount) > 0 ? "text-emerald-600 border-emerald-100" : "text-rose-600 border-rose-100"
                )}>
                    {row.original.accountName}
                </span>
            )
        },
        {
            accessorKey: 'amount',
            headerName: `القيمة (${currencyCode})`,
            header: `القيمة (${currencyCode})`,
            cell: ({ row }) => {
                const amt = Number(row.original.amount);
                return (
                    <div className="text-center">
                        <span className={cn(
                            "font-mono font-black text-xs",
                            amt > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            {amt > 0 ? `+${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )
            }
        }
    ], [theme, currencyCode]);

    if (loading && !report) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold text-sm">جاري تحليل فروقات العملة...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission="REPORTS_CURRENCY_GAINS_VIEW">
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <PageHeader
                    icon={APP_ICONS.REPORTS.EXCHANGE_GAINS}
                    title="فروقات العملة"
                    description="Currency Exchange Gains & Losses"
                    iconSize={24}
                />

                {/* Filters */}
                <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-muted-foreground font-black text-xs">
                        <APP_ICONS.ACTIONS.CALENDAR size={18} className={theme.accent} />
                        <span>فترة التقييم:</span>
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
                        onClick={fetchReport}
                        variant="primary"
                        className="h-11 px-6"
                    >
                        <APP_ICONS.ACTIONS.REFRESH size={16} />
                        تحديث التقرير
                    </CustomButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm text-center relative overflow-hidden group transition-all", theme.border.replace('border-', 'border-').replace('100', '200'))}>
                        <div className={cn("absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-5", theme.primary)}></div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border transition-all", theme.muted, "text-emerald-600", theme.border)}>
                            <APP_ICONS.REPORTS.BRANCH_REVENUE size={20} />
                        </div>
                        <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mb-1.5">أرباح الصرف</p>
                        <h3 className="text-2xl font-black font-mono text-emerald-600">+{report?.summary.gains.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm text-center relative overflow-hidden group transition-all", theme.border.replace('border-', 'border-').replace('100', '200'))}>
                        <div className={cn("absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-5", theme.primary)}></div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border transition-all", theme.muted, "text-rose-600", theme.border)}>
                            <APP_ICONS.REPORTS.BRANCH_EXPENSE size={20} />
                        </div>
                        <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mb-1.5">خسائر الصرف</p>
                        <h3 className="text-2xl font-black font-mono text-rose-600">-{report?.summary.losses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className={cn("p-6 rounded-[2rem] shadow-xl text-center text-white relative overflow-hidden group border shadow-md", theme.primary.replace('bg-', 'bg-').replace('-700', '-900'))}>
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 blur-3xl rounded-full"></div>
                        <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <APP_ICONS.SHARED.GLOBE size={20} />
                        </div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1.5">صافي الفرق ({currencyCode})</p>
                        <h3 className="text-2xl font-black font-mono text-white">{report?.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xs font-black text-foreground/90 uppercase tracking-widest">تفاصيل العمليات المؤثرة</h3>
                        <span className="text-[10px] font-black text-muted-foreground/60 tracking-tight uppercase">Transaction Details</span>
                    </div>

                    <DataTable
                        columns={columns}
                        data={report?.details || []}
                        loading={loading}
                        searchPlaceholder="بحث في العمليات..."
                        exportFileName="Currency_Exchange_Report"
                        noDataMessage="لا توجد فروقات عملة مسجلة في هذه الفترة"
                    />
                </div>

                <div className={cn("p-6 rounded-[2.5rem] border flex items-start gap-4", theme.muted, theme.border)}>
                    <div className={cn("p-3 bg-card rounded-[1.2rem] shadow-sm border", theme.accent, theme.border)}>
                        <APP_ICONS.STATE.INFO size={24} />
                    </div>
                    <div>
                        <h4 className={cn("font-black text-sm", theme.accent.replace('text-', 'text-').replace('-700', '-900'))}>حول أرباح وخسائر العملة</h4>
                        <p className={cn("text-xs leading-relaxed mt-1 font-bold opacity-70", theme.accent.replace('text-', 'text-').replace('-700', '-800'))}>
                            يتم احتساب هذه النتائج بناءً على الفرق بين سعر الصرف وقت تسجيل القيد وسعر الصرف المرجعي للعملة الأساسية. تعكس هذه الأرقام التأثير المباشر لتقلبات السوق على الأرصدة النقدية والذمم المالية الأجنبية.
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ExchangeReportPage;
