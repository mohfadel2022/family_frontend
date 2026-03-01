"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function SearchableAccountSelect({
    accounts,
    value,
    onChange,
    placeholder,
    onAddNew,
    disabled = false
}: any) {
    const [open, setOpen] = React.useState(false)

    const selectedAccount = accounts.find((acc: any) => acc.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 bg-transparent border-0 border-b-2 border-slate-200 focus:border-blue-500 rounded-none shadow-none font-black text-right outline-none ring-0 focus:ring-0 focus:ring-offset-0 px-2 disabled:opacity-50"
                >
                    <span className="truncate">
                        {selectedAccount
                            ? `${selectedAccount.code} | ${selectedAccount.name}`
                            : placeholder || "اختر الحساب..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] max-w-[95vw] p-0 shadow-2xl border-slate-200 rounded-2xl" align="start" dir="rtl">
                <Command dir="rtl">
                    <CommandInput placeholder="بحث برقم الكود أو الاسم..." className="text-right h-12" />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">لم يتم العثور على حساب.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="--add-new--"
                                onSelect={() => {
                                    onAddNew();
                                    setOpen(false);
                                }}
                                className="flex items-center gap-2 text-blue-600 font-bold cursor-pointer bg-blue-50/50 hover:bg-blue-100/50 my-1 rounded-lg"
                            >
                                <Plus size={16} />
                                إضافة حساب جديد...
                            </CommandItem>
                            {accounts.map((acc: any) => (
                                <CommandItem
                                    key={acc.id}
                                    value={`${acc.code} ${acc.name}`}
                                    onSelect={() => {
                                        onChange(acc.id)
                                        setOpen(false)
                                    }}
                                    className="flex items-center justify-between py-3 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{acc.code}</span>
                                        <span className="font-bold">{acc.name}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "h-4 w-4 text-blue-600",
                                            value === acc.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
