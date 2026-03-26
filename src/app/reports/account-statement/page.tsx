"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
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

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const AccountStatementPage = () => {
    const theme = usePageTheme();
    const [accountId, setAccountId] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_BASE}/accounts`, AUTH_HEADER);
            setAccounts(res.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setFetchingAccounts(false);
        }
    };

    const fetchReport = async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/reports/account-statement`, {
                params: {
                    accountId,
                    startDate: dateRange.start,
                    endDate: dateRange.end
                },
                ...AUTH_HEADER
            });
            setReport(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const totalDebit = report?.entries.reduce((sum: number, e: any) => sum + e.debit, 0) || 0;
    const totalCredit = report?.entries.reduce((sum: number, e: any) => sum + e.credit, 0) || 0;

    return (
        <ProtectedRoute permission="REPORTS_ACCOUNT_STATEMENT_VIEW">
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <PageHeader
                    icon={APP_ICONS.REPORTS.ACCOUNT_STATEMENT}
                    title="كشف حساب تفصيلي"
                    description="Detailed Transaction Ledger"
                    iconSize={24}
                >
                    <div className="flex gap-2">
                        <WithPermission permission="REPORTS_EXPORT">
                            <CustomButton
                                variant="outline"
                                disabled={!report}
                                onClick={() => {
                                    if (!report) return;
                                    import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                        const exportData = report.entries.map((e: any) => ({
                                            Date: new Date(e.date).toLocaleDateString('en-CA'),
                                            EntryNumber: e.entryNumber,
                                            Description: e.description,
                                            Debit: e.debit,
                                            OriginalDebit: e.originalDebit,
                                            OriginalCurrency: e.originalCurrencySymbol || e.originalCurrency,
                                            Credit: e.credit,
                                            OriginalCredit: e.originalCredit,
                                            Balance: e.balance,
                                            BaseBalance: e.baseBalance
                                        }));
                                        exportToExcel(
                                            exportData,
                                            `Account_Statement_${accountId}`,
                                            ['التاريخ', 'رقم القيد', 'البيان', 'مدين', 'مدين (أصلي)', 'العملة', 'دائن', 'دائن (أصلي)', 'الرصيد', 'الرصيد (أساسي)'],
                                            ['Date', 'EntryNumber', 'Description', 'Debit', 'OriginalDebit', 'OriginalCurrency', 'Credit', 'OriginalCredit', 'Balance', 'BaseBalance']
                                        );
                                    });
                                }}
                                className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-input text-foreground/80 hover:bg-muted/50 font-black text-xs transition-all disabled:opacity-50"
                            >
                                <APP_ICONS.ACTIONS.EXPORT size={16} className="text-emerald-500" />
                                Excel
                            </CustomButton>
                        </WithPermission>
                        <WithPermission permission="REPORTS_EXPORT">
                            <CustomButton
                                disabled={!report}
                                onClick={() => {
                                    if (!report) return;
                                    import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                        const selectedAccount = accounts.find(a => a.id === accountId);
                                        const subtitle = selectedAccount ? `الحساب: ${selectedAccount.code} - ${selectedAccount.name} (${report.currencyName})` : '';

                                        const entriesData = report.entries.map((e: any) => {
                                            const showOriginal = e.originalCurrency !== report.currency;
                                            const secondaryInfo = showOriginal 
                                                ? ` (${Number(e.originalDebit > 0 ? e.originalDebit : e.originalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${e.originalCurrencyName || e.originalCurrency})`
                                                : (!report.isBase ? ` (${Number(e.baseDebit > 0 ? e.baseDebit : e.baseCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })})` : '');

                                            return {
                                                Date: new Date(e.date).toLocaleDateString('en-CA'),
                                                EntryNumber: e.entryNumber,
                                                Description: `${e.description}${secondaryInfo}`,
                                                Debit: e.debit > 0 ? Number(e.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-',
                                                Credit: e.credit > 0 ? Number(e.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-',
                                                Balance: Number(e.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            };
                                        });

                                        const exportData = [
                                            {
                                                Date: '-',
                                                EntryNumber: '-',
                                                Description: `رصيد أول المدة${!report.isBase ? ` (${Number(report.openingBaseBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })})` : ''}`,
                                                Debit: '-',
                                                Credit: '-',
                                                Balance: Number(report.openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            },
                                            ...entriesData
                                        ];

                                        exportToPDF(
                                            exportData,
                                            `Account_Statement_${accountId}`,
                                            'كشف حساب تفصيلي',
                                            ['التاريخ', 'رقم القيد', 'البيان', 'مدين', 'دائن', 'الرصيد'],
                                            ['Date', 'EntryNumber', 'Description', 'Debit', 'Credit', 'Balance'],
                                            subtitle,
                                            {
                                                Description: `إجمالي الرصيد الختامي${!report.isBase ? ` (${report.closingBaseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})` : ''}`,
                                                Debit: '',
                                                Credit: '',
                                                Balance: report.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            },
                                            'landscape',
                                            {},
                                            {
                                                0: 0.8, // Date
                                                1: 0.7, // Entry Number
                                                2: 5.5, // Description (Much Wider now)
                                                3: 1.2, // Debit
                                                4: 1.2, // Credit
                                                5: 1.4  // Balance
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Filter */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-card p-5 rounded-[2rem] shadow-sm border border-border space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mr-1">الحساب المحاسبي</label>
                                <div className="relative">
                                    <APP_ICONS.ACTIONS.SEARCH className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10" size={14} />
                                    <Select disabled={fetchingAccounts} value={accountId} onValueChange={setAccountId}>
                                        <SelectTrigger className={cn("w-full pr-10 pl-3 h-11 bg-muted/50 border border-input rounded-xl focus:ring-2 transition-all font-bold text-xs", theme.accent.replace('text-', 'focus:ring-'))} dir="rtl">
                                            <SelectValue placeholder="اختر الحساب..." />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mr-1">من تاريخ</label>
                                <Input
                                    type="date"
                                    className={cn("w-full h-11 px-4 bg-muted/50 border border-input rounded-xl outline-none focus-visible:ring-2 transition-all font-bold text-xs", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mr-1">إلى تاريخ</label>
                                <Input
                                    type="date"
                                    className={cn("w-full h-11 px-4 bg-muted/50 border border-input rounded-xl outline-none focus-visible:ring-2 transition-all font-bold text-xs", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>

                            <CustomButton
                                disabled={loading || !accountId}
                                onClick={fetchReport}
                                variant="primary"
                                className="w-full h-12"
                            >
                                {loading ? <APP_ICONS.ACTIONS.REFRESH size={16} className="animate-spin" /> : <APP_ICONS.ACTIONS.SEARCH size={16} className="group-hover:scale-110 transition-transform" />}
                                تحديث الكشف
                            </CustomButton>
                        </div>

                        {report && (
                            <div className={cn("p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group", theme.primary.replace('bg-', 'bg-').replace('-700', '-900'))}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg shadow-lg">
                                            <APP_ICONS.SHARED.LANDMARK size={18} />
                                        </div>
                                        <h4 className="font-black text-xs uppercase tracking-widest opacity-60">Account Summary</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-muted-foreground/60">الرصيد الافتتاحي</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono text-white">{report.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {report.currencySymbol}</span>
                                                {!report.isBase && (
                                                    <span className="text-[9px] opacity-60 font-mono">({report.openingBaseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} الأساسي)</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-white/10 space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-white/60 uppercase tracking-tighter">بداية الفترة</span>
                                                <span className="font-mono text-white/90">{report.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 space-y-1">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Net Closing Balance</p>
                                            <div className="flex items-baseline gap-2">
                                                <h2 className="text-2xl font-black font-mono leading-none">{report.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                                                <span className="text-xs font-bold opacity-60">{report.currencySymbol}</span>
                                            </div>
                                            {!report.isBase && (
                                                <p className="text-[10px] font-mono opacity-50">({report.closingBaseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} الأساسي)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden min-h-[400px]">
                            {!report ? (
                                <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4 border-2 border-dashed border-border m-6 rounded-3xl">
                                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground/20">
                                        <APP_ICONS.SHARED.ARROW_SWITCH size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground/90">يرجى اختيار حساب</h3>
                                        <p className="text-xs text-muted-foreground/60 font-bold mt-1">اختر الحساب والفترة الزمنية لعرض كشف الحركة التفصيلي</p>
                                    </div>
                                </div>
                            ) : (
                                <Table className="w-full text-right" dir="rtl">
                                    <TableHeader className="bg-muted/50/70 border-b border-border">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-right">التاريخ</TableHead>
                                            <TableHead className="py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-right">رقم القيد</TableHead>
                                            <TableHead className="py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-right">البيان والشرح</TableHead>
                                            <TableHead className="py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-center">مدين</TableHead>
                                            <TableHead className="py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-center">دائن</TableHead>
                                            <TableHead className={cn("py-4 px-6 text-muted-foreground/80 text-[10px] uppercase tracking-widest font-black text-center", theme.muted)}>الرصيد</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-slate-50">
                                        <TableRow className="bg-muted/50 font-bold italic text-muted-foreground/80 hover:bg-muted/50 border-none">
                                            <TableCell colSpan={5} className="py-3 px-6 text-[10px] uppercase">رصيد أول المدة</TableCell>
                                            <TableCell className="py-3 px-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-mono text-xs">{report.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    {!report.isBase && (
                                                        <span className="text-[9px] opacity-60 font-mono">({report.openingBaseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {report.entries.map((entry: any, i: number) => (
                                            <TableRow key={i} className="hover:bg-muted/30 transition-colors group border-b-slate-50 border-none">
                                                <TableCell className="py-3.5 px-6 shrink-0">
                                                    <span className="text-[10px] font-black text-muted-foreground/80">{new Date(entry.date).toLocaleDateString('ar-AR')}</span>
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6">
                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black text-muted-foreground transition-all cursor-default", theme.muted, theme.accent.replace('text-', 'group-hover:bg-').replace('-700', '-600'), "group-hover:text-white")}>
                                                        #{entry.entryNumber}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6 text-xs font-bold text-foreground/80 max-w-[200px] truncate">{entry.description}</TableCell>
                                                <TableCell className="py-3.5 px-6 font-mono text-center text-xs font-black text-emerald-600">
                                                    {entry.debit > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span>{entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            {entry.originalCurrency !== report.currency ? (
                                                                <span className="text-[9px] font-normal text-muted-foreground/60">
                                                                    ({entry.originalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {entry.originalCurrencyName || entry.originalCurrency})
                                                                </span>
                                                            ) : !report.isBase ? (
                                                                <span className="text-[9px] font-normal text-muted-foreground/60">
                                                                    ({entry.baseDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-6 font-mono text-center text-xs font-black text-rose-600">
                                                    {entry.credit > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span>{entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            {entry.originalCurrency !== report.currency ? (
                                                                <span className="text-[9px] font-normal text-muted-foreground/60">
                                                                    ({entry.originalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {entry.originalCurrencyName || entry.originalCurrency})
                                                                </span>
                                                            ) : !report.isBase ? (
                                                                <span className="text-[9px] font-normal text-muted-foreground/60">
                                                                    ({entry.baseCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className={cn("py-3.5 px-6 font-mono text-center font-black text-foreground text-xs", theme.muted, "opacity-80")}>
                                                    <div className="flex flex-col items-center">
                                                        <span>{entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        {!report.isBase && (
                                                            <span className="text-[9px] font-normal text-muted-foreground/60">({entry.baseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {report.entries.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-20 text-center text-muted-foreground/60 font-bold text-sm italic">لا توجد حركات مسجلة في هذه الفترة</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableFooter className={cn("text-white font-black text-[10px] uppercase tracking-widest border-none", theme.primary.replace('bg-', 'bg-').replace('-700', '-900'))}>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableCell colSpan={5} className="py-5 px-6 text-right">إجمالي الرصيد الختامي (Closing Balance)</TableCell>
                                            <TableCell className="text-center font-mono text-white/90 bg-white/10 p-0 border-r border-white/5">
                                                <div className="flex flex-col items-center py-2">
                                                    <span className="text-lg">{report.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    {!report.isBase && (
                                                        <span className="text-[10px] opacity-60">({report.closingBaseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AccountStatementPage;
