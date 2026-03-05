"use client";

import React, { useState, useEffect } from 'react';
import {
    Users as UsersIcon,
    Plus,
    Trash2,
    Edit2,
    Shield,
    ShieldCheck,
    Loader2,
    UserPlus,
    UserCheck,
    Lock,
    User,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const { isAdmin, checkPermission } = useAuth();
    const canViewUsers = checkPermission('USERS_VIEW');
    const canCreateUsers = checkPermission('USERS_CREATE');
    const canEditUsers = checkPermission('USERS_EDIT');
    const canDeleteUsers = checkPermission('USERS_DELETE');

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const getRoleDetails = (roleName: string) => {
        switch (roleName) {
            case 'ADMIN': return { label: 'مدير نظام', color: 'bg-blue-600 shadow-blue-100', icon: ShieldCheck, text: 'text-blue-600', bg: 'bg-blue-50' };
            case 'RESPONSIBLE': return { label: 'مسؤول نظام', color: 'bg-emerald-600 shadow-emerald-100', icon: Shield, text: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'ENCARGADO': return { label: 'مسؤول جهة', color: 'bg-amber-600 shadow-amber-100', icon: UserCheck, text: 'text-amber-600', bg: 'bg-amber-50' };
            default: return { label: roleName, color: 'bg-slate-500', icon: User, text: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                axios.get(`${API_BASE}/users`, getAuthHeader()),
                axios.get(`${API_BASE}/roles`, getAuthHeader())
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            toast.error("فشل تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!pendingDeleteId) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE}/users/${pendingDeleteId}`, getAuthHeader());
            toast.success('تم حذف المستخدم بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حذف المستخدم');
        } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
            setPendingDeleteId(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل قائمة المستخدمين...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
            <PageHeader
                icon={UsersIcon}
                title="إدارة مستخدمي النظام"
                description="إدارة صلاحيات الوصول ومسؤولي الجهات والمحاسبين"
                iconClassName="bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-200"
            >
                {canCreateUsers && (
                    <Button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="bg-slate-900 text-white hover:bg-black rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 flex gap-2 items-center font-bold"
                    >
                        <UserPlus size={20} />
                        إضافة مستخدم جديد
                    </Button>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "p-4 rounded-2xl border transition-all",
                                getRoleDetails(user.role?.name).bg,
                                "border-transparent",
                                getRoleDetails(user.role?.name).text
                            )}>
                                {React.createElement(getRoleDetails(user.role?.name).icon, { size: 26 })}
                            </div>
                            {(canEditUsers || canDeleteUsers) && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {canEditUsers && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                            className="w-10 h-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                    )}
                                    {canDeleteUsers && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(user.id)}
                                            className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{user.name || 'مستخدم بدون اسم'}</h3>
                                <p className="text-sm font-bold text-slate-400 font-mono">@{user.username}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white",
                                    getRoleDetails(user.role?.name).color
                                )}>
                                    {getRoleDetails(user.role?.name).label}
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                                    <Lock size={12} />
                                    مؤمن بالكامل
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    roles={roles}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={executeDelete}
                title="حذف المستخدم"
                description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية."
                confirmLabel="حذف المستخدم"
                variant="danger"
                icon={Trash2}
                loading={confirmLoading}
            />
        </div>
    );
}

const UserModal = ({ user, roles, onClose, onSave }: any) => {
    const defaultRoleId = roles.find((r: any) => r.name === 'ENCARGADO')?.id || roles[0]?.id;

    const [formData, setFormData] = useState(user ? {
        username: user.username,
        name: user.name || '',
        roleId: user.roleId || '',
        password: ''
    } : {
        username: '',
        name: '',
        roleId: defaultRoleId,
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user) {
                await axios.put(`${API_BASE}/users/${user.id}`, formData, getAuthHeader());
            } else {
                await axios.post(`${API_BASE}/users`, formData, getAuthHeader());
            }
            onSave();
            onClose();
            toast.success('تم حفظ بيانات المستخدم بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حفظ المستخدم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem] shadow-2xl" dir="rtl">
                <DialogHeader className="p-8 bg-slate-900 border-b border-slate-800 text-right">
                    <DialogTitle className="text-2xl font-black text-white">{user ? 'تعديل مستخدم' : 'إضافة مستخدم نظام'}</DialogTitle>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Identity & Access Management</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">الاسم الكامل</label>
                            <Input
                                required
                                placeholder="مثال: محمد أحمد"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">اسم المستخدم</label>
                                <Input
                                    required
                                    placeholder="username"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-mono font-bold"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الدور الوظيفي</label>
                                <Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold">
                                        <SelectValue placeholder="اختر الدور" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="rounded-xl font-bold">
                                        {roles.map((role: any) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name === 'ADMIN' ? 'مدير نظام' :
                                                    role.name === 'RESPONSIBLE' ? 'مسؤول نظام' :
                                                        role.name === 'ENCARGADO' ? 'مسؤول جهة' : role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">كلمة المرور {user && '(اتركها فارغة لعدم التغيير)'}</label>
                            <div className="relative group/pass">
                                <Input
                                    required={!user}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-bold pr-12"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-2"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl border-slate-200 font-black text-slate-500">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex gap-2 items-center justify-center">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
                            حفظ بيانات المستخدم
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
