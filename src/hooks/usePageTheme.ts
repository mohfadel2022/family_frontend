
import { usePathname } from 'next/navigation';
import { PageTheme } from '@/lib/themes';
import { usePageThemeContext } from '@/context/PageThemeContext';

export const usePageTheme = (): PageTheme => {
    const pathname = usePathname();
    const { getDynamicTheme } = usePageThemeContext();
    return getDynamicTheme(pathname);
};
