"use client";

import React, { useState, useEffect, useMemo } from 'react';
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

// Year colors palette
const YEAR_COLORS: Record<number, { bg: string, text: string, border: string }> = {
    // We can generate these or define them. Let's define some or use a generator.
};

const getYearColor = (year: number) => {
    const colors = [
        { bg: 'bg-blue-400', text: 'text-white', border: 'border-blue-500' },
        { bg: 'bg-emerald-400', text: 'text-white', border: 'border-emerald-500' },
        { bg: 'bg-amber-400', text: 'text-white', border: 'border-amber-500' },
        { bg: 'bg-indigo-400', text: 'text-white', border: 'border-indigo-500' },
        { bg: 'bg-rose-400', text: 'text-white', border: 'border-rose-500' },
        { bg: 'bg-violet-400', text: 'text-white', border: 'border-violet-500' },
        { bg: 'bg-cyan-400', text: 'text-white', border: 'border-cyan-500' },
        { bg: 'bg-pink-400', text: 'text-white', border: 'border-pink-500' },
        { bg: 'bg-green-400', text: 'text-white', border: 'border-green-500' },
        { bg: 'bg-purple-400', text: 'text-white', border: 'border-purple-500' },
    ];
    return colors[year % colors.length];
};

interface PivotMember {
    id: string;
    name: string;
    status: string;
    affiliationYear: number;
    stoppedAt: string | null;
    subscriptions: Record<number, number | null>;
    observations: string;
}

interface PivotEntity {
    entityName: string;
    members: PivotMember[];
}

interface PivotData {
    years: number[];
    data: PivotEntity[];
}

