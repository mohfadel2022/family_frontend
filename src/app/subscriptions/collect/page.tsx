"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
    Wallet,
    Search,
    Building2,
    Calendar,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    UserMinus,
    UserX,
    ArrowLeft,
    Save,
    X,
    Check,
    Plus,
    Users,
    Filter,
    History as HistoryIcon
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { SearchableAccountSelect } from '@/components/SearchableAccountSelect';
import { AccountModal } from '@/components/AccountModal';
import { useRouter, useSearchParams } from 'next/navigation';

import { SUB_BASE, META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = SUB_BASE;
const AUTH_HEADER = getAuthHeader();

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

    // Form State
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [debitAccountId, setDebitAccountId] = useState('');
    const [creditAccountId, setCreditAccountId] = useState('');
    const [description, setDescription] = useState('تحصيل اشتراكات سنوية');

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [entRes, accRes, curRes] = await Promise.all([
                    axios.get(`${API_BASE}/entities`, AUTH_HEADER),
                    axios.get(`${META_BASE}/accounts`, AUTH_HEADER),
                    axios.get(`${META_BASE}/currencies`, AUTH_HEADER)
                ]);
                setEntities(entRes.data);
                setAccounts(accRes.data);
                setCurrencies(curRes.data);
                const base = curRes.data.find((c: any) => c.isBase);
                setBaseCurrency(base);

                if (entRes.data.length > 0) {
                    setSelectedEntityId(entRes.data[0].id);
                }

                if (collectionId) {
                    const collRes = await axios.get(`${API_BASE}/collections/${collectionId}`, AUTH_HEADER);
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
                }
            } catch (err) {
                toast.error("فشل تحميل البيانات الأساسية");
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
                ...AUTH_HEADER,
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
            }, AUTH_HEADER);

            toast.success(status === 'POSTED' ? "تم ترحيل وحفظ السند بنجاح" : "تم حفظ السند كمسودة بنجاح");

            if (status === 'POSTED' && res.data.journalEntryId) {
                router.push(`/vouchers/receipts?id=${res.data.journalEntryId}`);
            } else {
                router.push('/subscriptions/collect/history');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "فشل عملية التحصيل");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnpost = async () => {
        if (!confirm("هل أنت متأكد من إلغاء ترحيل هذا السند؟ سيتم حذف جميع سجلات الاشتراك المرتبطة والعودة لحالة المسودة.")) return;
        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE}/collections/${collectionId}/unpost`, {}, AUTH_HEADER);
            toast.success("تم إلغاء ترحيل السند بنجاح");
            window.location.reload(); // Refresh to update state
        } catch (err: any) {
            toast.error(err.response?.data?.error || "فشل إلغاء الترحيل");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableColumns: ColumnDef<any>[] = [
        {
            id: 'select',
            header: () => (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-white focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        checked={dueMembers.length > 0 && dueMembers.every(m => {
                            const sYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null;
                            const isTerminated = sYear ? sYear <= year : (m.status !== 'ACTIVE');
                            return isTerminated || selections.some(s => s.memberId === m.id && s.year === year);
                        })}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const newSels = dueMembers
                                    .filter(m => {
                                        const sYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : null;
                                        const isTerminated = sYear ? sYear <= year : (m.status !== 'ACTIVE');
                                        return !isTerminated && !selections.some(s => s.memberId === m.id && s.year === year);
                                    })
                                    .map(m => ({
                                        memberId: m.id,
                                        member: m,
                                        year: year,
                                        amount: m.entity.annualSubscription
                                    }));
                                setSelections([...selections, ...newSels]);
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
                            disabled={isTerminated}
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
            accessorKey: 'name',
            header: 'اسم العضو',
            cell: ({ row }) => <span className="font-bold text-slate-700">{row.original.name}</span>
        },
        {
            accessorKey: 'affiliationYear',
            header: 'السنة',
            cell: ({ row }) => <span className="text-slate-400 font-bold">{row.original.affiliationYear}</span>
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
                            member.status === 'DECEASED' ? "bg-slate-50 text-slate-500 border border-slate-200" :
                                "bg-rose-50 text-rose-700 border border-rose-100"
                    )}>
                        {!isTerminatedInYear ? (
                            <><UserCheck size={10} /> {member.status === 'ACTIVE' ? 'نشط' : 'نشط (سابقاً)'}</>
                        ) : member.status === 'DECEASED' ? (
                            <><UserX size={10} /> متوفى {sYear ? `(${sYear})` : ''}</>
                        ) : (
                            <><UserMinus size={10} /> متوقف {sYear ? `(${sYear})` : ''}</>
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
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تهيئة واجهة التحصيل...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHeader
                icon={Wallet}
                title="تحصيل الاشتراكات"
                description="الفلترة الذكية والتحصيل الجماعي لأعضاء الجهات"
                iconClassName="bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-200"
            >
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 mr-4 border-r pr-4 border-slate-200">
                        <Button
                            onClick={() => router.push('/subscriptions/collect/history')}
                            variant="ghost"
                            className="bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl h-14 px-5 flex gap-3 items-center font-black"
                        >
                            <HistoryIcon size={20} />
                            السجلات
                        </Button>
                    </div>
                    <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 font-black uppercase block">إجمالي التحصيل</span>
                        <div className="text-2xl font-black text-indigo-600">
                            {totalAmount.toLocaleString()} <span className="text-sm font-black text-slate-400 uppercase">{baseCurrency?.symbol || '...'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {collectionStatus === 'POSTED' ? (
                            <div className="flex gap-2">
                                <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 font-black flex items-center gap-3">
                                    <CheckCircle2 size={24} />
                                    تم الترحيل بالكامل
                                </div>
                                <Button
                                    onClick={handleUnpost}
                                    variant="outline"
                                    disabled={isSubmitting}
                                    className="bg-white text-rose-600 hover:bg-rose-50 border-rose-100 rounded-2xl h-14 px-5 flex gap-3 items-center font-black"
                                >
                                    <AlertCircle size={20} />
                                    إلغاء الترحيل
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    onClick={() => handleCollect('DRAFT')}
                                    variant="outline"
                                    disabled={isSubmitting || selections.length === 0}
                                    className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200 rounded-2xl h-14 px-6 shadow-sm flex gap-3 items-center font-black"
                                >
                                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={20} />}
                                    حفظ كمسودة
                                </Button>
                                <Button
                                    onClick={() => handleCollect('POSTED')}
                                    disabled={isSubmitting || selections.length === 0}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-100 flex gap-3 items-center font-black"
                                >
                                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                    ترحيل السند
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </PageHeader>

            <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8", collectionStatus === 'POSTED' && "pointer-events-none opacity-80")}>
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                            <Filter size={20} className="text-blue-600" />
                            <h2 className="font-black text-slate-800 text-lg">معايير التحصيل</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600">سنة الاستحقاق</label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(parseInt(e.target.value))}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 font-black text-center text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600">الجهة (Entity)</label>
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
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold" dir="rtl">
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
                                <label className="text-sm font-black text-slate-600">تاريخ السند</label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                                />
                            </div>
                        </div>
                    </section>
                    <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                            <ArrowLeft size={20} className="text-amber-600" />
                            <h2 className="font-black text-slate-800 text-lg">التوجيه المحاسبي</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600">حساب القبض (المدين - كاش/بنك)</label>
                                <SearchableAccountSelect
                                    accounts={accounts}
                                    value={debitAccountId}
                                    onChange={setDebitAccountId}
                                    onAddNew={() => setIsAccountModalOpen(true)}
                                    placeholder="اختر حساب القبض..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600">حساب الإيراد (الدائن)</label>
                                <SearchableAccountSelect
                                    accounts={accounts}
                                    value={creditAccountId}
                                    onChange={setCreditAccountId}
                                    onAddNew={() => setIsAccountModalOpen(true)}
                                    placeholder="اختر حساب الإيراد..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600">البيان / الوصف</label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-2">
                    <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
                                    <Users size={26} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 italic">اختيار الأعضاء</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Eligible Entity Members</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
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
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                                    <p className="font-black text-indigo-900">جاري تحليل بيانات الاستحقاق...</p>
                                </div>
                            ) : dueMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 py-20 opacity-30">
                                    <CheckCircle2 size={64} className="text-emerald-500" />
                                    <p className="font-black text-xl">لا يوجد مبالغ مستحقة لهذه الجهة في هذا العام</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <DataTable
                                            columns={availableColumns}
                                            data={dueMembers}
                                            searchPlaceholder="البحث في قائمة المستحقين..."
                                        />
                                    </div>

                                    {groupedSelections.length > 0 && (
                                        <div className="space-y-3 mt-8">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-tighter px-2">الاشتراكات المحددة ({groupedSelections.length} أعضاء)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                                {groupedSelections.map((group, idx) => (
                                                    <div key={`group-${idx}`} className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl group transition-all hover:border-indigo-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-wrap gap-1 max-w-[80px]">
                                                                {group.years.map((y: number) => (
                                                                    <div key={y} className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black">
                                                                        {y}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 text-sm">{group.member.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                                    {group.member?.entity?.name} | {group.total} {group.member?.entity?.currency?.symbol || ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelections(selections.filter(s => s.memberId !== group.memberId));
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                                        {selections.length}
                                    </div>
                                    <p className="font-black text-slate-700">أعضاء مختارون للسداد</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase">قيمة السند الإجمالي</p>
                                    <div className="text-3xl font-black text-slate-900 leading-none">
                                        {totalAmount.toLocaleString()} <span className="text-sm font-black text-slate-400 uppercase">{baseCurrency?.symbol || '...'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {isAccountModalOpen && (
                <AccountModal
                    onClose={() => setIsAccountModalOpen(false)}
                    onSave={() => {
                        axios.get(`${META_BASE}/accounts`, AUTH_HEADER).then(res => setAccounts(res.data));
                        setIsAccountModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

export default function CollectPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-black animate-pulse">جاري تحميل واجهة التحصيل...</p>
            </div>
        }>
            <CollectPageContent />
        </Suspense>
    );
}
