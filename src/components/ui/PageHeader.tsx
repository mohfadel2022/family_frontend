import React, { ReactNode } from 'react';
import { IconBox } from './IconBox';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';

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
    const theme = usePageTheme();

    if (variant === 'simple') {
        return (
            <div className={cn("flex flex-col md:flex-row items-center justify-between gap-6", className)}>
                <div className="flex items-center gap-4">
                    <IconBox icon={icon} className={iconClassName} iconSize={iconSize} />
                    <div>
                        <h2 className="text-base font-black text-foreground tracking-tight leading-tight">{title}</h2>
                        <p className="text-muted-foreground font-bold mt-0.5 uppercase tracking-tight text-[9px] opacity-80">{description}</p>
                    </div>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-card/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-border/50 dark:border-white/10 shadow-2xl flex justify-between",
            theme.shadow,
            className
        )}>
            <div className="flex items-center gap-5">
                <IconBox 
                    icon={icon} 
                    className={cn(
                        "shadow-xl", 
                        theme.shadow, 
                        !iconClassName?.includes('bg-') && theme.gradient,
                        iconClassName
                    )} 
                    iconSize={iconSize} 
                />
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black text-foreground tracking-tight leading-tight">{title}</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-tight text-[10px] opacity-80">{description}</p>
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
