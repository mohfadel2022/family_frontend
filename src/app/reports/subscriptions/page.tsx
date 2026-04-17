"use client";

import React, { useState, useEffect, useMemo, useTransition, useDeferredValue } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PageHeader } from '@/components/ui/PageHeader';
import { APP_ICONS } from '@/lib/icons';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

import { API_BASE, getAuthHeader, SUB_BASE } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const AUTH_HEADER = getAuthHeader();

// Fixed colors per calendar year to ensure consistent visual identity across different filter combinations
const YEAR_COLOR_MAP: Record<number, { bg: string, text: string, border: string }> = {
    2019: { bg: 'bg-blue-400',    text: 'text-white', border: 'border-blue-500' },
    2020: { bg: 'bg-indigo-400',  text: 'text-white', border: 'border-indigo-500' },
    2021: { bg: 'bg-violet-400',  text: 'text-white', border: 'border-violet-500' },
    2022: { bg: 'bg-cyan-400',    text: 'text-white', border: 'border-cyan-500' },
    2023: { bg: 'bg-sky-400',     text: 'text-white', border: 'border-sky-500' },
    2024: { bg: 'bg-red-500',    text: 'text-white', border: 'border-red-600' },
    2025: { bg: 'bg-pink-400',    text: 'text-white', border: 'border-pink-500' },
    2026: { bg: 'bg-fuchsia-400', text: 'text-white', border: 'border-fuchsia-500' },
    2027: { bg: 'bg-purple-400',  text: 'text-white', border: 'border-purple-500' },
    2028: { bg: 'bg-blue-500',   text: 'text-white', border: 'border-blue-600' },
    2029: { bg: 'bg-teal-400',    text: 'text-white', border: 'border-teal-500' },
    2030: { bg: 'bg-lime-500',    text: 'text-white', border: 'border-lime-600' },
};

const YEAR_HEX_MAP: Record<number, string> = {
    2019: '#60a5fa', // blue-400
    2020: '#818cf8', // indigo-400
    2021: '#a78bfa', // violet-400
    2022: '#22d3ee', // cyan-400
    2023: '#38bdf8', // sky-400
    2024: '#ef4444', // red-500
    2025: '#f472b6', // pink-400
    2026: '#e879f9', // fuchsia-400
    2027: '#c084fc', // purple-400
    2028: '#3b82f6', // blue-500
    2029: '#2dd4bf', // teal-400
    2030: '#84cc16', // lime-500
};

