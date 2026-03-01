"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Printer, Table as TableIcon, Loader2, RefreshCcw, Globe, Building2, Shield, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const TrialBalancePage = () => {
    const [branch, setBranch] = useState('all');
    const [branches, setBranches] = useState<any[]>([]);
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [baseCurrency, setBaseCurrency] = useState<any>(null);
    const [maxLevel, setMaxLevel] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tbRes, branchRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/trial-balance`, {
                    params: { branchId: branch === 'all' ? undefined : branch },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/branches`, AUTH_HEADER),
                axios.get(`${API_BASE}/`, AUTH_HEADER)
            ]);

            setReport(tbRes.data);
            setBranches(branchRes.data);
            const base = currRes.data.find((c: any) => c.isBase);
            setBaseCurrency(base || { code: '---' });
        } catch (error) {
            console.error('Error fetching trial balance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [branch]);

    const filteredReport = report.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.includes(search)
    );

    const buildSortedTree = (items: any[]) => {
        const itemMap: Record<string, any> = {};
        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        const roots: any[] = [];
        items.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                roots.push(itemMap[item.id]);
            }
        });

        const flatten = (nodes: any[], level = 0): any[] => {
            nodes.sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
            let result: any[] = [];
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children && node.children.length > 0) {
                    // Only continue to children if we are not at the max level
                    if (maxLevel === 'all' || level < parseInt(maxLevel)) {
                        result = result.concat(flatten(node.children, level + 1));
                    }
                }
            });
            return result;
        };

        return flatten(roots);
    };

    const accountGroups = [
        { key: 'ASSET', label: 'الأصول', icon: Building2, color: 'blue' },
        { key: 'LIABILITY', label: 'الخصوم', icon: Shield, color: 'amber' },
        { key: 'EQUITY', label: 'حقوق الملكية', icon: Globe, color: 'indigo' },
        { key: 'REVENUE', label: 'الإيرادات', icon: TrendingUp, color: 'emerald' },
        { key: 'EXPENSE', label: 'المصروفات', icon: TrendingDown, color: 'rose' },
    ];

    const getTreesByCategory = () => {
        return accountGroups.map(group => {
            const groupData = filteredReport.filter(item => item.type === group.key);
            return {
                ...group,
                items: buildSortedTree(groupData)
            };
        });
    };

    const categorizedTrees = getTreesByCategory();

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
        indigo: 'bg-indigo-500',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500'
    };

    const lightColorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        amber: 'bg-amber-100 text-amber-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        rose: 'bg-rose-100 text-rose-600'
    };

    const textColorMap: Record<string, string> = {
        blue: 'text-blue-700',
        amber: 'text-amber-700',
        indigo: 'text-indigo-700',
        emerald: 'text-emerald-700',
        rose: 'text-rose-700'
    };

    const totalsByType = accountGroups.reduce((acc: any, group) => {
        const groupItems = categorizedTrees.find(t => t.key === group.key)?.items || [];
        acc[group.key] = groupItems
            .filter(item => item.level === 0)
            .reduce((sum: number, item: any) => sum + (
                ['ASSET', 'EXPENSE'].includes(item.type)
                    ? Number(item.baseDebit) - Number(item.baseCredit)
                    : Number(item.baseCredit) - Number(item.baseDebit)
            ), 0);
        return acc;
    }, {});

    const totalDebit = categorizedTrees.reduce((sum, group) =>
        sum + group.items.filter(item => item.level === 0).reduce((s, it) => s + Number(it.baseDebit), 0)
        , 0);
    const totalCredit = categorizedTrees.reduce((sum, group) =>
        sum + group.items.filter(item => item.level === 0).reduce((s, it) => s + Number(it.baseCredit), 0)
        , 0);



    if (loading && report.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-slate-500 font-bold text-sm">جاري إنشاء ميزان المراجعة...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Premium Look */}
            <PageHeader
                icon={TableIcon}
                title="ميزان المراجعة"
                description={`Trial Balance & Financial Position Summary (${baseCurrency?.code || '---'})`}
                iconClassName="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-200"
                iconSize={24}
                className="mb-8"
            >
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                const allItems = categorizedTrees.flatMap(g => g.items);
                                exportToExcel(
                                    allItems.map(item => ({
                                        ...item,
                                        name: '  '.repeat(item.level) + item.name,
                                        baseDebit: Number(item.baseDebit).toFixed(2),
                                        baseCredit: Number(item.baseCredit).toFixed(2),
                                        netBase: Number(item.netBase).toFixed(2),
                                        foreignBalance: `${Number(item.foreignBalance).toFixed(2)} ${item.currency}`,
                                        avgRate: Number(item.avgRate).toFixed(4)
                                    })),
                                    'Mezan_Morajaha',
                                    ['رقم الحساب', 'اسم الحساب', 'مدين (أساسي)', 'دائن (أساسي)', 'الرصيد (أساسي)', 'الرصيد (أجنبي)', 'سعر الصرف'],
                                    ['code', 'name', 'baseDebit', 'baseCredit', 'netBase', 'foreignBalance', 'avgRate']
                                );
                            });
                        }}
                        className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-xs transition-all"
                    >
                        <Download size={16} className="text-emerald-500" />
                        Excel
                    </Button>
                    <Button
                        onClick={() => {
                            import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                const allItems = categorizedTrees.flatMap(g => g.items);
                                const selectedBranchName = branch === 'all' ? 'كافة الفروع' : branches.find(b => b.id === branch)?.name || '';

                                exportToPDF(
                                    allItems.map(item => ({
                                        ...item,
                                        name: '  '.repeat(item.level) + item.name,
                                        baseDebit: Number(item.baseDebit) > 0 ? Number(item.baseDebit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
                                        baseCredit: Number(item.baseCredit) > 0 ? Number(item.baseCredit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
                                        netBase: Number(item.netBase).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                        foreignBalance: !item.isBase ? `${Number(item.foreignBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.currency}` : '-',
                                        avgRate: !item.isBase ? Number(item.avgRate).toFixed(4) : '-'
                                    })),
                                    'Mezan_Morajaha',
                                    'ميزان المراجعة',
                                    ['رقم الحساب', 'اسم الحساب', 'مدين (أساسي)', 'دائن (أساسي)', 'الرصيد (أساسي)', 'الرصيد (أجنبي)', 'سعر الصرف'],
                                    ['code', 'name', 'baseDebit', 'baseCredit', 'netBase', 'foreignBalance', 'avgRate'],
                                    `الفرع: ${selectedBranchName}`,
                                    {
                                        baseDebit: totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                                        baseCredit: totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                    }
                                );
                            });
                        }}
                        className="flex items-center gap-2 px-4 rounded-xl shadow-lg h-11 bg-slate-900 text-white hover:bg-black font-black text-xs transition-all"
                    >
                        <Download size={16} className="text-rose-400" />
                        PDF
                    </Button>
                </div>
            </PageHeader>

            {/* Stats Cards Section - Comprehensive Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden group">
                    <p className="text-blue-600 font-black text-[9px] uppercase tracking-widest mb-1">إجمالي الأصول</p>
                    <h3 className="text-base font-black font-mono text-blue-700">
                        {(totalsByType['ASSET'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                    <p className="text-amber-600 font-black text-[9px] uppercase tracking-widest mb-1">إجمالي الخصوم</p>
                    <h3 className="text-base font-black font-mono text-amber-700">
                        {(totalsByType['LIABILITY'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <p className="text-emerald-600 font-black text-[9px] uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
                    <h3 className="text-base font-black font-mono text-emerald-700">
                        {(totalsByType['REVENUE'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden group">
                    <p className="text-rose-600 font-black text-[9px] uppercase tracking-widest mb-1">إجمالي المصروفات</p>
                    <h3 className="text-base font-black font-mono text-rose-700">
                        {(totalsByType['EXPENSE'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-slate-900 p-4 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <p className="text-blue-400 font-black text-[9px] uppercase tracking-widest mb-1">دقة الميزانية</p>
                    <h3 className="text-sm font-black font-mono">
                        {Math.abs(totalDebit - totalCredit) < 0.01 ? '100% متوازن' : 'غير متوازن'}
                    </h3>
                </div>
            </div>

            <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
                {/* Filters Row */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            type="text"
                            placeholder="بحث عن حساب بالاسم أو الكود..."
                            className="w-full pr-10 pl-4 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 font-bold text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-0 group h-11 w-48 overflow-hidden">
                        <Select value={branch} onValueChange={setBranch}>
                            <SelectTrigger className="w-full bg-transparent border-0 ring-offset-transparent focus:ring-0 shadow-none font-black text-xs text-slate-700 h-full !outline-none" dir="rtl">
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-blue-500" />
                                    <SelectValue placeholder="اختر الفرع" />
                                </div>
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="all">جميع الفروع الموحدة</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-0 group h-11 w-40 overflow-hidden">
                        <Select value={maxLevel} onValueChange={setMaxLevel}>
                            <SelectTrigger className="w-full bg-transparent border-0 ring-offset-transparent focus:ring-0 shadow-none font-black text-xs text-slate-700 h-full !outline-none" dir="rtl">
                                <div className="flex items-center gap-2">
                                    <Layers size={16} className="text-blue-500" />
                                    <SelectValue placeholder="المستوى" />
                                </div>
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="all">جميع المستويات</SelectItem>
                                <SelectItem value="0">المستوى 1</SelectItem>
                                <SelectItem value="1">المستوى 2</SelectItem>
                                <SelectItem value="2">المستوى 3</SelectItem>
                                <SelectItem value="3">المستوى 4</SelectItem>
                                <SelectItem value="4">المستوى 5</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        className="flex items-center gap-2 px-5 h-11 border-slate-200 rounded-xl text-slate-700 font-black text-xs transition-all shadow-sm hover:bg-slate-50"
                    >
                        {loading ? <RefreshCcw size={16} className="animate-spin text-blue-500" /> : <Filter size={16} className="text-blue-500" />}
                        تحديث النتائج
                    </Button>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                    <Table className="w-full text-right" dir="rtl">
                        <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                            <TableRow className="hover:bg-slate-50/70">
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">رقم الحساب</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right w-1/4">اسم الحساب</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-center bg-blue-50/30">مدين ({baseCurrency?.code})</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-center bg-blue-50/30">دائن ({baseCurrency?.code})</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-center bg-blue-50/30 font-bold border-l border-slate-200">الرصيد النهائي ({baseCurrency?.code})</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-center bg-amber-50/30">الرصيد (أجنبي)</TableHead>
                                <TableHead className="py-4 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-center bg-amber-50/30">متوسط السعر</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categorizedTrees.map(group => {
                                if (group.items.length === 0) return null;
                                return (
                                    <React.Fragment key={group.key}>
                                        <TableRow className="bg-slate-50/60 border-b border-slate-200/50">
                                            <TableCell colSpan={7} className="py-3.5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-1.5 rounded-lg shadow-sm border border-white/50", lightColorMap[group.color])}>
                                                        <group.icon size={13} />
                                                    </div>
                                                    <span className={cn("text-[11px] font-black uppercase tracking-wider", textColorMap[group.color])}>
                                                        {group.label}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {group.items.map((item) => (
                                            <TableRow key={item.id} className={cn(
                                                "hover:bg-slate-50/50 transition-colors group border-b border-slate-100",
                                                item.level === 0 ? "bg-white" : "bg-slate-50/10"
                                            )}>
                                                <TableCell className={cn(
                                                    "py-3.5 px-6 font-mono text-[10px] font-bold",
                                                    item.level === 0 ? "text-slate-900" : "text-slate-400"
                                                )}>
                                                    {item.code}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6">
                                                    <div
                                                        className="flex items-center gap-2 cursor-default"
                                                        style={{ paddingRight: `${item.level * 24}px` }}
                                                    >
                                                        <div className={cn(
                                                            "w-1 h-4 rounded-full transition-all group-hover:scale-110",
                                                            item.level === 0 ? colorMap[group.color] : "bg-slate-200"
                                                        )} />
                                                        <span className={cn(
                                                            "font-black tracking-tight transition-colors",
                                                            item.level === 0 ? "text-sm text-slate-800" : "text-xs text-slate-600 group-hover:text-slate-900"
                                                        )}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "py-3.5 px-6 font-mono text-center text-xs font-black",
                                                    item.level === 0 ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"
                                                )}>
                                                    {Number(item.baseDebit) > 0 ? Number(item.baseDebit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "py-3.5 px-6 font-mono text-center text-xs font-black",
                                                    item.level === 0 ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"
                                                )}>
                                                    {Number(item.baseCredit) > 0 ? Number(item.baseCredit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6 text-center border-l border-slate-100">
                                                    <span className={cn(
                                                        "text-xs font-black font-mono",
                                                        Number(item.netBase) >= 0 ? "text-slate-900" : "text-rose-600"
                                                    )}>
                                                        {Number(item.netBase).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6 text-center">
                                                    {!item.isBase ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="text-blue-600 font-mono text-xs font-black">
                                                                {Number(item.foreignBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[9px] font-black text-blue-400 opacity-70 uppercase tracking-tighter">
                                                                {item.currency}
                                                            </span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6 text-center">
                                                    {!item.isBase ? (
                                                        <span className="text-slate-500 font-mono text-[10px] font-bold">
                                                            {Number(item.avgRate).toFixed(2)}
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}

                            {filteredReport.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-slate-400 font-bold text-sm italic">
                                        لا توجد بيانات مطابقة للبحث
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter className="bg-slate-900 text-white font-black hover:bg-slate-900 pointer-events-none">
                            <TableRow className="hover:bg-slate-900">
                                <TableCell colSpan={2} />
                                <TableCell className="py-5 px-6 text-center font-mono text-lg underline decoration-blue-500 decoration-2 underline-offset-4">
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="py-5 px-6 text-center font-mono text-lg underline decoration-blue-500 decoration-2 underline-offset-4">
                                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell colSpan={3} />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-blue-800 text-[11px] font-black opacity-80">
                    ميزان المراجعة يتم حسابه بناءً على كافة القيود المرحّلة فقط. تأكد من ترحيل جميع القيود قبل استخراج الأرصدة الختامية.
                </p>
            </div>
        </div >
    );
};

export default TrialBalancePage;
