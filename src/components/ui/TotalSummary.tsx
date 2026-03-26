import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconBox } from './IconBox';
import { cn } from '@/lib/utils';

interface TotalSummaryProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    amount: number | string;
    amountLabel: string;
    accentColorClassName?: string; // e.g., "text-amber-500" or "text-rose-500"
    borderColorClassName?: string; // e.g., "border-amber-500/10"
    shadowColorClassName?: string; // e.g., "shadow-amber-900/10"
    iconClassName?: string;
}

export const TotalSummary = ({
    icon,
    title,
    subtitle,
    amount,
    amountLabel,
    accentColorClassName = "text-amber-500",
    borderColorClassName = "border-amber-500/10",
    shadowColorClassName = "shadow-amber-900/10",
    iconClassName = "bg-amber-500 shadow-amber-500/20"
}: TotalSummaryProps) => {
    return (
        <div className={cn(
            "bg-slate-900 py-4 px-6 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border",
            shadowColorClassName,
            borderColorClassName
        )}>
            <div className="flex items-center gap-4">
                <IconBox
                    icon={icon}
                    className={iconClassName}
                    boxSize="w-10 h-10"
                    iconSize={20}
                />
                <div>
                    <h2 className="text-ml font-black">{title}</h2>
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-widest mt-1">{subtitle}</p>
                </div>
            </div>
            <div className="text-center md:text-left">
                <h2 className={cn("text-2xl font-black font-mono leading-none", accentColorClassName)}>
                    {typeof amount === 'number' ? amount.toLocaleString() : amount}
                </h2>
                <p className="text-muted-foreground/80 font-bold uppercase text-[10px] mt-1 tracking-widest leading-none">
                    {amountLabel}
                </p>
            </div>
        </div>
    );
};
