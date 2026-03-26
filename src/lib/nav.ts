import { APP_ICONS } from "./icons";

export interface NavItem {
    title: string;
    href: string;
    icon: any;
    items?: NavItem[]; // For submenus
    description?: string;
    permission?: string | string[];
    color?: string;
}

export const MAIN_MENU: NavItem[] = [
    { title: "لوحة التحكم", icon: APP_ICONS.NAV.DASHBOARD, href: "/" },
];

export const VOUCHERS_MENU: NavItem[] = [
    { 
        title: "قيود اليومية", 
        icon: APP_ICONS.MODULES.JOURNAL, 
        href: "/vouchers/journal",
        permission: "JOURNAL_VIEW" 
    },
    { 
        title: "سندات القبض", 
        icon: APP_ICONS.MODULES.RECEIPTS, 
        href: "/vouchers/receipts",
        permission: "RECEIPT_VIEW" 
    },
    { 
        title: "سندات الصرف", 
        icon: APP_ICONS.MODULES.PAYMENTS, 
        href: "/vouchers/payments",
        permission: "PAYMENT_VIEW" 
    },
];

export const SUBSCRIPTION_MENU: NavItem[] = [
    { 
        title: "الأعضاء", 
        icon: APP_ICONS.MODULES.MEMBERS, 
        href: "/subscriptions/members",
        permission: "MEMBERS_VIEW" 
    },
    { 
        title: "تحصيل الاشتراكات", 
        icon: APP_ICONS.MODULES.COLLECT, 
        href: "/subscriptions/collect",
        permission: "COLLECTS_VIEW" 
    },
    { 
        title: "سجلات التحصيل", 
        icon: APP_ICONS.MODULES.COLLECT_HISTORY, 
        href: "/subscriptions/history",
        permission: "COLLECTS_VIEW" 
    },
];

export const ACCOUNTS_MENU: NavItem[] = [
    { 
        title: "الحسابات", 
        icon: APP_ICONS.MODULES.ACCOUNTS, 
        href: "/accounts",
        permission: "ACCOUNTS_VIEW" 
    },
];

export const REPORTS_MENU: NavItem[] = [
    { 
        title: "ميزان المراجعة", 
        href: "/reports/trial-balance", 
        icon: APP_ICONS.REPORTS.TRIAL_BALANCE,
        description: "عرض أرصدة جميع الحسابات المدينة والدائنة لضمان توازن النظام.",
        permission: "REPORTS_TRIAL_BALANCE_VIEW",
        color: "bg-blue-700"
    },
    { 
        title: "قائمة الدخل", 
        href: "/reports/income-statement", 
        icon: APP_ICONS.REPORTS.INCOME_STATEMENT,
        description: "تقرير الأرباح والخسائر الذي يوضح صافي الفائض أو العجز.",
        permission: "REPORTS_INCOME_STATEMENT_VIEW",
        color: "bg-emerald-700"
    },
    { 
        title: "كشف حساب تفصيلي", 
        icon: APP_ICONS.REPORTS.ACCOUNT_STATEMENT, 
        href: "/reports/account-statement",
        description: "استعراض جميع الحركات التي تمت على حساب معين خلال فترة.",
        permission: "REPORTS_ACCOUNT_STATEMENT_VIEW",
        color: "bg-slate-800"
    },
    { 
        title: "إيرادات الجهات", 
        icon: APP_ICONS.REPORTS.BRANCH_REVENUE, 
        href: "/reports/branch-revenue",
        description: "تحليل مصادر الإيرادات وتوزيعها على المشاريع والجهات",
        permission: ["REPORTS_BRANCH_REVENUE_VIEW", "reportes_branch_revenue_view"],
        color: "bg-cyan-700"
    },
    { 
        title: "مصاريف الجهات", 
        icon: APP_ICONS.REPORTS.BRANCH_EXPENSE, 
        href: "/reports/branch-expense",
        description: "تتبع المصاريف التشغيلية والإدارية حسب الجهة والموقع",
        permission: ["REPORTS_BRANCH_EXPENSE_VIEW", "reportes_branch_expense_view"],
        color: "bg-rose-700"
    },
    { 
        title: "فروقات العملة", 
        href: "/reports/currency-gains", 
        icon: APP_ICONS.REPORTS.EXCHANGE_GAINS,
        description: "تحليل الأرباح والخسائر الناتجة عن تذبذب أسعار صرف العملات.",
        permission: "REPORTS_CURRENCY_GAINS_VIEW",
        color: "bg-amber-700"
    },
    { 
        title: "سجل العملات", 
        href: "/reports/currency-history", 
        icon: APP_ICONS.REPORTS.CURRENCY_HISTORY,
        description: "تقرير تاريخي يوضح جميع التغيرات في أسعار صرف العملات الأجنبية.",
        permission: "REPORTS_CURRENCY_HISTORY_VIEW",
        color: "bg-violet-700"
    },
    { 
        title: "جدول الاشتراكات (Pivot)", 
        href: "/reports/subscriptions", 
        icon: APP_ICONS.REPORTS.SUBSCRIPTION_PIVOT,
        description: "تقرير شامل يوضح حالة تسديد الاشتراكات لجميع الأعضاء عبر السنوات.",
        permission: "REPORTS_SUBSCRIPTIONS_VIEW",
        color: "bg-indigo-700"
    },
    { 
        title: "تدقيق العملات", 
        href: "/reports/currency-audit", 
        icon: APP_ICONS.ACTIONS.SEARCH,
        description: "مقارنة أسعار الصرف المسجلة في السندات مع سجل التاريخ للتأكد من دقتها.",
        permission: "REPORTS_CURRENCY_HISTORY_VIEW",
        color: "bg-blue-600"
    },
    { 
        title: "ملخص الاشتراكات السنوي", 
        href: "/reports/subscriptions/pivot-summary", 
        icon: APP_ICONS.REPORTS.SUBSCRIPTION_SUMMARY,
        description: "إحصائيات تجميعية للاشتراكات حسب حالة الأعضاء والسنوات.",
        permission: "REPORTS_SUBSCRIPTIONS_VIEW",
        color: "bg-slate-700"
    },
];

