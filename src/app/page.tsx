"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Briefcase,
  History as HistoryIcon,
  Activity,
  LayoutDashboard,
  Loader2,
  Receipt,
  Coins,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBox } from '@/components/ui/IconBox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

import { API_BASE as API_URL, getAuthHeader } from '@/lib/api';

const API_BASE = API_URL;
const AUTH_HEADER = getAuthHeader();

// ─── Multi-Currency Card ────────────────────────────────────────────────
const CurrencyCard = ({
  title,
  subtitle,
  icon: Icon,
  color,
  gradientFrom,
  gradientTo,
  items,
  totalBase,
  baseCurrencyCode = 'SAR',
  loading,
  emptyText
}: any) => (
  <Card className="relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 border-slate-100/80 rounded-3xl bg-white">
    {loading && (
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    )}

    {/* Decorative background */}
    <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] transition-transform duration-700 group-hover:scale-[2]", `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)}></div>
    <div className={cn("absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.04]", `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)}></div>

    <CardContent className="p-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <IconBox icon={Icon} className={cn("shadow-lg", color)} boxSize="w-11 h-11" iconSize={20} />
          <div>
            <h3 className="font-black text-slate-800 text-sm">{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Currency Items */}
      <div className="space-y-3">
        {items && items.length > 0 ? items.map((item: any, i: number) => (
          <div
            key={item.code}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-all group/item border border-transparent hover:border-slate-200/50"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase tracking-tighter shadow-sm transition-transform group-hover/item:scale-110",
                color, "text-white"
              )}>
                {item.code}
              </div>
              <span className="text-xs font-bold text-slate-500">{item.symbol || item.code}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-slate-900 text-base tabular-nums">
                {Math.abs(item.balance ?? item.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{item.symbol || item.code}</span>
            </div>
          </div>
        )) : (
          <div className="text-center py-6 text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            {emptyText || 'لا توجد بيانات'}
          </div>
        )}
      </div>


    </CardContent>
  </Card>
);

// ─── Dashboard Component ────────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleNavigate = (entry: any) => {
    let path = '/vouchers/journal';
    if (entry.type === 'RECEIPT') path = '/vouchers/receipts';
    if (entry.type === 'PAYMENT') path = '/vouchers/payments';
    router.push(`${path}?id=${entry.id}`);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard`, AUTH_HEADER);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        toast.error('فشل تحميل بيانات اللوحة');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="نظرة عامة"
        description="مرحباً بك مجدداً، إليك ملخص الوضع المالي للصندوق"
        iconClassName="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200"
        iconSize={24}
      >
        <div className="flex gap-2">
          <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-700 font-black text-xs">البيانات محدثة لحظياً</span>
          </div>
        </div>
      </PageHeader>

      {/* ─── Multi-Currency Summary Cards ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Assets by Currency */}
        <CurrencyCard
          title="أرصدة الأصول"
          subtitle="All-Time Balances"
          icon={Wallet}
          color="bg-blue-600"
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          items={data?.assetsByCurrency}

          loading={loading}
          emptyText="لا توجد أرصدة أصول مسجلة"
        />

        {/* Revenue by Currency (current month) */}
        <CurrencyCard
          title="إيرادات الشهر"
          subtitle="Current Month Revenue"
          icon={ArrowUpRight}
          color="bg-emerald-600"
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
          items={data?.revenueByCurrency}

          loading={loading}
          emptyText="لا توجد إيرادات هذا الشهر"
        />

        {/* Expenses by Currency (current month) */}
        <CurrencyCard
          title="مصاريف الشهر"
          subtitle="Current Month Expenses"
          icon={ArrowDownRight}
          color="bg-rose-600"
          gradientFrom="from-rose-500"
          gradientTo="to-pink-600"
          items={data?.expenseByCurrency}

          loading={loading}
          emptyText="لا توجد مصاريف هذا الشهر"
        />
      </div>

      {/* ─── Recent Transactions + Expense Breakdown ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-slate-100 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
            <PageHeader
              icon={HistoryIcon}
              title="النشاط المالي الأخير"
              description="أحدث العمليات المسجلة"
              iconClassName="bg-white text-slate-500 shadow-sm"
              iconSize={16}
              variant="simple"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : data?.recentTransactions?.length > 0 ? (data.recentTransactions.map((entry: any) => (
                <div
                  key={entry.id}
                  onClick={() => handleNavigate(entry)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors shrink-0 shadow-sm">
                      <span className="text-sm font-black text-slate-400 group-hover:text-blue-500 uppercase leading-none mb-0.5">
                        #{entry.entryNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-800">
                      <span>{new Date(entry.date).toLocaleDateString('ar-AR')}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-blue-700 transition-colors">{entry.description || 'بدون وصف'}</h4>

                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-left">
                    <div className="text-right">
                      <p className="font-mono font-black text-slate-900 text-sm">
                        {Number(entry.originalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{entry.currencyCode}</p>
                        <span className="text-[10px] text-slate-300 font-bold">{entry.currencySymbol}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold h-fit">{entry.branch?.name}</Badge>
                  </div>
                </div>
              ))) : (
                <div className="text-center py-12 text-slate-400 font-medium">لا توجد عمليات حديثة</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
            <PageHeader
              icon={Activity}
              title="توزيع المصاريف"
              description="حسب التصنيف"
              iconClassName="bg-blue-50 text-blue-600 shadow-sm"
              iconSize={16}
              variant="simple"
            />
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : data?.expenseBreakdown?.length > 0 ? (
                data.expenseBreakdown.map((item: any) => (
                  <div key={item.name} className="group">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-700 font-bold group-hover:text-blue-600 transition-colors">{item.name}</span>
                      <span className="font-bold font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded-md text-xs">{Math.abs(item.value).toLocaleString()} <span className="text-[9px] text-slate-400 tracking-tighter">{data?.baseCurrencySymbol || data?.baseCurrencyCode || 'ر.س'}</span></span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${Math.min(100, Math.max(5, (Math.abs(item.value) / Math.abs(data.monthlyExpenses || 1)) * 100))}%`,
                          backgroundColor: item.color
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد مصاريف هذا الشهر</div>
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full blur-xl -mr-8 -mt-8 opacity-50"></div>
              <p className="text-xs text-blue-800 leading-relaxed font-bold relative z-10 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                الأرصدة الإجمالية معروضة بالعملة الأساسية ({data?.baseCurrencySymbol || data?.baseCurrencyCode || 'ر.س'}) مع تفاصيل كل عملة على حدة.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
