"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_ICONS } from '@/lib/icons';
import { CustomButton } from '@/components/ui/CustomButton';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-700 select-none">
      <div className="relative mb-12 group">
        {/* Decorative background elements with glow effect */}
        <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl animate-pulse group-hover:bg-indigo-500/20 transition-colors duration-700" />
        <div className="absolute -inset-20 bg-blue-500/5 rounded-full blur-3xl" />
        
        {/* Main Icon with complex animation and glass effect */}
        <div className="relative bg-card/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 dark:shadow-none border border-white dark:border-slate-800 transition-all hover:scale-105 hover:rotate-2 duration-500">
          <APP_ICONS.ACTIONS.SEARCH_X size={100} className="text-indigo-600 animate-pulse" />
        </div>
        
        {/* Floating 404 tag with stylized typography */}
        <div className="absolute -top-6 -right-6 bg-slate-900 text-white dark:bg-indigo-600 px-6 py-2 rounded-2xl text-3xl font-black shadow-2xl rotate-12 animate-in slide-in-from-bottom-8 duration-1000">
          404
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-foreground dark:text-white mb-6 tracking-tight">
        أوبس! الصفحة مفقودة
      </h1>
      
      <p className="max-w-lg mx-auto text-lg font-bold text-muted-foreground/80 dark:text-muted-foreground/60 mb-12 leading-relaxed opacity-80">
        يبدو أنك حاولت الوصول إلى وجهة غير موجودة. قد يكون الرابط قديمًا أو تم حذفه للصيانة. لا تقلق، يمكنك العودة للمسار الصحيح.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
        <CustomButton
          icon={APP_ICONS.ACTIONS.HOME}
          onClick={() => router.push('/')}
          className='hover:translate-y-[-4px] active:scale-95 transition-all'
          
        > العودة للرئيسية</CustomButton>
         
        
        <CustomButton
          icon={APP_ICONS.ACTIONS.ARROW_RIGHT}
          onClick={() => router.back()}
          className='hover:translate-y-[-4px] active:scale-95 transition-all'
          variant="outline"
        > الرجوع للخلف</CustomButton>       
      </div>

      {/* Help section */}
      
      {/* <div className="mt-20 pt-8 border-t border-border dark:border-slate-800 w-full max-w-sm flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-3 text-muted-foreground/60 font-bold text-lg">
          <APP_ICONS.ACTIONS.HELP size={20} />
          <span>هل واجهت مشكلة تقنية؟</span>
        </div>
        <Link href="/settings/support" className="px-6 py-2 rounded-full bg-accent dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground/40 text-sm font-black hover:bg-indigo-600 hover:text-white transition-all">
          بلاغ عن خطأ
        </Link>
      </div> */}
      
      {/* Decorative dots grid background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:48px_48px] opacity-25" />
    </div>
  );
}
