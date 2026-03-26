
export interface PageTheme {
  primary: string;       // bg-blue-600
  secondary: string;     // bg-blue-500
  accent: string;        // text-blue-600
  muted: string;         // bg-blue-50
  border: string;        // border-blue-200
  gradient: string;      // from-blue-600 to-indigo-700
  shadow: string;        // shadow-blue-500/10
  tableHeader: string;   // bg-blue-600
}

export const THEMES: Record<string, PageTheme> = {
  // Default / Dashboard
  DASHBOARD: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-500',
    accent: 'text-indigo-600',
    muted: 'bg-indigo-50',
    border: 'border-indigo-100',
    gradient: 'bg-gradient-to-br from-indigo-600 to-blue-700',
    shadow: 'shadow-indigo-500/20',
    tableHeader: 'bg-indigo-600',
  },
  // Vouchers
  JOURNAL: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-500',
    accent: 'text-blue-600',
    muted: 'bg-blue-50',
    border: 'border-blue-100',
    gradient: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    shadow: 'shadow-blue-500/20',
    tableHeader: 'bg-blue-600',
  },
  RECEIPTS: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-500',
    accent: 'text-emerald-600',
    muted: 'bg-emerald-50',
    border: 'border-emerald-100',
    gradient: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    shadow: 'shadow-emerald-500/20',
    tableHeader: 'bg-emerald-600',
  },
  PAYMENTS: {
    primary: 'bg-rose-600',
    secondary: 'bg-rose-500',
    accent: 'text-rose-600',
    muted: 'bg-rose-50',
    border: 'border-rose-100',
    gradient: 'bg-gradient-to-br from-rose-600 to-pink-700',
    shadow: 'shadow-rose-500/20',
    tableHeader: 'bg-rose-600',
  },
  // Subscriptions
  MEMBERS: {
    primary: 'bg-violet-600',
    secondary: 'bg-violet-500',
    accent: 'text-violet-600',
    muted: 'bg-violet-50',
    border: 'border-violet-100',
    gradient: 'bg-gradient-to-br from-violet-600 to-purple-700',
    shadow: 'shadow-violet-500/20',
    tableHeader: 'bg-violet-600',
  },
  COLLECT: {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-500',
    accent: 'text-amber-600',
    muted: 'bg-amber-50',
    border: 'border-amber-100',
    gradient: 'bg-gradient-to-br from-amber-600 to-orange-700',
    shadow: 'shadow-amber-500/20',
    tableHeader: 'bg-amber-600',
  },
  // Reports
  REPORTS: {
    primary: 'bg-slate-800',
    secondary: 'bg-slate-700',
    accent: 'text-slate-800',
    muted: 'bg-slate-100',
    border: 'border-slate-200',
    gradient: 'bg-gradient-to-br from-slate-800 to-slate-900',
    shadow: 'shadow-slate-500/20',
    tableHeader: 'bg-slate-800',
  },
  // Settings Sub-pages
  SETTINGS_USERS: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-500',
    accent: 'text-blue-600',
    muted: 'bg-blue-50',
    border: 'border-blue-100',
    gradient: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    shadow: 'shadow-blue-500/20',
    tableHeader: 'bg-blue-600',
  },
  SETTINGS_ROLES: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-500',
    accent: 'text-emerald-600',
    muted: 'bg-emerald-50',
    border: 'border-emerald-100',
    gradient: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    shadow: 'shadow-emerald-500/20',
    tableHeader: 'bg-emerald-600',
  },
  SETTINGS_AUDIT: {
    primary: 'bg-slate-700',
    secondary: 'bg-slate-600',
    accent: 'text-slate-700',
    muted: 'bg-slate-50',
    border: 'border-slate-200',
    gradient: 'bg-gradient-to-br from-slate-700 to-slate-800',
    shadow: 'shadow-slate-500/20',
    tableHeader: 'bg-slate-700',
  },
  SETTINGS_ENTITIES: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-500',
    accent: 'text-indigo-600',
    muted: 'bg-indigo-50',
    border: 'border-indigo-100',
    gradient: 'bg-gradient-to-br from-indigo-600 to-blue-700',
    shadow: 'shadow-indigo-500/20',
    tableHeader: 'bg-indigo-600',
  },
  SETTINGS_PERIODS: {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-500',
    accent: 'text-amber-600',
    muted: 'bg-amber-50',
    border: 'border-amber-100',
    gradient: 'bg-gradient-to-br from-amber-600 to-orange-700',
    shadow: 'shadow-amber-500/20',
    tableHeader: 'bg-amber-600',
  },
  SETTINGS: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-500',
    accent: 'text-indigo-600',
    muted: 'bg-indigo-50',
    border: 'border-indigo-100',
    gradient: 'bg-gradient-to-br from-indigo-600 to-blue-700',
    shadow: 'shadow-indigo-500/20',
    tableHeader: 'bg-indigo-600',
  },
  // Reports Sub-pages
  REPORTS_FINANCIAL: {
    primary: 'bg-blue-700',
    secondary: 'bg-blue-600',
    accent: 'text-blue-700',
    muted: 'bg-blue-50',
    border: 'border-blue-100',
    gradient: 'bg-gradient-to-br from-blue-700 to-indigo-800',
    shadow: 'shadow-blue-500/20',
    tableHeader: 'bg-blue-700',
  },
  REPORTS_EMERALD: {
    primary: 'bg-emerald-700',
    secondary: 'bg-emerald-600',
    accent: 'text-emerald-700',
    muted: 'bg-emerald-50',
    border: 'border-emerald-100',
    gradient: 'bg-gradient-to-br from-emerald-700 to-teal-800',
    shadow: 'shadow-emerald-500/20',
    tableHeader: 'bg-emerald-700',
  },
  REPORTS_ROSE: {
    primary: 'bg-rose-700',
    secondary: 'bg-rose-600',
    accent: 'text-rose-700',
    muted: 'bg-rose-50',
    border: 'border-rose-100',
    gradient: 'bg-gradient-to-br from-rose-700 to-pink-800',
    shadow: 'shadow-rose-500/20',
    tableHeader: 'bg-rose-700',
  },
  REPORTS_VIOLET: {
    primary: 'bg-violet-700',
    secondary: 'bg-violet-600',
    accent: 'text-violet-700',
    muted: 'bg-violet-50',
    border: 'border-violet-100',
    gradient: 'bg-gradient-to-br from-violet-700 to-purple-800',
    shadow: 'shadow-violet-500/20',
    tableHeader: 'bg-violet-700',
  },
  REPORTS_AMBER: {
    primary: 'bg-amber-700',
    secondary: 'bg-amber-600',
    accent: 'text-amber-700',
    muted: 'bg-amber-50',
    border: 'border-amber-100',
    gradient: 'bg-gradient-to-br from-amber-700 to-orange-800',
    shadow: 'shadow-amber-500/20',
    tableHeader: 'bg-amber-700',
  },
  REPORTS_CYAN: {
    primary: 'bg-cyan-700',
    secondary: 'bg-cyan-600',
    accent: 'text-cyan-700',
    muted: 'bg-cyan-50',
    border: 'border-cyan-100',
    gradient: 'bg-gradient-to-br from-cyan-700 to-teal-800',
    shadow: 'shadow-cyan-500/20',
    tableHeader: 'bg-cyan-700',
  },
  REPORTS_INDIGO: {
    primary: 'bg-indigo-700',
    secondary: 'bg-indigo-600',
    accent: 'text-indigo-700',
    muted: 'bg-indigo-50',
    border: 'border-indigo-100',
    gradient: 'bg-gradient-to-br from-indigo-700 to-indigo-800',
    shadow: 'shadow-indigo-500/20',
    tableHeader: 'bg-indigo-700',
  },
};

