"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const API_BASE = 'http://localhost:4000/api';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

export const AccountModal = ({ account, accounts, currencies, branches, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(account || {
        name: '',
        code: '',
        type: 'ASSET',
        currencyId: currencies[0]?.id,
        branchId: branches[0]?.id,
        parentId: null
    });
    const [loading, setLoading] = useState(false);

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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl h-full bg-white p-0 overflow-hidden border-slate-100 rounded-sm" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 relative text-right">
                    <DialogTitle className="text-xl font-black flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                            <FileText size={22} />
                        </div>
                        {account ? 'تعديل بيانات الحساب' : 'إضافة حساب مالي'}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-slate-500 font-medium">
                        يرجى ملء تفاصيل الحساب المالي بدقة.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[100vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 text-right">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-black text-slate-700 block">اسم الحساب الكامل</label>
                            <Input
                                required
                                placeholder="مثال: مصرف الراجحي - الحساب الجاري"
                                className="h-12 border-slate-200 bg-slate-50/50 text-right"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 block">كود الحساب (فريد)</label>
                            <Input
                                required
                                placeholder="101001"
                                className="h-12 border-slate-200 font-mono bg-slate-50/50 text-right"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 block">نوع الحساب</label>
                            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                <SelectTrigger className="h-12 bg-slate-50/50" dir="rtl">
                                    <SelectValue placeholder="اختر نوع الحساب" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="ASSET">أصل (Asset)</SelectItem>
                                    <SelectItem value="LIABILITY">التزام (Liability)</SelectItem>
                                    <SelectItem value="EQUITY">حقوق ملكية (Equity)</SelectItem>
                                    <SelectItem value="REVENUE">إيراد (Revenue)</SelectItem>
                                    <SelectItem value="EXPENSE">مصروف (Expense)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 block">العملة الأساسية</label>
                            <Select value={formData.currencyId} onValueChange={(val) => setFormData({ ...formData, currencyId: val })}>
                                <SelectTrigger className="h-12 bg-slate-50/50" dir="rtl">
                                    <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    {currencies && currencies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 block">الفرع المحاسبي</label>
                            <Select value={formData.branchId} onValueChange={(val) => setFormData({ ...formData, branchId: val })}>
                                <SelectTrigger className="h-12 bg-slate-50/50" dir="rtl">
                                    <SelectValue placeholder="اختر الفرع" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    {branches && branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-black text-slate-700 block">تبعية الحساب في الشجرة (Parent)</label>
                            <Select value={formData.parentId || 'null'} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                                <SelectTrigger className="h-12 bg-slate-50/50" dir="rtl">
                                    <SelectValue placeholder="اختر التبعية" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="null">-- بدون (هذا حساب مستوى أول / Parent Root) --</SelectItem>
                                    {accounts && accounts.filter((a: any) => a.id !== account?.id).map((a: any) => (
                                        <SelectItem key={a.id} value={a.id}>{a.code} | {a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl"
                        >
                            إلغاء الأمر
                        </Button>
                        <Button
                            disabled={loading}
                            type="submit"
                            className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin ml-2" /> : null}
                            {account ? 'تحديث الحساب' : 'اعتماد وحفظ الحساب'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
