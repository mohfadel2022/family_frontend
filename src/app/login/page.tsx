"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    HeartHandshake
} from 'lucide-react';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });

    return (
        <div className="min-h-screen grow flex items-center justify-center bg-slate-50 p-4 -m-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex p-4 rounded-3xl bg-blue-600 shadow-xl shadow-blue-200 mb-6">
                        <HeartHandshake size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">نظام صندوق العائلة</h1>
                    <p className="text-slate-500 mt-2">تسجيل الدخول لإدارة الحسابات والمساعدات الخيرية</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 mr-1">اسم المستخدم</label>
                            <div className="relative group">
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="أدخل اسم المستخدم..."
                                    className="w-full py-3 pr-11 pl-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full py-3 pr-11 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">تذكرني</span>
                        </label>
                        <button className="text-blue-600 font-bold hover:underline">نسيت كلمة المرور؟</button>
                    </div>

                    <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-3">
                        <ShieldCheck size={22} />
                        دخول للنظام
                    </button>

                    <div className="relative pt-4 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <span className="relative px-4 bg-white text-xs text-slate-400 font-bold uppercase tracking-widest">Family Charity Fund</span>
                    </div>
                </div>

                <p className="text-center text-slate-400 text-sm italic">
                    بوصولك لهذا النظام، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالصندوق.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