// Helper to generate a theme from a Tailwind color name
export const generateThemeFromColor = (color: string): PageTheme => {
  const c = color.toLowerCase();
  return {
    primary: `bg-${c}-600`,
    secondary: `bg-${c}-500`,
    accent: `text-${c}-600`,
    muted: `bg-${c}-50`,
    border: `border-${c}-100`,
    gradient: `bg-gradient-to-br from-${c}-600 to-${c}-700`,
    shadow: `shadow-${c}-500/20`,
    tableHeader: `bg-${c}-600`,
  };
};

export const COLOR_FAMILIES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
];

// Standardized color palettes for the Theme Configuration UI
export const PALETTES: Record<string, PageTheme> = COLOR_FAMILIES.reduce((acc, color) => {
  acc[color.toUpperCase()] = generateThemeFromColor(color);
  return acc;
}, {} as Record<string, PageTheme>);

/* TAILWIND SAFELIST FOR DYNAMIC COLORS
bg-slate-600 bg-slate-500 text-slate-600 bg-slate-50 border-slate-100 from-slate-600 to-slate-700 shadow-slate-500/20
bg-gray-600 bg-gray-500 text-gray-600 bg-gray-50 border-gray-100 from-gray-600 to-gray-700 shadow-gray-500/20
bg-zinc-600 bg-zinc-500 text-zinc-600 bg-zinc-50 border-zinc-100 from-zinc-600 to-zinc-700 shadow-zinc-500/20
bg-neutral-600 bg-neutral-500 text-neutral-600 bg-neutral-50 border-neutral-100 from-neutral-600 to-neutral-700 shadow-neutral-500/20
bg-stone-600 bg-stone-500 text-stone-600 bg-stone-50 border-stone-100 from-stone-600 to-stone-700 shadow-stone-500/20
bg-red-600 bg-red-500 text-red-600 bg-red-50 border-red-100 from-red-600 to-red-700 shadow-red-500/20
bg-orange-600 bg-orange-500 text-orange-600 bg-orange-50 border-orange-100 from-orange-600 to-orange-700 shadow-orange-500/20
bg-amber-600 bg-amber-500 text-amber-600 bg-amber-50 border-amber-100 from-amber-600 to-amber-700 shadow-amber-500/20
bg-yellow-600 bg-yellow-500 text-yellow-600 bg-yellow-50 border-yellow-100 from-yellow-600 to-yellow-700 shadow-yellow-500/20
bg-lime-600 bg-lime-500 text-lime-600 bg-lime-50 border-lime-100 from-lime-600 to-lime-700 shadow-lime-500/20
bg-green-600 bg-green-500 text-green-600 bg-green-50 border-green-100 from-green-600 to-green-700 shadow-green-500/20
bg-emerald-600 bg-emerald-500 text-emerald-600 bg-emerald-50 border-emerald-100 from-emerald-600 to-emerald-700 shadow-emerald-500/20
bg-teal-600 bg-teal-500 text-teal-600 bg-teal-50 border-teal-100 from-teal-600 to-teal-700 shadow-teal-500/20
bg-cyan-600 bg-cyan-500 text-cyan-600 bg-cyan-50 border-cyan-100 from-cyan-600 to-cyan-700 shadow-cyan-500/20
bg-sky-600 bg-sky-500 text-sky-600 bg-sky-50 border-sky-100 from-sky-600 to-sky-700 shadow-sky-500/20
bg-blue-600 bg-blue-500 text-blue-600 bg-blue-50 border-blue-100 from-blue-600 to-blue-700 shadow-blue-500/20
bg-indigo-600 bg-indigo-500 text-indigo-600 bg-indigo-50 border-indigo-100 from-indigo-600 to-indigo-700 shadow-indigo-500/20
bg-violet-600 bg-violet-500 text-violet-600 bg-violet-50 border-violet-100 from-violet-600 to-violet-700 shadow-violet-500/20
bg-purple-600 bg-purple-500 text-purple-600 bg-purple-50 border-purple-100 from-purple-600 to-purple-700 shadow-purple-500/20
bg-fuchsia-600 bg-fuchsia-500 text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100 from-fuchsia-600 to-fuchsia-700 shadow-fuchsia-500/20
bg-pink-600 bg-pink-500 text-pink-600 bg-pink-50 border-pink-100 from-pink-600 to-pink-700 shadow-pink-500/20
bg-rose-600 bg-rose-500 text-rose-600 bg-rose-50 border-rose-100 from-rose-600 to-rose-700 shadow-rose-500/20
*/

