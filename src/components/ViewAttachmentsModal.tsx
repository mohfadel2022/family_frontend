"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileText, ImageIcon, Film, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl text-slate-800">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {attachments.length === 0 ? (
                            <p className="text-center text-slate-400 font-bold py-8">لا توجد مرفقات</p>
                        ) : (
                            attachments.map((file, idx) => {
                                const Icon = getFileIcon(file.fileType);
                                const fileUrl = `http://localhost:4000${file.fileUrl}`;
                                const previewable = isPreviewable(file.fileType);

                                return (
                                    <div key={idx} className="group relative flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-800 truncate" title={file.fileName}>
                                                {file.fileName}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                {(file.fileSize ? (file.fileSize / 1024).toFixed(1) : 0)} KB • {file.fileType || 'Unkown'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {previewable ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-xs rounded-lg"
                                                    onClick={() => setSelectedAttachment(file)}
                                                >
                                                    <ExternalLink size={14} className="mr-1" />
                                                    عرض
                                                </Button>
                                            ) : (
                                                <a
                                                    href={fileUrl}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-8 px-2 inline-flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs rounded-lg transition-all"
                                                >
                                                    <Download size={14} className="mr-1" />
                                                    تحميل
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-2" dir="rtl">
                    <DialogHeader className="px-4 py-2 border-b border-slate-100 flex-none">
                        <DialogTitle className="font-black text-lg text-slate-800 flex justify-between items-center w-full pr-6">
                            <span className="truncate">{selectedAttachment?.fileName}</span>
                            <a
                                href={`http://localhost:4000${selectedAttachment?.fileUrl || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 ml-4 shrink-0"
                            >
                                <ExternalLink size={14} />
                                فتح في نافذة جديدة
                            </a>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 bg-slate-100/50 rounded-xl overflow-hidden relative mt-2">
                        {selectedAttachment && selectedAttachment.fileType?.startsWith('image/') ? (
                            <img
                                src={`http://localhost:4000${selectedAttachment.fileUrl}`}
                                alt={selectedAttachment.fileName}
                                className="w-full h-full object-contain"
                            />
                        ) : selectedAttachment && selectedAttachment.fileType === 'application/pdf' ? (
                            <iframe
                                src={`http://localhost:4000${selectedAttachment.fileUrl}`}
                                className="w-full h-full border-0"
                                title={selectedAttachment.fileName}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                لا يمكن معاينة هذا الملف
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
