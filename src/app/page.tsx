"use client";

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Briefcase,
  History,
  Activity,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBox } from '@/components/ui/IconBox';

const StatCard = ({ title, amount, currency, icon: Icon, trend, trendValue, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <IconBox icon={Icon} className={cn("shadow-lg shadow-blue-500/5", color)} boxSize="w-12 h-12" iconSize={22} />
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <p className="text-slate-500 font-medium mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-bold font-mono text-slate-900">{amount}</h3>
      <span className="text-sm font-semibold text-slate-400">{currency}</span>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <PageHeader
          icon={LayoutDashboard}
          title="نظرة عامة"
          description="مرحباً بك مجدداً، إليك ملخص الوضع المالي للصندوق"
          iconClassName="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200"
          iconSize={24}
        />
        <div className="flex gap-2">
          <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-700 font-black text-xs">البيانات محدثة لحظياً</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الأصول"
          amount="850,240"
          currency="SAR"
          icon={Wallet}
          trend="up"
          trendValue="12"
          color="bg-blue-600"
        />
        <StatCard
          title="إيرادات الشهر"
          amount="42,300"
          currency="SAR"
          icon={ArrowUpRight}
          trend="up"
          trendValue="5.4"
          color="bg-emerald-600"
        />
        <StatCard
          title="المصاريف الخيرية"
          amount="15,800"
          currency="SAR"
          icon={Briefcase}
          trend="down"
          trendValue="2.1"
          color="bg-rose-600"
        />
        <StatCard
          title="صافي الفائض"
          amount="26,500"
          currency="SAR"
          icon={TrendingUp}
          trend="up"
          trendValue="8.7"
          color="bg-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
            <PageHeader
              icon={History}
              title="النشاط المالي الأخير"
              description="Latest Transaction Logs"
              iconClassName="bg-slate-100 text-slate-500"
              iconSize={18}
            />
            <button className="text-blue-600 font-bold hover:underline text-xs bg-blue-50 px-4 py-2 rounded-xl transition-all">عرض الكل</button>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <IconBox icon={History} className="bg-slate-100 text-slate-500" boxSize="w-12 h-12" iconSize={20} />
                  <div>
                    <h4 className="font-bold text-slate-900">سداد فواتير طبية للعائلة</h4>
                    <p className="text-sm text-slate-400">14 فبراير 2026 • رقم القيد: #10{i}4</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold font-mono text-red-600">-1,200.00 SAR</span>
                  <p className="text-xs text-slate-400 uppercase">Debited from Fund</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-8 border-b border-slate-50 pb-4">
            <PageHeader
              icon={Activity}
              title="توزيع الأرصدة"
              description="Fund-wise Allocation"
              iconClassName="bg-blue-50 text-blue-600"
              iconSize={18}
            />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">الفرع الرئيسي (الرياض)</span>
                <span className="font-bold">75%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">فرع جدة (دولار هائل)</span>
                <span className="font-bold">15%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">فرع الدمام</span>
                <span className="font-bold">10%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed font-medium">
              ملاحظة: جميع الأرصدة أعلاه معروضة بـ <span className="underline font-bold">العملة الأساسية (SAR)</span> لضمان دقة التقرير الموحد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
