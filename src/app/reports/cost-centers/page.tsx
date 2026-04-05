"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { TotalSummary } from '@/components/ui/TotalSummary';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { META_BASE, COST_CENTER_BASE, getAuthHeader } from '@/lib/api';

import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableHead, 
    TableRow, 
    TableCell 
} from '@/components/ui/table';

const CostCentersReportPage = () => {
    const theme = usePageTheme();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);
    const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('ALL');

    const filteredReports = React.useMemo(() => {
        if (selectedCostCenterId === 'ALL') return reports;
        
        const principal = reports.find(r => r.id === selectedCostCenterId);
        if (principal) return principal.secondaryCenters || [];
        
        return reports;
    }, [reports, selectedCostCenterId]);

    // Hierarchy State
    const [expandedPrincipals, setExpandedPrincipals] = useState<Set<string>>(new Set());
    const [selectedSecondary, setSelectedSecondary] = useState<any | null>(null);
    const [detailsData, setDetailsData] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const togglePrincipal = (id: string) => {
        setExpandedPrincipals(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch base currency for display
            const currRes = await axios.get(`${META_BASE}/currencies`, getAuthHeader());
            setBaseCurrency(currRes.data.find((c: any) => c.isBase) || { code: '---' });

            // Fetch summary report
            const res = await axios.get(`${COST_CENTER_BASE}/reports/summary`, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                },
                ...getAuthHeader()
            });

            setReports(res.data);
        } catch (error) {
            console.error('Error fetching cost centers report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (ccId: string) => {
        setLoadingDetails(true);
        try {
            const res = await axios.get(`${COST_CENTER_BASE}/reports/${ccId}/details`, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                },
                ...getAuthHeader()
            });
            setDetailsData(res.data);
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const globalRevenue = filteredReports.reduce((sum: any, r: any) => sum + Number(r.totalRevenue || 0), 0);
    const globalExpense = filteredReports.reduce((sum: any, r: any) => sum + Number(r.totalExpense || 0), 0);
    const globalNet = globalRevenue - globalExpense;

    if (loading && reports.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold text-sm">جاري تحليل بيانات مراكز التكلفة...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission={['REPORTS_COST_CENTERS_VIEW', 'REPORTS_VIEW']}>
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <PageHeader
                    icon={APP_ICONS.ACTIONS.GROWTH}
                    title="تحليل مراكز التكلفة (المشاريع)"
                    description={`مقارنة الإيرادات والمصروفات لكل مشروع أو مركز تكلفة (${baseCurrency?.code || '---'})`}
                    iconSize={24}
                >
                    <div className="flex gap-2">
                        <WithPermission permission="REPORTS_COST_CENTERS_EXPORT">
                            <CustomButton
                                variant="outline"
                                onClick={() => {
                                    import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                        const exportData: any[] = [];
                                        filteredReports.forEach((r: any) => {
                                            const isPrincipal = !r.parentId;
                                            exportData.push({
                                                Code: r.code || '---',
                                                Name: isPrincipal ? `[رئيسي] ${r.name}` : `   └─ ${r.name}`,
                                                Revenue: r.totalRevenue,
                                                Expense: r.totalExpense,
                                                Net: r.netBalance
                                            });
                                            r.secondaryCenters?.forEach((s: any) => {
                                                exportData.push({
                                                    Code: s.code || '---',
                                                    Name: `   └─ ${s.name}`,
                                                    Revenue: s.totalRevenue,
                                                    Expense: s.totalExpense,
                                                    Net: s.netBalance
                                                });
                                            });
                                        });

                                        exportData.push({ Code: '', Name: 'الإجمالي العام', Revenue: globalRevenue, Expense: globalExpense, Net: globalNet });
                                        exportToExcel(
                                            exportData,
                                            'Cost_Centers_Report',
                                            ['الكود', 'المركز/المشروع', 'الإيرادات', 'المصروفات', 'الصافي'],
                                            ['Code', 'Name', 'Revenue', 'Expense', 'Net']
                                        );
                                    });
                                }}
                                className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-input text-foreground/80 hover:bg-muted/50 font-black text-xs transition-all"
                            >
                                <APP_ICONS.ACTIONS.EXPORT size={16} className="text-emerald-500" />
                                Excel
                            </CustomButton>
                        </WithPermission>
                        <WithPermission permission="REPORTS_COST_CENTERS_EXPORT">
                            <CustomButton
                                onClick={() => {
                                    import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                        const selectedCC = selectedCostCenterId !== 'ALL' 
                                            ? (reports.find(r => r.id === selectedCostCenterId) || reports.map(r => r.secondaryCenters).flat().find((s: any) => s?.id === selectedCostCenterId)) 
                                            : null;
                                        const subtitleDate = dateRange.start && dateRange.end
                                            ? `الفترة من ${dateRange.start} إلى ${dateRange.end}`
                                            : 'كافة الفترات';
                                        const subtitle = selectedCC ? `${subtitleDate} - مفلتر بحساب مركز التكلفة: ${selectedCC.name}` : subtitleDate;

                                        const pdfData: any[] = [];
                                        filteredReports.forEach((r: any) => {
                                            const isPrincipal = !r.parentId;
                                            pdfData.push({
                                                Code: r.code || '---',
                                                Name: r.name,
                                                Revenue: Number(r.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                Expense: Number(r.totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                Net: Number(r.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                _rowStyle: isPrincipal ? { isBold: true, bgColor: '#f1f5f9', isSummary: false } : { indent: 18, isSummary: false }
                                            });
                                            r.secondaryCenters?.forEach((s: any) => {
                                                pdfData.push({
                                                    Code: s.code || '---',
                                                    Name: s.name,
                                                    Revenue: Number(s.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                    Expense: Number(s.totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                    Net: Number(s.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                    _rowStyle: { indent: 18, isSummary: false }
                                                });
                                            });
                                        });

                                        exportToPDF(
                                            pdfData,
                                            'Cost_Centers_Report',
                                            'تحليل مراكز التكلفة',
                                            ['الكود', 'المركز/المشروع', 'الإيرادات', 'المصروفات', 'الصافي'],
                                            ['Code', 'Name', 'Revenue', 'Expense', 'Net'],
                                            subtitle,
                                            {
                                                Revenue: globalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                Expense: globalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                                Net: globalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            },
                                            'landscape',
                                            {},
                                            { 0: 1, 1: 4, 2: 1.5, 3: 1.5, 4: 1.5 }
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
                    <div className="flex items-center gap-2 text-muted-foreground font-black text-xs border-r border-border pr-4">
                        <APP_ICONS.NAV.COST_CENTERS size={18} className={theme.accent} />
                        <span>المركز:</span>
                    </div>
                    <div className="w-[300px]">
                        <Select value={selectedCostCenterId} onValueChange={setSelectedCostCenterId}>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border text-xs font-bold" dir="rtl">
                                <SelectValue placeholder="كافة المراكز..." />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="ALL" className="font-black text-xs">كافة المراكز</SelectItem>
                                {reports.map(r => (
                                    <SelectItem key={r.id} value={r.id} className="font-black text-xs text-indigo-700">{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                {/* Table View */}
                {filteredReports.length === 0 ? (
                    <div className="bg-card p-8 rounded-3xl border border-border flex flex-col items-center justify-center space-y-4">
                        <APP_ICONS.ACTIONS.NOT_FOUND className="w-16 h-16 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-bold">لم يتم العثور على بيانات لمراكز التكلفة</p>
                    </div>
                ) : (
                    <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <Table dir="rtl">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-24 text-center font-black text-[10px] uppercase">الكود</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase pl-8">المركز / المشروع</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase">الإيرادات</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase">المصروفات</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase">الصافي</TableHead>
                                    <TableHead className="w-20 text-center font-black text-[10px] uppercase">كشف حساب</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map((report: any) => {
                                    const isExpanded = expandedPrincipals.has(report.id);
                                    const hasChildren = report.secondaryCenters?.length > 0;
                                    const isLoss = report.netBalance < 0;

                                    return (
                                        <React.Fragment key={report.id}>
                                            <TableRow className={cn("group transition-all", isExpanded && "bg-primary/5")}>
                                                <TableCell className="text-center">
                                                    <span className={cn("text-[11px] font-black font-mono tracking-tighter opacity-60", theme.accent)}>{report.code}</span>
                                                </TableCell>
                                                <TableCell className="pl-8">
                                                    <div className="flex items-center gap-3">
                                                        {hasChildren ? (
                                                            <button 
                                                                onClick={() => togglePrincipal(report.id)}
                                                                className={cn("p-1.5 rounded-lg border border-border transition-all", isExpanded ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted/30 text-muted-foreground hover:bg-muted")}
                                                            >
                                                                <APP_ICONS.ACTIONS.CHEVRON_RIGHT size={14} className={cn("transition-transform duration-300", isExpanded && "rotate-90")} />
                                                            </button>
                                                        ) : (
                                                            <div className="w-8" />
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-foreground/80">{report.name}</span>
                                                            {!report.parentId ? (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter">رئيسي</span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-black uppercase tracking-tighter">فرعي</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-black font-mono text-emerald-600 text-sm">
                                                    {Number(report.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-center font-black font-mono text-rose-600 text-sm">
                                                    {Number(report.totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn("text-base font-black font-mono", isLoss ? "text-rose-600" : "text-emerald-600")}>
                                                        {Number(report.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                     <button 
                                                        onClick={() => { setSelectedSecondary(report); fetchDetails(report.id); }}
                                                        className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                                        title="كشف حساب تجميعي"
                                                    >
                                                        <APP_ICONS.ACTIONS.EDIT size={16} />
                                                    </button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Children Rows */}
                                            {isExpanded && report.secondaryCenters.map((sec: any) => (
                                                <TableRow key={sec.id} className="bg-muted/20 border-l-2 border-l-primary/30 group/sec">
                                                    <TableCell className="text-center">
                                                        <span className="text-[10px] font-bold text-muted-foreground/50 font-mono italic">{sec.code}</span>
                                                    </TableCell>
                                                    <TableCell className="pl-8 pr-16 relative">
                                                        <div className="absolute top-1/2 -right-4 w-12 h-px bg-border group-hover/sec:bg-primary/30" />
                                                        <div className="flex items-center gap-2">
                                                            <APP_ICONS.NAV.COST_CENTERS size={14} className="text-muted-foreground/30" />
                                                            <span className="text-[13px] font-bold text-muted-foreground/80">{sec.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold font-mono text-emerald-600/60 text-[13px]">
                                                        {Number(sec.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold font-mono text-rose-600/60 text-[13px]">
                                                        {Number(sec.totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn("text-[13px] font-black font-mono", sec.netBalance < 0 ? "text-rose-600/70" : "text-emerald-600/70")}>
                                                            {Number(sec.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button 
                                                            onClick={() => { setSelectedSecondary(sec); fetchDetails(sec.id); }}
                                                            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover/sec:opacity-100"
                                                            title="كشف حساب المركز"
                                                        >
                                                            <APP_ICONS.NAV.COST_CENTERS size={14} />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Total Summary Footer */}
                {reports.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-12">
                         <TotalSummary
                            icon={APP_ICONS.ACTIONS.GROWTH}
                            title="إجمالي الإيرادات"
                            subtitle="مجموع كل إيرادات المشاريع"
                            amount={globalRevenue}
                            amountLabel={`إيراد (${baseCurrency?.code || '---'})`}
                            accentColorClassName="text-emerald-600"
                            borderColorClassName="border-emerald-500/20"
                            shadowColorClassName="shadow-emerald-500/10"
                            iconClassName="bg-emerald-500 text-white shadow-emerald-500/50"
                        />
                         <TotalSummary
                            icon={APP_ICONS.ACTIONS.LOSS}
                            title="إجمالي المصروفات"
                            subtitle="مجموع كل مصروفات المشاريع"
                            amount={globalExpense}
                            amountLabel={`مصروف (${baseCurrency?.code || '---'})`}
                            accentColorClassName="text-rose-600"
                            borderColorClassName="border-rose-500/20"
                            shadowColorClassName="shadow-rose-500/10"
                            iconClassName="bg-rose-500 text-white shadow-rose-500/50"
                        />
                         <TotalSummary
                            icon={APP_ICONS.NAV.DASHBOARD}
                            title="صافي التكلفة"
                            subtitle="النتيجة الإجمالية للمشاريع"
                            amount={globalNet}
                            amountLabel={`صافي (${baseCurrency?.code || '---'})`}
                            accentColorClassName={globalNet >= 0 ? "text-emerald-600" : "text-rose-600"}
                            borderColorClassName={globalNet >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}
                            shadowColorClassName={globalNet >= 0 ? "shadow-emerald-500/10" : "shadow-rose-500/10"}
                            iconClassName={globalNet >= 0 ? "bg-emerald-500 text-white shadow-emerald-500/50" : "bg-rose-500 text-white shadow-rose-500/50"}
                        />
                    </div>
                )}

                {/* Details Modal */}
                <Dialog open={!!selectedSecondary} onOpenChange={(open) => !open && setSelectedSecondary(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-none shadow-2xl">
                        <DialogHeader className={cn("p-8 pb-6", theme.muted)}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 text-primary rounded-2xl shadow-inner">
                                    <APP_ICONS.NAV.COST_CENTERS size={28} />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black">{selectedSecondary?.name}</DialogTitle>
                                    <DialogDescription className="font-bold opacity-70">كشف العمليات التفصيلي لمركز التكلفة: {selectedSecondary?.code}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden p-8 pt-0">
                            {loadingDetails ? (
                                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                                    <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                                    <p className="text-muted-foreground font-black text-sm">تحميل كشف الحساب...</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[60vh] pr-4" dir="rtl">
                                    {detailsData?.entries?.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-7 p-4 bg-muted/50 rounded-2xl text-[10px] font-black uppercase text-muted-foreground/80 mb-2 sticky top-0 z-10 box-border border border-border/10">
                                                <div className="col-span-1">التاريخ</div>
                                                <div className="col-span-1">رقم السند</div>
                                                <div className="col-span-2">الحساب / البيان</div>
                                                <div className="col-span-1 text-center">العملة</div>
                                                <div className="col-span-1 text-center">مدين</div>
                                                <div className="col-span-1 text-center">دائن</div>
                                            </div>
                                            {detailsData.entries.map((entry: any, i: number) => (
                                                <div key={i} className="grid grid-cols-7 p-4 rounded-xl hover:bg-muted/30 transition-all border border-transparent hover:border-border group">
                                                    <div className="col-span-1 text-[11px] font-mono text-muted-foreground/60">{new Date(entry.date).toLocaleDateString()}</div>
                                                    <div className="col-span-1 text-[11px] font-black">{entry.entryNumber}</div>
                                                    <div className="col-span-2 pr-2">
                                                        <div className="text-[12px] font-black text-foreground/80 leading-none mb-1">{entry.accountName}</div>
                                                        <div className="text-[10px] text-muted-foreground line-clamp-1 italic">{entry.description}</div>
                                                    </div>
                                                    <div className="col-span-1 flex justify-center items-center">
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-muted/60 text-muted-foreground tracking-widest">{entry.currency}</span>
                                                    </div>
                                                    <div className="col-span-1 text-center text-xs font-black font-mono text-emerald-600 flex items-center justify-center">
                                                        {entry.baseCredit > 0 ? entry.baseCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </div>
                                                    <div className="col-span-1 text-center text-xs font-black font-mono text-rose-600 flex items-center justify-center">
                                                        {entry.baseDebit > 0 ? entry.baseDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-40">
                                            <APP_ICONS.ACTIONS.NOT_FOUND size={48} />
                                            <p className="font-black">لا توجد حركات في هذه الفترة</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </div>

                        <Separator />
                        <div className="p-8 flex justify-between items-center bg-muted/5">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">إجمالي الحركة</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-lg font-black font-mono text-emerald-600">{detailsData?.entries?.reduce((s: any, e: any) => s + e.baseCredit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            <span className="text-lg font-black font-mono text-rose-600">{detailsData?.entries?.reduce((s: any, e: any) => s + e.baseDebit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CustomButton onClick={() => setSelectedSecondary(null)}>إغلاق</CustomButton>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
};

export default CostCentersReportPage;
