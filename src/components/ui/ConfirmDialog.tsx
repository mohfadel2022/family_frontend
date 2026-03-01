"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, RotateCcw, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 'danger' = rose/red, 'warning' = amber, 'info' = blue */
    variant?: 'danger' | 'warning' | 'info';
    icon?: LucideIcon;
    loading?: boolean;
}

const variantStyles = {
    danger: {
        header: 'from-rose-50',
        iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
        title: 'text-rose-700',
        body: 'bg-rose-50 border-rose-100 text-rose-700',
        btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
        badge: 'bg-rose-100 text-rose-500',
    },
    warning: {
        header: 'from-amber-50',
        iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
        title: 'text-amber-700',
        body: 'bg-amber-50 border-amber-100 text-amber-700',
        btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
        badge: 'bg-amber-100 text-amber-500',
    },
    info: {
        header: 'from-blue-50',
        iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
        title: 'text-blue-700',
        body: 'bg-blue-50 border-blue-100 text-blue-700',
        btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        badge: 'bg-blue-100 text-blue-500',
    },
};

export const ConfirmDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    variant = 'danger',
    icon: Icon = AlertTriangle,
    loading = false,
}: ConfirmDialogProps) => {
    const s = variantStyles[variant];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md bg-white p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl"
                dir="rtl"
            >
                {/* Header */}
                <DialogHeader
                    className={cn(
                        'p-7 bg-gradient-to-br to-white border-b border-slate-100',
                        s.header,
                        'flex flex-row justify-between items-center text-right space-y-0'
                    )}
                >
                    <DialogTitle className={cn('text-xl font-black', s.title)}>
                        {title}
                    </DialogTitle>
                    <div className={cn('p-3 rounded-2xl border', s.iconBg)}>
                        <Icon size={20} />
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="p-7 space-y-5">
                    <p className={cn(
                        'p-4 rounded-2xl border text-sm font-semibold leading-relaxed',
                        s.body
                    )}>
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="flex-1 h-12 rounded-xl border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={cn(
                                'flex-[2] h-12 rounded-xl text-white font-black transition-all shadow-lg',
                                s.btn
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    جاري التنفيذ...
                                </span>
                            ) : confirmLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
