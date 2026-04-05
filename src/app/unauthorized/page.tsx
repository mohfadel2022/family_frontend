"use client";

import { useRouter } from 'next/navigation';
import { APP_ICONS } from '@/lib/icons';
import { CustomButton } from '@/components/ui/CustomButton';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-700 select-none">
      <div className="relative mb-12 group">
        {/* Glow */}
        <div className="absolute -inset-10 bg-rose-500/10 rounded-full blur-3xl animate-pulse group-hover:bg-rose-500/20 transition-colors duration-700" />
        <div className="absolute -inset-20 bg-red-500/5 rounded-full blur-3xl" />

        {/* Icon */}
        <div className="relative bg-card/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl shadow-rose-100/50 dark:shadow-none border border-white dark:border-slate-800 transition-all hover:scale-105 hover:-rotate-2 duration-500">
          <APP_ICONS.STATE.FORBIDDEN size={100} className="text-rose-500 animate-pulse" />
        </div>

        {/* 403 badge */}
        <div className="absolute -top-6 -right-6 bg-rose-600 text-white px-6 py-2 rounded-2xl text-3xl font-black shadow-2xl rotate-12 animate-in slide-in-from-bottom-8 duration-1000">
          403
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-foreground dark:text-white mb-6 tracking-tight">
        وصول مرفوض
      </h1>

      <p className="max-w-lg mx-auto text-lg font-bold text-muted-foreground/80 dark:text-muted-foreground/60 mb-12 leading-relaxed opacity-80">
        ليس لديك الصلاحية للوصول إلى هذه الصفحة أو الموارد المطلوبة. تواصل مع مسؤول النظام لمنحك الأذونات المناسبة.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
        <CustomButton
          icon={APP_ICONS.ACTIONS.HOME}
          onClick={() => router.push('/')}
          className='hover:translate-y-[-4px] active:scale-95 transition-all'
        >
          العودة للرئيسية
        </CustomButton>

        <CustomButton
          icon={APP_ICONS.ACTIONS.ARROW_RIGHT}
          onClick={() => router.back()}
          className='hover:translate-y-[-4px] active:scale-95 transition-all'
          variant="outline"
        >
          الرجوع للخلف
        </CustomButton>
      </div>

      {/* Dots grid background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(#fecaca_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#2d1515_1.5px,transparent_1.5px)] [background-size:48px_48px] opacity-25" />
    </div>
  );
}
