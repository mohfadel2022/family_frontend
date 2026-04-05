'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { APP_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from "@/components/ui/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usePageTheme } from "@/hooks/usePageTheme";
import { Badge } from "@/components/ui/badge";
import VoucherQuickEditModal from "@/components/vouchers/VoucherQuickEditModal";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const VouchersMissingCCPage = () => {
    const theme = usePageTheme();
    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMeta = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/cost-centers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCostCenters(res.data.filter((cc: any) => cc.parentId !== null));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/cost-centers/reports/vouchers-missing-cost-centers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل تقرير النواقص');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeta();
        fetchReport();
    }, []);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => (
                <div className="font-bold text-xs">{new Date(row.original.date).toLocaleDateString('ar-AR')}</div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'النوع',
            cell: ({ row }) => {
                const type = row.original.type;
                const config: any = {
                    GENERAL: { label: 'قيد يومية', color: 'bg-indigo-100 text-indigo-700' },
                    RECEIPT: { label: 'سند قبض', color: 'bg-emerald-100 text-emerald-700' },
                    PAYMENT: { label: 'سند صرف', color: 'bg-rose-100 text-rose-700' }
                };
                return (
                    <Badge className={cn("rounded-lg font-black text-[9px] uppercase border-none", config[type]?.color || "bg-slate-100")}>
                        {config[type]?.label || type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'entryNumber',
            header: 'رقم القيد',
            cell: ({ row }) => (
                <Badge variant="outline" className={cn("rounded-lg font-black text-[10px]", theme.accent)}>
                    {row.original.entryNumber}
                </Badge>
            ),
        },
        {
            accessorKey: 'branch.name',
            header: 'الفرع',
            cell: ({ row }) => <div className="text-xs font-bold text-muted-foreground">{row.original.branch.name}</div>,
        },
        {
            accessorKey: 'description',
            header: 'البيان',
            cell: ({ row }) => <div className="text-xs font-medium line-clamp-1 max-w-[300px]">{row.original.description}</div>,
        },
        {
            id: 'currency',
            header: 'العملة',
            cell: ({ row }) => {
                const currencies = Array.from(new Set(row.original.lines.map((l: any) => l.currency?.code).filter(Boolean)));
                return (
                    <div className="flex gap-1 justify-center">
                        {currencies.length > 0 ? currencies.map((c: any) => (
                            <Badge key={c} className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-muted/60 text-muted-foreground tracking-widest shadow-none border-none">
                                {c}
                            </Badge>
                        )) : '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'totalAmount',
            header: 'المبلغ الإجمالي',
            cell: ({ row }) => (
                <div className="font-black text-xs text-right tabular-nums">
                    {Number(row.original.totalAmount).toLocaleString()}
                </div>
            ),
        },
        {
            id: 'missingCount',
            header: 'الأسطر الناقصة',
            cell: ({ row }) => {
                const missing = row.original.lines.filter((l: any) => 
                    l.account.code.match(/^[45]/) && (!l.costCenters || l.costCenters.length === 0)
                ).length;
                return (
                    <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-200 border-none rounded-full font-black text-[10px] px-3">
                        {missing} أسطر
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const isLinked = !!row.original.subscriptionCollection;
                
                return (
                    <div className="flex justify-end gap-2 pr-4">
                        {isLinked && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/subscriptions/collect?id=${row.original.subscriptionCollection.id}`);
                                }}
                                className="h-8 gap-2 rounded-xl font-bold text-[10px] hover:scale-105 transition-all text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="الانتقال لبيانات التحصيل"
                            >
                                <APP_ICONS.MODULES.COLLECT size={14} />
                                عرض التحصيل
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setSelectedVoucher(row.original);
                                setIsModalOpen(true);
                            }}
                            className={cn("h-8 gap-2 rounded-xl font-bold text-[10px] hover:scale-105 transition-all text-indigo-600")}
                        >
                            <APP_ICONS.ACTIONS.EDIT size={14} />
                            مراجعة وتعديل
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <ProtectedRoute permission="REPORTS_VIEW">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                <PageHeader
                    icon={APP_ICONS.STATE.WARNING}
                    title="القيود الناقصة لتوزيع التكلفة"
                    description="استعرض وعالج كافة القيود التي تحتوي على حسابات إيرادات ومصروفات لم يتم تعيين مراكز تكلفة لها بعد"
                >
                    <Button
                        onClick={fetchReport}
                        variant="ghost"
                        className="rounded-2xl hover:bg-slate-100 text-muted-foreground uppercase text-[10px] font-black h-12 px-6"
                    >
                        <APP_ICONS.ACTIONS.REFRESH size={20} className={cn("ml-2", loading && "animate-spin")} />
                        تحديث البيانات
                    </Button>
                </PageHeader>

                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white/40 backdrop-blur-xl">
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={data}
                            loading={loading}
                            compact={true}
                            searchPlaceholder="البحث في القيود المحاسبية..."
                            noDataMessage={
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center shadow-inner">
                                        <APP_ICONS.ACTIONS.CHECK size={40} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">عمل رائع! كافة القيود مكتملة</h3>
                                    <p className="text-muted-foreground/60 font-bold max-w-xs text-center">لا توجد أي قيود حالياً تحتاج لتوزيع مراكز التكلفة على حسابات الإيرادات والمصروفات.</p>
                                </div>
                            }
                        />
                    </CardContent>
                </Card>

                <VoucherQuickEditModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    voucher={selectedVoucher}
                    costCenters={costCenters}
                    onSaveSuccess={fetchReport}
                    theme={theme}
                />
            </div>
        </ProtectedRoute>
    );
};

export default VouchersMissingCCPage;
