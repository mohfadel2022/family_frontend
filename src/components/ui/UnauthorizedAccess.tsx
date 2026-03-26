import { APP_ICONS } from '@/lib/icons';   
import { CustomButton } from './CustomButton';
import { useRouter } from 'next/navigation';

interface UnauthorizedAccessProps {
    title?: string;
    message?: string;
    showBackButton?: boolean;
}

export const UnauthorizedAccess = ({
    title = 'وصول غير مصرح به',
    message = 'عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة.',
    showBackButton = true
}: UnauthorizedAccessProps) => {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-20 rounded-full" />
                <div className="relative bg-card p-6 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-900/50 shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-500 shadow-inner">
                        <APP_ICONS.ACTIONS.SHIELD_ALERT size={40} />
                    </div>
                </div>
            </div>

            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black text-foreground">{title}</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">{message}</p>
            </div>

            {showBackButton && (
                <CustomButton
                    onClick={() => router.push('/')}
                    className="group"
                    icon={APP_ICONS.ACTIONS.ARROW_RIGHT}
                >
                    العودة للرئيسية
                </CustomButton>
            )}
        </div>
    );
};
