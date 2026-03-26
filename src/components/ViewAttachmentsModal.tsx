"use client";

import React, { useState } from 'react';
import { ActionModal } from '@/components/ui/ActionModal';
import { APP_ICONS } from '@/lib/icons';
import { FileText, ImageIcon, Film, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';

interface Attachment {
    id?: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
}

interface ViewAttachmentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachments: Attachment[];
    title?: string;
}

export const ViewAttachmentsModal = ({ open, onOpenChange, attachments, title = "مرفقات السند" }: ViewAttachmentsModalProps) => {
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

    const getFileIcon = (type?: string) => {
        if (!type) return FileText;
        if (type.startsWith('image/')) return ImageIcon;
        if (type.startsWith('video/')) return Film;
        return FileText;
    };

    const isPreviewable = (type?: string) => {
        if (!type) return false;
        return type.startsWith('image/') || type === 'application/pdf';
    };

    return (
        <>
            <ActionModal
                isOpen={open}
                onClose={() => onOpenChange(false)}
                title={title}
                description="عرض وتحميل الملفات المرفقة بالسند"
                icon={APP_ICONS.ACTIONS.ATTACHMENT}
                iconClassName="bg-blue-600 text-white shadow-blue-100"
                maxWidth="max-w-md"
            >
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                    {attachments.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/40">
                                <APP_ICONS.ACTIONS.ATTACHMENT size={32} />
                            </div>
                            <p className="text-muted-foreground/60 font-black">لا توجد مرفقات لهذا السند</p>
                        </div>
                    ) : (
                        attachments.map((file, idx) => {
                            const Icon = getFileIcon(file.fileType) as any;
                            const fileUrl = `${API_URL.replace('/api', '')}${file.fileUrl}`;
                            const previewable = isPreviewable(file.fileType);

                            return (
                                <div key={idx} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center text-blue-600 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-foreground/90 truncate mb-1" title={file.fileName}>
                                            {file.fileName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground/70 font-bold uppercase tracking-wider">
                                                {file.fileType?.split('/')[1] || 'FILE'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 font-bold">
                                                {(file.fileSize ? (file.fileSize / 1024).toFixed(1) : 0)} KB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {previewable ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-10 px-4 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
                                                onClick={() => setSelectedAttachment(file)}
                                            >
                                                <ExternalLink size={14} />
                                                عرض
                                            </Button>
                                        ) : (
                                            <a
                                                href={fileUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 px-4 inline-flex items-center justify-center bg-card border border-border/50 text-muted-foreground hover:bg-slate-900 hover:text-white font-black text-xs rounded-xl shadow-sm transition-all gap-2"
                                            >
                                                <Download size={14} />
                                                تحميل
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ActionModal>

            <ActionModal
                isOpen={!!selectedAttachment}
                onClose={() => setSelectedAttachment(null)}
                title={selectedAttachment?.fileName || 'معاينة الملف'}
                description="معاينة المرفق المختار مباشرة"
                icon={selectedAttachment ? (getFileIcon(selectedAttachment.fileType) as any) : APP_ICONS.ACTIONS.ATTACHMENT}
                iconClassName="bg-indigo-600 text-white shadow-indigo-100"
                maxWidth="max-w-5xl"
            >
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-none pb-4 flex justify-end">
                        <a
                            href={selectedAttachment ? `${API_URL.replace('/api', '')}${selectedAttachment.fileUrl}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-black text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
                        >
                            <ExternalLink size={14} />
                            فتح في نافذة جديدة
                        </a>
                    </div>
                    
                    <div className="flex-1 bg-muted/20 border border-border/50 rounded-[2rem] overflow-hidden relative shadow-inner">
                        {selectedAttachment && selectedAttachment.fileType?.startsWith('image/') ? (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={`${API_URL.replace('/api', '')}${selectedAttachment.fileUrl}`}
                                    alt={selectedAttachment.fileName}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                />
                            </div>
                        ) : selectedAttachment && selectedAttachment.fileType === 'application/pdf' ? (
                            <iframe
                                src={`${API_URL.replace('/api', '')}${selectedAttachment.fileUrl}`}
                                className="w-full h-full border-0"
                                title={selectedAttachment.fileName}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground/40 font-black">
                                <APP_ICONS.ACTIONS.NOT_FOUND size={48} />
                                لا يمكن معاينة هذا النوع من الملفات
                            </div>
                        )}
                    </div>
                </div>
            </ActionModal>
        </>
    );
};
