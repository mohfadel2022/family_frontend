"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Trash2,
    Edit2,
    Search,
    Building2,
    Calendar,
    Loader2,
    Filter,
    X,
    UserCheck,
    UserMinus,
    UserX,
    Globe
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
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const API_BASE = 'http://localhost:4000/api/subscriptions';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntity, setSelectedEntity] = useState<string>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);

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

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
        try {
            await axios.delete(`${API_BASE}/members/${id}`, AUTH_HEADER);
            toast.success('تم حذف العضو بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حذف العضو');
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEntity = selectedEntity === 'all' || m.entityId === selectedEntity;
        return matchesSearch && matchesEntity;
    });

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'name',
            header: 'اسم العضو',
            cell: ({ row }) => <span className="font-bold text-slate-800">{row.original.name}</span>
        },
        {
            accessorKey: 'entity.name',
            header: 'الجهة',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <Building2 size={12} />
                    {row.original.entity?.name}
                </div>
            )
        },
        {
            accessorKey: 'affiliationYear',
            header: 'سنة الانتساب',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Calendar size={14} className="text-slate-400" />
                    {row.original.affiliationYear}
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
                        member.status === 'DECEASED' && "bg-slate-50 text-slate-500 border border-slate-200",
                    )}>
                        {member.status === 'DECEASED' ? (
                            <><UserX size={12} /> متوفى {member.stoppedAt ? `(${new Date(member.stoppedAt).getFullYear()})` : ''}</>
                        ) : (member.status === 'INACTIVE' || member.stoppedAt) ? (
                            <><UserMinus size={12} /> توقف {member.stoppedAt ? `(${new Date(member.stoppedAt).getFullYear()})` : ''}</>
                        ) : (
                            <><UserCheck size={12} /> نشط</>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingMember(row.original); setIsModalOpen(true); }}
                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                    >
                        <Edit2 size={14} />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(row.original.id)}
                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ], [entities]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل قائمة الأعضاء...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={Users}
                title="إدارة أعضاء الصندوق"
                description="قاعدة بيانات المشتركين وتاريخ انتسابهم وتوقفهم"
                iconClassName="bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-200"
            >
                <Button
                    onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
                    className="bg-slate-900 text-white hover:bg-black rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 flex gap-2 items-center"
                >
                    <Plus size={20} />
                    إضافة عضو جديد
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="البحث عن عضو بالاسم..."
                        className="pr-12 h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold" dir="rtl">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-slate-400" />
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
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-500/5 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredMembers}
                    searchPlaceholder="بحث سريع في النتائج الحالية..."
                />
            </div>

            {isModalOpen && (
                <MemberModal
                    member={editingMember}
                    entities={entities}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}
        </div>
    );
}

const MemberModal = ({ member, entities, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(member ? {
        id: member.id,
        name: member.name || '',
        entityId: member.entityId || '',
        affiliationYear: member.affiliationYear || new Date().getFullYear(),
        status: member.status || 'ACTIVE',
        stoppedAt: member.stoppedAt ? new Date(member.stoppedAt).getFullYear() : null
    } : {
        name: '',
        entityId: entities[0]?.id || '',
        affiliationYear: new Date().getFullYear(),
        status: 'ACTIVE',
        stoppedAt: null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.entityId) {
            return toast.error('يرجى التأكد من إدخال اسم العضو وجهته');
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                entityId: formData.entityId,
                affiliationYear: Number(formData.affiliationYear) || new Date().getFullYear(),
                status: formData.status,
                stoppedAt: formData.stoppedAt ? new Date(Number(formData.stoppedAt), 0, 1).toISOString() : null
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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100 flex flex-row justify-between items-center text-right space-y-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900">{member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}</DialogTitle>
                        <p className="text-indigo-400 font-bold text-sm tracking-tight uppercase mt-1">Member Registry & Affiliation</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-indigo-50 mr-auto">
                        <Users className="text-indigo-600" size={24} />
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم العضو بالكامل وكنيته</label>
                            <Input
                                required
                                placeholder="مثال: أحمد بن عبدالعزيز آل سعود"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">الجهة التابع لها (Entity)</label>
                            <Select required value={formData.entityId} onValueChange={(v) => setFormData({ ...formData, entityId: v })}>
                                <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر الجهة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    {entities.map((e: any) => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">سنة الانتساب</label>
                                <Input
                                    type="number"
                                    required
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-center font-bold"
                                    value={formData.affiliationYear}
                                    onChange={e => setFormData({ ...formData, affiliationYear: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1 flex items-center justify-between">
                                    سنة التوقف
                                    <span className="text-[10px] text-slate-400">(اختياري)</span>
                                </label>
                                <Input
                                    type="number"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-center font-bold"
                                    placeholder="غير متوقف"
                                    value={formData.stoppedAt || ''}
                                    onChange={e => setFormData({ ...formData, stoppedAt: e.target.value ? parseInt(e.target.value) : null })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">حالة العضو (Status)</label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="ACTIVE">نشط (Activo)</SelectItem>
                                    <SelectItem value="INACTIVE">غير نشط (Inactivo)</SelectItem>
                                    <SelectItem value="DECEASED">متوفى (Muerto)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl border-slate-200 font-black text-slate-500">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                            {loading ? <Loader2 size={18} className="animate-spin ml-2" /> : 'حفظ بيانات العضو'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
