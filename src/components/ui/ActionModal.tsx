"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    iconClassName?: string;
    headerClassName?: string;
    preventClose?: boolean;
    showCloseButton?: boolean;
}

export const ActionModal = ({
    isOpen,
    onClose,
    title,
    description,
    icon: Icon,
    children,
    footer,
    maxWidth = "max-w-2xl",
    iconClassName = "bg-blue-100 text-blue-600 shadow-blue-50",
    headerClassName = "bg-gradient-to-br from-slate-50 to-white",
    preventClose = false,
    showCloseButton = true,
}: ActionModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className={cn(maxWidth, "bg-card p-0 overflow-hidden border-border rounded-[2.5rem] shadow-2xl")} 
                dir="rtl"
                onInteractOutside={(e) => { if (preventClose) e.preventDefault(); }}
                showCloseButton={showCloseButton}
            >
                <DialogHeader className={cn("p-8 border-b border-border relative text-right", headerClassName)}>
                    <DialogTitle className="text-xl font-black flex items-center gap-3">
                        {Icon && (
                            <div className={cn("p-2.5 rounded-xl shadow-sm border border-white/50", iconClassName)}>
                                <Icon size={22} />
                            </div>
                        )}
                        <span className="tracking-tight">{title}</span>
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="mt-2 text-muted-foreground/80 font-medium leading-relaxed">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh]">
                    {children}
                </div>

                {footer && (
                    <div className="p-6 md:p-8 border-t border-border bg-slate-50/30 backdrop-blur-sm">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
