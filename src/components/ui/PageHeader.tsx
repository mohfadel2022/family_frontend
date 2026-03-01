import React, { ReactNode } from 'react';
import { IconBox } from './IconBox';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    icon: any;
    title: string | ReactNode;
    description: string;
    iconClassName?: string;
    iconSize?: number;
    children?: ReactNode;
    className?: string;
    variant?: 'default' | 'simple';
}

export const PageHeader = ({
    icon,
    title,
    description,
    iconClassName,
    iconSize = 22,
    children,
    className,
    variant = 'default'
}: PageHeaderProps) => {
    if (variant === 'simple') {
        return (
            <div className={cn("flex items-center justify-between gap-6", className)}>
                <div className="flex items-center gap-4">
                    <IconBox icon={icon} className={iconClassName} iconSize={iconSize} />
                    <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">{title}</h2>
                        <p className="text-slate-500 font-bold mt-0.5 uppercase tracking-tight text-[9px] opacity-80">{description}</p>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6",
            className
        )}>
            <div className="flex items-center gap-5">
                <IconBox icon={icon} className={cn("shadow-xl shadow-blue-500/10", iconClassName)} iconSize={iconSize} />
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-tight text-[10px] opacity-80">{description}</p>
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
};
