"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    ShieldCheck,
    UserCheck,
    Users,
    Lock,
    Unlock,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Info,
    Plus,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from 'axios';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';

const API_BASE = 'http://localhost:4000/api/meta';

interface Permission {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: { permission: Permission }[];
    _count?: { users: number };
}

export default function RolesPage() {
    const { isAdmin, logout } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: [] as string[]
    });

    const getAuthHeader = () => {
        const token = localStorage.getItem('token') || 'mock-token';
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchData = async () => {
        if (!isAdmin && localStorage.getItem('token')) return;
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                axios.get(`${API_BASE}/roles`, getAuthHeader()),
                axios.get(`${API_BASE}/permissions`, getAuthHeader())
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (err.response?.status === 401) {
                logout();
            } else {
                toast.error('حدث خطأ أثناء تحميل البيانات');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <Shield size={48} className="text-rose-500" />
                <h2 className="text-xl font-black text-slate-800">وصول غير مصرح به</h2>
                <p className="text-slate-500 font-bold max-w-sm">
                    عذراً، صفحة إدارة الأدوار متاحة فقط لمشرفي النظام. يرجى التواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ.
                </p>
            </div>
        );
    }

    const handleOpenModal = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                permissionIds: role.permissions.map(p => p.permission.id)
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                description: '',
                permissionIds: []
            });
        }
        setIsModalOpen(true);
    };

    const togglePermission = (id: string) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(id)
                ? prev.permissionIds.filter(pId => pId !== id)
                : [...prev.permissionIds, id]
        }));
    };

    const permissionsByCategory = permissions.reduce((acc, perm) => {
        const cat = perm.category || 'عام';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const toggleCategory = (cat: string, select: boolean) => {
        const catPermIds = permissionsByCategory[cat].map(p => p.id);
        if (select) {
            setFormData(prev => ({
                ...prev,
                permissionIds: Array.from(new Set([...prev.permissionIds, ...catPermIds]))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                permissionIds: prev.permissionIds.filter(id => !catPermIds.includes(id))
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRole) {
                await axios.put(`${API_BASE}/roles/${editingRole.id}`, formData, getAuthHeader());
                toast.success('تم تحديث الدور بنجاح');
            } else {
                await axios.post(`${API_BASE}/roles`, formData, getAuthHeader());
                toast.success('تم إضافة الدور بنجاح');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
        try {
            await axios.delete(`${API_BASE}/roles/${id}`, getAuthHeader());
            toast.success('تم حذف الدور بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحذف');
        }
    };

    const getRoleIcon = (name: string) => {
        if (name === 'ADMIN') return ShieldCheck;
        if (name === 'RESPONSIBLE') return Shield;
        if (name === 'ENCARGADO') return UserCheck;
        return Lock;
    };

    const getRoleColor = (name: string) => {
        if (name === 'ADMIN') return 'blue';
        if (name === 'RESPONSIBLE') return 'emerald';
        if (name === 'ENCARGADO') return 'amber';
        return 'slate';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-slate-500 font-bold">جاري تحميل مصفوفة الصلاحيات...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
            <PageHeader
                icon={Lock}
                title="إدارة الصلاحيات والأدوار"
                description="تخصيص مستويات الوصول وتحديد مصفوفة الصلاحيات لكل دور وظيفي"
                iconClassName="bg-gradient-to-br from-blue-700 to-blue-900 shadow-blue-100"
            >
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-slate-900 text-white hover:bg-black rounded-2xl h-12 px-6 shadow-xl flex gap-2 items-center font-bold"
                >
                    <Plus size={20} />
                    إضافة دور جديد
                </Button>
            </PageHeader>

            {/* Roles Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => {
                    const Color = getRoleColor(role.name);
                    const Icon = getRoleIcon(role.name);

                    return (
                        <div key={role.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-8 flex flex-col relative overflow-hidden group">
                            {/* Status/Count Badge */}
                            <div className="absolute top-8 left-8 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 text-[10px] font-black text-slate-500">
                                {role._count?.users || 0} مستخدم
                            </div>

                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500",
                                Color === 'blue' ? "bg-blue-50 text-blue-600 shadow-lg shadow-blue-100/50" :
                                    Color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                        Color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                            )}>
                                <Icon size={32} />
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-black text-slate-800">{role.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(role)}>
                                        <Edit3 size={16} />
                                    </Button>
                                    {role.name !== 'ADMIN' && (
                                        <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(role.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed h-12 line-clamp-2">
                                {role.description || 'لا يوجد وصف لهذا الدور'}
                            </p>

                            <div className="space-y-3 flex-1">
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">الصلاحيات النشطة</h4>
                                {permissions.slice(0, 8).map(perm => {
                                    const allowed = role.permissions.some(rp => rp.permission.code === perm.code);
                                    return (
                                        <div key={perm.id} className="flex items-center justify-between group/perm">
                                            <span className={cn(
                                                "text-xs font-bold transition-colors",
                                                allowed ? "text-slate-600" : "text-slate-200 line-through decoration-slate-100"
                                            )}>
                                                {perm.name}
                                            </span>
                                            {allowed ? (
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            ) : (
                                                <XCircle size={14} className="text-slate-100" />
                                            )}
                                        </div>
                                    );
                                })}
                                {permissions.length > 8 && (
                                    <p className="text-[10px] text-slate-300 pt-2 font-bold text-center">+{permissions.length - 8} صلاحيات أخرى</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal for Create/Edit */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
                <DialogContent className="!max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl text-right">
                    <DialogHeader className="p-8 bg-slate-900 text-white relative">
                        <DialogTitle className="text-2xl font-black">{editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}</DialogTitle>
                        <Lock className="absolute top-8 left-8 text-white/10" size={64} />
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">اسم الدور (بالإنجليزي)</label>
                                <Input
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold uppercase"
                                    placeholder="e.g. ACCOUNTANT"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    disabled={editingRole?.name === 'ADMIN'}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">الوصف</label>
                                <Input
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                                    placeholder="وصف مختصر لمسؤوليات هذا الدور"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                            <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 sticky top-0 bg-white z-10">
                                <Shield size={18} className="text-blue-600" />
                                مصفوفة الصلاحيات حسب الموديول
                            </h4>

                            {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                const allSelected = perms.every(p => formData.permissionIds.includes(p.id));
                                return (
                                    <div key={category} className="space-y-3">
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                            <h5 className="text-xs font-black text-slate-600">{category}</h5>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-[10px] font-black hover:text-blue-600"
                                                onClick={() => toggleCategory(category, !allSelected)}
                                            >
                                                {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {perms.map(perm => (
                                                <label key={perm.id} className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50",
                                                    formData.permissionIds.includes(perm.id) ? "border-blue-200 bg-blue-50/30" : "border-slate-100"
                                                )}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        checked={formData.permissionIds.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                    />
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800">{perm.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold">{perm.code}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter className="pt-6 border-t border-slate-50 flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="h-12 rounded-xl font-bold px-8"
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-12 shadow-lg shadow-blue-100 transition-all flex gap-2 items-center"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                {editingRole ? 'تحديث الدور' : 'حفظ الدور'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Additional Info Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 shrink-0">
                        <Info size={48} className="text-blue-400" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black">ملاحظات هامة حول الأمان</h2>
                        <p className="text-slate-300 font-bold leading-relaxed max-w-3xl">
                            يتم تطبيق هذه الصلاحيات بشكل صارم على مستوى الخادم (Server-side) لضمان حماية البيانات.
                            لا يمكن للمستخدمين الوصول إلى البيانات أو تنفيذ العمليات التي لا تندرج تحت أدوارهم الوظيفية، حتى عبر محاولات الحقن المباشر للطلبات.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
