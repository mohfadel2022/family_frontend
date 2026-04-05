"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
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

import { META_BASE, COST_CENTER_BASE, getAuthHeader } from '@/lib/api';
import { CustomButton } from '@/components/ui/CustomButton';

const API_BASE = COST_CENTER_BASE;

export default function CostCentersPage() {
    const theme = usePageTheme();
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCostCenter, setEditingCostCenter] = useState<any>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [costCenterToDelete, setCostCenterToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                axios.get(API_BASE, getAuthHeader()),
                axios.get(`${META_BASE}/branches`, getAuthHeader()),
            ]);
            
            const fetchedCCs = results[0].status === 'fulfilled' ? results[0].value.data : [];
            setCostCenters(fetchedCCs);
            setBranches(results[1].status === 'fulfilled' ? results[1].value.data : []);

            // Auto-select first principal if none selected
            const principals = fetchedCCs.filter((c: any) => !c.parentId);
            if (principals.length > 0 && !selectedPrincipalId) {
                setSelectedPrincipalId(principals[0].id);
            }
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
        setCostCenterToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!costCenterToDelete) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`${API_BASE}/${costCenterToDelete}`, getAuthHeader());
            toast.success('تم حذف مركز التكلفة بنجاح');
            fetchData();
            setDeleteConfirmOpen(false);
            setCostCenterToDelete(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف');
        } finally {
            setDeleteLoading(false);
        }
    };

    const principals = costCenters.filter(c => !c.parentId && (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    ));

    const secondaries = costCenters.filter(c => c.parentId === selectedPrincipalId);
    const selectedPrincipal = costCenters.find(c => c.id === selectedPrincipalId);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل المراكز...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="COST_CENTERS_VIEW">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <PageHeader
                icon={APP_ICONS.MODULES.DASHBOARD}
                title="إدارة هرمية مراكز التكلفة"
                description="إدارة المراكز الرئيسية (القطاعات) والمراكز الفرعية (المشاريع)"
            >
                <WithPermission permission="COST_CENTERS_CREATE">
                    <CustomButton
                        onClick={() => { setEditingCostCenter(null); setIsModalOpen(true); }}
                        icon={APP_ICONS.ACTIONS.ADD}
                        variant="primary"
                    >
                        إضافة مركز تكلفة
                    </CustomButton>
                </WithPermission>
            </PageHeader>

            <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                {/* Left Pane: Principals Tree */}
                <div className="lg:w-80 flex flex-col gap-4">
                    <div className={cn("bg-card/50 p-3 rounded-2xl border border-border shadow-sm", theme.border)}>
                         <div className="relative w-full">
                            <APP_ICONS.ACTIONS.SEARCH className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
                            <Input
                                placeholder="بحث..."
                                className="pr-9 h-9 rounded-xl bg-card border-border focus:ring-1 font-bold text-xs"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[70vh] custom-scrollbar pr-1">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">المراكز الرئيسية</h3>
                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[9px] font-bold">{principals.length}</span>
                        </div>
                        
                        {principals.map(cc => {
                            const isActive = selectedPrincipalId === cc.id;
                            return (
                                <div 
                                    key={cc.id} 
                                    onClick={() => setSelectedPrincipalId(cc.id)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-l-4",
                                        isActive 
                                            ? cn("bg-primary/5 border-l-primary shadow-sm")
                                            : "border-l-transparent hover:bg-muted/40"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                        )}>
                                            <APP_ICONS.STATE.FOLDER_OPEN size={14} />
                                        </div>
                                        <div>
                                            <p className={cn("text-xs font-black", isActive ? "text-foreground" : "text-foreground/70")}>{cc.name}</p>
                                            <p className="text-[9px] font-bold opacity-40">{cc.code}</p>
                                        </div>
                                    </div>

                                    {/* Principals Actions */}
                                    <div className={cn("flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingCostCenter(cc); setIsModalOpen(true); }}
                                            className="p-1 hover:bg-primary/10 text-primary/60 hover:text-primary rounded-md transition-all"
                                        >
                                            <APP_ICONS.ACTIONS.EDIT size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); confirmDelete(cc.id); }}
                                            className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-md transition-all"
                                        >
                                            <APP_ICONS.ACTIONS.DELETE size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {principals.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground/30 font-bold border-2 border-dashed border-border/40 rounded-2xl text-[10px]">
                                لا توجد مراكز
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Secondaries Tree */}
                <div className="flex-1 flex flex-col gap-4">
                    {selectedPrincipal ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500 flex flex-col gap-4 h-full">
                            <div className={cn("bg-card border p-4 rounded-3xl shadow-sm flex items-center justify-between", theme.border)}>
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-xl flex items-center justify-center shadow-lg", theme.muted, theme.accent)}>
                                        <APP_ICONS.MODULES.ACCOUNT_FOLDER size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-foreground/90">{selectedPrincipal.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black opacity-30 uppercase tracking-tighter">هيكل المشروع الفرعي</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[9px] font-black text-primary/60">{secondaries.length} مركزاً تابعة</span>
                                        </div>
                                    </div>
                                </div>
                                <WithPermission permission="COST_CENTERS_CREATE">
                                    <CustomButton
                                        onClick={() => { setEditingCostCenter({ parentId: selectedPrincipalId }); setIsModalOpen(true); }}
                                        icon={APP_ICONS.ACTIONS.ADD}
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-3 text-[10px] rounded-xl font-black"
                                    >
                                        إضافة تفريع
                                    </CustomButton>
                                </WithPermission>
                            </div>

                            <div className="bg-card/30 border border-border/40 rounded-3xl p-2 flex-col gap-1 overflow-y-auto max-h-[60vh] custom-scrollbar flex">
                                {secondaries.length > 0 ? (
                                    secondaries.map(cc => (
                                        <div key={cc.id} className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-card border border-transparent hover:border-border/60 hover:shadow-sm transition-all relative">
                                            {/* Tree line connector */}
                                            <div className="absolute top-1/2 -right-4 w-4 h-px bg-border/40" />
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-muted/40 text-muted-foreground/60 flex items-center justify-center border border-border/20 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                                    <APP_ICONS.NAV.DASHBOARD size={14} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black text-foreground/80 leading-none">{cc.name}</p>
                                                        {cc.status === 'INACTIVE' && (
                                                            <span className="bg-rose-50 text-rose-500 px-1 border border-rose-100 rounded text-[8px] font-black">ملغى</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-mono text-muted-foreground/50 mt-1 uppercase">{cc.code}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="h-6 w-px bg-border mx-2" />
                                                <button 
                                                    onClick={() => { setEditingCostCenter(cc); setIsModalOpen(true); }}
                                                    className="p-1.5 hover:bg-primary/10 text-primary/40 hover:text-primary rounded-lg transition-all"
                                                    title="تعديل"
                                                >
                                                    <APP_ICONS.ACTIONS.EDIT size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => confirmDelete(cc.id)}
                                                    className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all"
                                                    title="حذف"
                                                >
                                                    <APP_ICONS.ACTIONS.DELETE size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/30 rounded-2xl m-2 opacity-40">
                                        <APP_ICONS.STATE.EMPTY size={40} className="mb-4" />
                                        <p className="text-xs font-black">لا توجد مراكز فرعية</p>
                                        <p className="text-[9px] font-bold mt-1 uppercase tracking-tighter">أضف عناصر فرعية لبناء الهيكل التنظيمي</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 border-2 border-dashed border-border rounded-3xl text-muted-foreground font-black opacity-30">
                            <APP_ICONS.STATE.FOLDER_OPEN size={64} className="mb-4 opacity-5" />
                            <p className="text-xs uppercase tracking-widest text-center px-8">اختر مركزاً رئيسياً من الهيكل لعرض الفروع</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CostCenterModal
                    costCenter={editingCostCenter}
                    branches={branches}
                    principals={costCenters.filter((c: any) => !c.parentId)}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            <ConfirmModal
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={executeDelete}
                title="حذف مركز التكلفة"
                description="هل أنت متأكد من رغبتك في حذف مركز التكلفة هذا؟ لا يمكن حذف المركز إذا كان يحتوي على مراكز فرعية أو مرتبطاً بحركات محاسبية."
                confirmLabel="تأكيد الحذف"
                variant="danger"
                icon={APP_ICONS.ACTIONS.DELETE}
                loading={deleteLoading}
            />
        </div>
        </ProtectedRoute>
    );
}

const CostCenterModal = ({ costCenter, branches, principals, onClose, onSave }: any) => {
    const [formData, setFormData] = useState({
        name: costCenter?.name || '',
        code: costCenter?.code || '',
        branchId: costCenter?.branchId || branches[0]?.id || '',
        status: costCenter?.status || 'ACTIVE',
        parentId: costCenter?.parentId || null
    });
    const [loading, setLoading] = useState(false);
    const [isAutoGenerated, setIsAutoGenerated] = useState(!costCenter?.code);

    // Fetch next code helper
    const fetchNextCode = async (pId: string | null) => {
        try {
            const res = await axios.get(`${API_BASE}/next-code`, {
                params: { parentId: pId },
                ...getAuthHeader()
            });
            if (res.data?.nextCode) {
                setFormData(prev => ({ ...prev, code: res.data.nextCode }));
                setIsAutoGenerated(true);
            }
        } catch (err) {
            console.error('Failed to fetch next code:', err);
        }
    };

    // React to name changes
    const handleNameChange = (newName: string) => {
        setFormData(prev => ({ ...prev, name: newName }));
        
        if (!newName.trim()) {
            if (isAutoGenerated) {
                setFormData(prev => ({ ...prev, code: '' }));
            }
            return;
        }

        if (!formData.code || isAutoGenerated) {
            fetchNextCode(formData.parentId);
        }
    };

    // React to parent change
    useEffect(() => {
        if (formData.name.trim() && (isAutoGenerated || !formData.code)) {
            fetchNextCode(formData.parentId);
        }
    }, [formData.parentId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                code: formData.code?.trim() || undefined
            };
            if (costCenter?.id) {
                await axios.put(`${API_BASE}/${costCenter.id}`, payload, getAuthHeader());
                toast.success('تم التحديث بنجاح');
            } else {
                await axios.post(API_BASE, payload, getAuthHeader());
                toast.success('تمت الإضافة بنجاح');
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
            title={costCenter?.id ? 'تعديل مركز تكلفة' : 'إضافة مركز تكلفة'}
            description="حدد مستويات العمل للمركز"
            icon={APP_ICONS.MODULES.DASHBOARD}
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2 col-span-2">
                        <label className="text-xs font-black text-muted-foreground mr-1 uppercase tracking-tighter">اسم المركز</label>
                        <Input
                            required
                            placeholder="مثال: قطاع التعليم"
                            className="w-full px-5 h-14 rounded-2xl bg-muted/40 border-border font-bold"
                            value={formData.name}
                            onChange={e => handleNameChange(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground mr-1 uppercase tracking-tighter">كود المركز (اختياري)</label>
                        <Input
                            placeholder="توليد تلقائي (CC-XX)"
                            className="w-full px-5 h-14 rounded-2xl bg-muted/40 border-border font-mono font-bold uppercase"
                            value={formData.code}
                            onChange={e => {
                                const val = e.target.value.toUpperCase();
                                setFormData({ ...formData, code: val });
                                if (val) {
                                    setIsAutoGenerated(false);
                                } else if (formData.name.trim()) {
                                    fetchNextCode(formData.parentId);
                                }
                            }}
                        />
                        <p className="text-[10px] text-muted-foreground/60 mr-2 font-bold italic">اتركه فارغاً للتوليد التلقائي (CC-01, CC-01-01...)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground mr-1 uppercase tracking-tighter">المستوى (المركز الرئيسي)</label>
                        <Select 
                            value={formData.parentId || "ROOT"} 
                            onValueChange={(v) => setFormData({ ...formData, parentId: v === "ROOT" ? null : v })}
                        >
                            <SelectTrigger className="w-full h-14 rounded-2xl bg-muted/40 border-border font-bold text-center">
                                <SelectValue placeholder="رئيسي" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border">
                                <SelectItem value="ROOT" className="font-bold">-- مركز رئيسي --</SelectItem>
                                {principals.filter((p: any) => p.id !== costCenter?.id).map((p: any) => (
                                    <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground mr-1 uppercase tracking-tighter">الفرع</label>
                        <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                            <SelectTrigger className="w-full h-14 rounded-2xl bg-muted/40 border-border font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر الفرع" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border">
                                {branches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id} className="font-bold">{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground mr-1 uppercase tracking-tighter">الحالة</label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                            <SelectTrigger className="w-full h-14 rounded-2xl bg-muted/40 border-border font-bold text-center">
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="rounded-2xl border-border">
                                <SelectItem value="ACTIVE" className="font-bold">نشط</SelectItem>
                                <SelectItem value="INACTIVE" className="font-bold text-rose-600">غير نشط</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-4 pt-6">
                    <CustomButton type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl">إلغاء</CustomButton>
                    <CustomButton disabled={loading} type="submit" className="flex-[2] h-14 rounded-2xl" variant="primary">
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                        {costCenter?.id ? 'تحديث' : 'حفظ'}
                    </CustomButton>
                </div>
            </form>
        </ActionModal>
    );
};
