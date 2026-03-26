"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    VisibilityState,
    OnChangeFn,
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    FileSpreadsheet,
    FileText as FilePdfIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePageTheme } from "@/hooks/usePageTheme"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { exportToExcel, exportToPDF } from '@/lib/exportUtils'
import { Button } from "./button"
import { Input } from "./input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    noDataMessage?: React.ReactNode
    searchPlaceholder?: string
    searchColumn?: string
    exportFileName?: string
    headerClassName?: string
    loading?: boolean
    onSearchChange?: (value: string) => void
    pageIndex?: number
    onPageIndexChange?: (index: number) => void
    searchValue?: string
    compact?: boolean
    columnVisibility?: VisibilityState
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>
}

export function DataTable<TData, TValue>({
    columns,
    data,
    noDataMessage = "لا توجد بيانات مسجلة حالياً",
    searchPlaceholder = "بحث...",
    searchColumn,
    exportFileName = "data-export",
    headerClassName,
    loading = false,
    onSearchChange,
    pageIndex,
    onPageIndexChange,
    searchValue = "",
    compact = false,
    columnVisibility,
    onColumnVisibilityChange
}: DataTableProps<TData, TValue>) {
    const theme = usePageTheme();
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = React.useState(searchValue)

    React.useEffect(() => {
        if (searchValue !== globalFilter) {
            setGlobalFilter(searchValue);
        }
    }, [searchValue]);

    const [pagination, setPagination] = React.useState({
        pageIndex: pageIndex ?? 0,
        pageSize: compact ? 15 : 10,
    })

    React.useEffect(() => {
        if (pageIndex !== undefined && pageIndex !== pagination.pageIndex) {
            setPagination(prev => ({ ...prev, pageIndex }));
        }
    }, [pageIndex]);

    const handleGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
        if (onSearchChange) {
            onSearchChange(value);
        }
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: onColumnVisibilityChange,
        autoResetPageIndex: false,
        state: {
            sorting,
            globalFilter,
            pagination,
            columnVisibility,
        },
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: (updater) => {
            const next = typeof updater === 'function' ? updater(pagination) : updater;
            setPagination(next);
            if (onPageIndexChange) {
                onPageIndexChange(next.pageIndex);
            }
        }
    })

    const handleExportExcel = () => {
        const rows = table.getFilteredRowModel().rows.map(row => {
            const rowData: any = {}
            row.getVisibleCells().forEach(cell => {
                const columnDef = cell.column.columnDef
                const header = typeof columnDef.header === 'string' ? columnDef.header : (columnDef as any).headerName || cell.column.id
                if (cell.column.id !== 'actions' && header !== 'actions') {
                    rowData[header] = cell.getValue()
                }
            })
            return rowData
        })

        const headers: string[] = []
        const keys: string[] = []
        table.getAllLeafColumns().forEach(col => {
            if (!col.getIsVisible()) return;
            const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : (col.columnDef as any).headerName || col.id
            if (col.id !== 'actions' && header !== 'actions') {
                headers.push(header)
                keys.push(header)
            }
        })

        exportToExcel(rows, exportFileName, headers, keys)
    }

    const handleExportPDF = () => {
        const headers: string[] = []
        const keys: string[] = []
        table.getAllLeafColumns().forEach(col => {
            if (!col.getIsVisible()) return;
            const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : (col.columnDef as any).headerName || col.id
            if (col.id !== 'actions' && header !== 'actions') {
                headers.push(header)
                keys.push(col.id)
            }
        })

        const tableData = table.getFilteredRowModel().rows.map(row => {
            const rowData: any = {}
            row.getVisibleCells().forEach(cell => {
                rowData[cell.column.id] = cell.getValue()
            })
            return rowData
        })

        exportToPDF(tableData, exportFileName, exportFileName, headers, keys)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="relative flex-1 min-w-[280px] max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(event) => handleGlobalFilterChange(event.target.value)}
                        className="pr-10 bg-muted/50 border-input rounded-xl h-11"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-border text-muted-foreground h-11 px-4 gap-2 font-bold hover:bg-muted/50"
                            >
                                <Settings2 size={18} />
                                الأعمدة
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] rounded-2xl p-2 border-border shadow-2xl">
                            <DropdownMenuLabel className="text-right text-xs font-black uppercase tracking-widest text-muted-foreground/60 py-2">تخصيص الأعمدة</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    const header = typeof column.columnDef.header === 'string' ? column.columnDef.header : (column.columnDef as any).headerName || column.id;
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="font-bold py-2.5 rounded-xl cursor-pointer text-right transition-colors hover:bg-muted"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            dir="rtl"
                                        >
                                            {header}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        className="rounded-xl border-border text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 h-11 px-4 gap-2 font-bold transition-all"
                    >
                        <FileSpreadsheet size={18} />
                        إكسل
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="rounded-xl border-border text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-11 px-4 gap-2 font-bold transition-all"
                    >
                        <FilePdfIcon size={18} />
                        PDF
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-[1.5rem] border border-border overflow-hidden shadow-xl shadow-slate-900/5">
                <Table className="w-full text-right" dir="rtl">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className={cn("hover:bg-opacity-90 border-none", headerClassName || theme.tableHeader)}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "px-2 text-white bg-default dark:text-muted-foreground/80 font-bold text-[10px] uppercase tracking-wider text-right select-none cursor-pointer hover:text-foreground transition-colors",
                                                compact ? "py-2" : "py-5"
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2 justify-end">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanSort() && (
                                                    <div className="text-muted-foreground">
                                                        {{
                                                            asc: <ArrowUp size={14} className="text-blue-500 dark:text-blue-400" />,
                                                            desc: <ArrowDown size={14} className="text-blue-500 dark:text-blue-400" />,
                                                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown size={14} className="opacity-30" />}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="divide-y divide-border/50">
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-muted-foreground/60 font-black text-xs animate-pulse">جاري تحميل البيانات...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-muted/50 transition-all group border-b-border/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cn(
                                            "px-2 text-right relative font-medium",
                                            compact ? "py-1.5 text-[11px]" : "py-4"
                                        )}>
                                            <div className="transition-transform group-hover:translate-x-1 duration-200">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-20 text-center font-bold italic opacity-40">
                                    {noDataMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t border-border">
                    <div className="flex-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        صفحة {table.getPageCount() === 0 ? 0 : table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
                        <span className="mr-4 opacity-40">|</span>
                        <span className="mr-4 capitalize">{data.length} سجل إجمالي</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-border text-muted-foreground hover:bg-accent transition-all shadow-sm"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsRight size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-border text-muted-foreground hover:bg-accent transition-all shadow-sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronRight size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-border text-muted-foreground hover:bg-accent transition-all shadow-sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-border text-muted-foreground hover:bg-accent transition-all shadow-sm"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsLeft size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