export const SETTINGS_MENU: NavItem[] = [
    { 
        title: "الإعدادات العامة", 
        icon: APP_ICONS.MODULES.GENERAL_SETTINGS, 
        href: "/settings",
        permission: ["CURRENCIES_VIEW", "PERIODS_VIEW", "DB_BACKUP"]
    },
    { 
        title: "سمات الصفحات", 
        icon: APP_ICONS.NAV.THEMES, 
        href: "/settings/themes",
        permission: "THEMES_VIEW"
    },
    { 
        title: "الجهات", 
        icon: APP_ICONS.MODULES.ENTITIES, 
        href: "/settings/entities",
        permission: "ENTITIES_VIEW"
    },
    { 
        title: "المستخدمون", 
        icon: APP_ICONS.MODULES.USERS, 
        href: "/settings/users",
        permission: "USERS_VIEW"
    },
    { 
        title: "الأدوار", 
        icon: APP_ICONS.MODULES.ROLES, 
        href: "/settings/roles",
        permission: "ROLES_VIEW"
    },
    { 
        title: "الصلاحيات", 
        icon: APP_ICONS.MODULES.PERMISSIONS, 
        href: "/settings/permissions",
        permission: "PERMISSIONS_VIEW"
    },
    { 
        title: "إغلاق الفترات", 
        icon: APP_ICONS.MODULES.PERIODS, 
        href: "/settings/periods",
        permission: "PERIODS_VIEW"
    },
    { 
        title: "سجل العمليات", 
        icon: APP_ICONS.MODULES.AUDIT, 
        href: "/settings/audit-logs",
        permission: "AUDIT_LOGS_VIEW"
    },
];

export const SIDEBAR_STRUCTURE = [
    { title: "الرئيسية", icon: APP_ICONS.NAV.DASHBOARD, items: MAIN_MENU },
    { title: "السندات والمحاسبة", icon: APP_ICONS.NAV.VOUCHERS, items: VOUCHERS_MENU },
    { title: "الاشتراكات", icon: APP_ICONS.NAV.SUBSCRIPTIONS, items: SUBSCRIPTION_MENU },
    { title: "الحسابات", icon: APP_ICONS.NAV.ACCOUNTS, items: ACCOUNTS_MENU },
    { title: "التقارير", icon: APP_ICONS.REPORTS.MAIN, href: "/reports", items: REPORTS_MENU },
    { title: "الإعدادات", icon: APP_ICONS.NAV.SETTINGS, items: SETTINGS_MENU },
];
