"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { APP_ICONS } from '@/lib/icons';

interface CollapsibleSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentColor?: string;
    description?: string;
}

export const CollapsibleSection = ({ 
    title, 
    icon, 
    children, 
    defaultOpen = true, 
    accentColor,
    description
}: CollapsibleSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-card/30 rounded-[2.5rem] border border-border/50 overflow-hidden transition-all duration-500 shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors text-right"
                dir="rtl"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500",
                        isOpen ? "scale-110" : "scale-100",
                        accentColor || "bg-blue-600"
                    )}>
                        {React.createElement(icon, { size: 20 })}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-foreground">{title}</h3>
                        {description && <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{description}</p>}
                    </div>
                </div>
                <div className={cn("transition-transform duration-500", isOpen ? "rotate-180" : "")}>
                    <APP_ICONS.ACTIONS.CHEVRON_DOWN size={22} className="text-muted-foreground/40" />
                </div>
            </button>
            <div className={cn(
                "transition-all duration-500 ease-in-out px-6 overflow-hidden", 
                isOpen ? "max-h-[5000px] pb-8 opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};
