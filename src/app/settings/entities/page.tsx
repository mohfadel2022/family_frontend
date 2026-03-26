"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
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
import { ActionModal } from '@/components/ui/ActionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { SUB_BASE, META_BASE, getAuthHeader } from '@/lib/api';
import { CustomButton } from '@/components/ui/CustomButton';

const API_BASE = SUB_BASE;
const AUTH_HEADER = getAuthHeader();

export default function EntitiesPage() {
    const theme = usePageTheme();
    const [entities, setEntities] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<any>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                axios.get(`${API_BASE}/entities`, AUTH_HEADER),
                axios.get(`${META_BASE}/users`, AUTH_HEADER),
                axios.get(`${META_BASE}/branches`, AUTH_HEADER),
                axios.get(`${META_BASE}/currencies`, AUTH_HEADER)
            ]);
            
            setEntities(results[0].status === 'fulfilled' ? results[0].value.data : []);
            setUsers(results[1].status === 'fulfilled' ? results[1].value.data : []);
            setBranches(results[2].status === 'fulfilled' ? results[2].value.data : []);
            setCurrencies(results[3].status === 'fulfilled' ? results[3].value.data : []);
        } catch (err) {
            toast.error("فشل تحميل البيانات التكميلية");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const confirmDelete = (id: string) => {
        setEntityToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!entityToDelete) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`${API_BASE}/entities/${entityToDelete}`, AUTH_HEADER);
            toast.success('تم حذف الجهة بنجاح');
            fetchData();
            setDeleteConfirmOpen(false);
            setEntityToDelete(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف');
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredEntities = entities.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل قائمة الجهات...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="ENTITIES_VIEW">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={APP_ICONS.MODULES.ENTITIES}
                title="إدارة الجهات (الكيانات)"
                description="إدارة اشتراكات ومسؤولي الجهات والمجموعات التابعة"
            >
                <WithPermission permission="ENTITIES_CREATE">
                    <CustomButton
                        onClick={() => { setEditingEntity(null); setIsModalOpen(true); }}
                        icon={APP_ICONS.ACTIONS.ADD}
                        variant="primary"
                    >
                        إضافة جهة جديدة
                    </CustomButton>
                </WithPermission>
            </PageHeader>

            <div className={cn("bg-card/50 p-6 rounded-[2.5rem] border shadow-xl flex flex-col md:flex-row gap-4 items-center", theme.border, theme.shadow)}>
                <div className="relative flex-1 w-full">
                    <APP_ICONS.ACTIONS.SEARCH className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <Input
                        placeholder="البحث عن جهة بالاسم أو الكود..."
                        className={cn("pr-12 h-12 rounded-2xl bg-card border-border focus:ring-2 transition-all font-bold", theme.accent.replace('text-', 'focus:ring-'))}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntities.map(entity => (
                    <div key={entity.id} className={cn("bg-card rounded-[2.5rem] border p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden", theme.border, theme.accent.replace('text-', 'hover:border-').replace('600', '100'))}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("p-3 rounded-2xl", theme.muted, theme.accent)}>
                                <APP_ICONS.MODULES.ENTITIES size={32} />
                            </div>
                            <div className="flex gap-2">
                                <WithPermission permission="ENTITIES_EDIT">
                                    <CustomButton
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => { setEditingEntity(entity); setIsModalOpen(true); }}
                                        className={cn("w-10 h-10 text-muted-foreground hover:scale-110 transition-all", theme.muted.replace('bg-', 'hover:bg-'), theme.accent.replace('text-', 'hover:text-'))}
                                    >
                                        <APP_ICONS.ACTIONS.EDIT size={18} />
                                    </CustomButton>
                                </WithPermission>
                                <WithPermission permission="ENTITIES_DELETE">
                                    <CustomButton
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => confirmDelete(entity.id)}
                                        className="w-10 h-10 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:scale-110 transition-all"
                                    >
                                        <APP_ICONS.ACTIONS.DELETE size={18} />
                                    </CustomButton>
                                </WithPermission>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-foreground/90">{entity.name}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-bold mt-1.5">
                                    <span className={cn("px-2 py-0.5 rounded-lg", theme.muted, theme.accent)}>كود: {entity.code || '---'}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="text-muted-foreground/80 flex items-center gap-1">
                                        <APP_ICONS.SHARED.BRIEFCASE size={12} /> {entity.branch?.name || 'بدون فرع'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-muted/50 border border-border">
                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase block mb-1">الاشتراك السنوي</span>
                                    <div className="flex items-center gap-1.5 text-foreground font-black">
                                        <APP_ICONS.SHARED.RECEIPT size={14} className="text-emerald-500" />
                                        {Number(entity.annualSubscription).toLocaleString()}
                                        <span className="text-[10px] text-muted-foreground/60">{entity.currency?.symbol}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-3xl bg-muted/50 border border-border">
                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase block mb-1">المكلف بالجهة</span>
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-black text-xs truncate">
                                        <APP_ICONS.SHARED.USER size={14} className={theme.accent.replace('700', '400')} />
                                        {entity.personInCharge?.name || entity.personInCharge?.username || 'غير محدد'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <EntityModal
                    entity={editingEntity}
                    users={users}
                    branches={branches}
                    currencies={currencies}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            <ConfirmModal
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={executeDelete}
                title="حذف الجهة"
                description="هل أنت متأكد من رغبتك في حذف هذه الجهة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء."
                confirmLabel="حذف الجهة"
                variant="danger"
                icon={APP_ICONS.ACTIONS.DELETE}
                loading={deleteLoading}
            />
        </div>
        </ProtectedRoute>
    );
}

