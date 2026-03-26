"use client";

import React from 'react';
import { ActionModal } from '@/components/ui/ActionModal';
import { Button } from '@/components/ui/button';
import { APP_ICONS } from '@/lib/icons';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 'danger' = rose/red, 'warning' = amber, 'info' = blue */
    variant?: 'danger' | 'warning' | 'info' | 'success' | 'destructive' | 'default';
    icon?: LucideIcon;
    loading?: boolean;
}

const variantStyles = {
    danger: {
        header: 'from-rose-50/50',
        iconBg: 'bg-rose-100 text-rose-600 border-rose-200 shadow-rose-50',
        body: 'bg-rose-50/50 border-rose-100 text-rose-700',
        btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    },
    destructive: { // Alias for danger
        header: 'from-rose-50/50',
        iconBg: 'bg-rose-100 text-rose-600 border-rose-200 shadow-rose-50',
        body: 'bg-rose-50/50 border-rose-100 text-rose-700',
        btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    },
    warning: {
        header: 'from-amber-50/50',
        iconBg: 'bg-amber-100 text-amber-600 border-amber-200 shadow-amber-50',
        body: 'bg-amber-50/50 border-amber-100 text-amber-700',
        btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    },
    info: {
        header: 'from-blue-50/50',
        iconBg: 'bg-blue-100 text-blue-600 border-blue-200 shadow-blue-50',
        body: 'bg-blue-50/50 border-blue-100 text-blue-700',
        btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    },
    default: { // Alias for info
        header: 'from-blue-50/50',
        iconBg: 'bg-blue-100 text-blue-600 border-blue-200 shadow-blue-50',
        body: 'bg-blue-50/50 border-blue-100 text-blue-700',
        btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    },
    success: {
        header: 'from-emerald-50/50',
        iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-emerald-50',
        body: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
        btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    },
};

export const ConfirmModal = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    variant = 'danger',
    icon: Icon = APP_ICONS.STATE.WARNING,
    loading = false,
}: ConfirmModalProps) => {
    const s = variantStyles[variant as keyof typeof variantStyles] || variantStyles.danger;

    return (
        <ActionModal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={title}
            description={description}
            icon={Icon}
            iconClassName={s.iconBg}
            headerClassName={cn("bg-gradient-to-br to-white", s.header)}
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 h-12 rounded-xl border-input font-bold text-muted-foreground/80 hover:bg-muted/50 transition-all shadow-sm"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            'flex-[2] h-12 rounded-xl text-white font-black transition-all shadow-lg font-bold active:scale-95',
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
            }
        >
            <div className={cn(
                'p-5 rounded-2xl border text-sm font-semibold leading-relaxed text-right animate-in fade-in slide-in-from-top-2 duration-300',
                s.body
            )}>
                يرجى التأكد من رغبتك في تنفيذ هذا الإجراء، حيث قد لا يمكن التراجع عنه في بعض الحالات.
            </div>
        </ActionModal>
    );
};
