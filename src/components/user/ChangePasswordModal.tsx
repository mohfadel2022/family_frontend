"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { APP_ICONS } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionModal } from "@/components/ui/ActionModal";
import axios from "axios";
import { META_BASE, getAuthHeader } from "@/lib/api";
import { toast } from "sonner";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("كلمات المرور الجديدة غير متطابقة");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        setLoading(true);

        try {
            await axios.put(`${META_BASE}/me/password`, {
                currentPassword,
                newPassword
            }, getAuthHeader());

            toast.success("تم تغيير كلمة المرور بنجاح");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "فشل تغيير كلمة المرور");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={isOpen}
            onClose={onClose}
            title="تغيير كلمة المرور"
            description="قم بتحديث كلمة مرورك لضمان أمان حسابك"
            icon={APP_ICONS.ACTIONS.LOCK}
            iconClassName="bg-rose-500 text-white"
            maxWidth="max-w-[425px]"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 mr-1">كلمة المرور الحالية</label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl bg-muted/50 border-input focus:ring-rose-500 font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 mr-1">كلمة المرور الجديدة</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl bg-muted/50 border-input focus:ring-rose-500 font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 mr-1">تأكيد كلمة المرور الجديدة</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl bg-muted/50 border-input focus:ring-rose-500 font-bold"
                            required
                        />
                    </div>
                </div>
                
                <div className="pt-6 border-t border-border/50 flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl font-bold border-none"
                        disabled={loading}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] h-12 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 transition-all flex gap-2 items-center justify-center font-black"
                        disabled={loading}
                    >
                        {loading ? <APP_ICONS.STATE.LOADING className="animate-spin" size={18} /> : <Check size={18} />}
                        تغيير كلمة المرور
                    </Button>
                </div>
            </form>
        </ActionModal>
    );
};
