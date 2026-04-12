"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { ActionModal } from '@/components/ui/ActionModal';
import { AccountForm } from '@/components/forms/AccountForm';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { useAuth } from '@/context/AuthContext';
import { META_BASE, getAuthHeader } from '@/lib/api';

// Using global getAuthHeader helper from @/lib/api

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
                    hasChildren ? "hover:bg-blue-50/30" : "hover:bg-accent/50"
                )}
                onClick={() => hasChildren && onToggle(id)}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                        {hasChildren ? (
                            <div className={cn("transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")}>
                                <APP_ICONS.ACTIONS.CHEVRON_DOWN size={16} className="text-muted-foreground/60 group-hover:text-blue-500" />
                            </div>
                        ) : <div className="w-4" />}
                    </div>

                    <IconBox
                        icon={hasChildren ? APP_ICONS.MODULES.ACCOUNT_FOLDER : APP_ICONS.MODULES.ACCOUNT_LEAF}
                        className={hasChildren ? "bg-blue-100 text-blue-600 shadow-blue-50" : "bg-accent text-muted-foreground/60 shadow-none"}
                        boxSize="w-8 h-8"
                        iconSize={14}
                    />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{highlight(code)}</span>
                            <span className="font-black text-sm text-foreground/90 tracking-tight">{highlight(name)}</span>
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest mt-0.5",
                            type === 'ASSET' ? "text-blue-500" :
                                type === 'REVENUE' ? "text-emerald-500" :
                                    type === 'EXPENSE' ? "text-rose-500" :
                                        "text-muted-foreground/60"
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
                            isNeg(balance) ? "text-rose-600" : "text-foreground"
                        )}>
                            {fmtNum(balance ?? 0)}
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase ml-1.5 tracking-tighter">{currency}</span>
                        </span>

                        {/* If parent has mixed currencies: show base equivalent */}
                        {hasMixedCurrencies && baseBalance !== undefined && baseCurrencyCode && (
                            <span className="text-[12px] text-muted-foreground/60 tabular-nums">
                                ≈ {fmtNum(baseBalance)}
                                <span className="ml-1 font-black text-muted-foreground/40 uppercase">{baseCurrencyCode}</span>
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
                            <CustomButton
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="w-10 h-10 text-muted-foreground/60 hover:text-blue-600 hover:bg-card border-transparent hover:border-blue-100"
                            >
                                <APP_ICONS.ACTIONS.EDIT_ALT size={16} />
                            </CustomButton>
                        )}
                        {canDelete && (
                            <CustomButton
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="w-10 h-10 text-muted-foreground/60 hover:text-rose-600 hover:bg-card border-transparent hover:border-rose-100"
                            >
                                <APP_ICONS.ACTIONS.DELETE size={16} />
                            </CustomButton>
                        )}
                    </div>
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div className="mr-12 border-r-2 border-border pr-4 mt-2 mb-4 space-y-2 relative">
                    <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-b from-transparent via-slate-50/50 to-transparent"></div>
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AccountsPage = () => {
    const { isAdmin, checkPermission, loading: authLoading } = useAuth();
    const canView = checkPermission('ACCOUNTS_VIEW');
    const canCreate = checkPermission('ACCOUNTS_CREATE');
    const canEdit = checkPermission('ACCOUNTS_EDIT');
    const canDelete = checkPermission('ACCOUNTS_DELETE');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accounts_searchQuery') || '';
        }
        return '';
    });
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('accounts_expandedIds');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        }
        return new Set();
    });

    useEffect(() => {
        localStorage.setItem('accounts_searchQuery', searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        localStorage.setItem('accounts_expandedIds', JSON.stringify(Array.from(expandedIds)));
    }, [expandedIds]);
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
    // (Consolidated above)

    // Search
    // (Consolidated above)

    // Get all accounts that have at least one child (parent accounts)
    const getParentIds = useCallback((accs: any[]): string[] => {
        const parentIdSet = new Set(accs.map(a => a.parentId).filter(Boolean));
        return accs.filter(a => parentIdSet.has(a.id)).map(a => a.id);
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, currRes, branchRes] = await Promise.all([
                axios.get(`${META_BASE}/accounts`, getAuthHeader()),
                axios.get(`${META_BASE}/currencies`, getAuthHeader()),
                axios.get(`${META_BASE}/branches`, getAuthHeader())
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
            await axios.delete(`${META_BASE}/accounts/${accountToDelete}`, getAuthHeader());
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

    if (authLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري التحقق من الصلاحيات...</p>
        </div>
    );

    if (!canView && !isAdmin) {
        return <UnauthorizedAccess />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <PageHeader
                icon={APP_ICONS.MODULES.ACCOUNTS_TREE}
                title="شجرة الحسابات"
                description="Chart of Accounts Management"
                iconSize={24}
                className="mb-8"
            >
                {canCreate && (
                    <CustomButton
                        onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
                        variant="primary"
                        className="h-12 px-6"
                    >
                        <APP_ICONS.ACTIONS.ADD size={18} />
                        إضافة حساب جديد
                    </CustomButton>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats & Tools */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card p-5 rounded-[2rem] border border-border shadow-xl shadow-slate-900/5">
                        {/* Search */}
                        <div className="relative mb-4">
                            <APP_ICONS.ACTIONS.SEARCH className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                            <Input
                                className="w-full bg-muted/50 border-input rounded-2xl text-xs py-5 pr-9 pl-8 transition-all font-bold placeholder:text-muted-foreground/40"
                                placeholder="ابحث عن حساب..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                                >
                                    <APP_ICONS.ACTIONS.X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Expand / Collapse All — single toggle button */}
                        <CustomButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const parentIds = getParentIds(accounts);
                                const allExpanded = parentIds.every(id => expandedIds.has(id));
                                allExpanded ? handleCollapseAll() : handleExpandAll();
                            }}
                            className="w-full justify-center h-10 mb-5"
                        >
                            {getParentIds(accounts).every(id => expandedIds.has(id))
                                ? <><APP_ICONS.ACTIONS.COLLAPSE_ALL size={13} /> طي الكل</>
                                : <><APP_ICONS.ACTIONS.EXPAND_ALL size={13} /> توسيع الكل</>
                            }
                        </CustomButton>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em]">إحصائيات الشجرة</h4>
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
                            <APP_ICONS.REPORTS.BRANCH_EXPENSE size={60} className="absolute -bottom-4 -left-4 opacity-10 group-hover:scale-110 transition-transform" />
                            <h5 className="font-black text-sm mb-1">هيكلة ذكية</h5>
                            <p className="text-[10px] text-blue-100 font-bold leading-relaxed">
                                قم بتنظيم حساباتك في مستويات غير محدودة. الحسابات الرئيسية تجمع أرصدة الفرعية تلقائياً.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tree View */}
                <div className="lg:col-span-3">
                    <div className="bg-card/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-border shadow-2xl min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="relative">
                                    <APP_ICONS.STATE.LOADING className="w-16 h-16 text-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    </div>
                                </div>
                                <p className="text-muted-foreground/80 font-black animate-pulse">جاري بناء معمارية الحسابات...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Search indicator */}
                                {searchQuery && (
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <APP_ICONS.ACTIONS.SEARCH size={14} className="text-blue-500" />
                                        <span className="text-xs font-black text-blue-600">
                                            نتائج البحث عن: "<span className="text-foreground/90">{searchQuery}</span>"
                                        </span>
                                    </div>
                                )}
                                {accounts.length > 0 ? (
                                    buildTree(null).length > 0 ? buildTree(null) : (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <APP_ICONS.ACTIONS.SEARCH size={40} className="text-muted-foreground/20" />
                                            <p className="font-black text-muted-foreground/60">لا توجد حسابات تطابق البحث</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                                        <IconBox icon={APP_ICONS.MODULES.ACCOUNTS} className="bg-accent text-muted-foreground/40" boxSize="w-20 h-20" iconSize={40} />
                                        <div className="text-center">
                                            <p className="font-black text-xl text-muted-foreground/60">لا توجد حسابات مسجلة حالياً</p>
                                            <p className="text-muted-foreground/40 text-xs font-bold mt-1">ابدأ بإضافة أول حساب لشجرتك المحاسبية</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ActionModal
                    isOpen={true}
                    onClose={() => setIsModalOpen(false)}
                    title={editingAccount ? 'تعديل بيانات الحساب' : 'إضافة حساب مالي'}
                    description="يرجى ملء تفاصيل الحساب المالي بدقة."
                    icon={APP_ICONS.MODULES.ACCOUNTS}
                    maxWidth="max-w-2xl"
                    preventClose={true}
                    showCloseButton={false}
                >
                    <AccountForm
                        account={editingAccount}
                        accounts={accounts}
                        currencies={currencies}
                        branches={branches}
                        onClose={() => setIsModalOpen(false)}
                        onSave={fetchData}
                    />
                </ActionModal>
            )}

            <ConfirmModal
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                loading={isDeleting}
                variant="danger"
                title="حذف الحساب المالي"
                description="هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذه العملية إذا كانت هناك بيانات مرتبطة."
                confirmLabel="حذف نهائي"
                cancelLabel="إلغاء الأمر"
            />
        </div>
    );
};

export default AccountsPage;
