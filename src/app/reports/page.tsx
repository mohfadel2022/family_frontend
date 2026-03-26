"use client";

import React from 'react';
import { APP_ICONS } from '@/lib/icons';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { usePageTheme } from '@/hooks/usePageTheme';
import { REPORTS_MENU as reports } from '@/lib/nav';

const ReportCard = ({ title, description, href, icon: Icon, color, theme }: any) => (
    <Link
        href={href}
        className={cn("group bg-card p-5 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all flex items-start gap-4", theme.accent.replace('text-', 'hover:border-').replace('600', '200'))}
    >
        <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shrink-0", color)}>
            <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1">
            <h3 className={cn("text-base font-black text-foreground transition-colors", theme.accent.replace('text-', 'group-hover:text-'))}>{title}</h3>
            <p className="text-muted-foreground/80 text-xs mt-1 leading-relaxed">{description}</p>
        </div>
        <div className={cn("mt-1 text-muted-foreground/40 transform group-hover:-translate-x-1 transition-all", theme.accent.replace('text-', 'group-hover:text-').replace('600', '500'))}>
            <APP_ICONS.ACTIONS.CHEVRON_LEFT size={18} />
        </div>
    </Link>
);

const ReportsDashboard = () => {
    const theme_page = usePageTheme();

    return (
        <ProtectedRoute permission="REPORTS_VIEW">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Standard Premium Header */}
            <PageHeader
                icon={APP_ICONS.REPORTS.MAIN}
                title="التقارير المالية"
                description="Financial Intelligence & Analytics"
                iconSize={18}
            >
                <div className={cn("flex items-center gap-3 px-4 py-2 rounded-xl border", theme_page.muted, theme_page.border)}>
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", theme_page.primary)}></div>
                    <span className={cn("font-black text-[11px]", theme_page.accent.replace('text-', 'text-').replace('600', '700'))}>البيانات محدثة لحظياً</span>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {reports.map((report: any, i) => (
                    <WithPermission key={i} permission={report.permission}>
                        <ReportCard title={report.title} description={report.description} href={report.href} icon={report.icon} color={report.color} theme={theme_page} />
                    </WithPermission>
                ))}
            </div>

            {/* commented temproraly */}

            {/* <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 flex items-center gap-4">
                <IconBox icon={APP_ICONS.REPORTS.ACCOUNT_STATEMENT} className="bg-blue-500 shadow-blue-200" boxSize="w-10 h-10" iconSize={18} />
                <div className="flex-1">
                    <h4 className="font-black text-blue-900 text-sm">هل تحتاج لتقرير مخصص؟</h4>
                    <p className="text-blue-700 text-xs font-bold opacity-80 mt-0.5">يمكنك طلب تقرير مخصص من الإدارة التقنية للصندوق في أي وقت.</p>
                </div>
                <Button variant="outline" className="bg-card text-blue-600 px-5 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all text-[11px] border border-blue-200 shadow-sm h-10">
                    طلب تقرير
                </Button>
            </div> */}
        </div>
        </ProtectedRoute>
    );
};

export default ReportsDashboard;
