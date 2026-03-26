"use client";

import { useState, useEffect, Suspense } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableAccountSelect } from '@/components/SearchableAccountSelect';
import { ActionModal } from '@/components/ui/ActionModal';
import { AccountForm } from '@/components/forms/AccountForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

import { SUB_BASE, META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = SUB_BASE;

function CollectPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const collectionId = searchParams.get('id');

    const [entities, setEntities] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [dueMembers, setDueMembers] = useState<any[]>([]);
    const [selections, setSelections] = useState<any[]>([]);

    const [loadingEntities, setLoadingEntities] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [collectionStatus, setCollectionStatus] = useState<string>('DRAFT');
    const [baseCurrency, setBaseCurrency] = useState<any>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    // Form State
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [debitAccountId, setDebitAccountId] = useState('');
    const [creditAccountId, setCreditAccountId] = useState('');
    const [description, setDescription] = useState('تحصيل اشتراكات سنوية');

    const [isActionModalOpen, seIsActionModalOpen] = useState(false);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; variant: 'danger' | 'warning' | 'info'; icon: any; label: string }>(
        { title: '', description: '', variant: 'danger', icon: APP_ICONS.STATE.WARNING, label: '' }
    );
    const [confirmLoading, setConfirmLoading] = useState(false);

    const askConfirm = (config: typeof confirmConfig, action: () => Promise<void>) => {
        setConfirmConfig(config);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const executeConfirm = async () => {
        if (!confirmAction) return;
        setConfirmLoading(true);
        try { await confirmAction(); } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
        }
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                // Fetch core entity data first (critical)
                const entRes = await axios.get(`${API_BASE}/entities`, getAuthHeader());
                setEntities(entRes.data);
                if (entRes.data.length > 0) {
                    setSelectedEntityId(entRes.data[0].id);
                }

                // Fetch metadata (non-critical, might fail if user lacks global permissions)
                try {
                    const accRes = await axios.get(`${META_BASE}/accounts`, getAuthHeader());
                    setAccounts(accRes.data);
                } catch (e) {
                    console.warn("Accounts fetch failed, likely permission missing:", e);
                }

                try {
                    const curRes = await axios.get(`${META_BASE}/currencies`, getAuthHeader());
                    setCurrencies(curRes.data);
                    const base = curRes.data.find((c: any) => c.isBase);
                    setBaseCurrency(base);
                } catch (e) {
                    console.warn("Currencies fetch failed, likely permission missing:", e);
                }

                try {
                    const branchRes = await axios.get(`${META_BASE}/branches`, getAuthHeader());
                    setBranches(branchRes.data);
                } catch (e) {
                    console.warn("Branches fetch failed, likely permission missing:", e);
                }

                if (collectionId) {
                    const collRes = await axios.get(`${API_BASE}/collections/${collectionId}`, getAuthHeader());
                    const coll = collRes.data;
                    setDate(coll.date.split('T')[0]);
                    setDescription(coll.description);
                    setDebitAccountId(coll.debitAccountId || '');
                    setCreditAccountId(coll.creditAccountId || '');
                    setCollectionStatus(coll.status);
                    setSelections(coll.items.map((it: any) => ({
                        memberId: it.memberId,
                        member: it.member,
                        year: it.year,
                        amount: it.amount
                    })));

                    // Recover the entity from the first member in the collection
                    if (coll.items.length > 0 && coll.items[0].member?.entityId) {
                        setSelectedEntityId(coll.items[0].member.entityId);
                    }
                }
            } catch (err: any) {
                toast.error(err.response?.data?.error || "فشل تحميل البيانات الأساسية");
                console.error(err);
            } finally {
                setLoadingEntities(false);
            }
        };
        fetchInitial();
    }, [collectionId]);

    useEffect(() => {
        if (selectedEntityId && year) {
            fetchDueMembers();
        }
    }, [selectedEntityId, year]);

    const fetchDueMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await axios.get(`${API_BASE}/due`, {
                ...getAuthHeader(),
                params: { entityId: selectedEntityId, year }
            });
            setDueMembers(res.data);
        } catch (err) {
            toast.error("فشل تحميل قائمة المستحقين");
        } finally {
            setLoadingMembers(false);
        }
    };

    const totalAmount = selections.reduce((sum, s) => sum + Number(s.amount), 0);
    const selectedEntity = entities.find(e => e.id === selectedEntityId);
    const currencySymbol = selectedEntity?.currency?.symbol || baseCurrency?.symbol || '...';

    const handleCollect = async (status: 'DRAFT' | 'POSTED' = 'DRAFT') => {
        if (selections.length === 0) {
            toast.error("يرجى اختيار عضو واحد على الأقل");
            return;
        }

        if (status === 'POSTED' && (!debitAccountId || !creditAccountId)) {
            toast.error("بيانات الحسابات المدين والدائن مطلوبة للترحيل");
            return;
        }

        setIsSubmitting(true);
        try {
            const firstBranchId = selections[0].member.entity.branchId;

            const res = await axios.post(`${API_BASE}/collect`, {
                id: collectionId || undefined,
                items: selections.map(s => ({
                    memberId: s.memberId,
                    year: s.year,
                    amount: s.amount
                })),
                date,
                debitAccountId: debitAccountId || undefined,
                creditAccountId: creditAccountId || undefined,
                branchId: firstBranchId,
                description,
                status
            }, getAuthHeader());

            toast.success(status === 'POSTED' ? "تم ترحيل وحفظ السند بنجاح" : "تم حفظ السند كمسودة بنجاح");

            if (status === 'POSTED' && res.data.journalEntryId) {
                router.push(`/vouchers/receipts?id=${res.data.journalEntryId}`);
            } else {
                router.push('/subscriptions/history');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "فشل عملية التحصيل");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnpost = () => {
        askConfirm(
            {
                title: 'إلغاء ترحيل سند التحصيل',
                description: 'هل أنت متأكد من إلغاء ترحيل هذا السند؟ سيتم حذف جميع سجلات الاشتراك المرتبطة والعودة لحالة المسودة.',
                variant: 'warning',
                icon: APP_ICONS.ACTIONS.UNDO,
                label: 'إلغاء الترحيل',
            },
            async () => {
                await axios.post(`${API_BASE}/collections/${collectionId}/unpost`, {}, getAuthHeader());
                toast.success("تم إلغاء ترحيل السند بنجاح");
                router.refresh(); // Or better yet:
                window.location.reload();
            }
        );
    };

    const availableColumns: ColumnDef<any>[] = [
        {
            id: 'select',
            header: () => (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        disabled={!year}
                        className="w-4 h-4 rounded border-slate-300 text-white focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        checked={dueMembers.length > 0 && dueMembers.every(m => {
                            const sYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null;
                            const isTerminated = sYear ? sYear <= year : (m.status !== 'ACTIVE');
                            return isTerminated || selections.some(s => s.memberId === m.id && s.year === year);
                        })}
                        onChange={(e) => {
                            if (e.target.checked) {
                                // Filter out already selected or terminated
                                const selectableMembers = dueMembers.filter(m => {
                                    const sYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null;
                                    const isTerminated = sYear ? sYear <= year : (m.status !== 'ACTIVE');
                                    return !isTerminated && !selections.some(s => s.memberId === m.id && s.year === year);
                                });

                                if (selectableMembers.length === 0) return;

                                // If some already selected, check consistency with new batch
                                const existingCurrencyId = selections.length > 0 ? selections[0].member.entity.currencyId : selectableMembers[0].entity.currencyId;

                                const inconsistent = selectableMembers.filter(m => m.entity.currencyId !== existingCurrencyId);
                                if (inconsistent.length > 0) {
                                    if (selections.length > 0) {
                                        toast.error("لا يمكن إضافة أعضاء بعملات مختلفة للسند نفسه");
                                        return;
                                    } else {
                                        // If selecting all for first time and they are inconsistent
                                        const currencies = new Set(selectableMembers.map(m => m.entity.currencyId));
                                        if (currencies.size > 1) {
                                            toast.error("القائمة تحتوي على أعضاء بعملات مختلفة، يرجى الاختيار يدوياً للسند الواحد");
                                            return;
                                        }
                                    }
                                }

                                const newBatch = selectableMembers.map(m => ({
                                    memberId: m.id,
                                    member: m,
                                    year,
                                    amount: m.entity.annualSubscription
                                }));
                                setSelections([...selections, ...newBatch]);
                            } else {
                                setSelections(selections.filter(s => s.year !== year || !dueMembers.some(m => m.id === s.memberId)));
                            }
                        }}
                    />
                </div>
            ),
            cell: ({ row }) => {
                const member = row.original;
                const isSelected = selections.some(s => s.memberId === member.id && s.year === year);
                const sYear = member.stoppedAt ? new Date(member.stoppedAt).getFullYear() : null;
                const isTerminated = sYear ? sYear <= year : (member.status !== 'ACTIVE');

                return (
                    <div className="flex justify-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            disabled={isTerminated || !year}
                            checked={isSelected}
                            onChange={() => {
                                if (isSelected) {
                                    setSelections(selections.filter(s => !(s.memberId === member.id && s.year === year)));
                                } else {
                                    setSelections([...selections, {
                                        memberId: member.id,
                                        member: member,
                                        year: year,
                                        amount: member.entity.annualSubscription
                                    }]);
                                }
                            }}
                        />
                    </div>
                );
            },
        },
        {
            accessorKey: 'code',
            header: 'كود العضو',
            cell: ({ row }) => <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{row.original.code}</span>
        },
        {
            accessorKey: 'name',
            header: 'اسم العضو',
            cell: ({ row }) => <span className="font-bold text-foreground/80">{row.original.name}</span>
        },
        {
            accessorKey: 'entity.name',
            header: 'الجهة',
            cell: ({ row }) => <span className="text-[10px] font-bold text-muted-foreground/60">{row.original.entity?.name}</span>
        },
        {
            accessorKey: 'phone',
            header: 'رقم الهاتف',
            cell: ({ row }) => <span className="font-mono text-[10px] text-muted-foreground/60">{row.original.phone || '-'}</span>
        },
        {
            accessorKey: 'affiliationYear',
            header: 'السنة',
            cell: ({ row }) => <span className="text-muted-foreground/60 font-bold">{row.original.affiliationYear}</span>
        },
        {
            accessorKey: 'status',
            header: 'الحالة',
            cell: ({ row }) => {
                const member = row.original;
                const sYear = member.stoppedAt ? new Date(member.stoppedAt).getFullYear() : null;
                const isTerminatedInYear = sYear ? sYear <= year : (member.status !== 'ACTIVE');

                return (
                    <div className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black inline-flex items-center gap-1 uppercase transition-all",
                        !isTerminatedInYear ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            member.status === 'DECEASED' ? "bg-muted/50 text-muted-foreground/80 border border-input" :
                                "bg-rose-50 text-rose-700 border border-rose-100"
                    )}>
                        {!isTerminatedInYear ? (
                            <><APP_ICONS.MODULES.STATUS.ACTIVE size={10} /> {member.status === 'ACTIVE' ? 'نشط' : 'نشط (سابقاً)'}</>
                        ) : member.status === 'DECEASED' ? (
                            <><APP_ICONS.MODULES.STATUS.DECEASED size={10} /> متوفى {sYear ? `(${sYear})` : ''}</>
                        ) : (
                            <><APP_ICONS.MODULES.STATUS.INACTIVE size={10} /> متوقف {sYear ? `(${sYear})` : ''}</>
                        )}
                    </div>
                );
            }
        }
    ];

    const groupedSelections = selections.reduce((acc: any[], s: any) => {
        const existing = acc.find(g => g.memberId === s.memberId);
        if (existing) {
            if (!existing.years.includes(s.year)) {
                existing.years.push(s.year);
                existing.total += Number(s.amount);
            }
        } else {
            acc.push({
                memberId: s.memberId,
                member: s.member,
                years: [s.year],
                total: Number(s.amount)
            });
        }
        return acc;
    }, []);

    if (loadingEntities) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تهيئة واجهة التحصيل...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHeader
                icon={APP_ICONS.MODULES.COLLECT}
                title="تحصيل الاشتراكات"
                description="الفلترة الذكية والتحصيل الجماعي لأعضاء الجهات"
            >
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 mr-4 border-r pr-4 border-input">
                        <CustomButton
                            onClick={() => router.push('/subscriptions/history')}
                            variant="outline"
                        >
                            <APP_ICONS.MODULES.COLLECT_HISTORY size={20} />
                            السجلات
                        </CustomButton>
                    </div>
                    <div className="text-left md:text-right">
                        <span className="text-[10px] text-muted-foreground/60 font-black uppercase block">إجمالي التحصيل</span>
                        <div className="text-2xl font-black text-indigo-600">
                            {totalAmount.toLocaleString()} <span className="text-sm font-black text-muted-foreground/60 uppercase">{currencySymbol}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {collectionStatus === 'POSTED' ? (
                            <div className="flex gap-2">
                                <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 font-black flex items-center gap-3">
                                    <APP_ICONS.STATE.SUCCESS size={24} />
                                    تم الترحيل بالكامل
                                </div>
                                <CustomButton
                                    icon={APP_ICONS.ACTIONS.UNDO}
                                    onClick={handleUnpost}
                                    disabled={isSubmitting}
                                    className="!text-black"
                                >
                                    إلغاء الترحيل
                                </CustomButton>
                            </div>
                        ) : (
                            <>
                                <CustomButton
                                    icon={isSubmitting ? APP_ICONS.STATE.LOADING : APP_ICONS.ACTIONS.SAVE}
                                    onClick={() => handleCollect('DRAFT')}
                                    variant="outline"
                                    disabled={isSubmitting || selections.length === 0}
                                    className={isSubmitting ? "animate-spin" : ""}
                                >
                                    حفظ كمسودة
                                </CustomButton>
                                <CustomButton
                                    icon={isSubmitting ? APP_ICONS.STATE.LOADING : APP_ICONS.STATE.SUCCESS}
                                    onClick={() => handleCollect('POSTED')}
                                    disabled={isSubmitting || selections.length === 0}
                                    className={isSubmitting ? "animate-spin" : ""}
                                >
                                    ترحيل السند
                                </CustomButton>
                            </>
                        )}
                    </div>
                </div>
            </PageHeader>

            <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8", collectionStatus === 'POSTED' && "pointer-events-none opacity-80")}>
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                            <APP_ICONS.ACTIONS.FILTER size={20} className="text-blue-600" />
                            <h2 className="font-black text-foreground/90 text-lg">معايير التحصيل</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">سنة الاستحقاق</label>
                                <Input
                                    type="number"
                                    value={year || ''}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        setYear(isNaN(val) ? 0 : val);
                                    }}
                                    className="h-12 rounded-xl bg-muted/50 border-border font-black text-center text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">الجهة (Entity)</label>
                                <Select
                                    value={selectedEntityId}
                                    onValueChange={(val) => {
                                        if (selections.length > 0 && val !== selectedEntityId) {
                                            toast.error("يرجى إفراغ القائمة قبل تغيير الجهة (يجب أن يكون التحصيل لجهة واحدة فقط)");
                                            return;
                                        }
                                        setSelectedEntityId(val);
                                    }}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-muted/50 font-bold" dir="rtl">
                                        <SelectValue placeholder="اختر الجهة" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        {entities.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">تاريخ السند</label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="h-12 rounded-xl bg-muted/50 border-border font-bold"
                                />
                            </div>
                        </div>
                    </section>
                    <section className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                            <APP_ICONS.ACTIONS.CHEVRON_LEFT size={20} className="text-amber-600 rotate-180" />
                            <h2 className="font-black text-foreground/90 text-lg">التوجيه المحاسبي</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">حساب القبض (المدين - كاش/بنك)</label>
                                <SearchableAccountSelect
                                    accounts={accounts.filter(a => !accounts.some(b => b.parentId === a.id) && a.type === 'ASSET')}
                                    value={debitAccountId}
                                    onChange={setDebitAccountId}
                                    onAddNew={() => seIsActionModalOpen(true)}
                                    placeholder="اختر حساب القبض (أصول)..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">حساب الإيراد (الدائن)</label>
                                <SearchableAccountSelect
                                    accounts={accounts.filter(a => !accounts.some(b => b.parentId === a.id) && a.type === 'REVENUE')}
                                    value={creditAccountId}
                                    onChange={setCreditAccountId}
                                    onAddNew={() => seIsActionModalOpen(true)}
                                    placeholder="اختر حساب الإيراد (إيرادات)..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-muted-foreground">البيان / الوصف</label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="h-12 rounded-xl bg-muted/50 border-border font-bold"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-2">
                    <section className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-border/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
                                    <APP_ICONS.MODULES.MEMBERS size={26} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground/90 italic">اختيار الأعضاء</h2>
                                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">Eligible Entity Members</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={!year}
                                    onClick={() => {
                                        const newSelections = dueMembers
                                            .filter(m => {
                                                const sYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null;
                                                const isTerminated = sYear ? sYear <= year : (m.status !== 'ACTIVE');
                                                const isSelected = selections.some(s => s.memberId === m.id && s.year === year);
                                                return !isTerminated && !isSelected;
                                            })
                                            .map(m => ({
                                                memberId: m.id,
                                                member: m,
                                                year: year,
                                                amount: m.entity.annualSubscription
                                            }));
                                        setSelections([...selections, ...newSelections]);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase transition-all"
                                >
                                    إضافة جميع المستحقين
                                </button>
                                <button
                                    onClick={() => setSelections([])}
                                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] uppercase transition-all"
                                >
                                    تفريغ القائمة
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar min-h-[400px]">
                            {loadingMembers ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 py-20 opacity-40">
                                    <APP_ICONS.STATE.LOADING className="w-12 h-12 animate-spin text-indigo-600" />
                                    <p className="font-black text-indigo-900">جاري تحليل بيانات الاستحقاق...</p>
                                </div>
                            ) : dueMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 py-20 opacity-30">
                                    <APP_ICONS.STATE.SUCCESS size={64} className="text-emerald-500" />
                                    <p className="font-black text-xl">لا يوجد مبالغ مستحقة لهذه الجهة في هذا العام</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-muted/50 p-2 rounded-2xl border border-border">
                                        <DataTable
                                            columns={availableColumns}
                                            data={dueMembers}
                                            searchPlaceholder="البحث في قائمة المستحقين..."
                                        />
                                    </div>

                                </div>
                            )}
                        </div>

                        {groupedSelections.length > 0 && (
                            <div className="shrink-0 bg-indigo-50/30 border-t border-indigo-100 p-6 max-h-[250px] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest px-2 flex items-center gap-2">
                                        <APP_ICONS.MODULES.MEMBERS size={12} />
                                        الأعضا المختارون ({groupedSelections.length})
                                    </h3>
                                    <button
                                        onClick={() => setSelections([])}
                                        className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase"
                                    >
                                        تفريغ الكل
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                    {groupedSelections.map((group, idx) => (
                                        <div key={`group-${idx}`} className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-xl group transition-all hover:border-indigo-300 hover:shadow-sm">
                                            
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                
                                                <div className="flex flex-wrap gap-1 shrink-0">
                                                    {group.years.map((y: number) => (
                                                        <div key={y} className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black">
                                                            {y}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-black text-foreground/90 text-xs truncate">{group.member.name}</p>
                                                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tight truncate">
                                                        {group.member?.code} | {group.total.toLocaleString()} {group.member?.entity?.currency?.symbol || ''}
                                                    </p>
                                                </div>
                                                
                                            </div>
                                            <button
                                                    onClick={() => {
                                                        setSelections(selections.filter(s => s.memberId !== group.memberId));
                                                    }}
                                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                                                >
                                                    <APP_ICONS.ACTIONS.X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-8 bg-muted/50 border-t border-border shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-card rounded-xl border border-input flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                                        {selections.length}
                                    </div>
                                    <p className="font-black text-foreground/80">أعضاء مختارون للسداد</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground/60 font-black uppercase">قيمة السند الإجمالي</p>
                                    <div className="text-3xl font-black text-foreground leading-none">
                                        {totalAmount.toLocaleString()} <span className="text-sm font-black text-muted-foreground/60 uppercase">{currencySymbol}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {isActionModalOpen && (
                <ActionModal
                    isOpen={true}
                    onClose={() => seIsActionModalOpen(false)}
                    title="إضافة حساب مالي"
                    description="يرجى ملء تفاصيل الحساب المالي بدقة."
                    icon={APP_ICONS.MODULES.ACCOUNTS}
                    maxWidth="max-w-2xl"
                    preventClose={true}
                    showCloseButton={false}
                >
                    <AccountForm
                        accounts={accounts}
                        currencies={currencies}
                        branches={branches}
                        onClose={() => seIsActionModalOpen(false)}
                        onSave={() => {
                            axios.get(`${META_BASE}/accounts`, getAuthHeader()).then(res => setAccounts(res.data));
                            seIsActionModalOpen(false);
                        }}
                    />
                </ActionModal>
            )}

            <ConfirmModal
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmLabel={confirmConfig.label}
                variant={confirmConfig.variant}
                icon={confirmConfig.icon}
                loading={confirmLoading}
            />
        </div>
    );
}

export default function CollectPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <APP_ICONS.STATE.LOADING className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل واجهة التحصيل...</p>
            </div>
        }>
            <CollectPageContent />
        </Suspense>
    );
}
