'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { APP_ICONS } from "@/lib/icons";
import axios from 'axios';
import { toast } from 'sonner';
import {LineCostCenterModal} from './LineCostCenterModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface VoucherQuickEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voucher: any;
    costCenters: any[];
    onSaveSuccess: () => void;
    theme: any;
}

const VoucherQuickEditModal: React.FC<VoucherQuickEditModalProps> = ({ open, onOpenChange, voucher, costCenters, onSaveSuccess, theme }) => {
    const [lines, setLines] = useState<any[]>(voucher?.lines || []);
    const [activeLineForCc, setActiveLineForCc] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (voucher) {
            setLines(voucher.lines.map((l: any) => ({
                ...l,
                tempId: l.id
            })));
        }
    }, [voucher]);

    const handleSaveCc = (dist: any[]) => {
        if (!activeLineForCc) return;
        setLines(prev => prev.map(l => l.tempId === activeLineForCc ? { ...l, costCenters: dist } : l));
        setActiveLineForCc(null);
    };

    const handlePermanentSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                distributions: lines.map(l => ({
                    lineId: l.id,
                    costCenters: (l.costCenters || []).map((cc: any) => ({
                        costCenterId: cc.costCenterId,
                        percentage: cc.percentage
                    }))
                }))
            };

            await axios.patch(`${API_BASE}/cost-centers/vouchers/${voucher.id}/distributions`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('تم تحديث توزيعات مراكز التكلفة بنجاح');
            onSaveSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'فشل في حفظ التغييرات');
        } finally {
            setIsSaving(false);
        }
    };

    if (!voucher) return null;

    const activeLine = lines.find(l => l.tempId === activeLineForCc);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className={cn("p-6 text-white", theme.primary)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <APP_ICONS.MODULES.JOURNAL size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black">مراجعة وتعديل القيد</DialogTitle>
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                        رقم القيد: {voucher.entryNumber} | التاريخ: {new Date(voucher.date).toLocaleDateString('ar-AR')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-black opacity-60 uppercase block">الإجمالي</span>
                                <span className="text-xl font-black">{Number(voucher.totalAmount).toLocaleString()} {voucher.lines[0]?.currency?.code}</span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                            <Table dir="rtl">
                                <TableHeader className="bg-slate-100/50">
                                    <TableRow>
                                        <TableHead className="text-right font-black text-[10px]">الحساب</TableHead>
                                        <TableHead className="text-center font-black text-[10px]">مدين</TableHead>
                                        <TableHead className="text-center font-black text-[10px]">دائن</TableHead>
                                        <TableHead className="text-center font-black text-[10px]">مركز التكلفة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line) => {
                                        const isMissingCc = line.account.code.match(/^[45]/) && (!line.costCenters || line.costCenters.length === 0);
                                        return (
                                            <TableRow key={line.tempId} className="group hover:bg-slate-50 transition-colors">
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs">{line.account.name}</span>
                                                        <span className="text-[9px] text-muted-foreground font-mono">{line.account.code}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-xs">{Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-center font-mono font-bold text-xs">{Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-center">
                                                    {(line.costCenters && line.costCenters.length > 0) ? (
                                                        <button
                                                            onClick={() => setActiveLineForCc(line.tempId)}
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-[9px] font-black uppercase tracking-wider",
                                                                theme.accent, "bg-primary/5 border-primary/20 hover:scale-105"
                                                            )}
                                                        >
                                                            <APP_ICONS.NAV.COST_CENTERS size={10} />
                                                            {line.costCenters.length === 1 
                                                                ? (line.costCenters[0].costCenter?.name || 'مركز')
                                                                : `${line.costCenters.length} مراكز (${line.costCenters.reduce((sum: number, c: any) => sum + Number(c.percentage), 0)}%)`}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setActiveLineForCc(line.tempId)}
                                                            className={cn(
                                                                "h-8 px-4 flex items-center justify-center rounded-full border border-dashed transition-all text-[9px] font-bold mx-auto",
                                                                isMissingCc 
                                                                    ? "border-amber-400 bg-amber-50 text-amber-600 animate-pulse hover:border-amber-600"
                                                                    : "border-slate-200 text-slate-400 hover:border-primary hover:text-primary"
                                                            )}
                                                        >
                                                            {isMissingCc ? (
                                                                <div className="flex items-center gap-1.5 capitalize">
                                                                    <APP_ICONS.STATE.WARNING size={10} />
                                                                    تعيين مركز تكلفة
                                                                </div>
                                                            ) : (
                                                                <APP_ICONS.ACTIONS.ADD size={12} />
                                                            )}
                                                        </button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-border flex items-center justify-between">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6">إلغاء</Button>
                        <Button 
                            onClick={handlePermanentSave} 
                            disabled={isSaving}
                            className={cn("rounded-xl px-8 font-black transition-all shadow-lg", theme.primary)}
                        >
                            {isSaving ? <APP_ICONS.STATE.LOADING className="animate-spin" /> : 'حفظ التوزيعات'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reuse existing distribution modal */}
            {activeLine && (
                <LineCostCenterModal
                    lineId={activeLine.tempId}
                    currentDistributions={activeLine.costCenters || []}
                    costCenters={costCenters}
                    onSave={handleSaveCc}
                    onClose={() => setActiveLineForCc(null)}
                />
            )}
        </>
    );
};

export default VoucherQuickEditModal;
