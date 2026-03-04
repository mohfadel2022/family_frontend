"use client";

import React from 'react';
import {
    FilePieChart,
    Table,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    ChevronLeft,
    Globe,
    LayoutDashboard,
    PieChart,
    History,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';

const ReportCard = ({ title, description, href, icon: Icon, color }: any) => (
    <Link
        href={href}
        className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all flex items-start gap-4"
    >
        <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shrink-0", color)}>
            <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1">
            <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="mt-1 text-slate-300 group-hover:text-blue-500 transform group-hover:-translate-x-1 transition-all">
            <ChevronLeft size={18} />
        </div>
    </Link>
);

const ReportsDashboard = () => {
    const reports = [
        {
            title: 'ميزان المراجعة',
            description: 'عرض أرصدة جميع الحسابات المدينة والدائنة لضمان توازن النظام.',
            href: '/reports/trial-balance',
            icon: Table,
            color: 'bg-indigo-600'
        },
        {
            title: 'قائمة الدخل',
            description: 'تقرير الأرباح والخسائر الذي يوضح صافي الفائض أو العجز.',
            href: '/reports/income-statement',
            icon: FilePieChart,
            color: 'bg-emerald-600'
        },
        {
            title: 'كشف حساب تفصيلي',
            description: 'استعراض جميع الحركات التي تمت على حساب معين خلال فترة.',
            icon: FileText,
            href: '/reports/account-statement',
            color: 'bg-blue-600'
        },
        {
            title: 'إيرادات الجهات',
            description: 'تحليل مقارن للإيرادات المسجلة لكل فرع من فروع العائلة.',
            href: '/reports/branch-revenue',
            icon: ArrowUpRight,
            color: 'bg-amber-600'
        },
        {
            title: 'فروقات العملة',
            description: 'تحليل الأرباح والخسائر الناتجة عن تذبذب أسعار صرف العملات.',
            href: '/reports/currency-gains',
            icon: Globe,
            color: 'bg-emerald-500'
        },
        {
            title: 'مصاريف الجهات',
            description: 'تتبع إنفاق كل فرع وتوزيع المصاريف الخيرية والإدارية.',
            href: '/reports/branch-expense',
            icon: ArrowDownRight,
            color: 'bg-rose-600'
        },
        {
            title: 'سجل العملات',
            description: 'تقرير تاريخي يوضح جميع التغيرات في أسعار صرف العملات الأجنبية.',
            href: '/reports/currency-history',
            icon: History,
            color: 'bg-indigo-500'
        },
        {
            title: 'جدول الاشتراكات (Pivot)',
            description: 'تقرير شامل يوضح حالة تسديد الاشتراكات لجميع الأعضاء عبر السنوات.',
            href: '/reports/subscriptions',
            icon: TrendingUp,
            color: 'bg-blue-600'
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Standard Premium Header */}
            <PageHeader
                icon={PieChart}
                title="التقارير المالية"
                description="Financial Intelligence & Analytics"
                iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
                iconSize={18}
            >
                <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-700 font-black text-[11px]">البيانات محدثة لحظياً</span>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {reports.map((report, i) => (
                    <ReportCard key={i} {...report} />
                ))}
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 flex items-center gap-4">
                <IconBox icon={FileText} className="bg-blue-500 shadow-blue-200" boxSize="w-10 h-10" iconSize={18} />
                <div className="flex-1">
                    <h4 className="font-black text-blue-900 text-sm">هل تحتاج لتقرير مخصص؟</h4>
                    <p className="text-blue-700 text-xs font-bold opacity-80 mt-0.5">يمكنك طلب تقرير مخصص من الإدارة التقنية للصندوق في أي وقت.</p>
                </div>
                <Button variant="outline" className="bg-white text-blue-600 px-5 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all text-[11px] border border-blue-200 shadow-sm h-10">
                    طلب تقرير
                </Button>
            </div>
        </div>
    );
};

export default ReportsDashboard;
