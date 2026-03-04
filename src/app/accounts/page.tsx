"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown,
    Folder,
    FileText,
    Plus,
    Loader2,
    Edit2,
    Trash2,
    Search,
    ArrowDownRight,
    Library,
    ChevronsDownUp,
    ChevronsUpDown,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { AccountModal } from '@/components/AccountModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useAuth } from '@/context/AuthContext';

const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || 'mock-token'}` }
});

// ─── Account Item ─────────────────────────────────────────────────────────────
interface AccountItemProps {
    id: string;
    name: string;
    code: string;
    type: string;
    balance?: number;          // balance in account's own currency
    baseBalance?: number;      // equivalent in base currency
    baseCurrencyCode?: string; // base currency code, e.g. "SAR"
    hasMixedCurrencies?: boolean;
    childCurrencies?: Record<string, number>; // { USD: 500, EUR: 200 }
    currency: string;
    children?: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    searchQuery: string;
    canEdit?: boolean;
    canDelete?: boolean;
}

const AccountItem = ({
    id, name, code, type, balance, baseBalance, baseCurrencyCode,
    hasMixedCurrencies, childCurrencies,
    currency, children, onEdit, onDelete,
    isExpanded, onToggle, searchQuery, canEdit = true, canDelete = true
}: AccountItemProps) => {
    const hasChildren = children && React.Children.count(children) > 0;
    const fmtNum = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const isNeg = (n?: number) => (n ?? 0) < 0;

    // Highlight search matches
    const highlight = (text: string) => {
        if (!searchQuery) return <span>{text}</span>;
        const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
        if (idx === -1) return <span>{text}</span>;
        return (
            <span>
                {text.slice(0, idx)}
                <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + searchQuery.length)}</mark>
                {text.slice(idx + searchQuery.length)}
            </span>
        );
    };

    return (
        <div className="select-none animate-in fade-in slide-in-from-right duration-300">
            <div
                className={cn(
                    "flex items-center gap-4 p-1 rounded-2xl group cursor-pointer transition-all border border-transparent",
                    hasChildren ? "hover:bg-blue-50/30" : "hover:bg-slate-100/50"
                )}
                onClick={() => hasChildren && onToggle(id)}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                        {hasChildren ? (
                            <div className={cn("transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")}>
                                <ChevronDown size={16} className="text-slate-400 group-hover:text-blue-500" />
                            </div>
                        ) : <div className="w-4" />}
                    </div>

                    <IconBox
                        icon={hasChildren ? Folder : FileText}
                        className={hasChildren ? "bg-blue-100 text-blue-600 shadow-blue-50" : "bg-slate-100 text-slate-400 shadow-none"}
                        boxSize="w-8 h-8"
                        iconSize={14}
                    />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{highlight(code)}</span>
                            <span className="font-black text-sm text-slate-800 tracking-tight">{highlight(name)}</span>
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest mt-0.5",
                            type === 'ASSET' ? "text-blue-500" :
                                type === 'REVENUE' ? "text-emerald-500" :
                                    type === 'EXPENSE' ? "text-rose-500" :
                                        "text-slate-400"
                        )}>
                            {type === 'ASSET' ? 'أصول' :
                                type === 'LIABILITY' ? 'خصوم' :
                                    type === 'EQUITY' ? 'حقوق الملكية' :
                                        type === 'REVENUE' ? 'إيرادات' :
                                            type === 'EXPENSE' ? 'مصروفات' : type}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end gap-0.5">
                        {/* Primary balance in account's own currency */}
                        <span className={cn(
                            "font-mono font-black text-lg tabular-nums",
                            isNeg(balance) ? "text-rose-600" : "text-slate-900"
                        )}>
                            {fmtNum(balance ?? 0)}
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-1.5 tracking-tighter">{currency}</span>
                        </span>

                        {/* If parent has mixed currencies: show base equivalent */}
                        {hasMixedCurrencies && baseBalance !== undefined && baseCurrencyCode && (
                            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                ≈ {fmtNum(baseBalance)}
                                <span className="ml-1 font-black text-slate-300 uppercase">{baseCurrencyCode}</span>
                            </span>
                        )}

                        {/* Per-child-currency chips when mixed */}
                        {hasMixedCurrencies && childCurrencies && Object.keys(childCurrencies).length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end mt-0.5">
                                {Object.entries(childCurrencies).map(([code, val]) => (
                                    <span key={code} className={cn(
                                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                                        isNeg(val) ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
                                    )}>
                                        {fmtNum(val)} {code}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        {canEdit && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="w-10 h-10 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                            >
                                <Edit2 size={16} />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="w-10 h-10 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                            >
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div className="mr-12 border-r-2 border-slate-100 pr-4 mt-2 mb-4 space-y-2 relative">
                    <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-b from-transparent via-slate-50/50 to-transparent"></div>
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AccountsPage = () => {
    const { checkPermission } = useAuth();
    const canCreate = checkPermission('ACCOUNTS_CREATE');
    const canEdit = checkPermission('ACCOUNTS_EDIT');
    const canDelete = checkPermission('ACCOUNTS_DELETE');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    // Confirmation Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Expansion state fully controlled here ──────────────────────────────
    // Set of account IDs that are currently expanded
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Get all accounts that have at least one child (parent accounts)
    const getParentIds = useCallback((accs: any[]): string[] => {
        const parentIdSet = new Set(accs.map(a => a.parentId).filter(Boolean));
        return accs.filter(a => parentIdSet.has(a.id)).map(a => a.id);
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, currRes, branchRes] = await Promise.all([
                axios.get('http://localhost:4000/api/meta/accounts', getAuthHeader()),
                axios.get('http://localhost:4000/api/meta/currencies', getAuthHeader()),
                axios.get('http://localhost:4000/api/meta/branches', getAuthHeader())
            ]);
            const accs = accRes.data.sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true }));
            setAccounts(accs);
            setCurrencies(currRes.data);
            setBranches(branchRes.data);
            // Default: all parents expanded
            setExpandedIds(new Set(getParentIds(accs)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Toggle a single account's expanded state
    const handleToggle = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Expand all parent accounts
    const handleExpandAll = () => {
        setExpandedIds(new Set(getParentIds(accounts)));
    };

    // Collapse all
    const handleCollapseAll = () => {
        setExpandedIds(new Set());
    };

    const handleDelete = (id: string) => {
        setAccountToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`http://localhost:4000/api/meta/accounts/${accountToDelete}`, {
                headers: { Authorization: 'Bearer mock-token' }
            });
            toast.success('تم حذف الحساب بنجاح', {
                description: 'تمت إزالة الحساب وكافة البيانات المرتبطة به من النظام.'
            });
            fetchData();
            setIsDeleteDialogOpen(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف', {
                description: 'تأكد من عدم وجود قيود يومية مرتبطة بهذا الحساب قبل محاولة حذفه.'
            });
        } finally {
            setIsDeleting(false);
            setAccountToDelete(null);
        }
    };

    // Filter for search
    const matchesSearch = useCallback((account: any): boolean => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return account.name.toLowerCase().includes(q) || account.code.toLowerCase().includes(q);
    }, [searchQuery]);

    const hasMatchingDescendant = useCallback((accountId: string): boolean => {
        const children = accounts.filter(a => a.parentId === accountId);
        return children.some(child => matchesSearch(child) || hasMatchingDescendant(child.id));
    }, [accounts, matchesSearch]);

    const buildTree = (parentId: string | null = null): React.ReactNode[] => {
        return accounts
            .filter(a => a.parentId === parentId)
            .filter(a => {
                if (!searchQuery) return true;
                return matchesSearch(a) || hasMatchingDescendant(a.id);
            })
            .map(a => {
                const hasChildren = accounts.some(b => b.parentId === a.id);
                // When searching: force expand so results are visible
                const isExpanded = searchQuery ? true : expandedIds.has(a.id);
                const baseCurrency = currencies.find((c: any) => c.isBase);
                return (
                    <AccountItem
                        key={a.id}
                        id={a.id}
                        name={a.name}
                        code={a.code}
                        type={a.type}
                        balance={a.balance}
                        baseBalance={a.baseBalance}
                        baseCurrencyCode={baseCurrency?.code}
                        hasMixedCurrencies={a.hasMixedCurrencies}
                        childCurrencies={a.childCurrencies}
                        currency={a.currency.code}
                        onEdit={() => { setEditingAccount(a); setIsModalOpen(true); }}
                        onDelete={() => handleDelete(a.id)}
                        isExpanded={isExpanded}
                        onToggle={handleToggle}
                        searchQuery={searchQuery}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    >
                        {buildTree(a.id)}
                    </AccountItem>
                );
            });
    };

    const parentAccountsCount = accounts.filter(a => accounts.some(b => b.parentId === a.id)).length;
    const leafAccountsCount = accounts.filter(a => !accounts.some(b => b.parentId === a.id)).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <PageHeader
                icon={Library}
                title="شجرة الحسابات"
                description="Chart of Accounts Management"
                iconClassName="bg-gradient-to-br from-indigo-600 to-blue-600 shadow-blue-200"
                iconSize={24}
                className="mb-8"
            >
                {canCreate && (
                    <Button
                        onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
                        className="shadow-xl"
                    >
                        <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        إضافة حساب جديد
                    </Button>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats & Tools */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl text-xs py-5 pr-9 pl-8 transition-all font-bold placeholder:text-slate-300"
                                placeholder="ابحث عن حساب..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Expand / Collapse All — single toggle button */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const parentIds = getParentIds(accounts);
                                const allExpanded = parentIds.every(id => expandedIds.has(id));
                                allExpanded ? handleCollapseAll() : handleExpandAll();
                            }}
                            className="w-full justify-center gap-2 text-xs font-black rounded-xl border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all mb-5"
                        >
                            {getParentIds(accounts).every(id => expandedIds.has(id))
                                ? <><ChevronsDownUp size={13} /> طي الكل</>
                                : <><ChevronsUpDown size={13} /> توسيع الكل</>
                            }
                        </Button>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">إحصائيات الشجرة</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="text-blue-600 font-black text-xl">{accounts.length}</div>
                                    <div className="text-[9px] font-black text-blue-400 uppercase leading-tight mt-0.5">إجمالي</div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="text-emerald-600 font-black text-xl">{accounts.filter(a => !a.parentId).length}</div>
                                    <div className="text-[9px] font-black text-emerald-400 uppercase leading-tight mt-0.5">رئيسية</div>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="text-indigo-600 font-black text-xl">{parentAccountsCount}</div>
                                    <div className="text-[9px] font-black text-indigo-400 uppercase leading-tight mt-0.5">مجمّعة</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="text-amber-600 font-black text-xl">{leafAccountsCount}</div>
                                    <div className="text-[9px] font-black text-amber-400 uppercase leading-tight mt-0.5">تشغيلية</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.5rem] text-white overflow-hidden relative group">
                            <ArrowDownRight size={60} className="absolute -bottom-4 -left-4 opacity-10 group-hover:scale-110 transition-transform" />
                            <h5 className="font-black text-sm mb-1">هيكلة ذكية</h5>
                            <p className="text-[10px] text-blue-100 font-bold leading-relaxed">
                                قم بتنظيم حساباتك في مستويات غير محدودة. الحسابات الرئيسية تجمع أرصدة الفرعية تلقائياً.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tree View */}
                <div className="lg:col-span-3">
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-black animate-pulse">جاري بناء معمارية الحسابات...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Search indicator */}
                                {searchQuery && (
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <Search size={14} className="text-blue-500" />
                                        <span className="text-xs font-black text-blue-600">
                                            نتائج البحث عن: "<span className="text-slate-800">{searchQuery}</span>"
                                        </span>
                                    </div>
                                )}
                                {accounts.length > 0 ? (
                                    buildTree(null).length > 0 ? buildTree(null) : (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Search size={40} className="text-slate-200" />
                                            <p className="font-black text-slate-400">لا توجد حسابات تطابق البحث</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                                        <IconBox icon={Library} className="bg-slate-100 text-slate-300" boxSize="w-20 h-20" iconSize={40} />
                                        <div className="text-center">
                                            <p className="font-black text-xl text-slate-400">لا توجد حسابات مسجلة حالياً</p>
                                            <p className="text-slate-300 text-xs font-bold mt-1">ابدأ بإضافة أول حساب لشجرتك المحاسبية</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AccountModal
                    account={editingAccount}
                    accounts={accounts}
                    currencies={currencies}
                    branches={branches}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                variant="destructive"
                title="حذف الحساب المالي"
                description="هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذه العملية إذا كانت هناك بيانات مرتبطة."
                confirmText="حذف نهائي"
                cancelText="إلغاء الأمر"
            />
        </div>
    );
};

export default AccountsPage;
