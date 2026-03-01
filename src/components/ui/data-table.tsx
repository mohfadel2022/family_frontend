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
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Download,
    FileSpreadsheet,
    FileText as FilePdfIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import { cn } from "@/lib/utils"

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



interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    noDataMessage?: React.ReactNode
    searchPlaceholder?: string
    searchColumn?: string
    exportFileName?: string
    headerClassName?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    noDataMessage = "لا توجد بيانات مسجلة حالياً",
    searchPlaceholder = "بحث...",
    searchColumn,
    exportFileName = "data-export",
    headerClassName = "bg-slate-900"
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
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
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pr-10 bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        className="rounded-xl border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 h-11 px-4 gap-2 font-bold"
                    >
                        <FileSpreadsheet size={18} />
                        إكسل
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="rounded-xl border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 h-11 px-4 gap-2 font-bold"
                    >
                        <FilePdfIcon size={18} />
                        PDF
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                <Table className="w-full text-right" dir="rtl">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className={cn("hover:bg-opacity-90 border-none", headerClassName)}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="py-5 px-6 text-slate-300 font-black text-xs uppercase tracking-wider text-right select-none cursor-pointer hover:text-white transition-colors"
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
                                                    <div className="text-slate-500">
                                                        {{
                                                            asc: <ArrowUp size={14} className="text-blue-400" />,
                                                            desc: <ArrowDown size={14} className="text-blue-400" />,
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
                    <TableBody className="divide-y divide-slate-100">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-slate-50/80 transition-all group border-b-slate-100"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4 px-6 text-right relative font-medium">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-20 text-center">
                                    {noDataMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-white transition-all shadow-sm"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsRight size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-white transition-all shadow-sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronRight size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-white transition-all shadow-sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-white transition-all shadow-sm"
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
