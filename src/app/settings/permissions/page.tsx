"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Lock,
    Eye,
    Edit3,
    Trash2,
    Plus,
    Loader2,
    Settings,
    Layout,
    FileText,
    Database,
    Search,
    ChevronDown,
    ChevronUp,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from 'axios';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;

interface Permission {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string;
}

export default function PermissionsPage() {
    const { isAdmin, logout } = useAuth();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingPerm, setEditingPerm] = useState<Permission | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: '',
        description: ''
    });

    // Local getAuthHeader removed in favor of import

    const fetchPermissions = async () => {
        if (!isAdmin && localStorage.getItem('token')) return; // Avoid unnecessary calls if not admin
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/permissions`, getAuthHeader());
            setPermissions(res.data);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (err.response?.status === 401) {
                logout();
            } else {
                toast.error('حدث خطأ أثناء تحميل الصلاحيات');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Shield size={48} className="text-rose-500" />
                <h2 className="text-xl font-black text-slate-800">وصول غير مصرح به</h2>
                <p className="text-slate-500 font-bold">عذراً، هذه الصفحة مخصصة لمدير النظام فقط.</p>
            </div>
        );
    }

    const handleOpenModal = (perm: Permission | null = null) => {
        if (perm) {
            setEditingPerm(perm);
            setFormData({
                code: perm.code,
                name: perm.name,
                category: perm.category,
                description: perm.description || ''
            });
        } else {
            setEditingPerm(null);
            setFormData({
                code: '',
                name: '',
                category: 'GENERAL',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingPerm) {
                await axios.put(`${API_BASE}/permissions/${editingPerm.id}`, formData, getAuthHeader());
                toast.success('تم تحديث الصلاحية بنجاح');
            } else {
                await axios.post(`${API_BASE}/permissions`, formData, getAuthHeader());
                toast.success('تم إضافة الصلاحية بنجاح');
            }
            setIsModalOpen(false);
            fetchPermissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الصلاحية؟ سيؤدي هذا لإزالتها من كافة الأدوار المرتبطة بها.')) return;
        try {
            await axios.delete(`${API_BASE}/permissions/${id}`, getAuthHeader());
            toast.success('تم حذف الصلاحية بنجاح');
            fetchPermissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحذف');
        }
    };

    const filteredPermissions = permissions.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping by category
    const categories = Array.from(new Set(permissions.map(p => p.category)));

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'المحاسبة': return FileText;
            case 'المالية': return Database;
            case 'الاشتراكات': return Users;
            case 'النظام': return Settings;
            case 'الأمان': return Shield;
            case 'التقارير': return Layout;
            default: return Lock;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-500 font-bold">جاري تحميل مصفوفة الصلاحيات...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
            <PageHeader
                icon={Shield}
                title="إدارة مفاتيح الصلاحيات"
                description="عرض وتعديل كافة الأذونات المتاحة في النظام وتصنيفها حسب الموديولات"
                iconClassName="bg-gradient-to-br from-indigo-700 to-indigo-900 shadow-indigo-100"
            >
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
                        <Input
                            className="h-12 w-64 pr-11 pl-4 rounded-2xl bg-white border-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold"
                            placeholder="بحث في الصلاحيات..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-12 px-6 shadow-xl flex gap-2 items-center font-bold"
                    >
                        <Plus size={20} />
                        إضافة صلاحية
                    </Button>
                </div>
            </PageHeader>

            {/* Permissions by Category */}
            <div className="space-y-12">
                {categories.map(category => {
                    const categoryPermissions = filteredPermissions.filter(p => p.category === category);
                    if (categoryPermissions.length === 0) return null;
                    const Icon = getCategoryIcon(category);

                    return (
                        <div key={category} className="space-y-6">
                            <div className="flex items-center gap-4 px-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{category}</h2>
                                    <p className="text-xs font-bold text-slate-400">{categoryPermissions.length} صلاحية متاحة</p>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-l from-indigo-100/50 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                                {categoryPermissions.map(perm => (
                                    <div key={perm.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <code className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded shadow-sm">{perm.code}</code>
                                                <h3 className="text-sm font-black text-slate-800 mt-2">{perm.name}</h3>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenModal(perm)}>
                                                    <Edit3 size={14} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(perm.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
                                            {perm.description || 'لا يوجد وصف متاح لهذه الصلاحية'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl text-right">
                    <DialogHeader className="p-8 bg-indigo-900 text-white relative">
                        <DialogTitle className="text-2xl font-black">{editingPerm ? 'تعديل الصلاحية' : 'إضافة صلاحية جديدة'}</DialogTitle>
                        <Shield className="absolute top-8 left-8 text-white/10" size={64} />
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700">الكود البرمجي</label>
                                    <Input
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold uppercase"
                                        placeholder="E.G. USERS_VIEW"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700">التصنيف (الموديول)</label>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="المحاسبة">المحاسبة</option>
                                        <option value="المالية">المالية</option>
                                        <option value="الاشتراكات">الاشتراكات</option>
                                        <option value="التقارير">التقارير</option>
                                        <option value="النظام">النظام</option>
                                        <option value="الأمان">الأمان</option>
                                        <option value="GENERAL">عام</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">اسم الصلاحية (بالعربي)</label>
                                <Input
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                                    placeholder="مثال: مشاهدة قائمة المستخدمين"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">الوصف</label>
                                <textarea
                                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-24"
                                    placeholder="اشرح ماذا تمكن هذه الصلاحية المستخدم من فعله..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
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
                                className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 shadow-lg shadow-indigo-100 transition-all flex gap-2 items-center"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                                {editingPerm ? 'تحديث الصلاحية' : 'حفظ الصلاحية'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
