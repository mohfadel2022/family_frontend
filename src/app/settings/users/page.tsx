"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { ActionModal } from '@/components/ui/ActionModal';
import { META_BASE, SUB_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

export default function UsersPage() {
    const theme = usePageTheme();
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const { isAdmin, loading: authLoading, checkPermission } = useAuth();

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const getRoleDetails = (roleName: string) => {
        switch (roleName) {
            case 'ADMIN': return { label: 'مدير نظام', color: 'bg-blue-600 shadow-blue-100', icon: APP_ICONS.MODULES.ROLES, text: 'text-blue-600', bg: 'bg-blue-50' };
            case 'RESPONSABLE': return { label: 'مسؤول نظام', color: 'bg-emerald-600 shadow-emerald-100', icon: APP_ICONS.MODULES.ROLES, text: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'ENCARGADO': return { label: 'مسؤول جهة', color: 'bg-amber-600 shadow-amber-100', icon: APP_ICONS.MODULES.STATUS.ACTIVE, text: 'text-amber-600', bg: 'bg-amber-50' };
            default: return { label: roleName, color: 'bg-slate-500', icon: APP_ICONS.SHARED.USER, text: 'text-muted-foreground/80', bg: 'bg-muted/50' };
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                axios.get(`${API_BASE}/users`, getAuthHeader()),
                axios.get(`${API_BASE}/roles`, getAuthHeader()),
                axios.get(`${SUB_BASE}/members`, getAuthHeader())
            ]);
            
            const usersData = results[0].status === 'fulfilled' ? results[0].value.data : [];
            const rolesData = results[1].status === 'fulfilled' ? results[1].value.data : [];
            const membersData = results[2].status === 'fulfilled' ? results[2].value.data : [];

            const existingUserIds = new Set(usersData.map((u: any) => u.memberId).filter(Boolean));
            const existingUserNames = new Set(usersData.map((u: any) => u.name?.trim().toLowerCase()));
            const membersWithFlag = membersData.map((m: any) => ({
                ...m,
                hasUser: existingUserIds.has(m.id) || existingUserNames.has(m.name?.trim().toLowerCase())
            }));
            setUsers(usersData);
            setRoles(rolesData);
            setMembers(membersWithFlag);
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

    if (authLoading || loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
            <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
            <p className="text-muted-foreground/80 font-black">جاري تحميل قائمة المستخدمين...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="USERS_VIEW">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
                <PageHeader
                    icon={APP_ICONS.MODULES.USERS}
                    title="إدارة مستخدمي النظام"
                    description="إدارة صلاحيات الوصول ومسؤولي الجهات والمحاسبين"
                >
                    <WithPermission permission="USERS_CREATE">
                        <CustomButton
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                            variant="primary"
                            className="h-12 px-6"
                        >
                            <APP_ICONS.ACTIONS.ADD size={20} />
                            إضافة مستخدم جديد
                        </CustomButton>
                    </WithPermission>
                </PageHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className={cn("bg-card rounded-[2rem] border border-border p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between", theme.border.replace('border-', 'hover:border-'))}>
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all",
                                        getRoleDetails(user.role?.name).bg,
                                        "border-transparent",
                                        getRoleDetails(user.role?.name).text
                                    )}>
                                        {React.createElement(getRoleDetails(user.role?.name).icon, { size: 26 })}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <WithPermission permission="USERS_EDIT">
                                            <CustomButton
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className={cn("w-10 h-10 text-muted-foreground hover:scale-110 transition-all", theme.accent.replace('text-', 'hover:text-'), theme.muted.replace('bg-', 'hover:bg-'))}
                                            >
                                                <APP_ICONS.ACTIONS.EDIT size={16} />
                                            </CustomButton>
                                        </WithPermission>
                                        <WithPermission permission="USERS_DELETE">
                                            <CustomButton
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(user.id)}
                                                className="w-10 h-10 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:scale-110 transition-all"
                                            >
                                                <APP_ICONS.ACTIONS.DELETE size={16} />
                                            </CustomButton>
                                        </WithPermission>
                                    </div>
                                </div>
                                <div>
                                        <h3 className="text-xl font-black text-foreground/90">{user.name || 'مستخدم بدون اسم'}</h3>
                                        <p className="text-sm font-bold text-muted-foreground/60 font-mono">@{user.username}</p>
                                        {user.email && (
                                            <p className="text-xs font-bold text-muted-foreground/50 mt-1 flex items-center gap-1.5">
                                                <APP_ICONS.SHARED.EMAIL size={12} />
                                                {user.email}
                                            </p>
                                        )}
                                        {user.entities && user.entities.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1 ">
                                                {user.entities.map((ent: any) => (
                                                    <span key={ent.id} className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1", theme.accent, theme.muted, theme.border)}>
                                                        <APP_ICONS.MODULES.ENTITIES size={10} />
                                                        {ent.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white",
                                        getRoleDetails(user.role?.name).color
                                    )}>
                                        {getRoleDetails(user.role?.name).label}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[10px] font-bold">
                                        <APP_ICONS.ACTIONS.LOCK size={12} />
                                        مؤمن بالكامل
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <UserModal
                        theme={theme}
                        user={editingUser}
                        roles={roles}
                        members={members}
                        existingUsernames={users.map((u: any) => u.username).filter(Boolean)}
                        onClose={() => setIsModalOpen(false)}
                        onSave={fetchData}
                    />
                )}

                <ConfirmModal
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    onConfirm={executeDelete}
                    title="حذف المستخدم"
                    description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية."
                    confirmLabel="حذف المستخدم"
                    variant="danger"
                    icon={APP_ICONS.ACTIONS.DELETE}
                    loading={confirmLoading}
                />
            </div>
        </ProtectedRoute>
    );
}