const getYearColor = (year: number) => {
    return YEAR_COLOR_MAP[year] || { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500' };
};

const getYearHex = (year: number) => {
    return YEAR_HEX_MAP[year] || '#94a3b8'; // slate-400 fallback
};

interface PivotMember {
    id: string;
    name: string;
    status: string;
    affiliationYear: number;
    stoppedAt: string | null;
    stopYearVal: number | null; // Pre-calculated
    subscriptions: Record<number, { amount: number, symbol: string } | number | null>;
    observations: string;
    residenceName: string;
    paymentName: string;
}

const SubscriptionTableCell = React.memo(({ 
    year, 
    member, 
    isPaid, 
    isAffiliatedInOrAfter 
}: { 
    year: number, 
    member: PivotMember, 
    isPaid: boolean, 
    isAffiliatedInOrAfter: boolean 
}) => {
    const isAfterStop = member.stopYearVal && year >= member.stopYearVal;
    
    let cellClass = "";
    let cellContent = null;

    if (isAfterStop && member.status !== 'ACTIVE') {
        cellClass = member.status === 'DECEASED' ? "bg-slate-800" : "bg-amber-500";
    } else {
        const yearTheme = getYearColor(year);
        cellClass = isPaid ? cn(yearTheme.bg, yearTheme.text, "shadow-inner border-y border-white/40") :
            isAffiliatedInOrAfter ? "text-rose-300 font-medium" : "bg-muted/50/30 text-muted-foreground/20";
        
        const subData: any = member.subscriptions[year];
        if (isPaid && subData && typeof subData === 'object') {
            cellContent = (
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-black tracking-tight drop-shadow-sm opacity-90">
                        {subData.amount}
                    </span>
                    <span className="text-[7px] font-black text-white/60 leading-none">
                        {subData.symbol}
                    </span>
                </div>
            );
        }
    }

    return (
        <TableCell key={year} className="text-center p-0 border-l border-border/30 min-w-[75px]">
            <div className={cn(
                "h-full w-full py-3 flex items-center justify-center transition-all min-h-[44px]",
                cellClass
            )}>
                {cellContent}
            </div>
        </TableCell>
    );
});

SubscriptionTableCell.displayName = 'SubscriptionTableCell';

const SubscriptionTableRow = React.memo(({ 
    member, 
    mIdx, 
    filteredYears, 
    theme 
}: { 
    member: PivotMember, 
    mIdx: number, 
    filteredYears: number[], 
    theme: any 
}) => {
    return (
        <TableRow key={member.id} className={cn("group transition-all", mIdx % 2 === 0 ? "bg-white hover:bg-muted/20" : "bg-muted/20 hover:bg-muted/40")}>
            <TableCell className="font-bold text-slate-800 text-sm sticky right-0 bg-card group-hover:bg-muted/50 z-20 border-l border-input/50 py-3 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                {member.name}
            </TableCell>
            <TableCell className="text-center font-mono text-[11px] text-muted-foreground border-l border-input/50 uppercase">
                {member.affiliationYear}
            </TableCell>
            {filteredYears.map(year => (
                <SubscriptionTableCell
                    key={year}
                    year={year}
                    member={member}
                    isPaid={member.subscriptions[year] !== null}
                    isAffiliatedInOrAfter={year >= member.affiliationYear}
                />
            ))}
            <TableCell className="text-right sm:sticky left-0 bg-card group-hover:bg-muted/50 z-20 border-r border-input py-3 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-lg inline-block transition-all",
                    member.status === 'ACTIVE' ? cn(theme.muted, theme.accent) :
                        member.status === 'DECEASED' ? "bg-rose-100 text-rose-600" :
                            "bg-amber-100 text-amber-600"
                )}>
                    {member.observations || (member.status === 'ACTIVE' ? 'نشط' : member.status)}
                </span>
            </TableCell>
        </TableRow>
    );
});

SubscriptionTableRow.displayName = 'SubscriptionTableRow';

interface PivotData {
    years: number[];
    members: PivotMember[];
}

