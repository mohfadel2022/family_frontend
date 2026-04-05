"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import axios from 'axios';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ActionModal } from '@/components/ui/ActionModal';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';
import { getCategoryIcon, getActionIcon } from '@/lib/permissions';
import { CustomButton } from '@/components/ui/CustomButton';

const API_BASE = META_BASE;

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
    const theme = usePageTheme();
    const { isAdmin, loading: authLoading, logout, checkPermission } = useAuth();

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
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});



    const fetchData = async () => {
        if (!isAdmin && !checkPermission('ROLES_VIEW')) {
            setLoading(false);
            return;
        }
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
            } else if (err.response?.status === 403) {
                toast.error('غير مصرح لك باستعراض هذه البيانات');
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

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("animate-spin", theme.accent)} size={48} />
                <p className="text-muted-foreground/80 font-bold">جاري تحميل الأدوار والصلاحيات...</p>
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

    const toggleSectionExpand = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleCategoryExpand = (cat: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };


    const permissionsBySection = permissions.reduce((acc, perm) => {
        const category = perm.category || 'عام';
        const parts = category.split('/').map(p => p.trim());
        const main = parts[0];
        const sub = parts[1] || '';
        
        if (!acc[main]) acc[main] = {};
        if (!acc[main][sub]) acc[main][sub] = [];
        acc[main][sub].push(perm);
        return acc;
    }, {} as Record<string, Record<string, Permission[]>>);

    const toggleSection = (sectionName: string, select: boolean) => {
        const sectionCategories = permissionsBySection[sectionName];
        if (!sectionCategories) return;

        let allPermIds: string[] = [];
        Object.values(sectionCategories).forEach(perms => {
            allPermIds = [...allPermIds, ...perms.map(p => p.id)];
        });

        if (select) {
            setFormData(prev => ({
                ...prev,
                permissionIds: Array.from(new Set([...prev.permissionIds, ...allPermIds]))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                permissionIds: prev.permissionIds.filter(id => !allPermIds.includes(id))
            }));
        }
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
        if (name === 'ADMIN') return APP_ICONS.MODULES.ROLES;
        if (name === 'RESPONSABLE') return APP_ICONS.NAV.SUBSCRIPTIONS;
        if (name === 'ENCARGADO') return APP_ICONS.MODULES.ENTITIES;
        return APP_ICONS.ACTIONS.LOCK;
    };

    // Using getCategoryIcon from @/lib/permissions


    const getRoleColor = (name: string) => {
        if (name === 'ADMIN') return 'blue';
        if (name === 'RESPONSABLE') return 'emerald';
        if (name === 'ENCARGADO') return 'amber';
        return 'slate';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("animate-spin", theme.accent)} size={48} />
                <p className="text-muted-foreground/80 font-bold">جاري تحميل مصفوفة الصلاحيات...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission="ROLES_VIEW">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
                <PageHeader
                    icon={APP_ICONS.ACTIONS.LOCK}
                    title="إدارة الصلاحيات والأدوار"
                    description="تخصيص مستويات الوصول وتحديد مصفوفة الصلاحيات لكل دور وظيفي"
                >
                    <WithPermission permission="ROLES_CREATE">
                        <CustomButton
                            onClick={() => handleOpenModal()}
                            variant="primary"
                            className="h-12 px-6"
                        >
                            <APP_ICONS.ACTIONS.ADD size={20} />
                            إضافة دور جديد
                        </CustomButton>
                    </WithPermission>
                </PageHeader>

                {/* Roles Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => {
                        const Color = getRoleColor(role.name);
                        const Icon = getRoleIcon(role.name);

                        return (
                            <div key={role.id} className="bg-card rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl transition-all p-8 flex flex-col relative overflow-hidden group">
                                {/* Status/Count Badge */}
                                <div className="absolute top-8 left-8 bg-muted/50 px-4 py-1.5 rounded-full border border-border text-[10px] font-black text-muted-foreground/80">
                                    {role._count?.users || 0} مستخدم
                                </div>

                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500",
                                    Color === 'blue' ? "bg-blue-50 text-blue-600 shadow-lg shadow-blue-100/50" :
                                        Color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                            Color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-muted/50 text-muted-foreground"
                                )}>
                                    <Icon size={32} />
                                </div>

                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-black text-foreground/90">{role.name}</h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <WithPermission permission="ROLES_EDIT">
                                            <CustomButton size="icon" variant="ghost" className={cn("w-8 h-8 rounded-lg text-muted-foreground hover:scale-110 transition-all", theme.accent.replace('text-', 'hover:text-'), theme.muted.replace('bg-', 'hover:bg-'))} onClick={() => handleOpenModal(role)}>
                                                <APP_ICONS.ACTIONS.EDIT size={16} />
                                            </CustomButton>
                                        </WithPermission>
                                        {role.name !== 'ADMIN' && (
                                            <WithPermission permission="ROLES_DELETE">
                                                <CustomButton size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:scale-110 transition-all" onClick={() => handleDelete(role.id)}>
                                                    <APP_ICONS.ACTIONS.DELETE size={16} />
                                                </CustomButton>
                                            </WithPermission>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm font-bold text-muted-foreground/60 mb-8 leading-relaxed h-12 line-clamp-2">
                                    {role.description || 'لا يوجد وصف لهذا الدور'}
                                </p>

                                <div className="space-y-4 flex-1">
                                    <h4 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2 border-b border-border/50 pb-2">الصلاحيات الممنوحة</h4>
                                    <div className="space-y-3 mt-2">
                                        {Object.entries(
                                            role.permissions.reduce((acc, rp) => {
                                                const cat = rp.permission.category;
                                                const parts = cat.split('/').map(p => p.trim());
                                                const sub = parts[1] || parts[0];
                                                if (!acc[sub]) acc[sub] = [];
                                                acc[sub].push(rp.permission.name.split(' ').pop() || rp.permission.name);
                                                return acc;
                                            }, {} as Record<string, string[]>)
                                        ).slice(0, 6).map(([sub, names]) => (
                                            <div key={sub} className="group/perm animate-in slide-in-from-right-2 duration-300">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {React.createElement(getCategoryIcon(sub), { size: 12, className: cn("shrink-0", theme.accent) })}
                                                    <p className="text-[10px] font-black text-muted-foreground/60 truncate">{sub}</p>
                                                </div>
                                                <p className="text-[11px] font-bold text-muted-foreground leading-tight pr-5 line-clamp-2">
                                                    {names.join('، ')}
                                                </p>
                                            </div>
                                        ))}
                                        {role.permissions.length === 0 && (
                                            <p className="text-xs font-bold text-muted-foreground/40 italic">لا توجد صلاحيات مسندة</p>
                                        )}
                                        {Object.keys(
                                            role.permissions.reduce((acc, rp) => {
                                                acc[rp.permission.category] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)
                                        ).length > 6 && (
                                                <div className="pt-2 flex items-center gap-2">
                                                    <div className="h-px flex-1 bg-muted/50" />
                                                    <p className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", theme.accent.replace('text-', 'text-').replace('-600', '-400'), theme.muted.replace('bg-', 'bg-').replace('-50', '-100'))}>
                                                        +{Object.keys(
                                                            role.permissions.reduce((acc, rp) => {
                                                                acc[rp.permission.category] = true;
                                                                return acc;
                                                            }, {} as Record<string, boolean>)
                                                        ).length - 6} موديولات أخرى
                                                    </p>
                                                    <div className="h-px flex-1 bg-muted/50" />
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal for Create/Edit */}
                <ActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
                    description="Role Based Access Control (RBAC)"
                    icon={APP_ICONS.ACTIONS.LOCK}
                    iconClassName="bg-slate-800 text-white shadow-slate-900/20"
                    headerClassName="bg-slate-900 text-white border-slate-800"
                    maxWidth="!max-w-4xl"
                    preventClose={true}
                    showCloseButton={false}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">اسم الدور (بالإنجليزي)</label>
                                <Input
                                    className={cn("h-12 rounded-xl bg-muted/50 border-input font-bold uppercase focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                    placeholder="e.g. ACCOUNTANT"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    disabled={editingRole?.name === 'ADMIN'}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">الوصف</label>
                                <Input
                                    className="h-12 rounded-xl bg-muted/50 border-input font-bold"
                                    placeholder="وصف مختصر لمسؤوليات هذا الدور"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                            <h4 className="text-sm font-black text-foreground border-b border-border pb-3 flex items-center gap-2 sticky top-0 bg-card z-10">
                                <APP_ICONS.MODULES.ROLES size={18} className={theme.accent} />
                                مصفوفة الصلاحيات حسب الموديول
                            </h4>

                            {Object.entries(permissionsBySection).map(([sectionName, categories]) => {
                                const isSectionExpanded = !!expandedSections[sectionName];

                                // Calculate section level selection
                                let sectionTotal = 0;
                                let sectionSelected = 0;
                                Object.values(categories).forEach(perms => {
                                    sectionTotal += perms.length;
                                    sectionSelected += perms.filter(p => formData.permissionIds.includes(p.id)).length;
                                });
                                const sectionAllSelected = sectionSelected === sectionTotal && sectionTotal > 0;

                                return (
                                    <div key={sectionName} className="space-y-4">
                                        {/* Section Header */}
                                        <div className="flex items-center justify-between py-3 border-b border-border bg-muted/40 px-4 rounded-2xl cursor-pointer hover:bg-accent transition-colors mt-6" onClick={() => toggleSectionExpand(sectionName)}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    sectionSelected > 0 ? "bg-slate-900 text-white" : "bg-card text-muted-foreground/60 border border-border"
                                                )}>
                                                    {React.createElement(getCategoryIcon(sectionName), { size: 20 })}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-foreground/90">{sectionName}</h4>
                                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase">
                                                        {sectionSelected} من {sectionTotal} صلاحيات إجمالية
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CustomButton
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn("h-8 text-[11px] font-black px-4 rounded-lg bg-card border border-border", theme.accent.replace('text-', 'hover:text-'))}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(sectionName, !sectionAllSelected);
                                                    }}
                                                >
                                                    {sectionAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                                                </CustomButton>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all border shadow-sm",
                                                    isSectionExpanded ? "bg-slate-900 border-slate-800 text-white" : "bg-card border-input text-muted-foreground/60 group-hover:border-slate-300 group-hover:text-muted-foreground"
                                                )}>
                                                    {isSectionExpanded ? <APP_ICONS.ACTIONS.CHEVRON_DOWN size={22} strokeWidth={3} /> : <APP_ICONS.ACTIONS.CHEVRON_RIGHT size={22} strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </div>

                                        {isSectionExpanded && (
                                            <div className="space-y-4 pr-4 border-r-2 border-border/50 mr-4 animate-in slide-in-from-top-2 duration-300">
                                                {Object.entries(categories).map(([category, perms]) => {
                                                    const allSelected = perms.every(p => formData.permissionIds.includes(p.id));
                                                    const selectedCount = perms.filter(p => formData.permissionIds.includes(p.id)).length;
                                                    const isExpanded = !!expandedCategories[category];

                                                    return (
                                                        <div key={category} className="space-y-3 bg-card rounded-[1.5rem] border border-border overflow-hidden shadow-sm transition-all">
                                                            <div className="flex justify-between items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleCategoryExpand(category)}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                                            selectedCount > 0 ? cn(theme.primary, "text-white shadow-lg", theme.shadow) : "bg-card text-muted-foreground/60 border border-border"
                                                                        )}>
                                                                            {React.createElement(getCategoryIcon(category), { size: 20 })}
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-sm font-black text-foreground/80">
                                                                                {category.includes(' / ') ? category.split(' / ').pop() : category}
                                                                            </h5>
                                                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">
                                                                                {selectedCount} من {perms.length} صلاحيات محددة
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomButton
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className={cn("h-8 text-[11px] font-black px-4 bg-muted/50 border border-border", theme.accent.replace('text-', 'hover:text-'))}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleCategory(category, !allSelected);
                                                                            }}
                                                                        >
                                                                            {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                                                                        </CustomButton>
                                                                        <div className={cn(
                                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all border shadow-sm",
                                                                            isExpanded ? cn(theme.primary, theme.primary.replace('bg-', 'border-'), "text-white") : "bg-muted/50 border-input text-muted-foreground/60 group-hover:border-slate-300 group-hover:text-muted-foreground"
                                                                        )}>
                                                                            {isExpanded ? <APP_ICONS.ACTIONS.CHEVRON_DOWN size={18} strokeWidth={3} /> : <APP_ICONS.ACTIONS.CHEVRON_RIGHT size={18} strokeWidth={3} />}
                                                                        </div>
                                                                    </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
                                                                    {perms.map(perm => {
                                                                        const ActionIcon = getActionIcon(perm.code);
                                                                        const isSelected = formData.permissionIds.includes(perm.id);
                                                                        return (
                                                                            <label key={perm.id} className={cn(
                                                                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-muted/50",
                                                                                isSelected ? cn(theme.border, theme.muted.replace('bg-', 'bg-') + "/20") : "border-border/50 bg-card"
                                                                            )}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className={cn("w-4 h-4 rounded-md border-slate-300", theme.accent.replace('text-', 'text-'))}
                                                                                    checked={isSelected}
                                                                                    onChange={() => togglePermission(perm.id)}
                                                                                />
                                                                                <div className={cn(
                                                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                                                    isSelected ? cn(theme.primary, "text-white shadow-md") : "bg-muted text-muted-foreground/40"
                                                                                )}>
                                                                                    <ActionIcon size={12} />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[11px] font-black text-foreground/90 truncate">{perm.name}</p>
                                                                                    <p className="text-[9px] text-muted-foreground/40 font-bold font-mono">{perm.code.split('_').pop()}</p>
                                                                                </div>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </form>
                    <div className="pt-6 border-t border-border flex gap-3">
                            
                            <CustomButton 
                                icon={APP_ICONS.ACTIONS.CANCEL}
                                onClick={() => setIsModalOpen(false)}
                                variant='outline'                                    

                            >
                                إلغاء 

                            </CustomButton>
                            <CustomButton
                                icon={APP_ICONS.ACTIONS.CHECK}
                                isLoading={submitting}
                                onClick={handleSubmit}
                                >
                                {editingRole ? 'تحديث الدور' : 'حفظ الدور'}

                            </CustomButton>

                            {/* <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-12 shadow-lg shadow-blue-100 transition-all flex gap-2 items-center justify-center"
                            >
                                {submitting ? <APP_ICONS.STATE.LOADING className="animate-spin" size={20} /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                                {editingRole ? 'تحديث الدور' : 'حفظ الدور'}
                            </Button> */}
                    </div>
                </ActionModal>

                {/* Additional Info Section */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                        <div className="p-6 bg-card/10 backdrop-blur-xl rounded-[2rem] border border-white/10 shrink-0">
                            <APP_ICONS.ACTIONS.INFO size={48} className={theme.accent.replace('-600', '-400')} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black">ملاحظات هامة حول الأمان</h2>
                            <p className="text-muted-foreground/40 font-bold leading-relaxed max-w-3xl">
                                يتم تطبيق هذه الصلاحيات بشكل صارم على مستوى الخادم (Server-side) لضمان حماية البيانات.
                                لا يمكن للمستخدمين الوصول إلى البيانات أو تنفيذ العمليات التي لا تندرج تحت أدوارهم الوظيفية، حتى عبر محاولات الحقن المباشر للطلبات.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
