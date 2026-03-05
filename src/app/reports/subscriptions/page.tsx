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
import {
    TrendingUp,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Search,
    Filter,
    X,
    ChevronDown,
    Users,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

import { API_BASE, getAuthHeader, SUB_BASE } from '@/lib/api';

const AUTH_HEADER = getAuthHeader();

// Year colors palette
const YEAR_COLORS: Record<number, { bg: string, text: string, border: string }> = {
    // We can generate these or define them. Let's define some or use a generator.
};

const getYearColor = (year: number) => {
    const colors = [
        { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
        { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
        { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
        { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
        { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
        { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
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
        } catch (err) {
            console.error(err);
            toast.error("فشل في تحميل تقرير الاشتراكات");
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
        const stats: Record<number, { collected: number, uncollected: number }> = {};
        filteredYears.forEach(y => {
            stats[y] = { collected: 0, uncollected: 0 };
        });

        filteredData.forEach(entity => {
            entity.members.forEach(m => {
                filteredYears.forEach(y => {
                    const isAffiliated = y >= m.affiliationYear;
                    const isPaid = m.subscriptions[y] !== null;
                    if (isPaid) {
                        stats[y].collected++;
                    } else if (isAffiliated) {
                        stats[y].uncollected++;
                    }
                });
            });
        });
        return stats;
    }, [filteredData, filteredYears]);

    const handleExportExcel = () => {
        if (!data) return;

        const headers = ['الجهة', 'الاسم', 'سنة الانتساب', ...filteredYears.map(y => y.toString()), 'ملاحظات'];
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
                    row[y.toString()] = m.subscriptions[y] || '-';
                });
                exportRows.push(row);
            });
        });

        const excelCollectedRow: any = {
            entity: 'إجمالي المحصلين',
            name: '-',
            affiliation: '-',
            obs: '-'
        };
        const excelUncollectedRow: any = {
            entity: 'إجمالي غير المحصلين',
            name: '-',
            affiliation: '-',
            obs: '-'
        };
        filteredYears.forEach(y => {
            const s = yearlyStats[y];
            excelCollectedRow[y.toString()] = s.collected;
            excelUncollectedRow[y.toString()] = s.uncollected;
        });
        exportRows.push(excelCollectedRow, excelUncollectedRow);

        exportToExcel(exportRows, `Subscriptions_Pivot_${new Date().toISOString().split('T')[0]}`, headers, keys);
    };

    const handleExportPDF = () => {
        if (!data) return;

        const headers = ['الجهة/الاسم', 'الانتساب', ...filteredYears.map(y => y.toString()), 'ملاحظات'];
        const keys = ['name', 'affiliation', ...filteredYears.map(y => y.toString()), 'obs'];

        // Define darker HEX colors for PDF (mapping to ~300 level)
        const pdfYearBgColors = [
            '#93c5fd', // blue-300
            '#6ee7b7', // emerald-300
            '#fcd34d', // amber-300
            '#a5b4fc', // indigo-300
            '#fca5a5', // rose-300
            '#d8b4fe', // purple-300
            '#67e8f9', // cyan-300
        ];

        const columnStyles: Record<number, string> = {};
        filteredYears.forEach((year, idx) => {
            // idx + 2 because first two columns are name and affiliation
            columnStyles[idx + 2] = pdfYearBgColors[year % pdfYearBgColors.length];
        });

        const exportRows: any[] = [];
        filteredData.forEach(entity => {
            entity.members.forEach(m => {
                const row: any = {
                    name: m.name,
                    affiliation: m.affiliationYear,
                    obs: m.observations
                };
                filteredYears.forEach(y => {
                    const stopDate = m.stoppedAt ? new Date(m.stoppedAt) : null;
                    const stopYearVal = stopDate ? stopDate.getFullYear() : null;
                    const isAfterStop = stopYearVal && y >= stopYearVal;

                    if (isAfterStop && m.status !== 'ACTIVE') {
                        if (m.status === 'DECEASED') {
                            row[y.toString()] = { text: '', bgColor: '#475569' }; // Slate-600
                        } else if (m.status === 'INACTIVE') {
                            row[y.toString()] = { text: '', bgColor: '#CBD5E1' }; // Slate-300
                        } else {
                            row[y.toString()] = m.subscriptions[y] !== null ? '' : null;
                        }
                    } else {
                        // Standard logic: Paid = '' (colored), Unpaid/N/A = null (empty)
                        row[y.toString()] = m.subscriptions[y] !== null ? '' : null;
                    }
                });
                exportRows.push(row);
            });
        });

        // Add PDF Summary Rows
        const pdfCollectedRow: any = {
            name: 'إجمالي المحصلين',
            affiliation: '-',
            obs: '-'
        };
        const pdfUncollectedRow: any = {
            name: 'إجمالي غير المحصلين',
            affiliation: '-',
            obs: '-'
        };
        filteredYears.forEach(y => {
            const s = yearlyStats[y];
            pdfCollectedRow[y.toString()] = s.collected;
            pdfUncollectedRow[y.toString()] = s.uncollected;
        });
        exportRows.push(pdfCollectedRow, pdfUncollectedRow);

        const entitySubtitle = selectedEntity !== 'all' ? `الجهة: ${selectedEntity}` : '';
        const periodSubtitle = `الفترة: ${startYear} - ${endYear}`;
        // const statsSubtitle = `الأعضاء: ${stats.total} | محصلين: ${stats.collected} | غير محصلين: ${stats.uncollected}`;
        const statsSubtitle = `الأعضاء: ${stats.total}`;

        exportToPDF(
            exportRows,
            `Subscriptions_Pivot_${new Date().toISOString().split('T')[0]}`,
            'تقرير اشتراكات الأعضاء',
            headers,
            keys,
            `${entitySubtitle}${entitySubtitle ? ' | ' : ''}${periodSubtitle} | ${statsSubtitle}`,
            null,
            'portrait',
            columnStyles
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">جاري إعداد جدول الاشتراكات المختصر...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="max-w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <PageHeader
                icon={TrendingUp}
                title="تقرير اشتراكات الأعضاء المطور"
                description="جدول زمني متقدم مع فلاتر ذكية وتنسيق ملون للسنوات"
                iconClassName="bg-blue-600 shadow-blue-200"
            >
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        className={cn("h-11 rounded-2xl gap-2 font-bold transition-all", showFilters && "bg-blue-50 border-blue-200 text-blue-600")}
                    >
                        <Filter size={18} />
                        {showFilters ? 'إخفاء الفلاتر' : 'تصفية البيانات'}
                    </Button>
                    <Button
                        onClick={handleExportPDF}
                        variant="outline"
                        className="h-11 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 gap-2 font-bold transition-all"
                    >
                        <FileText size={20} />
                        PDF
                    </Button>
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        className="h-11 rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 gap-2 font-bold transition-all"
                    >
                        <FileSpreadsheet size={20} />
                        Excel
                    </Button>
                </div>
            </PageHeader>

            {/* Filters Section */}
            {showFilters && (
                <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-50/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">بحث نصي</label>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input
                                placeholder="اسم العضو أو الجهة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 pr-9 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">الجهة</label>
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-sm">
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
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">حالة العضو</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-sm">
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
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">نطاق السنوات المعروضة</label>
                        <div className="flex items-center gap-2">
                            <Select value={startYear} onValueChange={setStartYear}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{data.years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                            <span className="text-slate-300">←</span>
                            <Select value={endYear} onValueChange={setEndYear}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-[11px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{data.years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">سنة الانتساب</label>
                        <Input
                            type="number"
                            placeholder="مثال: 2020"
                            value={affYear}
                            onChange={(e) => setAffYear(e.target.value)}
                            className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase mr-1">سنة التوقف/الوفاة</label>
                        <Input
                            type="number"
                            placeholder="مثال: 2024"
                            value={stopYear}
                            onChange={(e) => setStopYear(e.target.value)}
                            className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-sm"
                        />
                    </div>

                    <div className="lg:col-span-2 flex items-end">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedEntity('all');
                                setSelectedStatus('all');
                                setAffYear('');
                                setStopYear('');
                                setStartYear(data.years[0].toString());
                                setEndYear(data.years[data.years.length - 1].toString());
                            }}
                            className="h-10 text-slate-400 hover:text-rose-500 font-bold text-xs gap-1"
                        >
                            <X size={14} />
                            إعادة ضبط الفلاتر
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-sm border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <Table dir="rtl">
                        <TableHeader className="bg-slate-50 border-b-2 border-slate-100">
                            <TableRow>
                                <TableHead className="w-[200px] text-right text-slate-800 font-black whitespace-nowrap sticky right-0 bg-slate-50 z-30 border-l border-slate-100">العضو / الجهة</TableHead>
                                <TableHead className="w-[80px] text-center text-slate-800 font-black">الانتساب</TableHead>
                                {filteredYears.map(year => {
                                    const color = getYearColor(year);
                                    return (
                                        <TableHead key={year} className={cn("text-center font-black min-w-[85px] border-l border-slate-100/50", color.text)}>
                                            <div className={cn("py-1 rounded-lg", color.bg)}>
                                                {year}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                                <TableHead className="text-right text-slate-800 font-black sticky left-0 bg-slate-50 z-30 border-r border-slate-100 min-w-[150px]">ملاحظات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((entity, eIdx) => (
                                <React.Fragment key={entity.entityName}>
                                    <TableRow className="bg-blue-50/20 hover:bg-blue-50/40 transition-colors">
                                        <TableCell colSpan={filteredYears.length + 3} className="py-2.5 px-6 border-b border-blue-100/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                                                <span className="font-black text-blue-700 text-sm">{entity.entityName}</span>
                                                <span className="text-[10px] bg-blue-100/50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                                    {entity.members.length} عضو
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {entity.members.map((member) => (
                                        <TableRow key={member.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50">
                                            <TableCell className="font-bold text-slate-700 sticky right-0 bg-white group-hover:bg-slate-50 z-20 py-3 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] border-l border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-sm truncate max-w-[180px]">{member.name}</span>
                                                    {/* <span className="text-[10px] text-slate-400 font-bold">{entity.entityName}</span> */}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-slate-400 font-black text-[10px]">
                                                {member.affiliationYear}
                                            </TableCell>
                                            {filteredYears.map(year => {
                                                const amount = member.subscriptions[year];
                                                const isAffiliatedInOrAfter = year >= member.affiliationYear;
                                                const isPaid = amount !== null;
                                                const yearColor = getYearColor(year);

                                                // Death or Inactivity logic
                                                const stopDate = member.stoppedAt ? new Date(member.stoppedAt) : null;
                                                const stopYearVal = stopDate ? stopDate.getFullYear() : null;
                                                const isAfterStop = stopYearVal && year >= stopYearVal;

                                                let cellClass = "";
                                                let cellContent = null;

                                                if (isAfterStop && member.status !== 'ACTIVE') {
                                                    // Deceased or Inactive starting from that year
                                                    if (member.status === 'DECEASED') {
                                                        cellClass = "bg-slate-800 text-slate-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]";
                                                        cellContent = <span className="text-[10px] font-black opacity-40"></span>;
                                                    } else if (member.status === 'INACTIVE') {
                                                        cellClass = "bg-slate-100 text-slate-300 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]";
                                                        cellContent = <span className="text-[10px] font-black opacity-30"></span>;
                                                    }
                                                } else {
                                                    cellClass = isPaid ? cn(yearColor.bg, yearColor.text, "font-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]") :
                                                        isAffiliatedInOrAfter ? "text-rose-300 font-medium" : "bg-slate-50/30 text-slate-200";

                                                    cellContent = isPaid ? (
                                                        <span className="text-xs font-black">{amount}</span>
                                                    ) : isAffiliatedInOrAfter ? (
                                                        <span className="text-[10px] opacity-40">---</span>
                                                    ) : (
                                                        <span className="text-[10px] opacity-20">---</span>
                                                    );
                                                }

                                                return (
                                                    <TableCell key={year} className="text-center p-0 border-l border-slate-100/30">
                                                        <div className={cn(
                                                            "h-full w-full py-3 flex items-center justify-center transition-all",
                                                            cellClass
                                                        )}>
                                                            {cellContent}
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-right sticky left-0 bg-white group-hover:bg-slate-50 z-20 border-r border-slate-100 py-3 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-1 rounded-lg inline-block",
                                                    member.status === 'ACTIVE' ? "text-slate-400" :
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
                        <TableHeader className="bg-slate-100 border-t-2 border-slate-200">
                            {/* Collected Row */}
                            <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors">
                                <TableCell className="sticky right-0 bg-emerald-50 z-30 font-black text-emerald-700 border-l border-emerald-100/50 text-xs">إجمالي المحصلين</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-black text-emerald-600 text-sm border-l border-slate-200/50">
                                        {yearlyStats[year].collected}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-emerald-50 z-30 border-r border-emerald-100/50">-</TableCell>
                            </TableRow>
                            {/* Uncollected Row */}
                            <TableRow className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors border-t border-slate-200/50">
                                <TableCell className="sticky right-0 bg-rose-50 z-30 font-black text-rose-700 border-l border-rose-100/50 text-xs">إجمالي غير المحصلين</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                {filteredYears.map(year => (
                                    <TableCell key={year} className="text-center font-black text-rose-500 text-sm border-l border-slate-200/50">
                                        {yearlyStats[year].uncollected}
                                    </TableCell>
                                ))}
                                <TableCell className="sticky left-0 bg-rose-50 z-30 border-r border-rose-100/50">-</TableCell>
                            </TableRow>
                        </TableHeader>
                    </Table>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-50 border border-blue-100 rounded" />
                    <span className="text-[11px] font-black text-slate-500 uppercase">مربعات ملونة: مسدد (لون خاص لكل سنة)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-rose-300 font-black text-[11px]">---</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase">مستحق (غير مسدد)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-black text-[11px]">---</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase">قبل تاريخ الانتساب الرسمي</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-800 rounded flex items-center justify-center">
                        <span className="text-[6px] text-white font-bold tracking-tighter">RIP</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase">حالة وفاة (اعتبارا من تلك السنة)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                        <span className="text-[6px] text-slate-400 font-bold tracking-tighter">OFF</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase">حالة توقف (اعتبارا من تلك السنة)</span>
                </div>
                <div className="mr-auto flex items-center gap-6">
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <Users size={16} />
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
    );
}
