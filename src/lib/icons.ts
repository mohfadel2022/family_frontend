import {
    LayoutDashboard,
    FileText,
    Receipt,
    PieChart,
    Shield,
    Settings,
    Settings2,
    LogOutIcon,
    FilePlus2,
    X,
    ChevronDown,
    ChevronRight,
    Library,
    Coins,
    Building2,
    AlertTriangle,
    UserCheck,
    Wallet,
    Users,
    User,
    Menu,
    History,
    Table,
    FilePieChart,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    TrendingUp,
    TrendingDown,
    Search,
    Landmark,
    CloudDownload,
    Eye,
    Edit3,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Plus,
    Lock,
    Unlock,
    Info,
    Database,
    MapPin,
    Download,
    UploadCloud,
    FileSearch,
    Ticket,
    Printer,
    RefreshCcw,
    Loader2,
    ChevronLeft,
    Sun,
    Monitor,
    Moon,
    UserX,
    Activity,
    CalendarDays,
    ShieldAlert,
    ArrowRight,
    ArrowLeft,
    Ghost,
    Home,
    HelpCircle,
    Check,
    AlertCircle,
    List,
    Filter,
    RotateCcw,
    Paperclip,
    ArrowLeftRight,
    ArrowDownToLine,
    RefreshCw,
    UserMinus,
    Phone,
    UserCircle,
    Briefcase,
    EyeOff,
    FileSpreadsheet,
    FileDown,
    ArrowUpDown,
    Folder,
    ChevronsDownUp,
    ChevronsUpDown,
    ShieldCheck,
    FilePlus,
    Send,
    FilterX,
    Clock,
    FileEdit,
    FileX,
    FileOutput,
    FileInput,
    Key,
    MinusSquare,
    PlusSquare,
    FileQuestion,
    ListTree,
    SearchX,
    Mail,
    ArrowUpToLine,
    Palette,
    MoreHorizontal,
    Bell,
    ClipboardList,
    BarChart4
} from "lucide-react";

/**
 * APP_ICONS
 * A centralized registry of all icons used in the application.
 * This ensures consistency across Sidebar, Page Headers, and Role Permissions.
 */