export default function SubscriptionPivotReport() {
    const theme = usePageTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PivotData | null>(null);

    // Helper to get saved filters
    const getSavedFilters = () => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('subscription-pivot-filters');
        return saved ? JSON.parse(saved) : null;
    };

    const savedFilters = getSavedFilters();

    // Filters State
    const [searchTerm, setSearchTerm] = useState(savedFilters?.searchTerm || '');
    const [selectedEntity, setSelectedEntity] = useState<string>(savedFilters?.selectedEntity || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>(savedFilters?.selectedStatus || 'all');
    const [startYear, setStartYear] = useState<string>(savedFilters?.startYear || '');
    const [endYear, setEndYear] = useState<string>(savedFilters?.endYear || '');
    const [affYear, setAffYear] = useState<string>(savedFilters?.affYear || '');
    const [stopYear, setStopYear] = useState<string>(savedFilters?.stopYear || '');
    const [entityFilterType, setEntityFilterType] = useState<'residence' | 'payment'>(savedFilters?.entityFilterType || 'payment');
    const [showFilters, setShowFilters] = useState(false);
    
    // Performance Optimization Hooks
    const [isPending, startTransition] = useTransition();
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [displayLimit, setDisplayLimit] = useState(100);

    useEffect(() => {
        const filters = { searchTerm, selectedEntity, selectedStatus, startYear, endYear, affYear, stopYear, entityFilterType };
        localStorage.setItem('subscription-pivot-filters', JSON.stringify(filters));
    }, [searchTerm, selectedEntity, selectedStatus, startYear, endYear, affYear, stopYear, entityFilterType]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        if (!data) setLoading(true);
        try {
            const res = await axios.get(`${SUB_BASE}/reports/pivot`, AUTH_HEADER);
            const reportData = res.data;
            
            // Pre-calculate stopYearVal for all members to avoid repeated Date object creation during render
            reportData.members = reportData.members.map((m: any) => ({
                ...m,
                stopYearVal: m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null
            }));

            setData(reportData);
            
            // Ensure filters are valid with new data
            if (reportData.years.length > 0) {
                const minYear = reportData.years[0];
                const maxYear = reportData.years[reportData.years.length - 1];
                
                if (!startYear || parseInt(startYear) < minYear || parseInt(startYear) > maxYear) {
                    setStartYear(minYear.toString());
                }
                if (!endYear || parseInt(endYear) > maxYear || parseInt(endYear) < minYear) {
                    setEndYear(maxYear.toString());
                }
            }
        } catch (e) {
            toast.error('خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Removed duplicate mount useEffect

    const filteredYears = useMemo(() => {
        if (!data) return [];
        return data.years.filter(y =>
            (!startYear || y >= parseInt(startYear)) &&
            (!endYear || y <= parseInt(endYear))
        );
    }, [data, startYear, endYear]);

    const entityList = useMemo(() => {
        if (!data) return [];
        const names = data.members.map((m: any) => 
            entityFilterType === 'residence' ? m.residenceName : m.paymentName
        );
        return Array.from(new Set(names)).sort();
    }, [data, entityFilterType]);

    const processedData = useMemo(() => {
        if (!data) return [];

        const membersList = data.members;
        
        // 1. Filter by Search, Status, Branch
        let filtered = membersList.filter((m: PivotMember) => {
            // Use deferredSearchTerm for expensive filtering
            const s = deferredSearchTerm.toLowerCase();
            const nameMatch = m.name.toLowerCase().includes(s);
            const residenceMatch = m.residenceName.toLowerCase().includes(s);
            const paymentMatch = m.paymentName.toLowerCase().includes(s);

            const statusMatch = selectedStatus === 'all' || m.status === selectedStatus;
            
            let affYearMatch = true;
            if (affYear !== 'all' && affYear !== '') {
                affYearMatch = m.affiliationYear === Number(affYear);
            }
            
            let stopYearMatch = true;
            if (stopYear !== 'all' && stopYear !== '') {
                stopYearMatch = m.stopYearVal === Number(stopYear);
            }

            return (nameMatch || residenceMatch || paymentMatch) && statusMatch && affYearMatch && stopYearMatch;
        });

        // 2. Group by current entityFilterType
        const entitiesMap = new Map<string, any[]>();
        filtered.forEach(m => {
            const entityName = entityFilterType === 'residence' ? m.residenceName : m.paymentName;
            if (!entitiesMap.has(entityName)) {
                entitiesMap.set(entityName, []);
            }
            entitiesMap.get(entityName)!.push(m);
        });

        // 3. Filter by selectedEntity name
        let finalGroups = Array.from(entitiesMap.entries()).map(([name, members]) => ({
            entityName: name,
            members
        }));

        if (selectedEntity !== 'all') {
            finalGroups = finalGroups.filter(g => g.entityName === selectedEntity);
        }

        return finalGroups.sort((a, b) => a.entityName.localeCompare(b.entityName));
    }, [data, deferredSearchTerm, selectedStatus, affYear, stopYear, entityFilterType, selectedEntity]);

    // Slice data for display limit to keep DOM manageable
    const displayData = useMemo(() => {
        let totalMembersFetched = 0;
        const result: any[] = [];
        
        for (const entity of processedData) {
            if (totalMembersFetched >= displayLimit) break;
            
            const remaining = displayLimit - totalMembersFetched;
            if (entity.members.length <= remaining) {
                result.push(entity);
                totalMembersFetched += entity.members.length;
            } else {
                result.push({
                    ...entity,
                    members: entity.members.slice(0, remaining),
                    hasMore: true
                });
                totalMembersFetched += remaining;
                break;
            }
        }
        return result;
    }, [processedData, displayLimit]);

    const totalResultsCount = useMemo(() => {
        return processedData.reduce((acc, curr) => acc + curr.members.length, 0);
    }, [processedData]);

    const stats = useMemo(() => {
        let total = 0;
        let collected = 0;
        processedData.forEach((entity: any) => {
            entity.members.forEach((m: any) => {
                total++;
                if (filteredYears.some(y => m.subscriptions[y] !== null)) {
                    collected++;
                }
            });
        });
        return { total, collected, uncollected: total - collected };
    }, [processedData, filteredYears]);

    const yearlyStats = useMemo(() => {
        const stats: Record<number, {
            collected: number,
            uncollected: number,
            active: number,
            inactive: number,
            deceased: number
        }> = {};
        filteredYears.forEach(y => {
            stats[y] = { collected: 0, uncollected: 0, active: 0, inactive: 0, deceased: 0 };
        });

        processedData.forEach((entity: any) => {
            entity.members.forEach((m: PivotMember) => {
                filteredYears.forEach(y => {
                    const isAffiliated = y >= m.affiliationYear;
                    const isPaid = m.subscriptions[y] !== null;
                    const stopYearVal = m.stopYearVal;
                    const isAfterStop = stopYearVal && y >= stopYearVal;

                    if (isAfterStop && m.status !== 'ACTIVE') {
                        if (m.status === 'DECEASED') stats[y].deceased++;
                        else if (m.status === 'INACTIVE') stats[y].inactive++;
                    } else if (isAffiliated) {
                        stats[y].active++;
                        if (isPaid) stats[y].collected++;
                        else stats[y].uncollected++;
                    }
                });
            });
        });
        return stats;
    }, [processedData, filteredYears]);

    const memoizedTable = useMemo(() => {
        if (!data) return null;
        return (
            <div className={cn("transition-all duration-500", (loading || isPending) ? "opacity-50 pointer-events-none blur-[1px]" : "opacity-100")}>
                <div className={cn("bg-card rounded-[2.5rem] border shadow-2xl overflow-hidden mb-4", theme.border, theme.shadow)}>
                    <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        <table className="relative min-w-full w-max border-collapse text-sm">
                            <thead className="bg-background">
                                <tr className={cn("border-b-2", theme.border)}>
                                    <th className="w-[150px] sm:w-[180px] text-right sticky right-0 bg-background z-40 border-l border-input/50 transition-all shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] font-black text-slate-800 p-3">الاسم الكامل</th>
                                    <th className="w-[60px] sm:w-[80px] text-center border-l border-input/50 font-black text-slate-800 p-3">الانتساب</th>
                                    {filteredYears.map(year => {
                                        const yearTheme = getYearColor(year);
                                        return (
                                            <th key={year} className={cn("min-w-[75px] w-[75px] text-center border-l border-input/50 font-black text-white p-3", yearTheme.bg)}>
                                                {year}
                                            </th>
                                        );
                                    })}

                                    <th className="w-[100px] sm:w-[120px] text-right sm:sticky left-0 bg-background z-40 border-r border-input py-3 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] font-black text-slate-800 px-3">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((entity: any) => (
                                    <React.Fragment key={entity.entityName}>
                                        <TableRow className={cn("bg-muted/40", theme.muted)}>
                                            <TableCell
                                                colSpan={3 + filteredYears.length}
                                                className="font-black py-3 px-6 text-slate-800 text-sm tracking-wide bg-gradient-to-l from-slate-100/80 to-transparent"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-2 h-6 rounded-full bg-slate-800")} />
                                                    <span>{entity.entityName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal bg-white/50 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                                                        {entity.members.length} مشترك
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {entity.members.map((member: PivotMember, mIdx: number) => (
                                            <SubscriptionTableRow 
                                                key={member.id}
                                                member={member}
                                                mIdx={mIdx}
                                                filteredYears={filteredYears}
                                                theme={theme}
                                            />
                                        ))}
                                    </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="bg-accent border-t-2 border-input font-black">
                        {/* Summary Rows (skipped here for brevity, keeping existing logic) */}
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="sticky right-0 bg-slate-50 z-30 font-black text-slate-700 border-l border-slate-100/50 text-xs">المشتركون النشطون</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            {filteredYears.map(year => (
                                <TableCell key={year} className="text-center font-bold text-slate-600 text-sm border-l border-input/50">
                                    {yearlyStats[year]?.active || 0}
                                </TableCell>
                            ))}
                            <TableCell className="sticky left-0 bg-slate-50 z-30 border-r border-slate-100/50">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-amber-50/50 hover:bg-amber-50/80 transition-colors border-t border-input/50">
                            <TableCell className="sticky right-0 bg-amber-50 z-30 font-black text-amber-700 border-l border-amber-100/50 text-xs">المتوقفون</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            {filteredYears.map(year => (
                                <TableCell key={year} className="text-center font-bold text-amber-600 text-sm border-l border-input/50">
                                    {yearlyStats[year]?.inactive || 0}
                                </TableCell>
                            ))}
                            <TableCell className="sticky left-0 bg-amber-50 z-30 border-r border-amber-100/50">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors border-t border-input/50">
                            <TableCell className="sticky right-0 bg-rose-50 z-30 font-black text-rose-700 border-l border-rose-100/50 text-xs">المتوفون</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            {filteredYears.map(year => (
                                <TableCell key={year} className="text-center font-bold text-rose-600 text-sm border-l border-input/50">
                                    {yearlyStats[year]?.deceased || 0}
                                </TableCell>
                            ))}
                            <TableCell className="sticky left-0 bg-rose-50 z-30 border-r border-rose-100/50">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors border-t border-input/50">
                            <TableCell className="sticky right-0 bg-emerald-50 z-30 font-black text-emerald-700 border-l border-emerald-100/50 text-xs">إجمالي المحصلين</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            {filteredYears.map(year => (
                                <TableCell key={year} className="text-center font-black text-emerald-600 text-sm border-l border-input/50">
                                    {yearlyStats[year]?.collected || 0}
                                </TableCell>
                            ))}
                            <TableCell className="sticky left-0 bg-emerald-50 z-30 border-r border-emerald-100/50">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors border-t border-input/50">
                            <TableCell className="sticky right-0 bg-rose-50 z-30 font-black text-rose-700 border-l border-rose-100/50 text-xs">إجمالي غير المحصلين</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            {filteredYears.map(year => (
                                <TableCell key={year} className="text-center font-black text-rose-500 text-sm border-l border-input/50">
                                    {yearlyStats[year]?.uncollected || 0}
                                </TableCell>
                            ))}
                                <TableCell className="sticky left-0 bg-rose-50 z-30 border-r border-slate-100/50">-</TableCell>
                            </TableRow>
                        </tfoot>
                    </table>
                </div>
            </div>

        {totalResultsCount > displayLimit && (
            <div className="flex justify-center mb-8">
                <CustomButton 
                    onClick={() => setDisplayLimit(prev => prev + 200)}
                    variant="outline"
                    className="rounded-2xl border-indigo-200 bg-indigo-50/30 text-indigo-600 font-black px-10 h-12 hover:bg-indigo-50"
                >
                    عرض المزيد ({totalResultsCount - displayLimit} مشترك إضافي)
                </CustomButton>
            </div>
        )}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-6 bg-card rounded-3xl border border-input shadow-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-100 rounded" />
                <span className="text-[11px] font-black text-muted-foreground/80 uppercase">مربعات ملونة: مسدد (لون خاص لكل سنة)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-rose-300 font-black text-[11px]">---</span>
                <span className="text-[11px] font-black text-muted-foreground/80 uppercase">مستحق (غير مسدد)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground/20 font-black text-[11px]">---</span>
                <span className="text-[11px] font-black text-muted-foreground/80 uppercase">قبل تاريخ الانتساب الرسمي</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-800 rounded flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold tracking-tighter">RIP</span>
                </div>
                <span className="text-[11px] font-black text-muted-foreground/80 uppercase">حالة وفاة (اعتبارا من تلك السنة)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent border border-input rounded flex items-center justify-center">
                    <span className="text-[7px] text-muted-foreground/60 font-bold tracking-tighter">OFF</span>
                </div>
                <span className="text-[11px] font-black text-muted-foreground/80 uppercase">حالة توقف (اعتبارا من تلك السنة)</span>
            </div>
            <div className="mr-auto flex items-center gap-6">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border", theme.muted, theme.border, theme.accent)}>
                    <APP_ICONS.MODULES.MEMBERS size={16} />
                    <span className="text-xs font-black uppercase">الإجمالي: {stats.total}</span>
                </div>
            </div>
        </div>
    </div>
        );
    }, [data, loading, isPending, theme, filteredYears, displayData, yearlyStats, stats, displayLimit, totalResultsCount]);

    const handleExportExcel = () => {
        if (!data) return;

        const headers = ['الجهة', 'الاسم', 'الانتساب', ...filteredYears.map(y => y.toString()), 'الملاحظات'];
        const keys = ['entity', 'name', 'affiliation', ...filteredYears.map(y => y.toString()), 'obs'];

        const exportRows: any[] = [];
        processedData.forEach((entity: any) => {
            entity.members.forEach((m: any) => {
                const row: any = {
                    entity: entity.entityName,
                    name: m.name,
                    affiliation: m.affiliationYear,
                    obs: m.observations
                };
                filteredYears.forEach(y => {
                    const val: any = m.subscriptions[y];
                    const stopDate = m.stoppedAt ? new Date(m.stoppedAt) : null;
                    const stopYearVal = stopDate ? stopDate.getFullYear() : null;
                    const isAfterStop = stopYearVal && y >= stopYearVal;
                    
                    if (isAfterStop && m.status !== 'ACTIVE') {
                        row[y.toString()] = m.status === 'DECEASED' ? 'RIP' : 'OFF';
                    } else if (val !== null) {
                        if (typeof val === 'object') {
                            row[y.toString()] = `${val.amount} ${val.symbol}`;
                        } else {
                            row[y.toString()] = ''; // Only show text for collections
                        }
                    } else {
                        row[y.toString()] = '';
                    }
                });
                exportRows.push(row);
            });
        });

        const excelSummaryLabels = [
            { key: 'active', label: 'إجمالي المشتركين النشطين' },
            { key: 'inactive', label: 'إجمالي المتوقفين' },
            { key: 'deceased', label: 'إجمالي المتوفين' },
            { key: 'collected', label: 'إجمالي المحصلين' },
            { key: 'uncollected', label: 'إجمالي غير المحصلين' }
        ];

        excelSummaryLabels.forEach(sLabel => {
            const sRow: any = { entity: sLabel.label, name: '-', affiliation: '-', obs: '-' };
            filteredYears.forEach(y => {
                sRow[y.toString()] = yearlyStats[y][sLabel.key as keyof typeof yearlyStats[number]];
            });
            exportRows.push(sRow);
        });

        const filename = `Subscriptions_Pivot_${selectedEntity !== 'all' ? `${selectedEntity}_` : ''}${new Date().toISOString().split('T')[0]}`;
        exportToExcel(exportRows, filename, headers, keys);
    };

    const handleExportPDF = () => {
        if (!data) return;

        const headers = ['الاسم الكامل', ...filteredYears.map(y => y.toString())];
        const keys = ['name', ...filteredYears.map(y => y.toString())];

        const columnAligns: Record<number, 'left' | 'center' | 'right'> = {
            0: 'right'
        };
        filteredYears.forEach((_, idx) => {
            columnAligns[idx + 1] = 'center';
        });

        const globalStats: Record<number, any> = {};
        filteredYears.forEach(y => {
            globalStats[y] = { collected: 0, uncollected: 0, active: 0, inactive: 0, deceased: 0 };
        });

        // const pdfYearBgColors = [
        //     '#2563eb', // Blue 600
        //     '#059669', // Emerald 600
        //     '#d97706', // Amber 600
        //     '#4f46e5', // Indigo 600
        //     '#e11d48', // Rose 600
        //     '#7c3aed', // Violet 600
        //     '#0891b2', // Cyan 600
        //     '#db2777', // Pink 600
        //     '#16a34a', // Green 600
        //     '#9333ea', // Purple 600
        // ];

        const sections = processedData.map((entity: any) => {
            const entityRows: any[] = [];
            const entityStats: Record<number, any> = {};
            filteredYears.forEach(y => {
                entityStats[y] = { collected: 0, uncollected: 0, active: 0, inactive: 0, deceased: 0 };
            });

            entity.members.forEach((m: any) => {
                const row: any = { name: m.name };
                filteredYears.forEach(y => {
                    const isAffiliated = y >= m.affiliationYear;
                    const isPaid = m.subscriptions[y] !== null;
                    const stopDate = m.stoppedAt ? new Date(m.stoppedAt) : null;
                    const stopYearVal = stopDate ? stopDate.getFullYear() : null;
                    const isAfterStop = stopYearVal && y >= stopYearVal;

                    if (isAfterStop && m.status !== 'ACTIVE') {
                        if (m.status === 'DECEASED') {
                            entityStats[y].deceased++;
                            globalStats[y].deceased++;
                        } else {
                            entityStats[y].inactive++;
                            globalStats[y].inactive++;
                        }
                        row[y.toString()] = { 
                            text: '', 
                            bgColor: m.status === 'DECEASED' ? '#1e293b' : '#f59e0b' // Slate-900 / Amber-500 (Bolder OFF)
                        };
                    } else if (isAffiliated) {
                        entityStats[y].active++;
                        globalStats[y].active++;
                        if (isPaid) {
                            entityStats[y].collected++;
                            globalStats[y].collected++;
                            row[y.toString()] = { 
                                text: '', 
                                bgColor: getYearHex(y)
                            };
                        } else {
                            entityStats[y].uncollected++;
                            globalStats[y].uncollected++;
                            row[y.toString()] = { 
                                text: '', 
                                bgColor: '' // Only color collected
                            };
                        }
                    } else {
                        row[y.toString()] = '';
                    }
                });
                entityRows.push(row);
            });

            // Summary row labels for Arabic with color boxes instead of full backgrounds
            const summaryRowLabels = [
                { key: 'active', label: 'إجمالي المشتركين النشطين', boxColor: '#059669' }, // emerald-600
                { key: 'collected', label: 'إجمالي المحصلين', boxColor: '#2563eb' }, // blue-600
                { key: 'uncollected', label: 'إجمالي غير المحصلين', boxColor: '#fff' }, // indigo-600
                { key: 'inactive', label: 'إجمالي المتوقفين', boxColor: '#d97706' }, // amber-600
                { key: 'deceased', label: 'إجمالي المتوفين', boxColor: '#1e293b' } // rose-600
            ];

            summaryRowLabels.forEach(sLabel => {
                const sRow: any = { 
                    name: sLabel.label,
                    _rowStyle: { font: 'AlmaraiBold' } // Background removed
                };
                filteredYears.forEach(y => {
                    const val = entityStats[y][sLabel.key as keyof typeof entityStats[number]];
                    const boxColor = sLabel.key === 'collected' ? getYearHex(y) : sLabel.boxColor;
                    sRow[y.toString()] = { text: val, colorBox: boxColor };
                });
                entityRows.push(sRow);
            });

            return {
                title: `تقرير اشتراكات: ${entity.entityName}`,
                subtitle: `الفترة: ${startYear || 'البداية'} - ${endYear || 'النهاية'}`,
                headers,
                keys,
                data: entityRows
            };
        });

        // Global Summary Page
        const globalSummaryRows: any[] = [];
        [
            { key: 'active', label: 'المجموع العام للمشتركين النشطين', boxColor: '#059669' }, 
            { key: 'collected', label: 'المجموع العام للمحصلين', boxColor: '#2563eb' }, 
            { key: 'uncollected', label: 'المجموع العام لغير المحصلين', boxColor: '#4f46e5' }, 
            { key: 'inactive', label: 'المجموع العام للمتوقفين', boxColor: '#d97706' }, 
            { key: 'deceased', label: 'المجموع العام للمتوفين', boxColor: '#e11d48' } 
        ].forEach(sLabel => {
            const sRow: any = { 
                name: sLabel.label,
                _rowStyle: { font: 'AlmaraiBold' } // Background removed
            };
            filteredYears.forEach(y => {
                const val = globalStats[y][sLabel.key];
                const boxColor = sLabel.key === 'collected' ? getYearHex(y) : sLabel.boxColor;
                sRow[y.toString()] = { text: val, colorBox: boxColor };
            });
            globalSummaryRows.push(sRow);
        });

        sections.push({
            title: 'الملخص العام النهائي',
            subtitle: 'إجماليات جميع الجهات',
            headers,
            keys,
            data: globalSummaryRows
        });

        // Year column starts at index 1 (index 0 = name). Apply year hex color to each header.
        const columnStyles: Record<number, string> = {};
        filteredYears.forEach((y, idx) => {
            columnStyles[idx + 1] = getYearHex(y);
        });


        const filename = `Subscriptions_Pivot_${selectedEntity}_${new Date().toLocaleString().split(',')[0]}`;
        
                    
        exportToPDF(
            [],
            filename,
            'تقرير اشتراكات الأعضاء المطور',
            headers,
            keys,
            '',
            null,
            'portrait',
            columnStyles,
            { 0: 4 },
            columnAligns,
            sections
        );
    };

    // Full page loader only on initial load
    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-700">
                <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-black animate-pulse tracking-tight">جاري إعداد جدول الاشتراكات المختصر...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <ProtectedRoute permission="REPORTS_SUBSCRIPTIONS_VIEW">
        <div className="max-w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <PageHeader
                icon={APP_ICONS.REPORTS.SUBSCRIPTION_PIVOT}
                title="تقرير اشتراكات الأعضاء المطور"
                description="جدول زمني متقدم مع فلاتر ذكية وتنسيق ملون للسنوات"
            >
                <div className="flex items-center gap-3">
                    <CustomButton
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        className={cn("h-11 rounded-2xl gap-2 font-bold transition-all", showFilters && cn(theme.muted, "border-indigo-200", theme.accent))}
                    >
                        <APP_ICONS.ACTIONS.FILTER size={18} />
                        {showFilters ? 'إخفاء الفلاتر' : 'تصفية البيانات'}
                    </CustomButton>
                    <WithPermission permission="REPORTS_EXPORT">
                        <CustomButton
                            onClick={handleExportPDF}
                            variant="outline"
                            className={cn("h-11 rounded-2xl gap-2 font-bold transition-all", theme.muted, "text-rose-600 hover:bg-rose-50 border-rose-200")}
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={20} />
                            PDF
                        </CustomButton>
                    </WithPermission>
                    <WithPermission permission="REPORTS_EXPORT">
                        <CustomButton
                            onClick={handleExportExcel}
                            variant="outline"
                            className={cn("h-11 rounded-2xl gap-2 font-bold transition-all", theme.muted, "text-emerald-600 hover:bg-emerald-50 border-emerald-200")}
                        >
                            <APP_ICONS.ACTIONS.SPREADSHEET size={20} />
                            Excel
                        </CustomButton>
                    </WithPermission>
                    {loading && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in zoom-in-95 duration-200">
                        <APP_ICONS.STATE.LOADING className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">جاري التحديث...</span>
                    </div>
                )}
            </div>
        </PageHeader>

            {/* Filters Section - Now always in DOM but hidden via CSS for instant toggle */}
            <div className={cn(
                "bg-card p-6 rounded-[2rem] border shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transition-all duration-300 origin-top overflow-hidden",
                showFilters ? "opacity-100 max-h-[1000px] mb-6 translate-y-0" : "opacity-0 max-h-0 py-0 border-0 mb-0 -translate-y-4 pointer-events-none",
                theme.border, 
                theme.shadow
            )}>
                <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">نظام تجميع الجهات</label>
                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border items-center h-10">
                        <button
                            onClick={() => setEntityFilterType('residence')}
                            className={cn(
                                "flex-1 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2",
                                entityFilterType === 'residence' ? "bg-card text-indigo-600 shadow-sm border border-border" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <APP_ICONS.MODULES.ENTITIES size={12} />
                            حسب السكن
                        </button>
                        <button
                            onClick={() => setEntityFilterType('payment')}
                            className={cn(
                                "flex-1 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2",
                                entityFilterType === 'payment' ? "bg-card text-amber-600 shadow-sm border border-border" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <APP_ICONS.MODULES.ACCOUNTS size={12} />
                            حسب الدفع
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">بحث نصي</label>
                    <div className="relative">
                            <APP_ICONS.ACTIONS.SEARCH className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                        <Input
                            placeholder="اسم العضو أو الجهة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 pr-9 rounded-xl border-border bg-muted/50 focus:bg-card transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">الجهة</label>
                    <Select value={selectedEntity} onValueChange={(val) => startTransition(() => setSelectedEntity(val))}>
                        <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {entityList.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">حالة العضو</label>
                    <Select value={selectedStatus} onValueChange={(val) => startTransition(() => setSelectedStatus(val))}>
                        <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="ACTIVE">نشط</SelectItem>
                            <SelectItem value="INACTIVE">متوقف</SelectItem>
                            <SelectItem value="DECEASED">متوفى</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">نطاق السنوات المعروضة</label>
                    <div className="flex gap-2">
                        <Select value={startYear} onValueChange={(val) => startTransition(() => setStartYear(val))}>
                            <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.years.map(y => (
                                    <SelectItem key={`start-${y}`} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center text-muted-foreground"><ArrowLeft  size={14}/></div>
                        <Select value={endYear} onValueChange={(val) => startTransition(() => setEndYear(val))}>
                            <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.years.map(y => (
                                    <SelectItem key={`end-${y}`} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">سنة الانتساب</label>
                    <Select value={affYear} onValueChange={(val) => startTransition(() => setAffYear(val))}>
                        <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm">
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {data.years.map(y => (
                                <SelectItem key={`aff-${y}`} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">سنة التوقف/الوفاة</label>
                    <Select value={stopYear} onValueChange={(val) => startTransition(() => setStopYear(val))}>
                        <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm">
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {data.years.map(y => (
                                <SelectItem key={`stop-${y}`} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {memoizedTable}
        </div>
        </ProtectedRoute>
    );
}
