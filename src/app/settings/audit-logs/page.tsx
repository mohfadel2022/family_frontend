"use client";

import React, { useState } from 'react';
import {
    Shield,
    User,
    Search,
    Eye,
    Calendar,
    Lock,
    Unlock,
    FilePlus,
    Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const AuditLogPage = () => {
    const [logs] = useState([
        { id: '1', user: 'عبدالرحمن', action: 'POST', entity: 'JournalEntry', entityId: '#1004', date: '2026-02-14 15:30', details: 'ترحيل قيد المصاريف الطبية' },
        { id: '2', user: 'محمد', action: 'CREATE', entity: 'JournalEntry', entityId: '#1005', date: '2026-02-14 14:15', details: 'إنشاء مسودة قيد تبرعات' },
        { id: '3', user: 'عبدالرحمن', action: 'LOCK', entity: 'Period', entityId: 'الربع الرابع 2025', date: '2026-02-13 10:00', details: 'إغلاق الفترة المالية' },
        { id: '4', user: 'النظام', action: 'BACKUP', entity: 'System', entityId: 'Full Backup', date: '2026-02-13 03:00', details: 'نسخ احتياطي تلقائي ناجح' },
    ]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'POST': return <Send size={14} className="text-emerald-500" />;
            case 'CREATE': return <FilePlus size={14} className="text-blue-500" />;
            case 'LOCK': return <Lock size={14} className="text-rose-500" />;
            default: return <Shield size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Standard Premium Header */}
            <PageHeader
                icon={Shield}
                title="سجل العمليات"
                description="Security Audit & Activity Logs"
                iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
            >
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        type="text"
                        placeholder="بحث في السجلات..."
                        className="pr-10 pl-4 py-2 bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500 w-56 text-xs font-bold h-10"
                    />
                </div>
            </PageHeader>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <Table className="w-full text-right" dir="rtl">
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-slate-50/50 border-none">
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">المستخدم</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">العملية</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">الهدف</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">التاريخ والوقت</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">التفاصيل</TableHead>
                            <TableHead className="py-3 px-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group border-b-slate-50">
                                <TableCell className="py-3 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <User size={14} />
                                        </div>
                                        <span className="font-bold text-slate-800 text-xs">{log.user}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6">
                                    <div className="flex items-center gap-2">
                                        {getActionIcon(log.action)}
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{log.action}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase">
                                        {log.entity}: {log.entityId}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3 px-6 text-slate-500 text-[11px] font-mono">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        <span>{log.date}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6 text-slate-600 text-xs max-w-xs truncate font-medium">
                                    {log.details}
                                </TableCell>
                                <TableCell className="py-3 px-6 text-left">
                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-300 hover:text-blue-600 hover:bg-transparent transition-colors p-0 rounded-full">
                                        <Eye size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-emerald-800 text-[11px] font-black opacity-80">
                    يتم حفظ كافة السجلات بشكل مشفر ولا يمكن حذفها حتى من قبل المشرفين (Immutable Logs).
                </p>
            </div>
        </div>
    );
};

export default AuditLogPage;
