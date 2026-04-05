import { APP_ICONS } from "./icons";

export interface NavItem {
    title: string;
    href?: string;
    icon?: any;
    items?: NavItem[]; // For submenus
    description?: string;
    permission?: string | string[];
    color?: string;
    isSection?: boolean;
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
        title: "المالية الأساسية",
        isSection: true,
        items: [
            { 
                title: "ميزان المراجعة", 
                href: "/reports/trial-balance", 
                icon: APP_ICONS.REPORTS.TRIAL_BALANCE,
                permission: "REPORTS_TRIAL_BALANCE_VIEW",
            },
            { 
                title: "قائمة الدخل", 
                href: "/reports/income-statement", 
                icon: APP_ICONS.REPORTS.INCOME_STATEMENT,
                permission: "REPORTS_INCOME_STATEMENT_VIEW",
            },
            { 
                title: "كشف حساب تفصيلي", 
                icon: APP_ICONS.REPORTS.ACCOUNT_STATEMENT, 
                href: "/reports/account-statement",
                permission: "REPORTS_ACCOUNT_STATEMENT_VIEW",
            },
        ]
    },
    {
        title: "تحليل الفروع والمشاريع",
        isSection: true,
        items: [
            { 
                title: "إيرادات الجهات", 
                icon: APP_ICONS.REPORTS.BRANCH_REVENUE, 
                href: "/reports/branch-revenue",
                permission: ["REPORTS_BRANCH_REVENUE_VIEW", "reportes_branch_revenue_view"],
            },
            { 
                title: "مصاريف الجهات", 
                icon: APP_ICONS.REPORTS.BRANCH_EXPENSE, 
                href: "/reports/branch-expense",
                permission: ["REPORTS_BRANCH_EXPENSE_VIEW", "reportes_branch_expense_view"],
            },
            { 
                title: "مراكز التكلفة (المشاريع)", 
                icon: APP_ICONS.ACTIONS.GROWTH, 
                href: "/reports/cost-centers",
                permission: "REPORTS_COST_CENTERS_VIEW",
            },
            { 
                title: "نواقص مراكز التكلفة", 
                icon: APP_ICONS.STATE.WARNING, 
                href: "/reports/vouchers-missing-CC",
                permission: "REPORTS_VIEW",
            },
        ]
    },
    {
        title: "تحليل صرف العملات",
        isSection: true,
        items: [
            { 
                title: "فروقات العملة", 
                href: "/reports/currency-gains", 
                icon: APP_ICONS.REPORTS.EXCHANGE_GAINS,
                permission: "REPORTS_CURRENCY_GAINS_VIEW",
            },
            { 
                title: "سجل العملات", 
                href: "/reports/currency-history", 
                icon: APP_ICONS.REPORTS.CURRENCY_HISTORY,
                permission: "REPORTS_CURRENCY_HISTORY_VIEW",
            },
            { 
                title: "تدقيق العملات", 
                href: "/reports/currency-audit", 
                icon: APP_ICONS.ACTIONS.SEARCH,
                permission: "REPORTS_CURRENCY_HISTORY_VIEW",
            },
        ]
    },
    {
        title: "تقارير الاشتراكات",
        isSection: true,
        items: [
            { 
                title: "جدول الاشتراكات (Pivot)", 
                href: "/reports/subscriptions", 
                icon: APP_ICONS.REPORTS.SUBSCRIPTION_PIVOT,
                permission: "REPORTS_SUBSCRIPTIONS_VIEW",
            },
            { 
                title: "ملخص الاشتراكات السنوي", 
                href: "/reports/subscriptions/pivot-summary", 
                icon: APP_ICONS.REPORTS.SUBSCRIPTION_SUMMARY,
                permission: "REPORTS_SUBSCRIPTIONS_VIEW",
            },
        ]
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
        title: "مراكز التكلفة", 
        icon: APP_ICONS.NAV.DASHBOARD, 
        href: "/settings/cost-centers",
        permission: "COST_CENTERS_VIEW"
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

// ─── Permission Extraction Utility ────────────────────────────────────────────
// Maps nav group titles to Arabic category names for permission records
const GROUP_CATEGORY_MAP: Record<string, string> = {
    "main": "لوحة التحكم",
    "vouchers": "السندات",
    "subscription": "الاشتراكات",
    "accounts": "الحسابات",
    "reports": "التقارير",
    "settings": "الإعدادات",
};

// Maps permisson codes to human-readable Arabic names (fallback if not in nav)
const PERMISSION_NAME_MAP: Record<string, string> = {
    // Dashboard
    "DASHBOARD_VIEW": "عرض لوحة التحكم",
    // Vouchers
    "JOURNAL_VIEW": "عرض قيود اليومية",
    "JOURNAL_CREATE": "إضافة قيد يومية",
    "JOURNAL_EDIT": "تعديل قيد يومية",
    "JOURNAL_DELETE": "حذف قيد يومية",
    "JOURNAL_POST": "ترحيل قيد يومية",
    "JOURNAL_UNPOST": "إلغاء ترحيل قيد يومية",
    "JOURNAL_EXPORT": "تصدير قيود اليومية",
    "RECEIPT_VIEW": "عرض سندات القبض",
    "RECEIPT_CREATE": "إضافة سند قبض",
    "RECEIPT_EDIT": "تعديل سند قبض",
    "RECEIPT_DELETE": "حذف سند قبض",
    "RECEIPT_POST": "ترحيل سند قبض",
    "RECEIPT_UNPOST": "إلغاء ترحيل سند قبض",
    "RECEIPT_EXPORT": "تصدير سندات القبض",
    "PAYMENT_VIEW": "عرض سندات الصرف",
    "PAYMENT_CREATE": "إضافة سند صرف",
    "PAYMENT_EDIT": "تعديل سند صرف",
    "PAYMENT_DELETE": "حذف سند صرف",
    "PAYMENT_POST": "ترحيل سند صرف",
    "PAYMENT_UNPOST": "إلغاء ترحيل سند صرف",
    "PAYMENT_EXPORT": "تصدير سندات الصرف",
    // Subscriptions
    "MEMBERS_VIEW": "عرض الأعضاء",
    "MEMBERS_CREATE": "إضافة عضو",
    "MEMBERS_EDIT": "تعديل عضو",
    "MEMBERS_DELETE": "حذف عضو",
    "MEMBERS_IMPORT": "استيراد الأعضاء",
    "MEMBERS_EXPORT": "تصدير الأعضاء",
    "COLLECTS_VIEW": "عرض سجلات التحصيل",
    "COLLECTS_CREATE": "إنشاء سند تحصيل",
    "COLLECTS_EDIT": "تعديل سند تحصيل",
    "COLLECTS_DELETE": "حذف سند تحصيل",
    "COLLECTS_POST": "ترحيل سند تحصيل",
    "COLLECTS_UNPOST": "إلغاء ترحيل تحصيل",
    // Accounts
    "ACCOUNTS_VIEW": "عرض الحسابات",
    "ACCOUNTS_CREATE": "إضافة حساب",
    "ACCOUNTS_EDIT": "تعديل حساب",
    "ACCOUNTS_DELETE": "حذف حساب",
    "ACCOUNTS_EXPORT": "تصدير الحسابات",
    // Reports
    "REPORTS_TRIAL_BALANCE_VIEW": "عرض ميزان المراجعة",
    "REPORTS_TRIAL_BALANCE_EXPORT": "تصدير ميزان المراجعة",
    "REPORTS_INCOME_STATEMENT_VIEW": "عرض قائمة الدخل",
    "REPORTS_INCOME_STATEMENT_EXPORT": "تصدير قائمة الدخل",
    "REPORTS_ACCOUNT_STATEMENT_VIEW": "عرض كشف الحساب",
    "REPORTS_ACCOUNT_STATEMENT_EXPORT": "تصدير كشف الحساب",
    "REPORTS_BRANCH_REVENUE_VIEW": "عرض إيرادات الجهات",
    "REPORTS_BRANCH_REVENUE_EXPORT": "تصدير إيرادات الجهات",
    "REPORTS_BRANCH_EXPENSE_VIEW": "عرض مصاريف الجهات",
    "REPORTS_BRANCH_EXPENSE_EXPORT": "تصدير مصاريف الجهات",
    "REPORTS_COST_CENTERS_VIEW": "عرض مراكز التكلفة",
    "REPORTS_COST_CENTERS_EXPORT": "تصدير تقرير مراكز التكلفة",
    "REPORTS_VIEW": "عرض التقارير العامة",
    "REPORTS_CURRENCY_GAINS_VIEW": "عرض فروقات العملة",
    "REPORTS_CURRENCY_GAINS_EXPORT": "تصدير فروقات العملة",
    "REPORTS_CURRENCY_HISTORY_VIEW": "عرض سجل العملات",
    "REPORTS_CURRENCY_HISTORY_EXPORT": "تصدير سجل العملات",
    "REPORTS_SUBSCRIPTIONS_VIEW": "عرض تقارير الاشتراكات",
    "REPORTS_SUBSCRIPTIONS_EXPORT": "تصدير تقارير الاشتراكات",
    // Settings
    "CURRENCIES_VIEW": "عرض العملات",
    "CURRENCIES_CREATE": "إضافة عملة",
    "CURRENCIES_EDIT": "تعديل عملة",
    "CURRENCIES_DELETE": "حذف عملة",
    "PERIODS_VIEW": "عرض الفترات المحاسبية",
    "PERIODS_CREATE": "إضافة فترة",
    "PERIODS_EDIT": "تعديل فترة",
    "PERIODS_DELETE": "حذف فترة",
    "DB_BACKUP": "نسخ احتياطي لقاعدة البيانات",
    "DB_RESTORE": "استعادة قاعدة البيانات",
    "DB_RESET": "إعادة تعيين قاعدة البيانات",
    "THEMES_VIEW": "عرض سمات الصفحات",
    "THEMES_EDIT": "تعديل سمات الصفحات",
    "ENTITIES_VIEW": "عرض الجهات",
    "ENTITIES_CREATE": "إضافة جهة",
    "ENTITIES_EDIT": "تعديل جهة",
    "ENTITIES_DELETE": "حذف جهة",
    "COST_CENTERS_VIEW": "عرض مراكز التكلفة",
    "COST_CENTERS_CREATE": "إضافة مركز تكلفة",
    "COST_CENTERS_EDIT": "تعديل مركز تكلفة",
    "COST_CENTERS_DELETE": "حذف مركز تكلفة",
    "USERS_VIEW": "عرض المستخدمين",
    "USERS_CREATE": "إضافة مستخدم",
    "USERS_EDIT": "تعديل مستخدم",
    "USERS_DELETE": "حذف مستخدم",
    "ROLES_VIEW": "عرض الأدوار",
    "ROLES_CREATE": "إضافة دور",
    "ROLES_EDIT": "تعديل دور",
    "ROLES_DELETE": "حذف دور",
    "PERMISSIONS_VIEW": "عرض الصلاحيات",
    "PERMISSIONS_CREATE": "إضافة صلاحية",
    "PERMISSIONS_EDIT": "تعديل صلاحية",
    "PERMISSIONS_DELETE": "حذف صلاحية",
    "AUDIT_LOGS_VIEW": "عرض سجل العمليات",
    "AUDIT_LOGS_DELETE": "حذف سجلات العمليات",
    "AUDIT_LOGS_EXPORT": "تصدير سجل العمليات",
};

// Maps permission codes to their category string (matching format in DB)
const PERMISSION_CATEGORY_MAP: Record<string, string> = {
    // Dashboard
    "DASHBOARD_VIEW": "لوحة التحكم",
    // Vouchers
    "JOURNAL_VIEW": "السندات / قيود اليومية",
    "JOURNAL_CREATE": "السندات / قيود اليومية",
    "JOURNAL_EDIT": "السندات / قيود اليومية",
    "JOURNAL_DELETE": "السندات / قيود اليومية",
    "JOURNAL_POST": "السندات / قيود اليومية",
    "JOURNAL_UNPOST": "السندات / قيود اليومية",
    "JOURNAL_EXPORT": "السندات / قيود اليومية",
    "RECEIPT_VIEW": "السندات / سندات القبض",
    "RECEIPT_CREATE": "السندات / سندات القبض",
    "RECEIPT_EDIT": "السندات / سندات القبض",
    "RECEIPT_DELETE": "السندات / سندات القبض",
    "RECEIPT_POST": "السندات / سندات القبض",
    "RECEIPT_UNPOST": "السندات / سندات القبض",
    "RECEIPT_EXPORT": "السندات / سندات القبض",
    "PAYMENT_VIEW": "السندات / سندات الصرف",
    "PAYMENT_CREATE": "السندات / سندات الصرف",
    "PAYMENT_EDIT": "السندات / سندات الصرف",
    "PAYMENT_DELETE": "السندات / سندات الصرف",
    "PAYMENT_POST": "السندات / سندات الصرف",
    "PAYMENT_UNPOST": "السندات / سندات الصرف",
    "PAYMENT_EXPORT": "السندات / سندات الصرف",
    // Subscriptions
    "MEMBERS_VIEW": "الاشتراكات / الأعضاء",
    "MEMBERS_CREATE": "الاشتراكات / الأعضاء",
    "MEMBERS_EDIT": "الاشتراكات / الأعضاء",
    "MEMBERS_DELETE": "الاشتراكات / الأعضاء",
    "MEMBERS_IMPORT": "الاشتراكات / الأعضاء",
    "MEMBERS_EXPORT": "الاشتراكات / الأعضاء",
    "COLLECTS_VIEW": "الاشتراكات / التحصيل",
    "COLLECTS_CREATE": "الاشتراكات / التحصيل",
    "COLLECTS_EDIT": "الاشتراكات / التحصيل",
    "COLLECTS_DELETE": "الاشتراكات / التحصيل",
    "COLLECTS_POST": "الاشتراكات / التحصيل",
    "COLLECTS_UNPOST": "الاشتراكات / التحصيل",
    // Accounts
    "ACCOUNTS_VIEW": "الحسابات",
    "ACCOUNTS_CREATE": "الحسابات",
    "ACCOUNTS_EDIT": "الحسابات",
    "ACCOUNTS_DELETE": "الحسابات",
    "ACCOUNTS_EXPORT": "الحسابات",
    // Reports
    "REPORTS_TRIAL_BALANCE_VIEW": "التقارير / ميزان المراجعة",
    "REPORTS_TRIAL_BALANCE_EXPORT": "التقارير / ميزان المراجعة",
    "REPORTS_INCOME_STATEMENT_VIEW": "التقارير / قائمة الدخل",
    "REPORTS_INCOME_STATEMENT_EXPORT": "التقارير / قائمة الدخل",
    "REPORTS_ACCOUNT_STATEMENT_VIEW": "التقارير / كشف الحساب",
    "REPORTS_ACCOUNT_STATEMENT_EXPORT": "التقارير / كشف الحساب",
    "REPORTS_BRANCH_REVENUE_VIEW": "التقارير / إيرادات الجهات",
    "REPORTS_BRANCH_REVENUE_EXPORT": "التقارير / إيرادات الجهات",
    "REPORTS_BRANCH_EXPENSE_VIEW": "التقارير / مصاريف الجهات",
    "REPORTS_BRANCH_EXPENSE_EXPORT": "التقارير / مصاريف الجهات",
    "REPORTS_COST_CENTERS_VIEW": "التقارير / مراكز التكلفة",
    "REPORTS_COST_CENTERS_EXPORT": "التقارير / مراكز التكلفة",
    "REPORTS_VIEW": "التقارير",
    "REPORTS_CURRENCY_GAINS_VIEW": "التقارير / فروقات العملة",
    "REPORTS_CURRENCY_GAINS_EXPORT": "التقارير / فروقات العملة",
    "REPORTS_CURRENCY_HISTORY_VIEW": "التقارير / سجل العملات",
    "REPORTS_CURRENCY_HISTORY_EXPORT": "التقارير / سجل العملات",
    "REPORTS_SUBSCRIPTIONS_VIEW": "التقارير / تقارير الاشتراكات",
    "REPORTS_SUBSCRIPTIONS_EXPORT": "التقارير / تقارير الاشتراكات",
    // Settings
    "CURRENCIES_VIEW": "الإعدادات / العملات",
    "CURRENCIES_CREATE": "الإعدادات / العملات",
    "CURRENCIES_EDIT": "الإعدادات / العملات",
    "CURRENCIES_DELETE": "الإعدادات / العملات",
    "PERIODS_VIEW": "الإعدادات / الفترات",
    "PERIODS_CREATE": "الإعدادات / الفترات",
    "PERIODS_EDIT": "الإعدادات / الفترات",
    "PERIODS_DELETE": "الإعدادات / الفترات",
    "DB_BACKUP": "الإعدادات / قاعدة البيانات",
    "DB_RESTORE": "الإعدادات / قاعدة البيانات",
    "DB_RESET": "الإعدادات / قاعدة البيانات",
    "THEMES_VIEW": "الإعدادات / سمات الصفحات",
    "THEMES_EDIT": "الإعدادات / سمات الصفحات",
    "ENTITIES_VIEW": "الإعدادات / الجهات",
    "ENTITIES_CREATE": "الإعدادات / الجهات",
    "ENTITIES_EDIT": "الإعدادات / الجهات",
    "ENTITIES_DELETE": "الإعدادات / الجهات",
    "COST_CENTERS_VIEW": "الإعدادات / مراكز التكلفة",
    "COST_CENTERS_CREATE": "الإعدادات / مراكز التكلفة",
    "COST_CENTERS_EDIT": "الإعدادات / مراكز التكلفة",
    "COST_CENTERS_DELETE": "الإعدادات / مراكز التكلفة",
    "USERS_VIEW": "الإعدادات / المستخدمون",
    "USERS_CREATE": "الإعدادات / المستخدمون",
    "USERS_EDIT": "الإعدادات / المستخدمون",
    "USERS_DELETE": "الإعدادات / المستخدمون",
    "ROLES_VIEW": "الإعدادات / الأدوار",
    "ROLES_CREATE": "الإعدادات / الأدوار",
    "ROLES_EDIT": "الإعدادات / الأدوار",
    "ROLES_DELETE": "الإعدادات / الأدوار",
    "PERMISSIONS_VIEW": "الإعدادات / الصلاحيات",
    "PERMISSIONS_CREATE": "الإعدادات / الصلاحيات",
    "PERMISSIONS_EDIT": "الإعدادات / الصلاحيات",
    "PERMISSIONS_DELETE": "الإعدادات / الصلاحيات",
    "AUDIT_LOGS_VIEW": "الإعدادات / سجل العمليات",
    "AUDIT_LOGS_DELETE": "الإعدادات / سجل العمليات",
    "AUDIT_LOGS_EXPORT": "الإعدادات / سجل العمليات",
};

export interface NavPermissionEntry {
    code: string;
    name: string;
    category: string;
}

/**
 * Returns the complete list of all permission codes the app requires,
 * extracted from the navigation config + the comprehensive PERMISSION_NAME_MAP.
 * This serves as the authoritative list of permissions the app expects in the DB.
 */
export function getAllNavPermissions(): NavPermissionEntry[] {
    const seen = new Set<string>();
    const result: NavPermissionEntry[] = [];

    const addCode = (code: string) => {
        if (!seen.has(code)) {
            seen.add(code);
            result.push({
                code,
                name: PERMISSION_NAME_MAP[code] || code,
                category: PERMISSION_CATEGORY_MAP[code] || 'عام',
            });
        }
    };

    // Walk all menus extracting permission keys
    const walkItems = (items: NavItem[]) => {
        for (const item of items) {
            if (item.permission) {
                if (Array.isArray(item.permission)) {
                    item.permission.forEach(addCode);
                } else {
                    addCode(item.permission);
                }
            }
            if (item.items) {
                walkItems(item.items);
            }
        }
    };

    walkItems(MAIN_MENU);
    walkItems(VOUCHERS_MENU);
    walkItems(SUBSCRIPTION_MENU);
    walkItems(ACCOUNTS_MENU);
    walkItems(REPORTS_MENU);
    walkItems(SETTINGS_MENU);

    // Also add all codes from the comprehensive map that weren't in nav items
    Object.keys(PERMISSION_NAME_MAP).forEach(addCode);

    return result;
}

export const SIDEBAR_STRUCTURE = [
    { title: "الرئيسية", icon: APP_ICONS.NAV.DASHBOARD, items: MAIN_MENU },
    { title: "السندات والمحاسبة", icon: APP_ICONS.NAV.VOUCHERS, items: VOUCHERS_MENU },
    { title: "الاشتراكات", icon: APP_ICONS.NAV.SUBSCRIPTIONS, items: SUBSCRIPTION_MENU },
    { title: "الحسابات", icon: APP_ICONS.NAV.ACCOUNTS, items: ACCOUNTS_MENU },
    { title: "التقارير", icon: APP_ICONS.REPORTS.MAIN, href: "/reports", items: REPORTS_MENU },
    { title: "الإعدادات", icon: APP_ICONS.NAV.SETTINGS, items: SETTINGS_MENU },
];
