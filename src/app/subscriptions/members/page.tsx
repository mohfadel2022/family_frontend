"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ImportMembersModal } from './ImportMembersModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ActionModal } from '@/components/ui/ActionModal';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';

import { SUB_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = SUB_BASE;
const AUTH_HEADER = getAuthHeader();

import { useSearchParams, useRouter } from 'next/navigation';

import { Suspense } from 'react';

function MembersPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlStatus = searchParams.get('status');
    const urlDue = searchParams.get('due') === 'true';
    const urlYear = searchParams.get('year');
    const urlPaid = searchParams.get('paid') === 'true';
    const urlSearch = searchParams.get('search') || '';
    const urlEntity = searchParams.get('entity') || 'all';
    const urlPage = Number(searchParams.get('page')) || 0;

    const [members, setMembers] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [selectedEntity, setSelectedEntity] = useState<string>(urlEntity);
    const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus || 'all');
    const [showOnlyDue, setShowOnlyDue] = useState(urlDue);
    const [filterYear, setFilterYear] = useState<number>(urlYear ? Number(urlYear) : new Date().getFullYear());
    const [showOnlyPaid, setShowOnlyPaid] = useState(urlPaid);
    const [pageIndex, setPageIndex] = useState(urlPage);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isExemptionsModalOpen, setIsExemptionsModalOpen] = useState(false);
    const [exemptingMember, setExemptingMember] = useState<any>(null);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // Sync state to URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedStatus !== 'all') params.set('status', selectedStatus);
        if (showOnlyDue) params.set('due', 'true');
        if (showOnlyPaid) params.set('paid', 'true');
        if (filterYear !== new Date().getFullYear()) params.set('year', filterYear.toString());
        if (searchTerm) params.set('search', searchTerm);
        if (selectedEntity !== 'all') params.set('entity', selectedEntity);
        if (pageIndex > 0) params.set('page', pageIndex.toString());

        const queryString = params.toString();
        router.replace(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
    }, [selectedStatus, showOnlyDue, showOnlyPaid, filterYear, searchTerm, selectedEntity, pageIndex, router]);

    // Reset pageIndex when any filter changes
    useEffect(() => {
        setPageIndex(0);
    }, [selectedStatus, showOnlyDue, showOnlyPaid, filterYear, searchTerm, selectedEntity]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [memRes, entRes] = await Promise.all([
                axios.get(`${API_BASE}/members`, AUTH_HEADER),
                axios.get(`${API_BASE}/entities`, AUTH_HEADER)
            ]);
            setMembers(memRes.data);
            setEntities(entRes.data);
        } catch (err) {
            toast.error("فشل تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (!memberToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${API_BASE}/members/${memberToDelete.id}`, AUTH_HEADER);
            toast.success('تم حذف العضو بنجاح');
            setMemberToDelete(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حذف العضو');
        } finally {
            setIsDeleting(false);
        }
    };

    const membersForEntity = selectedEntity === 'all' ? members : members.filter((m: any) => m.entityId === selectedEntity);
    const membersByYear = membersForEntity.filter((m: any) => m.affiliationYear <= filterYear);

    const baseFilteredMembers = membersByYear.filter((m: any) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            m.name.toLowerCase().includes(term) ||
            m.affiliationYear.toString().includes(term) ||
            m.entity?.name?.toLowerCase().includes(term);
        
        // Historical Status Logic: Active in filterYear if joined by then AND (not stopped OR stopped after filterYear)
        const stoppedYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : Infinity;
        const isActiveInYear = stoppedYear > filterYear;

        let matchesDue = true;
        if (showOnlyDue) {
            matchesDue = isActiveInYear && 
                !m.subscriptions?.some((s: any) => s.year === filterYear) &&
                !m.exemptions?.some((e: any) => e.year === filterYear);
        }

        let matchesPaid = true;
        if (showOnlyPaid) {
            matchesPaid = m.subscriptions?.some((s: any) => s.year === filterYear);
        }

        return matchesSearch && matchesDue && matchesPaid;
    });

    const stats = {
        total: baseFilteredMembers.length,
        active: baseFilteredMembers.filter((m: any) => {
            const stoppedYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : Infinity;
            return stoppedYear > filterYear;
        }).length,
        inactive: baseFilteredMembers.filter((m: any) => {
            const stoppedYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : Infinity;
            return stoppedYear <= filterYear && m.status === 'INACTIVE';
        }).length,
        deceased: baseFilteredMembers.filter((m: any) => {
            const stoppedYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : Infinity;
            return stoppedYear <= filterYear && m.status === 'DECEASED';
        }).length,
    };

    const filteredMembers = baseFilteredMembers.filter((m: any) => {
        if (selectedStatus === 'all') return true;
        
        const stoppedYear = m.stoppedAt ? new Date(m.stoppedAt).getFullYear() : Infinity;
        const isActiveInYear = stoppedYear > filterYear;
        
        if (selectedStatus === 'ACTIVE') return isActiveInYear;
        
        // For INACTIVE/DECEASED, we check if they reached that status by that year
        return stoppedYear <= filterYear && m.status === selectedStatus;
    });

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'name',
            header: 'اسم العضو',
            cell: ({ row }) => <span className="font-bold text-foreground/90">{row.original.name}</span>
        },
        {
            accessorKey: 'entity.name',
            header: 'الجهة',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <APP_ICONS.MODULES.ENTITIES size={12} />
                    {row.original.entity?.name}
                </div>
            )
        },
        {
            accessorKey: 'affiliationYear',
            header: 'سنة الانتساب',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-foreground/80 font-bold">
                    <APP_ICONS.ACTIONS.CALENDAR size={14} className="text-muted-foreground/60" />
                    {row.original.affiliationYear}
                </div>
            )
        },
        {
            accessorKey: 'phone',
            header: 'رقم الهاتف',
            cell: ({ row }) => (
                <div dir="ltr" className="text-right text-muted-foreground font-medium">
                    {row.original.phone ? row.original.phone : <span className="text-muted-foreground/40">-</span>}
                </div>
            )
        },
        {
            accessorKey: 'manager.name',
            header: 'الجهة المسؤولة (المسؤول)',
            cell: ({ row }) => (
                <div className="text-muted-foreground text-sm font-medium">
                    {row.original.manager?.name ? row.original.manager.name : <span className="text-muted-foreground/60 text-xs">لا يوجد</span>}
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'الحالة',
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-2 uppercase tracking-wider",
                        member.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                        member.status === 'INACTIVE' && "bg-rose-50 text-rose-700 border border-rose-100",
                        member.status === 'DECEASED' && "bg-muted/50 text-muted-foreground/80 border border-input",
                    )}>
                        {member.status === 'DECEASED' ? (
                            <><APP_ICONS.MODULES.STATUS.DECEASED size={12} /> متوفى {member.stoppedAt ? `(${new Date(member.stoppedAt).getFullYear()})` : ''}</>
                        ) : (member.status === 'INACTIVE' || member.stoppedAt) ? (
                            <><APP_ICONS.MODULES.STATUS.INACTIVE size={12} /> توقف {member.stoppedAt ? `(${new Date(member.stoppedAt).getFullYear()})` : ''}</>
                        ) : (
                            <><APP_ICONS.MODULES.STATUS.ACTIVE size={12} /> نشط</>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <WithPermission permission="MEMBERS_EDIT">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setEditingMember(row.original); setIsModalOpen(true); }}
                            className="w-9 h-9 rounded-xl text-muted-foreground/60 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                            title="تعديل العضو"
                        >
                            <APP_ICONS.ACTIONS.EDIT size={14} />
                        </Button>
                    </WithPermission>
                    <WithPermission permission="MEMBERS_EDIT">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setExemptingMember(row.original); setIsExemptionsModalOpen(true); }}
                            className="w-9 h-9 rounded-xl text-muted-foreground/60 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
                            title="إعفاءات (لا يجب)"
                        >
                            <APP_ICONS.ACTIONS.EXEMPT size={14} />
                        </Button>
                    </WithPermission>
                    <WithPermission permission="MEMBERS_DELETE">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setMemberToDelete(row.original)}
                            className="w-9 h-9 rounded-xl text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                        >
                            <APP_ICONS.ACTIONS.DELETE size={14} />
                        </Button>
                    </WithPermission>
                </div>
            )
        }
    ], [entities]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل قائمة الأعضاء...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="MEMBERS_VIEW">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={APP_ICONS.MODULES.MEMBERS}
                title="إدارة أعضاء الصندوق"
                description="قاعدة بيانات المشتركين وتاريخ انتسابهم وتوقفهم"
            >
                <WithPermission permission="MEMBERS_IMPORT">
                    <CustomButton
                        onClick={() => setIsImportOpen(true)}
                        variant="outline"
                        className="bg-card text-indigo-600 hover:bg-indigo-50 border-indigo-100 rounded-2xl h-12 px-6 shadow-sm flex gap-2 items-center font-bold"
                    >
                        <APP_ICONS.ACTIONS.IMPORT size={20} />
                        استيراد من Excel
                    </CustomButton>
                </WithPermission>
                <WithPermission permission="MEMBERS_CREATE">
                    <CustomButton
                        onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
                        className="h-12"
                    >
                        <APP_ICONS.ACTIONS.ADD size={20} />
                        إضافة عضو جديد
                    </CustomButton>
                </WithPermission>
            </PageHeader>

            {/* Stats section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div onClick={() => setSelectedStatus('all')} className={cn("p-5 rounded-3xl border cursor-pointer transition-all hover:-translate-y-1", selectedStatus === 'all' ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200" : "bg-card border-border hover:border-indigo-200")}>
                    <div className="text-[11px] font-black uppercase mb-1 opacity-80 flex items-center gap-1.5"><APP_ICONS.MODULES.MEMBERS size={14}/> إجمالي الأعضاء 
                    {selectedEntity !== 'all' && <span className="bg-card/20 px-2 py-0.5 rounded-md text-[9px] mr-auto">المفلتر</span>}
                    </div>
                    <div className="text-3xl font-black">{stats.total}</div>
                </div>
                <div onClick={() => setSelectedStatus('ACTIVE')} className={cn("p-5 rounded-3xl border cursor-pointer transition-all hover:-translate-y-1", selectedStatus === 'ACTIVE' ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-200" : "bg-card border-border hover:border-emerald-200")}>
                    <div className="text-[11px] font-black uppercase mb-1 opacity-80 flex items-center gap-1.5"><APP_ICONS.MODULES.STATUS.ACTIVE size={14}/> نشط</div>
                    <div className="text-3xl font-black">{stats.active}</div>
                </div>
                <div onClick={() => setSelectedStatus('INACTIVE')} className={cn("p-5 rounded-3xl border cursor-pointer transition-all hover:-translate-y-1", selectedStatus === 'INACTIVE' ? "bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-200" : "bg-card border-border hover:border-amber-200")}>
                    <div className="text-[11px] font-black uppercase mb-1 opacity-80 flex items-center gap-1.5"><APP_ICONS.MODULES.STATUS.INACTIVE size={14}/> غير نشط</div>
                    <div className="text-3xl font-black">{stats.inactive}</div>
                </div>
                <div onClick={() => setSelectedStatus('DECEASED')} className={cn("p-5 rounded-3xl border cursor-pointer transition-all hover:-translate-y-1", selectedStatus === 'DECEASED' ? "bg-slate-700 text-white border-slate-700 shadow-xl shadow-md" : "bg-card border-border hover:border-input")}>
                    <div className="text-[11px] font-black uppercase mb-1 opacity-80 flex items-center gap-1.5"><APP_ICONS.MODULES.STATUS.DECEASED size={14}/> متوفى</div>
                    <div className="text-3xl font-black">{stats.deceased}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-border shadow-2xl flex flex-col md:flex-row gap-4 items-center z-10 relative">
                {/* <div className="relative flex-1 w-full">
                    <APP_ICONS.ACTIONS.SEARCH className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <Input
                        placeholder="البحث عن عضو بالاسم..."
                        className="pr-12 h-12 rounded-xl bg-muted/50 border-border focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div> */}
                <div className="w-full md:w-64">
                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                        <SelectTrigger className="h-12 rounded-xl border-border bg-muted/50 font-bold" dir="rtl">
                            <div className="flex items-center gap-2">
                                <APP_ICONS.MODULES.ENTITIES size={16} className="text-muted-foreground/60" />
                                <SelectValue placeholder="تصفية حسب الجهة" />
                            </div>
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">كل الجهات</SelectItem>
                            {entities.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-48">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-12 rounded-xl border-border bg-muted/50 font-bold" dir="rtl">
                            <div className="flex items-center gap-2">
                                <APP_ICONS.ACTIONS.FILTER size={16} className="text-muted-foreground/60" />
                                <SelectValue placeholder="تصفية حسب الحالة" />
                            </div>
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">كل الحالات</SelectItem>
                            <SelectItem value="ACTIVE">نشط</SelectItem>
                            <SelectItem value="INACTIVE">غير نشط</SelectItem>
                            <SelectItem value="DECEASED">متوفى</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-auto flex items-center gap-6 px-6 h-12 rounded-xl border border-border bg-muted/50">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="due-toggle"
                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" 
                            checked={showOnlyDue}
                            onChange={(e) => {
                                setShowOnlyDue(e.target.checked);
                                if (e.target.checked) setShowOnlyPaid(false);
                            }}
                        />
                        <label htmlFor="due-toggle" className="text-sm font-black text-foreground/80 cursor-pointer">
                            متأخرات ({filterYear})
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="paid-toggle"
                            className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                            checked={showOnlyPaid}
                            onChange={(e) => {
                                setShowOnlyPaid(e.target.checked);
                                if (e.target.checked) setShowOnlyDue(false);
                            }}
                        />
                        <label htmlFor="paid-toggle" className="text-sm font-black text-foreground/80 cursor-pointer">
                            تم السداد ({filterYear})
                        </label>
                    </div>

                    <div className="flex items-center gap-2 border-r border-input pr-4">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase">سنة الفلترة:</span>
                        <input 
                            type="number" 
                            className="w-20 bg-transparent font-black text-indigo-600 focus:outline-none"
                            value={filterYear}
                            onChange={e => setFilterYear(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredMembers}
                    searchPlaceholder="بحث سريع في النتائج الحالية..."
                    onSearchChange={setSearchTerm}
                    searchValue={searchTerm}
                    pageIndex={pageIndex}
                    onPageIndexChange={setPageIndex}
                    compact={true}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                />
            </div>

            {
                isImportOpen && (
                    <ImportMembersModal
                        entities={entities}
                        onClose={() => setIsImportOpen(false)}
                        onSuccess={() => { fetchData(); setIsImportOpen(false); }}
                    />
                )
            }

            {isModalOpen && (
                <MemberModal
                    member={editingMember}
                    entities={entities}
                    members={members}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            {isExemptionsModalOpen && (
                <MemberExemptionsModal
                    member={exemptingMember}
                    onClose={() => {
                        setIsExemptionsModalOpen(false);
                        setExemptingMember(null);
                    }}
                    onSave={fetchData}
                />
            )}

            <ConfirmModal
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
                onConfirm={handleDelete}
                title="حذف عضو"
                description={`هل أنت متأكد من حذف العضو "${memberToDelete?.name}"؟ سيتم حذف جميع بياناته واشتراكاته بشكل نهائي.`}
                confirmLabel="حذف العضو"
                cancelLabel="إلغاء"
                variant="danger"
                icon={APP_ICONS.ACTIONS.DELETE}
                loading={isDeleting}
            />
        </div>
        </ProtectedRoute>
    );
}

export default function MembersPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <APP_ICONS.STATE.LOADING className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-muted-foreground/80 font-bold animate-pulse">جاري التحميل...</p>
            </div>
        }>
            <MembersPageContent />
        </Suspense>
    );
}

