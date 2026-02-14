import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconBox } from './IconBox';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    iconClassName?: string;
    iconSize?: number;
}

export const PageHeader = ({
    icon,
    title,
    description,
    iconClassName,
    iconSize = 22
}: PageHeaderProps) => {
    return (
        <div className="flex items-center gap-5">
            <IconBox icon={icon} className={iconClassName} iconSize={iconSize} />
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
                <p className="text-slate-500 font-bold mt-0.5 uppercase tracking-tight text-[10px] opacity-80">{description}</p>
            </div>
        </div>
    );
};
