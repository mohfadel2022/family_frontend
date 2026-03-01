"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning" | "success"
    isLoading?: boolean
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    variant = "default",
    isLoading = false,
}: ConfirmationDialogProps) {

    const getIcon = () => {
        switch (variant) {
            case "destructive":
                return <Trash2 className="text-rose-500" size={24} />
            case "warning":
                return <AlertTriangle className="text-amber-500" size={24} />
            case "success":
                return <CheckCircle2 className="text-emerald-500" size={24} />
            default:
                return <Info className="text-blue-500" size={24} />
        }
    }

    const getVariantStyles = () => {
        switch (variant) {
            case "destructive":
                return "bg-rose-50 text-rose-600 border-rose-100"
            case "warning":
                return "bg-amber-50 text-amber-600 border-amber-100"
            case "success":
                return "bg-emerald-50 text-emerald-600 border-emerald-100"
            default:
                return "bg-blue-50 text-blue-600 border-blue-100"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem]" dir="rtl">
                <div className="p-8">
                    <div className="flex items-start gap-5">
                        <div className={cn("p-4 rounded-2xl border shrink-0", getVariantStyles())}>
                            {getIcon()}
                        </div>
                        <div className="space-y-2 text-right">
                            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50/80 backdrop-blur-sm p-6 flex flex-row-reverse gap-3 rounded-b-[1.5rem]">
                    <Button
                        type="button"
                        variant={variant === "destructive" ? "destructive" : "default"}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={cn(
                            "min-w-28 rounded-xl font-black shadow-lg transition-all active:scale-95",
                            variant === "default" && "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
                            variant === "success" && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        )}
                    >
                        {isLoading ? "جاري المعالجة..." : confirmText}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="min-w-24 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50"
                    >
                        {cancelText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