export const getThemeByPath = (pathname: string): PageTheme => {
  // Exact matches or specific prefixes first
  if (pathname === '/' || pathname.startsWith('/dashboard')) return THEMES.DASHBOARD;
  
  // Vouchers
  if (pathname.startsWith('/vouchers/journal')) return THEMES.JOURNAL;
  if (pathname.startsWith('/vouchers/receipts')) return THEMES.RECEIPTS;
  if (pathname.startsWith('/vouchers/payments')) return THEMES.PAYMENTS;
  if (pathname.startsWith('/vouchers')) return THEMES.JOURNAL;

  // Subscriptions
  if (pathname.startsWith('/subscriptions/members')) return THEMES.MEMBERS;
  if (pathname.startsWith('/subscriptions/collect')) return THEMES.COLLECT;
  if (pathname.startsWith('/subscriptions')) return THEMES.MEMBERS;

  // Settings
  if (pathname.startsWith('/settings/users')) return THEMES.SETTINGS_USERS;
  if (pathname.startsWith('/settings/roles')) return THEMES.SETTINGS_ROLES;
  if (pathname.startsWith('/settings/audit-logs')) return THEMES.SETTINGS_AUDIT;
  if (pathname.startsWith('/settings/entities')) return THEMES.SETTINGS_ENTITIES;
  if (pathname.startsWith('/settings/periods')) return THEMES.SETTINGS_PERIODS;
  if (pathname.startsWith('/settings/permissions')) return THEMES.SETTINGS_ROLES; // Re-use Roles theme for permissions
  if (pathname.startsWith('/settings')) return THEMES.SETTINGS;

  // Reports - UNIQUE THEMES FOR EACH
  if (pathname.startsWith('/reports/trial-balance')) return THEMES.REPORTS_FINANCIAL; // Blue
  if (pathname.startsWith('/reports/income-statement')) return THEMES.REPORTS_EMERALD; // Emerald
  if (pathname.startsWith('/reports/branch-revenue')) return THEMES.REPORTS_CYAN;    // Cyan [NEW]
  if (pathname.startsWith('/reports/branch-expense')) return THEMES.REPORTS_ROSE;    // Rose
  if (pathname.startsWith('/reports/currency-history')) return THEMES.REPORTS_VIOLET; // Violet
  if (pathname.startsWith('/reports/currency-gains')) return THEMES.REPORTS_AMBER;   // Amber
  if (pathname.startsWith('/reports/subscriptions')) return THEMES.REPORTS_INDIGO;   // Indigo [NEW]
  if (pathname.startsWith('/reports/account-statement')) return THEMES.REPORTS;      // Slate
  if (pathname.startsWith('/reports')) return THEMES.REPORTS;

  // Accounts & Profile
  if (pathname.startsWith('/accounts')) return THEMES.REPORTS; // Re-use Reports theme for accounts tree
  if (pathname.startsWith('/profile')) return THEMES.SETTINGS; // Re-use Settings theme for profile
  
  return THEMES.DASHBOARD;
};
