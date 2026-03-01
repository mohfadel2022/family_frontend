"use client";

import React, { useState, useEffect } from 'react';
import {
    Users as UsersIcon,
    Plus,
    Trash2,
    Edit2,
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

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/users`, AUTH_HEADER);
            setUsers(res.data);
        } catch (err) {
            toast.error("فشل تحميل قائمة المستخدمين");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!pendingDeleteId) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE}/users/${pendingDeleteId}`, AUTH_HEADER);
            toast.success('تم حذف المستخدم بنجاح');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حذف المستخدم');
        } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
            setPendingDeleteId(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل قائمة المستخدمين...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={UsersIcon}
                title="إدارة مستخدمي النظام"
                description="إدارة صلاحيات الوصول ومسؤولي الجهات والمحاسبين"
                iconClassName="bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-200"
            >
                <Button
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="bg-slate-900 text-white hover:bg-black rounded-2xl h-12 px-6 shadow-xl shadow-slate-200 flex gap-2 items-center font-bold"
                >
                    <UserPlus size={20} />
                    إضافة مستخدم جديد
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "p-4 rounded-2xl border transition-all",
                                user.role === 'ADMIN' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-50 border-slate-100 text-slate-500"
                            )}>
                                {user.role === 'ADMIN' ? <ShieldCheck size={26} /> : <User size={26} />}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    <Edit2 size={16} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(user.id)}
                                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">{user.name || 'مستخدم بدون اسم'}</h3>
                                <p className="text-sm font-bold text-slate-400 font-mono">@{user.username}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                    user.role === 'ADMIN' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-100 text-slate-500"
                                )}>
                                    {user.role === 'ADMIN' ? 'مدير نظام' : 'مستخدم'}
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
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchUsers}
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

const UserModal = ({ user, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(user ? {
        username: user.username,
        name: user.name || '',
        role: user.role,
        password: ''
    } : {
        username: '',
        name: '',
        role: 'USER',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user) {
                await axios.put(`${API_BASE}/users/${user.id}`, formData, AUTH_HEADER);
            } else {
                await axios.post(`${API_BASE}/users`, formData, AUTH_HEADER);
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
            <DialogContent className="max-w-lg bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 text-right">
                    <DialogTitle className="text-2xl font-black text-slate-900">{user ? 'تعديل مستخدم' : 'إضافة مستخدم نظام'}</DialogTitle>
                    <p className="text-slate-400 font-bold text-sm tracking-tight uppercase mt-1">Identity & Access Management</p>
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

                        <div className="grid grid-cols-2 gap-4">
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
                                <label className="text-sm font-black text-slate-700 mr-1">الصلاحية</label>
                                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="USER">مستخدم</SelectItem>
                                        <SelectItem value="ADMIN">مدير نظام</SelectItem>
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
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl border-slate-200 font-black text-slate-500">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                            {loading ? <Loader2 size={18} className="animate-spin ml-2" /> : 'حفظ بيانات المستخدم'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
