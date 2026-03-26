"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { API_BASE, getAuthHeader } from '@/lib/api';

interface AccountFormProps {
    account?: any;
    accounts: any[];
    currencies: any[];
    branches: any[];
    onClose: () => void;
    onSave: () => void;
}

export const AccountForm = ({ account, accounts, currencies, branches, onClose, onSave }: AccountFormProps) => {
    const [formData, setFormData] = useState(account || {
        name: '',
        code: '',
        type: 'ASSET',
        currencyId: currencies[0]?.id,
        branchId: branches[0]?.id,
        parentId: null
    });
    const [loading, setLoading] = useState(false);

    // Type Inheritance: Automatically match parent's type when parent changes
    React.useEffect(() => {
        if (formData.parentId && formData.parentId !== 'null') {
            const parent = accounts.find(a => a.id === formData.parentId);
            if (parent && parent.type !== formData.type) {
                setFormData(prev => ({ ...prev, type: parent.type }));
            }
        }
    }, [formData.parentId, accounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                type: formData.type,
                currencyId: formData.currencyId,
                branchId: formData.branchId,
                parentId: (formData.parentId === 'null' || !formData.parentId) ? null : formData.parentId
            };

            const AUTH_HEADER = getAuthHeader();
            if (account) {
                await axios.put(`${API_BASE}/meta/accounts/${account.id}`, payload, AUTH_HEADER);
            } else {
                await axios.post(`${API_BASE}/meta/accounts`, payload, AUTH_HEADER);
            }
            onSave();
            onClose();
            toast.success(account ? 'تم تحديث الحساب بنجاح' : 'تم إضافة الحساب بنجاح', {
                description: account ? 'تم حفظ التعديلات الجديدة في قاعدة البيانات.' : 'يمكنك الآن استخدام الحساب الجديد في قيودك المحاسبية.'
            });
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحفظ', {
                description: 'يرجى مراجعة البيانات المدخلة والتأكد من عدم تكرار كود الحساب.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 text-right" dir="rtl">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">اسم الحساب الكامل</label>
                    <Input
                        required
                        placeholder="مثال: مصرف الراجحي - الحساب الجاري"
                        className="h-12 border-input bg-muted/30 text-right font-bold rounded-xl focus-visible:ring-blue-500"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">كود الحساب (فريد)</label>
                    <Input
                        required
                        placeholder="101001"
                        className="h-12 border-input font-mono bg-muted/30 text-right font-bold rounded-xl focus-visible:ring-blue-500"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">نوع الحساب</label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <SelectTrigger className="h-12 bg-muted/30 font-bold rounded-xl focus:ring-blue-500" dir="rtl">
                            <SelectValue placeholder="اختر نوع الحساب" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl font-bold">
                            <SelectItem value="ASSET">أصل (Asset)</SelectItem>
                            <SelectItem value="LIABILITY">التزام (Liability)</SelectItem>
                            <SelectItem value="EQUITY">حقوق ملكية (Equity)</SelectItem>
                            <SelectItem value="REVENUE">إيراد (Revenue)</SelectItem>
                            <SelectItem value="EXPENSE">مصروف (Expense)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">العملة الأساسية</label>
                    <Select value={formData.currencyId} onValueChange={(val) => setFormData({ ...formData, currencyId: val })}>
                        <SelectTrigger className="h-12 bg-muted/30 font-bold rounded-xl focus:ring-blue-500" dir="rtl">
                            <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl font-bold">
                            {currencies && currencies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">الفرع المحاسبي</label>
                    <Select value={formData.branchId} onValueChange={(val) => setFormData({ ...formData, branchId: val })}>
                        <SelectTrigger className="h-12 bg-muted/30 font-bold rounded-xl focus:ring-blue-500" dir="rtl">
                            <SelectValue placeholder="اختر الفرع" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl font-bold">
                            {branches && branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-black text-foreground/80 block">تبعية الحساب في الشجرة (Parent)</label>
                    <Select value={formData.parentId || 'null'} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                        <SelectTrigger className="h-12 bg-muted/30 font-bold rounded-xl focus:ring-blue-500" dir="rtl">
                            <SelectValue placeholder="اختر التبعية" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl font-bold">
                            <SelectItem value="null">-- بدون (هذا حساب مستوى أول / Parent Root) --</SelectItem>
                            {accounts && accounts.filter((a: any) => a.id !== account?.id).map((a: any) => (
                                <SelectItem key={a.id} value={a.id}>{a.code} | {a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl font-bold hover:bg-slate-50"
                >
                    إلغاء الأمر
                </Button>
                <Button
                    disabled={loading}
                    type="submit"
                    className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 size={18} className="animate-spin ml-2" /> : null}
                    {account ? 'تحديث الحساب' : 'اعتماد وحفظ الحساب'}
                </Button>
            </div>
        </form>
    );
};
