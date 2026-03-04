"use client";

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    Trash2,
    Edit2,
    Globe,
    UserCircle,
    Loader2,
    Save,
    Search,
    Receipt,
    Briefcase
} from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = 'http://localhost:4000/api/subscriptions';
const META_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

export default function EntitiesPage() {
    const [entities, setEntities] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entRes, userRes, branchRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/entities`, AUTH_HEADER),
                axios.get(`${META_BASE}/users`, AUTH_HEADER),
                axios.get(`${META_BASE}/branches`, AUTH_HEADER),
                axios.get(`${META_BASE}/currencies`, AUTH_HEADER)
            ]);
            setEntities(entRes.data);
            setUsers(userRes.data);
            setBranches(branchRes.data);
            setCurrencies(currRes.data);
        } catch (err) {
            toast.error("فشل تحميل البيانات التكميلية");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الجهة؟')) return;
        try {
            await axios.delete(`${API_BASE}/entities/${id}`, AUTH_HEADER);
            toast.success('تم حذف الجهة بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف');
        }
    };

    const filteredEntities = entities.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل قائمة الجهات...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={Building2}
                title="إدارة الجهات (الكيانات)"
                description="إدارة اشتراكات ومسؤولي الجهات والمجموعات التابعة"
                iconClassName="bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-indigo-100"
            >
                <Button
                    onClick={() => { setEditingEntity(null); setIsModalOpen(true); }}
                    className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 flex gap-2"
                >
                    <Plus size={20} />
                    إضافة جهة جديدة
                </Button>
            </PageHeader>

            <div className="bg-white/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="البحث عن جهة بالاسم أو الكود..."
                        className="pr-12 h-12 rounded-2xl bg-white border-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntities.map(entity => (
                    <div key={entity.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Building2 size={32} />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => { setEditingEntity(entity); setIsModalOpen(true); }}
                                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                    <Edit2 size={18} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(entity.id)}
                                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{entity.name}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-bold mt-1.5">
                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">كود: {entity.code || '---'}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Briefcase size={12} /> {entity.branch?.name || 'بدون فرع'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">الاشتراك السنوي</span>
                                    <div className="flex items-center gap-1.5 text-slate-900 font-black">
                                        <Receipt size={14} className="text-emerald-500" />
                                        {Number(entity.annualSubscription).toLocaleString()}
                                        <span className="text-[10px] text-slate-400">{entity.currency?.symbol}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">المكلف بالجهة</span>
                                    <div className="flex items-center gap-1.5 text-slate-600 font-black text-xs truncate">
                                        <UserCircle size={14} className="text-indigo-400" />
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
        </div>
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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl bg-white p-0 overflow-hidden border-indigo-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100 text-right">
                    <DialogTitle className="text-2xl font-black text-slate-900">{entity ? 'تعديل بيانات الجهة' : 'إضافة جهة جديدة'}</DialogTitle>
                    <p className="text-indigo-400 font-bold text-sm tracking-tight uppercase mt-1">Entity Details & Configuration</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم الجهة الكامل</label>
                            <Input
                                required
                                placeholder="مثال: وزارة الخارجية"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">كود الجهة (اختياري)</label>
                            <Input
                                placeholder="MFA"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 font-mono font-bold uppercase"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">الفرع المحاسبي التابع له</label>
                            <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                                <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر الفرع" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    {branches.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">المكلف بالجهة (المسؤول)</label>
                            <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                                <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر المسؤول" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="none">بدون مسؤول</SelectItem>
                                    {users.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>{u.name || u.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">العملة والاشتراك السنوي</label>
                            <div className="flex gap-2">
                                <Select value={formData.currencyId} onValueChange={(v) => setFormData({ ...formData, currencyId: v })}>
                                    <SelectTrigger className="w-24 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-center">
                                        <SelectValue placeholder="CUR" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        {currencies.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    className="flex-1 px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 font-black text-lg text-center"
                                    value={formData.annualSubscription}
                                    onChange={e => setFormData({ ...formData, annualSubscription: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl border-slate-200 font-black text-slate-500">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                            {loading ? <Loader2 size={18} className="animate-spin ml-2" /> : <Save size={18} className="ml-2" />}
                            حفظ الجهة
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
