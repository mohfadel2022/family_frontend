import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE = 'http://localhost:4000/api/subscriptions';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

interface Props {
    onClose: () => void;
    entities: any[];
    onSuccess: () => void;
}

export const ImportMembersModal = ({ onClose, entities, onSuccess }: Props) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileName, setFileName] = useState('');
    const [parsedData, setParsedData] = useState<any[]>([]);

    const [unresolvedEntities, setUnresolvedEntities] = useState<string[]>([]);
    const [entityMapping, setEntityMapping] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                processParsedData(data);
            } catch (err) {
                toast.error('فشل في قراءة الملف. تأكد من أنه بصيغة Excel الصحيحة.');
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const processParsedData = (data: any[]) => {
        if (!data || data.length === 0) {
            toast.error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
            setLoading(false);
            return;
        }

        const normalizedPropsData = data.map(row => {
            const getVal = (keys: string[]) => {
                for (const key of keys) {
                    const match = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
                    if (match && row[match]) return String(row[match]).trim();
                }
                return null;
            };

            return {
                name: getVal(['الاسم', 'اسم العضو', 'name', 'full name']),
                entityStr: getVal(['الجهة', 'entity', 'جهة الانتساب']),
                affiliationYear: getVal(['سنة الانتساب', 'سنة التوظيف', 'الانتساب', 'aff year', 'year', 'affiliation year']),
                status: getVal(['الحالة', 'status', 'estado']),
                stoppedAt: getVal(['سنة التوقف', 'تاريخ التوقف', 'stopped at', 'stopped year']),
                phone: getVal(['الهاتف', 'رقم الهاتف', 'phone', 'tel']),
                // Manager mapping wouldn't be easy to automate by name from excel perfectly, but let's allow it as field
                managerText: getVal(['رقم المسؤول', 'المسؤول', 'manager'])
            };
        });

        const missingOrUnknownEntities = new Set<string>();
        normalizedPropsData.forEach(row => {
            if (!row.entityStr) {
                missingOrUnknownEntities.add('بدون جهة');
                return;
            }
            // Check if string matches any existing entity by name
            const exactMatch = entities.find(e => e.name.trim().toLowerCase() === row.entityStr?.toLowerCase());
            if (exactMatch) {
                setEntityMapping(prev => ({ ...prev, [row.entityStr!]: exactMatch.id }));
            } else {
                missingOrUnknownEntities.add(row.entityStr);
            }
        });

        setParsedData(normalizedPropsData);
        setUnresolvedEntities(Array.from(missingOrUnknownEntities));
        setStep(2);
        setLoading(false);
    };

    const handleCreateEntity = async (entityNameStr: string) => {
        try {
            // Pick the first branch id we can find from existing entities to create a default one
            const defaultBranch = entities[0]?.branchId;
            const defaultCurrency = entities[0]?.currencyId;
            if (!defaultBranch || !defaultCurrency) throw new Error('لا توجد إعدادات افتراضية لإنشاء جهة');

            const res = await axios.post(`${API_BASE}/entities`, {
                name: entityNameStr === 'بدون جهة' ? 'جهة جديدة (مجهولة)' : entityNameStr,
                code: 'NEW_' + Math.random().toString(36).substring(7).toUpperCase(),
                currencyId: defaultCurrency,
                branchId: defaultBranch,
                annualSubscription: 0
            }, AUTH_HEADER);

            toast.success(`تم إنشاء الجهة الجديدة: ${res.data.name}`);

            // Add to mapping
            setEntityMapping(prev => ({ ...prev, [entityNameStr]: res.data.id }));

            // Update entity list internally if needed or assume mapping works
            entities.push(res.data);

            setUnresolvedEntities(prev => prev.filter(e => e !== entityNameStr));

        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل إنشاء الجهة');
        }
    };

    const handleImport = async () => {
        // Validate all mapped
        const unmapped = unresolvedEntities.filter(e => !entityMapping[e]);
        if (unmapped.length > 0) {
            return toast.error('يرجى ربط جميع الجهات قبل الاستيراد');
        }

        // Format for backend
        const finalRows = parsedData.map(row => {
            const eId = entityMapping[row.entityStr || 'بدون جهة'];
            return {
                ...row,
                entityId: eId
            };
        });

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/members/import`, {
                filename: fileName,
                rows: finalRows
            }, AUTH_HEADER);

            setReport(res.data);
            setStep(3);
            toast.success('تم الانتهاء من عملية الاستيراد');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل عملية الاستيراد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100">
                    <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <FileSpreadsheet className="text-indigo-600" />
                        استيراد أعضاء من Excel
                    </DialogTitle>
                    <p className="text-slate-500 font-medium text-sm mt-2">
                        {step === 1 && "قم برفع ملف Excel أو CSV يحتوي على بيانات الأعضاء"}
                        {step === 2 && "مراجعة وربط الجهات غير المعرفة"}
                        {step === 3 && "تقرير نهاية عملية الاستيراد"}
                    </p>
                </DialogHeader>

                <div className="p-8">
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50 relative hover:bg-slate-100 hover:border-indigo-400 transition-all">
                            {loading ? (
                                <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                            ) : (
                                <Upload size={40} className="text-slate-400 mb-4" />
                            )}
                            <h3 className="font-bold text-slate-700 text-lg mb-2">اضغط لاختيار ملف</h3>
                            <p className="text-slate-400 text-sm">يقبل صيغ .xlsx و .csv</p>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-sm font-bold flex items-start gap-3">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <p>تم قراءة {parsedData.length} سجل بنجاح.</p>
                                    <p className="font-medium text-blue-600 mt-1">يجب مطابقة الجهات الموجودة في الملف مع جهات مسجلة في النظام.</p>
                                </div>
                            </div>

                            {unresolvedEntities.length > 0 ? (
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                    {unresolvedEntities.map(unres => (
                                        <div key={unres} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="font-bold text-slate-800 break-words line-clamp-2">الجهة في الملف: <span className="text-indigo-600">"{unres}"</span></div>
                                            <div className="flex gap-2 w-full">
                                                <div className="flex-1">
                                                    <Select value={entityMapping[unres] || ''} onValueChange={v => setEntityMapping(p => ({ ...p, [unres]: v }))}>
                                                        <SelectTrigger className="w-full h-11 bg-white font-bold" dir="rtl">
                                                            <SelectValue placeholder="اختر جهة للربط..." />
                                                        </SelectTrigger>
                                                        <SelectContent dir="rtl">
                                                            {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="h-11 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold shrink-0"
                                                    onClick={() => handleCreateEntity(unres)}
                                                >
                                                    <PlusCircle size={16} className="mr-2" /> جديد
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center p-8 bg-emerald-50 rounded-2xl text-emerald-700">
                                    <CheckCircle2 size={40} className="mb-4" />
                                    <h3 className="font-black text-lg">جميع الجهات مطابقة!</h3>
                                    <p className="font-medium mt-1">يمكنك الآن بدء عملية الاستيراد الفعلي للسجلات.</p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold">إلغاء</Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={loading || unresolvedEntities.some(e => !entityMapping[e])}
                                    className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'بدء الاستيراد'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && report && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                                    <div className="text-3xl font-black text-emerald-600 mb-1">{report.importedCount}</div>
                                    <div className="text-emerald-800 font-bold text-sm">تم استيراده بنجاح</div>
                                </div>
                                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center">
                                    <div className="text-3xl font-black text-rose-600 mb-1">{report.errorsCount}</div>
                                    <div className="text-rose-800 font-bold text-sm">أخطاء غير مستوردة</div>
                                </div>
                            </div>

                            {report.errorsDetails && report.errorsDetails.length > 0 && (
                                <div className="border border-rose-100 rounded-2xl max-h-48 overflow-y-auto bg-white">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-rose-50 text-rose-800 font-bold sticky top-0">
                                            <tr>
                                                <th className="p-3 border-b border-rose-100">سطر</th>
                                                <th className="p-3 border-b border-rose-100">الاسم</th>
                                                <th className="p-3 border-b border-rose-100">الخطأ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-rose-50 font-medium text-slate-700">
                                            {report.errorsDetails.map((err: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="p-3">{err.row}</td>
                                                    <td className="p-3 text-rose-600">{err.name || 'مجهول'}</td>
                                                    <td className="p-3">{err.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <Button onClick={onClose} className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black rounded-xl">
                                إغلاق النافذة
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
