import { APP_ICONS } from './icons';

/**
 * Get icon for a permission category based on string matching.
 */
export const getCategoryIcon = (category: string) => {
    if (!category) return APP_ICONS.NAV.DEFAULT;

    // Split category by '/' and trim parts to handle cases like "التقارير / ميزان المراجعة"
    const parts = category.split('/').map(p => p.trim());
    const mainCategory = parts[0];
    const subCategory = parts[parts.length - 1];

    const ICON_MAP: Record<string, any> = {
    'لوحة التحكم': APP_ICONS.NAV.DASHBOARD,
    'قيود اليومية': APP_ICONS.MODULES.JOURNAL,
    'سندات القبض': APP_ICONS.MODULES.RECEIPTS,
    'سندات الصرف': APP_ICONS.MODULES.PAYMENTS,
    'السندات': APP_ICONS.NAV.VOUCHERS,
    'إدارة الجهات': APP_ICONS.MODULES.ENTITIES,
    'إدارة الصلاحيات': APP_ICONS.MODULES.PERMISSIONS,
    'الصلاحيات': APP_ICONS.MODULES.PERMISSIONS,
    'الأعضاء': APP_ICONS.MODULES.MEMBERS,
    'التحصيل': APP_ICONS.MODULES.COLLECT,
    'الاشتراكات': APP_ICONS.NAV.SUBSCRIPTIONS,
    'الحسابات': APP_ICONS.MODULES.ACCOUNTS_TREE,
    
    // Reports
    'ميزان المراجعة': APP_ICONS.REPORTS.TRIAL_BALANCE,
    'قائمة الدخل': APP_ICONS.REPORTS.INCOME_STATEMENT,
    'كشف الحساب': APP_ICONS.REPORTS.ACCOUNT_STATEMENT,
    'إيرادات الجهات': APP_ICONS.REPORTS.BRANCH_REVENUE,
    'مصاريف الجهات': APP_ICONS.REPORTS.BRANCH_EXPENSE,
    'فروقات العملة': APP_ICONS.REPORTS.EXCHANGE_GAINS,
    'سجل العملات': APP_ICONS.REPORTS.CURRENCY_HISTORY,
    'جدول الاشتراكات': APP_ICONS.REPORTS.SUBSCRIPTION_PIVOT,
    'ملخص الاشتراكات': APP_ICONS.REPORTS.SUBSCRIPTION_SUMMARY,
    'التقارير': APP_ICONS.REPORTS.MAIN,

    // Otros
    'العملات': APP_ICONS.MODULES.CURRENCIES,
    'الفترات': APP_ICONS.MODULES.PERIODS,
    'المستخدمون': APP_ICONS.MODULES.USERS,
    'الأدوار': APP_ICONS.MODULES.ROLES,
    'سجل العمليات': APP_ICONS.MODULES.AUDIT,
    'قاعدة البيانات': APP_ICONS.MODULES.DATABASE,
    'سمات الصفحات': APP_ICONS.NAV.THEMES,
    'الإعدادات': APP_ICONS.NAV.SETTINGS,
    'الجهات': APP_ICONS.MODULES.ENTITIES,
    };

  // Try the most specific sub-category first, then fallback to the main category, finally default
  return ICON_MAP[subCategory] || ICON_MAP[mainCategory] || APP_ICONS.NAV.DEFAULT;

};

/**
 * Get icon for a permission action based on the permission code suffix.
 */
export const getActionIcon = (code: string) => {
    if (!code) return APP_ICONS.ACTIONS.KEY;
    const upperCode = code.toUpperCase();
    
    if (upperCode.endsWith('_VIEW')) return APP_ICONS.ACTIONS.VIEW;
    if (upperCode.endsWith('_CREATE')) return APP_ICONS.ACTIONS.ADD;
    if (upperCode.endsWith('_EDIT')) return APP_ICONS.ACTIONS.EDIT;
    if (upperCode.endsWith('_DELETE')) return APP_ICONS.ACTIONS.DELETE;
    if (upperCode.endsWith('_PRINT')) return APP_ICONS.ACTIONS.PRINT;
    if (upperCode.endsWith('_POST')) return APP_ICONS.ACTIONS.SHIELD_CHECK;
    if (upperCode.endsWith('_UNPOST')) return APP_ICONS.ACTIONS.UNDO;
    if (upperCode.endsWith('_IMPORT')) return APP_ICONS.ACTIONS.IMPORT;
    if (upperCode.endsWith('_EXPORT')) return APP_ICONS.ACTIONS.EXPORT;
    if (upperCode.endsWith('_BACKUP')) return APP_ICONS.MODULES.DATABASE;
    if (upperCode.endsWith('_RESTORE')) return APP_ICONS.ACTIONS.IMPORT;
    if (upperCode.endsWith('_RESET')) return APP_ICONS.STATE.WARNING;
    
    return APP_ICONS.ACTIONS.KEY;
};
