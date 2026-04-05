"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { ActionModal } from '@/components/ui/ActionModal';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';

interface LineCostCenterModalProps {
    lineId: string;
    // Changed from string[] to distribution objects
    currentDistributions: { costCenterId: string, percentage: number }[];
    costCenters: any[];
    onSave: (distributions: { costCenterId: string, percentage: number }[]) => void;
    onClose: () => void;
}

export const LineCostCenterModal = ({ 
    lineId, 
    currentDistributions, 
    costCenters, 
    onSave, 
    onClose 
}: LineCostCenterModalProps) => {
    const theme = usePageTheme();
    
    // We store the full info needed for the list
    const [distributions, setDistributions] = useState<any[]>(() => {
        return currentDistributions.map(d => {
            const cc = costCenters.find(c => c.id === d.costCenterId);
            return {
                costCenterId: d.costCenterId,
                percentage: Number(d.percentage),
                name: cc?.name || 'Unknown',
                code: cc?.code || ''
            };
        });
    });

    const [search, setSearch] = useState('');

    const filtered = costCenters.filter(cc => 
        (cc.name.toLowerCase().includes(search.toLowerCase()) || 
        cc.code.toLowerCase().includes(search.toLowerCase())) &&
        !distributions.some(d => d.costCenterId === cc.id) // Hide already selected
    );

    const toggleId = (cc: any) => {
        if (distributions.some(d => d.costCenterId === cc.id)) {
            setDistributions(distributions.filter(d => d.costCenterId !== cc.id));
        } else {
            // Default percentage is the remaining amount to reach 100
            const currentTotal = distributions.reduce((sum, d) => sum + d.percentage, 0);
            const remaining = Math.max(0, 100 - currentTotal);
            
            setDistributions([...distributions, {
                costCenterId: cc.id,
                percentage: remaining,
                name: cc.name,
                code: cc.code
            }]);
        }
    };

    const updatePercentage = (id: string, value: string) => {
        const num = parseFloat(value) || 0;
        setDistributions(distributions.map(d => 
            d.costCenterId === id ? { ...d, percentage: num } : d
        ));
    };

    const totalPercentage = distributions.reduce((sum, d) => sum + d.percentage, 0);
    const isBalanced = Math.abs(totalPercentage - 100) < 0.01;

    const equalizeDistributions = () => {
        if (distributions.length === 0) return;
        const even = Math.floor((100 / distributions.length) * 100) / 100;
        const lastEven = 100 - (even * (distributions.length - 1));
        
        setDistributions(distributions.map((d, idx) => ({
            ...d,
            percentage: idx === distributions.length - 1 ? lastEven : even
        })));
    };

    const handleSave = () => {
        if (!isBalanced) {
            toast.error("مجموع النسب يجب أن يساوي 100%");
            return;
        }
        
        // Return only the DTO structure
        onSave(distributions.map(d => ({
            costCenterId: d.costCenterId,
            percentage: d.percentage
        })));
        onClose();
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title="توزيع الحساب على مراكز التكلفة"
            description="يمكنك تقسيم القيد على عدة مراكز بنسب مئوية محددة"
            icon={APP_ICONS.NAV.COST_CENTERS}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6 pt-4">
                {/* Search & Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-1">إضافة مركز تكلفة</label>
                    <div className="relative">
                        <APP_ICONS.ACTIONS.SEARCH className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                        <Input
                            placeholder="ابحث واختر مركزاً..."
                            className="pr-10 h-10 rounded-xl bg-muted/20 border-border focus:ring-1"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                        {filtered.length > 0 ? (
                            filtered.map(cc => (
                                <button
                                    key={cc.id}
                                    onClick={() => toggleId(cc)}
                                    className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-[11px] font-bold flex items-center gap-2 group"
                                >
                                    <span className="opacity-40 group-hover:opacity-100">{cc.code}</span>
                                    <span>{cc.name}</span>
                                    <APP_ICONS.ACTIONS.ADD size={12} className="opacity-0 group-hover:opacity-100 text-primary" />
                                </button>
                            ))
                        ) : (
                            search && <div className="text-[10px] opacity-40 italic w-full text-center py-2">لا توجد نتائج مطابقة</div>
                        )}
                    </div>
                </div>

                {/* Distribution List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">التوزيع الحالي</label>
                        {distributions.length > 1 && (
                            <button 
                                onClick={equalizeDistributions}
                                className="text-[9px] font-black text-primary hover:underline transition-all flex items-center gap-1"
                            >
                                <APP_ICONS.ACTIONS.REFRESH size={10} />
                                توزيع بالتساوي
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                        {distributions.map((d) => (
                            <div key={d.costCenterId} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{d.name}</p>
                                    <p className="text-[9px] font-mono opacity-40">{d.code}</p>
                                </div>
                                <div className="flex items-center gap-2 w-32">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="h-9 rounded-xl text-center font-black text-xs"
                                        value={d.percentage}
                                        onChange={e => updatePercentage(d.costCenterId, e.target.value)}
                                    />
                                    <span className="text-xs font-black opacity-30">%</span>
                                </div>
                                <button 
                                    onClick={() => toggleId({id: d.costCenterId})}
                                    className="p-2 hover:bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                >
                                    <APP_ICONS.ACTIONS.DELETE size={14} />
                                </button>
                            </div>
                        ))}

                        {distributions.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                <APP_ICONS.NAV.COST_CENTERS size={32} className="mb-2" />
                                <p className="text-xs font-bold italic">يرجى اختيار مركز تكلفة واحد على الأقل</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Bar */}
                <div className={cn(
                    "p-4 rounded-2xl flex items-center justify-between transition-all border",
                    isBalanced ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
                            isBalanced ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                            {isBalanced ? <APP_ICONS.ACTIONS.CHECK size={16} /> : <APP_ICONS.ACTIONS.DELETE size={16} />}
                        </div>
                        <div>
                            <p className="text-xs font-black">إجمالي التوزيع</p>
                            <p className={cn("text-sm font-black", isBalanced ? "text-emerald-700" : "text-rose-700")}>
                                {totalPercentage.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                    {!isBalanced && (
                        <div className="text-right">
                            <p className="text-[10px] font-black opacity-40 uppercase">المتبقي / الزائد</p>
                            <p className="text-xs font-black text-rose-600">
                                {(100 - totalPercentage).toFixed(2)}%
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                    <CustomButton
                        onClick={handleSave}
                        disabled={!isBalanced || distributions.length === 0}
                        className={cn("flex-1 h-12 shadow-lg", theme.accent)}
                        icon={APP_ICONS.ACTIONS.CHECK}
                    >
                        حفظ التوزيع
                    </CustomButton>
                    <CustomButton
                        variant="ghost"
                        onClick={onClose}
                        className="px-6 h-12 text-muted-foreground"
                    >
                        إلغاء
                    </CustomButton>
                </div>
            </div>
        </ActionModal>
    );
};