export const APP_ICONS = {
    // ─── Main Navigation (Sidebar Groups) ────────────────────────────────────
    NAV: {
        DASHBOARD: LayoutDashboard,
        VOUCHERS: FileText,           // Sidebar group icon
        SUBSCRIPTIONS: UserCheck,      // Sidebar group icon
        ANALYTICS: Library,
        SETTINGS: Settings,
        LOGOUT: LogOutIcon,
        ACCOUNTS: Library,
        THEMES: Palette,
        DEFAULT: Lock,
    },

    // ─── Modules & Pages ─────────────────────────────────────────────────────
    MODULES: {
        DASHBOARD: LayoutDashboard,
        
        // Vouchers
        JOURNAL: ArrowLeftRight,
        RECEIPTS: ArrowUpToLine,
        PAYMENTS: ArrowDownToLine,
        
        // Subscriptions
        ENTITIES: Building2,
        MEMBERS: Users,
        COLLECT: Wallet,
        COLLECT_HISTORY: History,
        SUBSCRIPTIONS: Ticket,
        STATUS: {
            ACTIVE: UserCheck,
            INACTIVE: UserMinus,
            DECEASED: UserX
        },
        
        // Analytics & Accounts
        ACCOUNTS: Library,
        ACCOUNTS_TREE: ListTree,
        ACCOUNT_FOLDER: Folder,
        ACCOUNT_LEAF: FileText,
        
        // Settings
        GENERAL_SETTINGS: Settings,
        USERS: Users,
        ROLES: Shield,
        PERMISSIONS: Key,
        PERIODS: History,
        AUDIT: Activity,
        DATABASE: CloudDownload,
        CURRENCIES: Coins,
        BRANCHES: MapPin
    },

    // ─── Reports Dashboard ───────────────────────────────────────────────────
    REPORTS: {
        MAIN: PieChart,
        TRIAL_BALANCE: Table,
        INCOME_STATEMENT: FilePieChart,
        ACCOUNT_STATEMENT: FileText,
        BRANCH_REVENUE: ArrowUpRight,
        BRANCH_EXPENSE: ArrowDownRight,
        EXCHANGE_GAINS: Globe,
        CURRENCY_HISTORY: History,
        SUBSCRIPTION_PIVOT: FileSpreadsheet,
        SUBSCRIPTION_SUMMARY: BarChart4,
        SEARCH: Search
    },

    // ─── Shared UI & Actions ─────────────────────────────────────────────────
    ACTIONS: {
        ADD: Plus,
        PLUS: Plus,
        EDIT: Edit3,
        EDIT_ALT: Edit2,
        DELETE: Trash2,
        VIEW: Eye,
        HIDE: EyeOff,
        EXPORT: Download,
        IMPORT: UploadCloud,
        EXEMPT: ShieldCheck,
        SAVE: CheckCircle2,
        CANCEL: XCircle,
        INCOME: TrendingUp,
        PAYMENT: ArrowDownToLine,
        SEARCH: Search,
        PRINT: Printer,
        REFRESH: RefreshCcw,
        INFO: Info,
        LOCK: Lock,
        UNLOCK: Unlock,
        X: X,
        MORE_HORIZONTAL: MoreHorizontal,
        CHEVRON_DOWN: ChevronDown,
        DOWN: ChevronDown,
        CHEVRON_RIGHT: ChevronRight,
        CHEVRON_LEFT: ChevronLeft,
        ACTIVITY: Activity,
        INACTIVE: UserX,
        CALENDAR: CalendarDays,
        GROWTH: TrendingUp,
        LOSS: TrendingDown,
        MENU: Menu,
        PROFILE: User,
        SHIELD_ALERT: ShieldAlert,
        ARROW_RIGHT: ArrowRight,
        ARROW_LEFT: ArrowLeft,
        SEARCH_X: SearchX,
        GHOST: Ghost,
        HOME: Home,
        HELP: HelpCircle,
        LIST: List,
        FILTER: Filter,
        UNDO: RotateCcw,
        ATTACHMENT: Paperclip,
        CHECK: Check,
        SPREADSHEET: FileSpreadsheet,
        FILE_DOWN: FileDown,
        SORT: ArrowUpDown,
        COLLAPSE_ALL: ChevronsDownUp,
        EXPAND_ALL: ChevronsUpDown,
        SHIELD_CHECK: ShieldCheck,
        FILE_PLUS: FilePlus,
        FILE_SEARCH: FileSearch,
        FILE_EDIT: FileEdit,
        FILE_X: FileX,
        FILE_OUTPUT: FileOutput,
        FILE_INPUT: FileInput,
        KEY: Key,
        MINUS_SQUARE: MinusSquare,
        PLUS_SQUARE: PlusSquare,
        SEND: Send,
        FILTER_X: FilterX,
        CLOCK: Clock,
        NOT_FOUND: SearchX
    },
    
    // ─── Misc & State ────────────────────────────────────────────────────────
    STATE: {
        SUCCESS: CheckCircle2,
        WARNING: AlertTriangle,
        ERROR: XCircle,
        INFO: Info,
        LOADING: Loader2
    },

    // ─── Shared Utilities ────────────────────────────────────────────────────
    SHARED: {
        CALENDAR: CalendarDays,
        GLOBE: Globe,
        PHONE: Phone,
        USER: UserCircle,
        BRIEFCASE: Briefcase,
        RECEIPT: Receipt,
        LANDMARK: Landmark,
        ARROW_SWITCH: ArrowLeftRight,
        BELL: Bell,
        TASKS: ClipboardList,
        EMAIL: Mail
    },

    // ─── Theme ──────────────────────────────────────────────────────────────
    THEME: {
        LIGHT: Sun,
        DARK: Moon,
        SYSTEM: Monitor
    }
} as const;

// Types for better developer experience
export type AppIconType = keyof typeof APP_ICONS;
export type AppNavIconType = keyof typeof APP_ICONS.NAV;
export type AppModuleIconType = keyof typeof APP_ICONS.MODULES;
export type AppReportIconType = keyof typeof APP_ICONS.REPORTS;
export type AppActionIconType = keyof typeof APP_ICONS.ACTIONS;
