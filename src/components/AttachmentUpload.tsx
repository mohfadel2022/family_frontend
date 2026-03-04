"use client";

import React, { useState } from 'react';
import { Paperclip, X, Loader2, FileText, ImageIcon, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

interface Attachment {
    id?: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
}

interface AttachmentUploadProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
    label?: string;
    disabled?: boolean;
}

const API_BASE = 'http://localhost:4000/api/upload';

export const AttachmentUpload = ({ attachments, onChange, label = "المرفقات", disabled = false }: AttachmentUploadProps) => {
    const [uploading, setUploading] = useState(false);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token') || 'mock-token';
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size limit: 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(API_BASE, formData, {
                headers: {
                    ...getAuthHeader().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const newAttachment: Attachment = {
                fileName: res.data.fileName,
                fileUrl: res.data.fileUrl,
                fileType: res.data.fileType,
                fileSize: res.data.fileSize
            };

            onChange([...attachments, newAttachment]);
            toast.success('تم رفع الملف بنجاح');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('فشل رفع الملف');
        } finally {
            setUploading(false);
            // Clear input
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        onChange(newAttachments);
    };

    const getFileIcon = (type?: string) => {
        if (!type) return FileText;
        if (type.startsWith('image/')) return ImageIcon;
        if (type.startsWith('video/')) return Film;
        return FileText;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <Paperclip size={18} className="text-blue-600" />
                    {label}
                </label>
                {!disabled && (
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-xl border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 font-bold gap-2"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                            {uploading ? 'جاري الرفع...' : 'إضافة ملف'}
                        </Button>
                    </div>
                )}
            </div>

            {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {attachments.map((file, idx) => {
                        const Icon = getFileIcon(file.fileType);
                        return (
                            <div key={idx} className="group relative flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate" title={file.fileName}>
                                        {file.fileName}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        {(file.fileSize ? (file.fileSize / 1024).toFixed(1) : 0)} KB
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <a
                                        href={`http://localhost:4000${file.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all"
                                    >
                                        <FileText size={14} />
                                    </a>
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