export default function SubscriptionPivotReport() {
    const theme = usePageTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PivotData | null>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntity, setSelectedEntity] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [startYear, setStartYear] = useState<string>('');
    const [endYear, setEndYear] = useState<string>('');
    const [affYear, setAffYear] = useState<string>('');
    const [stopYear, setStopYear] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Load filters from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('subscription-pivot-filters');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
                if (parsed.selectedEntity) setSelectedEntity(parsed.selectedEntity);
                if (parsed.selectedStatus) setSelectedStatus(parsed.selectedStatus);
                if (parsed.startYear) setStartYear(parsed.startYear);
                if (parsed.endYear) setEndYear(parsed.endYear);
                if (parsed.affYear) setAffYear(parsed.affYear);
                if (parsed.stopYear) setStopYear(parsed.stopYear);
                if (parsed.showFilters !== undefined) setShowFilters(parsed.showFilters);
            } catch (e) {
                console.error('Error parsing saved filters', e);
            }
        }
        fetchReport();
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (!loading) {
            const filters = {
                searchTerm,
                selectedEntity,
                selectedStatus,
                startYear,
                endYear,
                affYear,
                stopYear,
                showFilters
            };
            localStorage.setItem('subscription-pivot-filters', JSON.stringify(filters));
        }
    }, [searchTerm, selectedEntity, selectedStatus, startYear, endYear, affYear, stopYear, showFilters, loading]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${SUB_BASE}/reports/pivot`, AUTH_HEADER);
            setData(res.data);

            // Only set defaults if startYear/endYear are still empty (meaning no localStorage found)
            if (res.data.years.length > 0) {
                const saved = localStorage.getItem('subscription-pivot-filters');
                const hasSavedYears = saved && JSON.parse(saved).startYear;

                if (!hasSavedYears) {
                    setStartYear(res.data.years[0].toString());
                    setEndYear(res.data.years[res.data.years.length - 1].toString());
                }
            }
        } catch (e) {
            toast.error('خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const filteredYears = useMemo(() => {
        if (!data) return [];
        return data.years.filter(y =>
            (!startYear || y >= parseInt(startYear)) &&
            (!endYear || y <= parseInt(endYear))
        );
    }, [data, startYear, endYear]);

    const filteredData = useMemo(() => {
        if (!data) return [];

        return data.data
            .filter(e => selectedEntity === 'all' || e.entityName === selectedEntity)
            .map(entity => ({
                ...entity,
                members: entity.members.filter(m => {
                    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        entity.entityName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
                    const matchesAff = !affYear || m.affiliationYear === parseInt(affYear);
                    const matchesStop = !stopYear || (m.stoppedAt && new Date(m.stoppedAt).getFullYear() === parseInt(stopYear));

                    return matchesSearch && matchesStatus && matchesAff && matchesStop;
                })
            }))
            .filter(entity => entity.members.length > 0);
    }, [data, searchTerm, selectedEntity, selectedStatus, affYear, stopYear]);

    const stats = useMemo(() => {
        let total = 0;
        let collected = 0;
        filteredData.forEach(entity => {
            entity.members.forEach(m => {
                total++;
                if (filteredYears.some(y => m.subscriptions[y] !== null)) {
                    collected++;
                }
            });
        });
        return { total, collected, uncollected: total - collected };
    }, [filteredData, filteredYears]);

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

        filteredData.forEach(entity => {
            entity.members.forEach(m => {
                filteredYears.forEach(y => {
                    const isAffiliated = y >= m.affiliationYear;
                    const isPaid = m.subscriptions[y] !== null;

                    const stopDate = m.stoppedAt ? new Date(m.stoppedAt) : null;
                    const stopYearVal = stopDate ? stopDate.getFullYear() : null;
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
    }, [filteredData, filteredYears]);

    const handleExportExcel = () => {
        if (!data) return;

        const headers = ['الجهة', 'الاسم', 'الانتساب', ...filteredYears.map(y => y.toString()), 'الملاحظات'];
        const keys = ['entity', 'name', 'affiliation', ...filteredYears.map(y => y.toString()), 'obs'];

        const exportRows: any[] = [];
        filteredData.forEach(entity => {
            entity.members.forEach(m => {
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

        const pdfYearBgColors = [
            '#2563eb', // Blue 600
            '#059669', // Emerald 600
            '#d97706', // Amber 600
            '#4f46e5', // Indigo 600
            '#e11d48', // Rose 600
            '#7c3aed', // Violet 600
            '#0891b2', // Cyan 600
            '#db2777', // Pink 600
            '#16a34a', // Green 600
            '#9333ea', // Purple 600
        ];

        const sections = filteredData.map(entity => {
            const entityRows: any[] = [];
            const entityStats: Record<number, any> = {};
            filteredYears.forEach(y => {
                entityStats[y] = { collected: 0, uncollected: 0, active: 0, inactive: 0, deceased: 0 };
            });

            entity.members.forEach(m => {
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
                                bgColor: pdfYearBgColors[y % pdfYearBgColors.length] 
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

            // Summary row labels for Arabic with bold category-specific backgrounds
            const summaryRowLabels = [
                { key: 'active', label: 'إجمالي المشتركين النشطين', bgColor: '#d1fae5' }, // emerald-100/200
                { key: 'collected', label: 'إجمالي المحصلين', bgColor: '#dbeafe' }, // sky-100/200
                { key: 'uncollected', label: 'إجمالي غير المحصلين', bgColor: '#e0e7ff' }, // indigo-100/200
                { key: 'inactive', label: 'إجمالي المتوقفين', bgColor: '#fef3c7' }, // amber-100/200
                { key: 'deceased', label: 'إجمالي المتوفين', bgColor: '#ffe4e6' } // rose-100/200
            ];

            summaryRowLabels.forEach(sLabel => {
                const sRow: any = { 
                    name: sLabel.label,
                    _rowStyle: { bgColor: sLabel.bgColor, font: 'AlmaraiBold' }
                };
                filteredYears.forEach(y => {
                    sRow[y.toString()] = entityStats[y][sLabel.key as keyof typeof entityStats[number]];
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
            { key: 'active', label: 'المجموع العام للمشتركين النشطين', bgColor: '#d1fae5' }, 
            { key: 'collected', label: 'المجموع العام للمحصلين', bgColor: '#dbeafe' }, 
            { key: 'uncollected', label: 'المجموع العام لغير المحصلين', bgColor: '#e0e7ff' }, 
            { key: 'inactive', label: 'المجموع العام للمتوقفين', bgColor: '#fef3c7' }, 
            { key: 'deceased', label: 'المجموع العام للمتوفين', bgColor: '#ffe4e6' } 
        ].forEach(sLabel => {
            const sRow: any = { 
                name: sLabel.label,
                _rowStyle: { bgColor: sLabel.bgColor, font: 'AlmaraiBold' }
            };
            filteredYears.forEach(y => {
                sRow[y.toString()] = globalStats[y][sLabel.key];
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

        const columnStyles: Record<number, string> = {};
        // We don't need columnStyles for the grid anymore since we use object values,
        // but we might want them for the header. Currently exportUtils uses them for the whole column.
        // Let's keep them for header consistency if needed, or remove.

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold animate-pulse">جاري إعداد جدول الاشتراكات المختصر...</p>
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
                </div>
            </PageHeader>

            {/* Filters Section */}
            {showFilters && (
                <div className={cn("bg-card p-6 rounded-[2rem] border shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300", theme.border, theme.shadow)}>
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
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger className="h-10 rounded-xl border-border bg-muted/50 font-bold text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                {data.data.map(e => (
                                    <SelectItem key={e.entityName} value={e.entityName}>{e.entityName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase mr-1">حالة العضو</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                            <Select value={startYear} onValueChange={setStartYear}>
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
                            <Select value={endYear} onValueChange={setEndYear}>
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
                        <Select value={affYear} onValueChange={setAffYear}>
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
                        <Select value={stopYear} onValueChange={setStopYear}>
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
            )}

            <div className={cn("bg-card rounded-[2.5rem] border shadow-2xl overflow-hidden", theme.border, theme.shadow)}>
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    <Table className="relative min-w-max border-collapse">
                        <TableHeader>
                            <TableRow className={cn("border-b-2", theme.border)}>
                                <TableHead className="w-[180px] text-right sticky right-0 bg-background z-40 border-l border-input/50 transition-all shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] font-black text-slate-800">الاسم الكامل</TableHead>
                                <TableHead className="w-[80px] text-center border-l border-input/50 font-black text-slate-800">الانتساب</TableHead>
                                {filteredYears.map(year => (
                                    <TableHead key={year} className="w-[60px] text-center border-l border-input/50 font-black text-slate-800">
                                        {year}
                                    </TableHead>
                                ))}
                                <TableHead className="w-[120px] text-right sticky left-0 bg-background z-40 border-r border-input py-3 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] font-black text-slate-800">الملاحظات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map(entity => (
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
                                    {entity.members.map(member => (
                                        <TableRow key={member.id} className="group hover:bg-muted/30 transition-all">
                                            <TableCell className="font-bold text-slate-800 text-sm sticky right-0 bg-card group-hover:bg-muted/50 z-20 border-l border-input/50 py-3 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                                                {member.name}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-muted-foreground border-l border-input/50 uppercase">
                                                {member.affiliationYear}
                                            </TableCell>
                                            {filteredYears.map(year => {
                                                const isPaid = member.subscriptions[year] !== null;
                                                const isAffiliatedInOrAfter = year >= member.affiliationYear;
                                                
                                                const stopDate = member.stoppedAt ? new Date(member.stoppedAt) : null;
                                                const stopYearVal = stopDate ? stopDate.getFullYear() : null;
                                                const isAfterStop = stopYearVal && year >= stopYearVal;

                                                let cellClass = "";
                                                let cellContent = null;

                                                if (isAfterStop && member.status !== 'ACTIVE') {
                                                    cellClass = member.status === 'DECEASED' ? "bg-slate-800 text-white" : "bg-accent text-accent-foreground";
                                                    cellContent = null; // Removed RIP/OFF text
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
                                                    } else {
                                                        cellContent = null; // Removed "---" text
                                                    }
                                                }

                                                return (
                                                    <TableCell key={year} className="text-center p-0 border-l border-border/30">
                                                        <div className={cn(
                                                            "h-full w-full py-3 flex items-center justify-center transition-all",
                                                            cellClass
                                                        )}>
                                                            {cellContent}
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-right sticky left-0 bg-card group-hover:bg-muted/50 z-20 border-r border-input py-3 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
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
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                        <TableHeader className="bg-accent border-t-2 border-input">
                            {/* Active Row */}
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                                <TableCell className="sticky right-0 bg-slate-50 z-30 font-black text-slate-700 border-l border-slate-100/50 text-xs">المشتركون النشطون</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-bold text-slate-600 text-sm border-l border-input/50">
                                        {yearlyStats[year].active}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-slate-50 z-30 border-r border-slate-100/50">-</TableCell>
                            </TableRow>
                            {/* Inactive Row */}
                            <TableRow className="bg-amber-50/50 hover:bg-amber-50/80 transition-colors border-t border-input/50">
                                <TableCell className="sticky right-0 bg-amber-50 z-30 font-black text-amber-700 border-l border-amber-100/50 text-xs">المتوقفون</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-bold text-amber-600 text-sm border-l border-input/50">
                                        {yearlyStats[year].inactive}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-amber-50 z-30 border-r border-amber-100/50">-</TableCell>
                            </TableRow>
                            {/* Deceased Row */}
                            <TableRow className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors border-t border-input/50">
                                <TableCell className="sticky right-0 bg-rose-50 z-30 font-black text-rose-700 border-l border-rose-100/50 text-xs">المتوفون</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-bold text-rose-600 text-sm border-l border-input/50">
                                        {yearlyStats[year].deceased}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-rose-50 z-30 border-r border-rose-100/50">-</TableCell>
                            </TableRow>
                            {/* Collected Row */}
                            <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors border-t border-input/50">
                                <TableCell className="sticky right-0 bg-emerald-50 z-30 font-black text-emerald-700 border-l border-emerald-100/50 text-xs">إجمالي المحصلين</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-black text-emerald-600 text-sm border-l border-input/50">
                                        {yearlyStats[year].collected}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-emerald-50 z-30 border-r border-emerald-100/50">-</TableCell>
                            </TableRow>
                            {/* Uncollected Row */}
                            <TableRow className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors border-t border-input/50">
                                <TableCell className="sticky right-0 bg-rose-50 z-30 font-black text-rose-700 border-l border-rose-100/50 text-xs">إجمالي غير المحصلين</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-black text-rose-500 text-sm border-l border-input/50">
                                        {yearlyStats[year].uncollected}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-rose-50 z-30 border-r border-rose-100/50">-</TableCell>
                            </TableRow>
                        </TableHeader>
                    </Table>
                </div>
            </div>

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
                    {/* <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black uppercase">المحصلين: {stats.collected}</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                        <div className="w-2 h-2 bg-rose-500 rounded-full" />
                        <span className="text-xs font-black uppercase">غير المحصلين: {stats.uncollected}</span>
                    </div> */}
                </div>
            </div>
        </div>
        </ProtectedRoute>
    );
}