const UserModal = ({ theme, user, roles, members, existingUsernames, onClose, onSave }: any) => {
    const defaultRoleId = roles.find((r: any) => r.name === 'ENCARGADO')?.id || roles[0]?.id;

    // Is-member toggle — when true shows member picker
    const [isMember, setIsMember] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState<any>(null);

    const [formData, setFormData] = useState(user ? {
        username: user.username,
        name: user.name || '',
        email: user.email || '',
        roleId: user.roleId || '',
        password: ''
    } : {
        username: '',
        name: '',
        email: '',
        roleId: defaultRoleId,
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const requirements = [
        { label: '8 أحرف على الأقل', test: (p: string) => p.length >= 8 },
        { label: 'حرف كبير (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'حرف صغير (a-z)', test: (p: string) => /[a-z]/.test(p) },
        { label: 'رقم (0-9)', test: (p: string) => /[0-9]/.test(p) },
        { label: 'رمز خاص (@#$!)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];

    const isPasswordValid = !formData.password || requirements.every(req => req.test(formData.password));

    // Arabic to Latin transliteration map
    const arabicToLatin: Record<string, string> = {
        'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
        'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
        'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
        'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '', 'ئ': 'y',
        'ؤ': 'w', 'لا': 'la', 'لأ': 'la', 'لإ': 'li', 'لآ': 'laa',
    };

    // Generate latinized username from full Arabic name
    const generateUsername = (name: string): string => {
        const transliterated = name
            .trim()
            .split('')
            .map(ch => arabicToLatin[ch] ?? (ch.match(/[a-zA-Z0-9]/) ? ch.toLowerCase() : ''))
            .join('')
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 30);
        return transliterated || name.trim().replace(/\s+/g, '').toLowerCase().substring(0, 20);
    };

    // Check if username is taken (case-insensitive). Allow current user's own username.
    const isTaken = (uname: string): boolean => {
        if (!uname) return false;
        const lower = uname.toLowerCase();
        if (user && user.username?.toLowerCase() === lower) return false; // editing own
        return (existingUsernames || []).some((u: string) => u.toLowerCase() === lower);
    };

    const usernameTaken = isTaken(formData.username);

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        const suggestedUsername = generateUsername(member.name);
        setFormData(f => ({
            ...f,
            name: member.name,
            username: suggestedUsername
        }));
    };

    const filteredMembers = (members || []).filter((m: any) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.entity?.name?.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!isPasswordValid) {
            toast.error('يرجى استيفاء جميع متطلبات كلمة المرور');
            setLoading(false);
            return;
        }

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
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={user ? 'تعديل مستخدم' : 'إضافة مستخدم نظام'}
            description="Identity & Access Management"
            icon={APP_ICONS.MODULES.USERS}
            iconClassName="bg-slate-800 text-white shadow-slate-900/20"
            headerClassName="bg-slate-900 text-white border-slate-800"
            maxWidth="max-w-xl"
            preventClose={true}
            showCloseButton={false}
        >
            <div dir="rtl">
                {/* Is-Member toggle — shown for both new and existing users */}
                <div className={cn(
                    "p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer select-none transition-all mb-6",
                    isMember
                        ? cn(theme.border, theme.muted.replace('bg-', 'bg-') + "/60")
                        : "border-border bg-muted/50/40 hover:border-input"
                )}
                    onClick={() => {
                        setIsMember(!isMember);
                        if (isMember) {
                            setSelectedMember(null);
                            setMemberSearch('');
                        }
                    }}
                >
                    <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        isMember ? cn(theme.primary, theme.primary.replace('bg-', 'border-')) : "border-slate-300 bg-card"
                    )}>
                        {isMember && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={cn("font-black text-sm", isMember ? theme.accent.replace('text-', 'text-').replace('-600', '-800') : "text-muted-foreground")}>
                            اختر المستخدم من قائمة الاعضاء
                        </p>
                        <p className={cn("text-[11px] font-medium mt-0.5", isMember ? theme.accent.replace('-600', '-500') : "text-muted-foreground/60")}>
                            {isMember ? "سيتم اختيار العضو من قائمة الأعضاء" : "مستخدم مستقل بدون ربط بعضو"}
                        </p>
                    </div>
                    <APP_ICONS.MODULES.STATUS.ACTIVE size={18} className={isMember ? theme.accent.replace('-600', '-500') : "text-muted-foreground/40"} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Member Picker — shown when isMember is checked */}
                    {isMember && (
                        <div className="space-y-3">
                            <label className="text-sm font-black text-foreground/80">اختر عضواً</label>
                            <Input
                                placeholder="ابحث عن عضو بالاسم أو الجهة..."
                                className="h-12 rounded-2xl bg-muted/50 border-input font-bold"
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                            />
                            <div className="max-h-52 overflow-y-auto rounded-2xl border border-border divide-y divide-slate-50">
                                {filteredMembers.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground/60 font-bold text-sm">لا توجد نتائج</div>
                                ) : filteredMembers.map((m: any) => {
                                    const isSelected = selectedMember?.id === m.id;
                                    const alreadyUser = m.hasUser;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            disabled={alreadyUser}
                                            onClick={() => !alreadyUser && handleSelectMember(m)}
                                            className={cn(
                                                "w-full px-4 py-3 text-right transition-all flex items-center justify-between",
                                                isSelected ? theme.muted : "bg-card hover:bg-muted/50",
                                                alreadyUser ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <p className={cn("font-black text-sm", isSelected ? theme.accent.replace('-600', '-700') : "text-foreground/90")}>
                                                    {m.name}
                                                </p>
                                                <span className="text-muted-foreground/40 font-bold text-xs">—</span>
                                                <p className="text-sm font-bold text-muted-foreground/80">{m.entity?.name || 'بدون جهة'}</p>
                                            </div>
                                            {alreadyUser && (
                                                <span className="text-xs font-bold text-muted-foreground/60">(مستخدم)</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedMember && (
                                <div className={cn("flex items-center gap-2 p-3 rounded-2xl border", theme.muted, theme.border)}>
                                    <div className={cn("w-8 h-8 rounded-xl text-white flex items-center justify-center text-sm font-black shrink-0", theme.primary)}>
                                        {selectedMember.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className={cn("text-sm font-black", theme.accent.replace('-600', '-800'))}>{selectedMember.name}</p>
                                        <p className={cn("text-[11px]", theme.accent.replace('-600', '-500'))}>تم اختيار هذا العضو — يمكنك تعديل البيانات أدناه</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1">الاسم الكامل</label>
                            <Input
                                required
                                placeholder="مثال: محمد أحمد"
                                className={cn("w-full px-5 h-14 rounded-2xl bg-muted/50 border-input font-bold focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1">البريد الإلكتروني (اختياري)</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    className={cn("w-full px-5 h-14 rounded-2xl bg-muted/50 border-input font-bold focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value.trim() })}
                                />
                                <APP_ICONS.SHARED.EMAIL size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80 mr-1">اسم المستخدم</label>
                                <div className="relative">
                                    <Input
                                        required
                                        placeholder="username"
                                        className={cn(
                                            "w-full px-5 h-14 rounded-2xl bg-muted/50 font-mono font-bold transition-all focus-visible:ring-2",
                                            usernameTaken
                                                ? "border-rose-400 bg-rose-50/30 focus-visible:ring-rose-400"
                                                : cn("border-input", theme.accent.replace('text-', 'focus-visible:ring-'))
                                        )}
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                    />
                                    <span className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black px-2 py-0.5 rounded-full",
                                        usernameTaken
                                            ? "bg-rose-100 text-rose-600"
                                            : formData.username ? "bg-emerald-100 text-emerald-600" : "hidden"
                                    )}>
                                        {usernameTaken ? 'مستخدم مسبقاً ✕' : '✓ متاح'}
                                    </span>
                                </div>
                                {usernameTaken && (
                                    <p className="text-[11px] text-rose-500 font-bold mr-1">
                                        اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم مختلف.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80 mr-1">الدور الوظيفي</label>
                                <Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-input font-bold">
                                        <SelectValue placeholder="اختر الدور" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="rounded-xl font-bold">
                                        {roles.map((role: any) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name === 'ADMIN' ? 'مدير نظام' :
                                                    role.name === 'RESPONSABLE' ? 'مسؤول نظام' :
                                                        role.name === 'ENCARGADO' ? 'مسؤول جهة' : role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80 mr-1">كلمة المرور {user && '(اتركها فارغة لعدم التغيير)'}</label>
                            <div className="relative group/pass">
                                <Input
                                    required={!user}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={cn("w-full px-5 h-14 rounded-2xl bg-muted/50 border-input font-bold pr-12 focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors p-2", theme.accent.replace('text-', 'hover:text-'))}
                                >
                                    {showPassword ? <APP_ICONS.ACTIONS.HIDE size={20} /> : <APP_ICONS.ACTIONS.VIEW size={20} />}
                                </button>
                            </div>

                            {/* Password Requirements Grid */}
                            {formData.password && (
                                <div className="grid grid-cols-2 gap-2 mt-4 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {requirements.map((req, idx) => {
                                        const met = req.test(formData.password);
                                        return (
                                            <div key={idx} className={cn(
                                                "flex items-center gap-2 text-[10px] font-bold transition-colors",
                                                met ? "text-emerald-500" : "text-muted-foreground/40"
                                            )}>
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    met ? "bg-emerald-500" : "bg-muted-foreground/20"
                                                )} />
                                                <span>{req.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <CustomButton type="button" variant="outline" onClick={onClose} className="flex-1 h-14 border-input text-muted-foreground/80">إلغاء</CustomButton>
                        <CustomButton
                            disabled={!!(loading || usernameTaken || (isMember && !selectedMember && !formData.name) || (formData.password && !isPasswordValid))}
                            type="submit"
                            variant="primary"
                            className="flex-[2] h-14"
                        >
                            {loading ? <APP_ICONS.STATE.LOADING size={18} className="animate-spin" /> : <APP_ICONS.ACTIONS.ADD size={20} />}
                            حفظ بيانات المستخدم
                        </CustomButton>
                    </div>
                </form>
            </div>
        </ActionModal>
    );
};


