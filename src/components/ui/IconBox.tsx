import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconBoxProps {
    icon: LucideIcon;
    className?: string;
    iconSize?: number;
    boxSize?: string;
}

export const IconBox = ({
    icon: Icon,
    className,
    iconSize = 22,
    boxSize = "w-12 h-12"
}: IconBoxProps) => {
    return (
        <div className={cn(
            boxSize,
            "rounded-2xl flex items-center justify-center text-white shadow-lg",
            className
        )}>
            <Icon size={iconSize} />
        </div>
    );
};