const MemberModal = ({ member, entities, members, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(member ? {
        id: member.id,
        name: member.name || '',
        entityId: member.entityId || '',
        affiliationYear: member.affiliationYear || new Date().getFullYear(),
        status: member.status || 'ACTIVE',
        stoppedAt: member.stoppedAt ? new Date(member.stoppedAt).getFullYear() : null,
        phone: member.phone || '',
        managerId: member.managerId || 'none'
    } : {
        name: '',
        entityId: entities[0]?.id || '',
        affiliationYear: new Date().getFullYear(),
        status: 'ACTIVE',
        stoppedAt: null,
        phone: '',
        managerId: 'none'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.entityId) {
            return toast.error('يرجى التأكد من إدخال اسم العضو وجهته');
        }

        if ((formData.status === 'DECEASED' || formData.status === 'INACTIVE') && !formData.stoppedAt) {
            return toast.error('يرجى تحديد سنة التوقف أو الوفاة عند اختيار حالة غير نشطة');
        }

        if (formData.stoppedAt && formData.stoppedAt < formData.affiliationYear) {
            return toast.error('لا يمكن أن تكون سنة التوقف أو الوفاة أقدم من سنة الانتساب');
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                entityId: formData.entityId,
                affiliationYear: Number(formData.affiliationYear) || new Date().getFullYear(),
                status: formData.status,
                stoppedAt: formData.stoppedAt ? new Date(Number(formData.stoppedAt), 0, 1).toISOString() : null,
                phone: formData.phone.trim() || null,
                managerId: formData.managerId === 'none' ? null : formData.managerId
            };

            if (member) {
                await axios.put(`${API_BASE}/members/${member.id}`, payload, AUTH_HEADER);
            } else {
                await axios.post(`${API_BASE}/members`, payload, AUTH_HEADER);
            }
            onSave();
            onClose();
            toast.success('تم حفظ بيانات العضو بنجاح');
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast.error(err.response?.data?.error || 'فشل حفظ العضو');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
            description="إدارة سجل المشتركين وتاريخ انتسابهم وتوقفهم عن السداد"
            icon={APP_ICONS.MODULES.MEMBERS}
            iconClassName="bg-indigo-600 text-white shadow-indigo-100"
            maxWidth="max-w-lg"
            preventClose={true}
            showCloseButton={false}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">اسم العضو بالكامل</label>
                        <Input
                            required
                            placeholder="مثال: أحمد محمدسالم"
                            className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 font-bold"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">الجهة التابع لها (Entity)</label>
                        <Select required value={formData.entityId} onValueChange={(v) => setFormData({ ...formData, entityId: v })}>
                            <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر الجهة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                {entities.map((e: any) => (
                                    <SelectItem key={e.id} value={e.id} className="font-bold py-3 rounded-xl cursor-pointer">{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1 flex items-center justify-between">
                                رقم الهاتف
                                <span className="text-[10px] text-muted-foreground/60">(دولي)</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="+213..."
                                className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 font-bold"
                                dir="ltr"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1">العضو المسؤول عنه</label>
                            <Select value={formData.managerId} onValueChange={(v) => setFormData({ ...formData, managerId: v })}>
                                <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر المسؤول" />
                                </SelectTrigger>
                                <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                    <SelectItem value="none" className="font-bold py-3 rounded-xl cursor-pointer text-muted-foreground italic">بدون مسؤول (مستقل)</SelectItem>
                                    {members.filter((m: any) => m.id !== formData.id).map((m: any) => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold py-3 rounded-xl cursor-pointer">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1">سنة الانتساب</label>
                            <Input
                                type="number"
                                required
                                className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 text-center font-bold"
                                value={formData.affiliationYear}
                                onChange={e => setFormData({ ...formData, affiliationYear: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1 flex items-center justify-between">
                                سنة التوقف
                                <span className="text-[10px] text-muted-foreground/60">(اختياري)</span>
                            </label>
                            <Input
                                type="number"
                                className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 text-center font-bold"
                                placeholder="غير متوقف"
                                value={formData.stoppedAt || ''}
                                onChange={e => {
                                    const val = e.target.value ? parseInt(e.target.value) : null;
                                    setFormData(prev => {
                                        const next = { ...prev, stoppedAt: val };
                                        if (val && next.status === 'ACTIVE') {
                                            next.status = 'INACTIVE';
                                        }
                                        return next;
                                    });
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">حالة العضو (Status)</label>
                        <Select value={formData.status} onValueChange={(v) => {
                            setFormData(prev => {
                                const next = { ...prev, status: v };
                                if (v === 'ACTIVE') {
                                    next.stoppedAt = null;
                                }
                                return next;
                            });
                        }}>
                            <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                <SelectItem value="ACTIVE" className="font-bold py-3 rounded-xl cursor-pointer text-emerald-600">نشط (Activo)</SelectItem>
                                <SelectItem value="INACTIVE" className="font-bold py-3 rounded-xl cursor-pointer text-amber-600">غير نشط (Inactivo)</SelectItem>
                                <SelectItem value="DECEASED" className="font-bold py-3 rounded-xl cursor-pointer text-muted-foreground">متوفى (Muerto)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl border-input font-black text-muted-foreground/80 hover:bg-muted/10">إلغاء</Button>
                    <CustomButton disabled={loading} type="submit" className="flex-[2] h-14">
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                        {member ? 'تحديث البيانات' : 'حفظ بيانات العضو'}
                    </CustomButton>
                </div>
            </form>
        </ActionModal>
    );
};

const MemberExemptionsModal = ({ member, onClose, onSave }: any) => {
    const [exemptions, setExemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingYear, setTogglingYear] = useState<number | null>(null);

    const fetchExemptions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/members/${member.id}/exemptions`, AUTH_HEADER);
            setExemptions(res.data);
        } catch (err) {
            toast.error("فشل تحميل قائمة الإعفاءات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (member) fetchExemptions();
    }, [member]);

    const handleToggle = async (year: number, currentExemption: any) => {
        if (togglingYear) return;
        setTogglingYear(year);
        try {
            if (currentExemption) {
                await axios.delete(`${API_BASE}/exemptions/${currentExemption.id}`, AUTH_HEADER);
                toast.success(`تم إزالة إعفاء ${year}`);
            } else {
                await axios.post(`${API_BASE}/members/exemptions`, {
                    memberId: member.id,
                    year,
                    reason: 'إعفاء'
                }, AUTH_HEADER);
                toast.success(`تم إضافة إعفاء لسنة ${year}`);
            }
            await fetchExemptions();
            if (onSave) onSave();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "فشل تحديث الإعفاء");
        } finally {
            setTogglingYear(null);
        }
    };

    // Range: from affiliation to BEFORE inactive/death year
    const startYear = member.affiliationYear || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    // If stoppedAt exists, we only go up to the year BEFORE it.
    // Otherwise, we go up to the current year.
    const endYear = member.stoppedAt 
        ? new Date(member.stoppedAt).getFullYear() - 1 
        : currentYear;
    
    const yearsToShow = [];
    for (let y = endYear; y >= startYear; y--) {
        yearsToShow.push(y);
    }

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={`إعفاءات العضو: ${member.name}`}
            description="حدد السنوات المعفاة من الاشتراك. لا يمكن إعفاء السنوات التي تم سدادها بالفعل."
            icon={APP_ICONS.ACTIONS.EXEMPT}
            maxWidth="max-w-md"
            iconClassName="bg-amber-100 text-amber-600 shadow-amber-50"
        >
            <div className="space-y-4">
                <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
                        <APP_ICONS.ACTIONS.INFO size={14} />
                        تلميح
                    </div>
                    <p className="text-amber-900/70 text-[11px] leading-relaxed font-medium">
                        السنوات المحددة كإعفاء لن تظهر كديون متأخرة في Dashboard أو في قوائم التحصيل.
                    </p>
                </div>

                <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <APP_ICONS.STATE.LOADING className="animate-spin text-amber-600 w-8 h-8" />
                            <p className="text-xs font-bold text-muted-foreground animate-pulse">جاري التحقق من السجلات...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {yearsToShow.map(year => {
                                const isPaid = member.subscriptions?.some((s: any) => s.year === year);
                                const exemption = exemptions.find(ex => ex.year === year);
                                const isBusy = togglingYear === year;

                                return (
                                    <div 
                                        key={year} 
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                            isPaid ? "bg-emerald-50/30 border-emerald-100 opacity-80" : 
                                            exemption ? "bg-amber-50 border-amber-200" : "bg-card border-border hover:border-input"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs",
                                                isPaid ? "bg-emerald-100 text-emerald-700" : 
                                                exemption ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                                            )}>
                                                {year}
                                            </div>
                                            <span className="text-xs font-bold text-foreground/60">{isPaid ? "مدفوع" : "سنة"}</span>
                                        </div>

                                        <div className="flex items-center">
                                            {isPaid ? (
                                                <div className="w-8 h-8 flex items-center justify-center text-emerald-600">
                                                    <APP_ICONS.ACTIONS.CHECK size={18} />
                                                </div>
                                            ) : (
                                                <button
                                                    disabled={isBusy}
                                                    onClick={() => handleToggle(year, exemption)}
                                                    className={cn(
                                                        "w-10 h-5 rounded-full relative transition-all outline-none",
                                                        exemption ? "bg-amber-500 shadow-inner" : "bg-muted border border-input shadow-sm",
                                                        isBusy && "opacity-50 cursor-wait"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-md flex items-center justify-center",
                                                        exemption ? "left-[22px] bg-white" : "left-1 bg-muted-foreground/40",
                                                    )}>
                                                        {isBusy && <APP_ICONS.STATE.LOADING size={8} className="animate-spin text-amber-600" />}
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="pt-6 border-t border-border mt-6 flex gap-3">
                <CustomButton
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl font-bold"
                    variant="outline"
                    icon={APP_ICONS.ACTIONS.X}
                >
                    إغلاق
                </CustomButton>
            </div>
        </ActionModal>
    );
};
