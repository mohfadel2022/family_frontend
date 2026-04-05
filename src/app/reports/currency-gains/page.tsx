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

const ExchangeReportPage = () => {
    const theme = usePageTheme();
    const [evalDate, setEvalDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/currency-gains`, {
                    params: { date: evalDate },
                    ...getAuthHeader()
                }),
                axios.get(`${API_BASE}/currencies`, getAuthHeader())
            ]);
            setReport(reportRes.data);
            setBaseCurrency(currRes.data.find((c: any) => c.isBase) || { code: '---' });
        } catch (error) {
            console.error('Error fetching unrealized gains report:', error);
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
            accessorKey: 'accountName',
            header: 'الحساب',
            cell: ({ row }) => (
                <div>
                    <span className="text-xs font-black text-foreground/90">{row.original.accountName}</span>
                    <span className="block text-[9px] text-muted-foreground/60 font-mono tracking-widest">{row.original.code}</span>
                </div>
            )
        },
        {
            accessorKey: 'currencyCode',
            header: 'العملة',
            cell: ({ row }) => (
                <span className={cn("px-2 py-1 bg-muted rounded-md text-[10px] font-black uppercase text-foreground/70")}>
                    {row.original.currencyCode}
                </span>
            )
        },
        {
            accessorKey: 'foreignBalance',
            header: 'الرصيد الأجنبي',
            cell: ({ row }) => (
                <span className="font-mono text-[11px] font-bold">
                    {Number(row.original.foreignBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'avgBookRate',
            header: 'متوسط سعر الدفتر',
            cell: ({ row }) => (
                <span className="font-mono text-[11px] text-muted-foreground">
                    {Number(row.original.avgBookRate).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                </span>
            )
        },
        {
            accessorKey: 'currentRate',
            header: 'السعر الحالي',
            cell: ({ row }) => (
                <span className={cn("font-mono text-[11px] font-bold", theme.accent)}>
                    {Number(row.original.currentRate).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                </span>
            )
        },
        {
            accessorKey: 'bookValue',
            header: `القيمة الدفترية (${currencyCode})`,
            cell: ({ row }) => (
                <span className="font-mono text-[11px]">
                    {Number(row.original.bookValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'marketValue',
            header: `القيمة السوقية (${currencyCode})`,
            cell: ({ row }) => (
                <span className={cn("font-mono text-[11px] font-bold", theme.accent)}>
                    {Number(row.original.marketValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'unrealizedPnL',
            header: `الربح/الخسارة (${currencyCode})`,
            cell: ({ row }) => {
                const pnl = Number(row.original.unrealizedPnL);
                const isGain = pnl > 0;
                const isLoss = pnl < 0;
                return (
                    <div className="text-center">
                        <span className={cn(
                            "font-mono font-black text-[12px] px-2 py-1 rounded-lg",
                            isGain ? "text-emerald-600 bg-emerald-500/10" : 
                            isLoss ? "text-rose-600 bg-rose-500/10" : "text-slate-500 bg-slate-500/10"
                        )}>
                            {pnl > 0 ? `+${pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <p className="text-muted-foreground/80 font-bold text-sm">جاري التقييم وحساب فروقات العملة...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission="REPORTS_CURRENCY_GAINS_VIEW">
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <PageHeader
                    icon={APP_ICONS.REPORTS.EXCHANGE_GAINS}
                    title="فروقات العملة (غير محققة)"
                    description="تقييم الأرصدة الأجنبية بناءً على أحدث أسعار الصرف لحساب الأرباح أو الخسائر الدفترية."
                    iconSize={24}
                >
                    <div className="flex gap-2">
                            <CustomButton
                                variant="outline"
                                onClick={() => {
                                    import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                        const exportData = report?.details?.map((r: any) => ({
                                            Account: r.accountName,
                                            Currency: r.currencyCode,
                                            ForeignBalance: r.foreignBalance,
                                            BookRate: r.avgBookRate,
                                            CurrentRate: r.currentRate,
                                            BookValue: r.bookValue,
                                            MarketValue: r.marketValue,
                                            PnL: r.unrealizedPnL
                                        })) || [];

                                        exportData.push({ 
                                            Account: 'الإجمالي العام', 
                                            Currency: '', 
                                            ForeignBalance: '', 
                                            BookRate: '', 
                                            CurrentRate: '', 
                                            BookValue: '', 
                                            MarketValue: '', 
                                            PnL: report?.summary?.total || 0 
                                        });

                                        exportToExcel(
                                            exportData,
                                            'Unrealized_Gains_Report',
                                            ['الحساب', 'العملة', 'الرصيد الأجنبي', 'متوسط سعر الدفتر', 'السعر الحالي', 'القيمة الدفترية', 'القيمة السوقية', 'الربح/الخسارة'],
                                            ['Account', 'Currency', 'ForeignBalance', 'BookRate', 'CurrentRate', 'BookValue', 'MarketValue', 'PnL']
                                        );
                                    });
                                }}
                                className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-input text-foreground/80 hover:bg-muted/50 font-black text-xs transition-all"
                            >
                                <APP_ICONS.ACTIONS.EXPORT size={16} className="text-emerald-500" />
                                Excel
                            </CustomButton>

                            <CustomButton
                                onClick={() => {
                                    import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                        exportToPDF(
                                            (report?.details || []).map((r: any) => ({
                                                Account: r.accountName,
                                                Currency: r.currencyCode,
                                                ForeignBalance: Number(r.foreignBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                BookRate: Number(r.avgBookRate).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                CurrentRate: Number(r.currentRate).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                BookValue: Number(r.bookValue).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                MarketValue: Number(r.marketValue).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                PnL: Number(r.unrealizedPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            })),
                                            'Unrealized_Gains_Report',
                                            'فروقات وتقييم العملة غير المحققة',
                                            ['الحساب', 'العملة', 'الرصيد', 'السعر الدفتري', 'السعر الحالي', 'الدفترية', 'السوقية', 'الربح/الخسارة'],
                                            ['Account', 'Currency', 'ForeignBalance', 'BookRate', 'CurrentRate', 'BookValue', 'MarketValue', 'PnL'],
                                            `تاريخ التقييم: ${evalDate}`,
                                            {
                                                PnL: Number(report?.summary?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
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
                        </div>
                </PageHeader>

                {/* Filters */}
                <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-muted-foreground font-black text-xs">
                        <APP_ICONS.ACTIONS.CALENDAR size={18} className={theme.accent} />
                        <span>تاريخ التقييم (حتى):</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border h-11">
                        <Input
                            type="date"
                            className={cn("bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-foreground/80 border-none shadow-none focus-visible:ring-0 max-w-[140px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                            value={evalDate}
                            onChange={(e) => setEvalDate(e.target.value)}
                        />
                    </div>
                    <CustomButton
                        onClick={fetchReport}
                        variant="primary"
                        className="h-11 px-6"
                    >
                        <APP_ICONS.ACTIONS.REFRESH size={16} />
                        تحديث التقييم
                    </CustomButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm text-center relative overflow-hidden group transition-all hover:shadow-lg", theme.border)}>
                        <div className={cn("absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-10", "bg-emerald-500")}></div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border transition-all", "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                            <APP_ICONS.REPORTS.BRANCH_REVENUE size={20} />
                        </div>
                        <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mb-1.5">أرباح تقييم (غير محققة)</p>
                        <h3 className="text-2xl font-black font-mono text-emerald-600">+{report?.summary?.gains?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</h3>
                    </div>
                    
                    <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm text-center relative overflow-hidden group transition-all hover:shadow-lg", theme.border)}>
                        <div className={cn("absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-10", "bg-rose-500")}></div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border transition-all", "bg-rose-50 text-rose-600 border-rose-100")}>
                            <APP_ICONS.REPORTS.BRANCH_EXPENSE size={20} />
                        </div>
                        <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest mb-1.5">خسائر تقييم (غير محققة)</p>
                        <h3 className="text-2xl font-black font-mono text-rose-600">-{report?.summary?.losses?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</h3>
                    </div>

                    <div className={cn("p-6 rounded-[2rem] shadow-xl text-center text-white relative overflow-hidden group border shadow-md", theme.primary.replace('bg-', 'bg-').replace('-700', '-900'))}>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
                        <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <APP_ICONS.SHARED.GLOBE size={20} />
                        </div>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1.5">صافي الفرق الدفتري ({currencyCode})</p>
                        <h3 className="text-3xl font-black font-mono text-white">
                            {(report?.summary?.total > 0 ? '+' : '')}{report?.summary?.total?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xs font-black text-foreground/90 uppercase tracking-widest">التفاصيل حسب الحساب</h3>
                        <span className="text-[10px] font-black text-muted-foreground/60 tracking-tight uppercase">Valuation Details</span>
                    </div>

                    <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden p-2">
                        <DataTable
                            columns={columns}
                            data={report?.details || []}
                            loading={loading}
                            searchPlaceholder="بحث في الحسابات..."
                            exportFileName="Currency_Exchange_Report"
                            noDataMessage="لا توجد أرصدة أجنبية تحتاج للتقييم"
                        />
                    </div>
                </div>

                <div className={cn("p-6 rounded-[2.5rem] border flex items-start gap-4", theme.muted, theme.border)}>
                    <div className={cn("p-3 bg-card rounded-[1.2rem] shadow-sm border", theme.accent, theme.border)}>
                        <APP_ICONS.STATE.INFO size={24} />
                    </div>
                    <div>
                        <h4 className={cn("font-black text-sm", theme.accent.replace('text-', 'text-').replace('-700', '-900'))}>عن تقييم العملات الأجنبية</h4>
                        <p className={cn("text-xs leading-relaxed mt-1 font-bold opacity-70", theme.accent.replace('text-', 'text-').replace('-700', '-800'))}>
                            تقوم هذه الشاشة بحساب الأرباح والخسائر الدفترية غير المحققة. يتم التقييم بمقارنة القيمة الدفترية للأرصدة (التي سجلت بالسعر التاريخي) مع القيمة السوقية الحالية باستخدام آخر سعر صرف متاح في تاريخ التقييم المحدد.
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ExchangeReportPage;