const EntityModal = ({ entity, users, branches, currencies, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(entity ? {
        name: entity.name || '',
        code: entity.code || '',
        branchId: entity.branchId || '',
        currencyId: entity.currencyId || '',
        userId: entity.userId || 'none',
        annualSubscription: Number(entity.annualSubscription) || 0
    } : {
        name: '',
        code: '',
        currencyId: currencies[0]?.id || '',
        branchId: branches[0]?.id || '',
        userId: 'none',
        annualSubscription: 0
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.branchId || !formData.currencyId) {
            toast.error("يرجى اختيار الفرع والعملة");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code?.trim() || null,
                branchId: formData.branchId,
                currencyId: formData.currencyId,
                userId: formData.userId === 'none' ? null : formData.userId,
                annualSubscription: Number(formData.annualSubscription)
            };
            if (entity) {
                await axios.put(`${API_BASE}/entities/${entity.id}`, payload, AUTH_HEADER);
                toast.success('تم تحديث بيانات الجهة بنجاح');
            } else {
                await axios.post(`${API_BASE}/entities`, payload, AUTH_HEADER);
                toast.success('تمت إضافة الجهة بنجاح');
            }
            onSave();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={entity ? 'تعديل بيانات الجهة' : 'إضافة جهة جديدة'}
            description="إدارة اشتراكات ومسؤولي الجهات والمجموعات التابعة"
            icon={APP_ICONS.MODULES.ENTITIES}
            maxWidth="max-w-xl"
            preventClose={true}
            showCloseButton={false}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">اسم الجهة الكامل</label>
                        <Input
                            required
                            placeholder="مثال: ولاية بوجدور"
                            className={cn("w-full px-5 h-14 rounded-2xl bg-muted/50 border-input font-bold")}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">كود الجهة (اختياري)</label>
                        <Input
                            placeholder="MFA"
                            className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 font-mono font-bold uppercase"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">الفرع المحاسبي التابع له</label>
                        <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                            <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر الفرع" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                {branches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id} className="font-bold py-3 rounded-xl cursor-pointer">{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">المكلف بالجهة (المسؤول)</label>
                        <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                            <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر المسؤول" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                <SelectItem value="none" className="font-bold py-3 rounded-xl cursor-pointer text-muted-foreground italic">بدون مسؤول</SelectItem>
                                {users.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id} className="font-bold py-3 rounded-xl cursor-pointer">{u.name || u.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80 mr-1">العملة والاشتراك السنوي</label>
                        <div className="flex gap-2">
                            <Select value={formData.currencyId} onValueChange={(v) => setFormData({ ...formData, currencyId: v })}>
                                <SelectTrigger className="w-24 h-14 rounded-2xl bg-muted/50 border-input focus:ring-2 focus:ring-indigo-500 font-bold text-center">
                                    <SelectValue placeholder="CUR" />
                                </SelectTrigger>
                                <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                    {currencies.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id} className="font-bold py-3 rounded-xl cursor-pointer">{c.code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                required
                                placeholder="0.00"
                                className="flex-1 px-5 h-14 rounded-2xl bg-muted/50 border-input focus-visible:ring-indigo-500 font-black text-lg text-center"
                                value={formData.annualSubscription}
                                onChange={e => setFormData({ ...formData, annualSubscription: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-border/50">
                    <CustomButton type="button" variant="outline" onClick={onClose} className="flex-1 h-14 border-input text-muted-foreground/80">إلغاء</CustomButton>
                    <CustomButton disabled={loading} type="submit" className="flex-[2] h-14" variant="primary">
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                        {entity ? 'تحديث البيانات' : 'حفظ الجهة'}
                    </CustomButton>
                </div>
            </form>
        </ActionModal>
    );
};
