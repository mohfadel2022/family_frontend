"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { APP_ICONS } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionModal } from "@/components/ui/ActionModal";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { META_BASE, getAuthHeader } from "@/lib/api";
import { toast } from "sonner";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.put(`${META_BASE}/me`, { name, username }, getAuthHeader());
            toast.success("تم تحديث الملف الشخصي بنجاح");
            await refreshUser();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "فشل تحديث الملف الشخصي");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={isOpen}
            onClose={onClose}
            title="الملف الشخصي"
            description="عرض وتعديل بيانات ملفك الشخصي الأساسية"
            icon={APP_ICONS.NAV.SETTINGS}
            iconClassName="bg-blue-600 text-white"
            maxWidth="max-w-[425px]"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 mr-1">الاسم الكامل</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="أدخل اسمك الكامل"
                            className="h-12 rounded-2xl bg-muted/50 border-input focus:ring-blue-500 font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 mr-1">اسم المستخدم</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="اسم المستخدم"
                            className="h-12 rounded-2xl bg-muted/50 border-input focus:ring-blue-500 font-bold"
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
                        className="flex-[2] h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all flex gap-2 items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? <APP_ICONS.STATE.LOADING className="animate-spin" size={18} /> : <Save size={18} />}
                        حفظ التغييرات
                    </Button>
                </div>
            </form>
        </ActionModal>
    );
};
