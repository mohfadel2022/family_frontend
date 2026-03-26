import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ActionModal } from '@/components/ui/ActionModal';
import { APP_ICONS } from '@/lib/icons';
import { SUB_BASE, META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = SUB_BASE;
const AUTH_HEADER = getAuthHeader();

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
    const [defaultYear, setDefaultYear] = useState<number>(new Date().getFullYear());

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
    const [availableBranches, setAvailableBranches] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [curRes, braRes] = await Promise.all([
                    axios.get(`${META_BASE}/currencies`, AUTH_HEADER),
                    axios.get(`${META_BASE}/branches`, AUTH_HEADER)
                ]);
                setAvailableCurrencies(curRes.data);
                setAvailableBranches(braRes.data);
            } catch (err) {
                console.error('Error fetching meta for import:', err);
            }
        };
        fetchMeta();
    }, []);

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
            const defaultBranch = entities[0]?.branchId || availableBranches.find(b => b.code !== 'FAKE_CODE')?.id || availableBranches[0]?.id;
            const defaultCurrency = entities[0]?.currencyId || availableCurrencies.find(c => c.isBase)?.id || availableCurrencies[0]?.id;

            if (!defaultBranch || !defaultCurrency) {
                toast.error('لا يمكن إنشاء جهة بدون إعدادات الفروع والعملات. يرجى مراجعة إعدادات النظام أولاً.');
                return false;
            }

            const res = await axios.post(`${API_BASE}/entities`, {
                name: entityNameStr === 'بدون جهة' ? 'جهة جديدة (مجهولة)' : entityNameStr,
                code: 'NEW_' + Math.random().toString(36).substring(7).toUpperCase(),
                currencyId: defaultCurrency,
                branchId: defaultBranch,
                annualSubscription: 0
            }, AUTH_HEADER);

            toast.success(`تم إنشاء الجهة الجديدة: ${res.data.name}`);

            setEntityMapping(prev => ({ ...prev, [entityNameStr]: res.data.id }));
            entities.push(res.data);
            setUnresolvedEntities(prev => prev.filter(e => e !== entityNameStr));
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل إنشاء الجهة');
            return false;
        }
    };

    const handleCreateAllEntities = async () => {
        setLoading(true);
        let successCount = 0;
        const unmapped = unresolvedEntities.filter(e => !entityMapping[e]);
        for (const unres of unmapped) {
            const success = await handleCreateEntity(unres);
            if (success) successCount++;
        }
        setLoading(false);
        if (successCount > 0) {
            toast.success(`تم إنشاء ${successCount} جهة تلقائياً`);
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
                rows: finalRows,
                defaultYear: defaultYear
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
            <ActionModal
                isOpen={true}
                onClose={onClose}
                title="استيراد أعضاء من Excel"
                description={
                    step === 1 ? "قم برفع ملف Excel أو CSV يحتوي على بيانات الأعضاء" :
                    step === 2 ? "مراجعة وربط الجهات غير المعرفة" :
                    "تقرير نهاية عملية الاستيراد"
                }
                icon={APP_ICONS.ACTIONS.IMPORT}
                iconClassName="bg-indigo-600 text-white shadow-indigo-100"
                maxWidth="max-w-xl"
                preventClose={true}
                showCloseButton={false}
            >
                <div>
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-[2rem] p-12 bg-muted/30 relative hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer group">
                                {loading ? (
                                    <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                                ) : (
                                    <APP_ICONS.ACTIONS.IMPORT size={40} className="text-muted-foreground/40 group-hover:scale-110 transition-transform mb-4" />
                                )}
                                <h3 className="font-black text-foreground/80 text-lg mb-2">اضغط لاختيار ملف</h3>
                                <p className="text-muted-foreground/60 text-sm font-bold">يقبل صيغ .xlsx و .csv</p>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                />
                            </div>

                            <div className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-3">
                                <label className="text-sm font-black text-foreground/70 flex items-center gap-2 px-1">
                                    <FileSpreadsheet size={16} className="text-indigo-600" />
                                    سنة الانتساب الافتراضية
                                </label>
                                <Input
                                    type="number"
                                    value={defaultYear}
                                    onChange={(e) => setDefaultYear(Number(e.target.value))}
                                    className="h-12 bg-muted/30 font-black rounded-xl border-none text-center text-lg focus-visible:ring-indigo-500"
                                    placeholder="مثال: 2024"
                                />
                                <p className="text-[10px] text-muted-foreground font-bold px-1 leading-relaxed">
                                    هذه السنة ستستخدم في حال لم يتم تحديد "سنة الانتساب" في ملف Excel لكل عضو.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 text-blue-800 p-5 rounded-2xl border border-blue-100/50 text-sm font-bold flex items-start gap-4 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-blue-900 mb-1">تم قراءة {parsedData.length} سجل بنجاح.</p>
                                    <p className="font-medium text-blue-600/80">يجب مطابقة الجهات الموجودة في الملف مع جهات مسجلة في النظام.</p>
                                </div>
                            </div>

                            {unresolvedEntities.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-black text-foreground/80">الجهات غير المعرفة</p>
                                            <p className="text-xs text-muted-foreground font-bold">عدد الجهات: {unresolvedEntities.length}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCreateAllEntities}
                                            className="h-9 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white font-black text-xs rounded-xl shadow-sm transition-all"
                                        >
                                            <PlusCircle size={14} className="ml-2" />
                                            إنشاء الكل تلقائياً
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {unresolvedEntities.map(unres => (
                                            <div key={unres} className="flex flex-col gap-3 p-5 bg-muted/20 rounded-2xl border border-border/50 hover:border-indigo-100 transition-colors">
                                                <div className="font-black text-foreground/90 text-sm break-words flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                                    الجهة في الملف: <span className="text-indigo-600">"{unres}"</span>
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <div className="flex-1">
                                                        <Select value={entityMapping[unres] || ''} onValueChange={v => setEntityMapping(p => ({ ...p, [unres]: v }))}>
                                                            <SelectTrigger className="w-full h-12 bg-card font-bold rounded-xl border-border/50 shadow-sm" dir="rtl">
                                                                <SelectValue placeholder="اختر جهة للربط..." />
                                                            </SelectTrigger>
                                                            <SelectContent dir="rtl" className="rounded-xl shadow-xl border-border/50">
                                                                {entities.map(e => (
                                                                    <SelectItem key={e.id} value={e.id} className="font-bold py-3 focus:bg-indigo-50 focus:text-indigo-600 rounded-lg mx-1">
                                                                        {e.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="h-12 w-12 border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl shadow-sm flex items-center justify-center p-0 shrink-0 transition-all"
                                                        title="إنشاء جهة جديدة"
                                                        onClick={() => handleCreateEntity(unres)}
                                                    >
                                                        <PlusCircle size={20} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-12 px-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/50 text-emerald-700 shadow-sm">
                                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-emerald-100/50 shadow-lg">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="font-black text-2xl mb-2">جميع الجهات مطابقة!</h3>
                                    <p className="font-bold text-emerald-600/70 text-center">يمكنك الآن بدء عملية الاستيراد الفعلي للسجلات بنقرة واحدة.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && report && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100/50 text-center shadow-sm group hover:bg-emerald-50 transition-colors">
                                    <div className="text-4xl font-black text-emerald-600 mb-2 group-hover:scale-110 transition-transform">{report.importedCount}</div>
                                    <div className="text-emerald-800 font-black text-xs uppercase tracking-wider">تم استيراده بنجاح</div>
                                </div>
                                <div className="bg-rose-50/50 p-8 rounded-[2rem] border border-rose-100/50 text-center shadow-sm group hover:bg-rose-50 transition-colors">
                                    <div className="text-4xl font-black text-rose-600 mb-2 group-hover:scale-110 transition-transform">{report.errorsCount}</div>
                                    <div className="text-rose-800 font-black text-xs uppercase tracking-wider">أخطاء غير مستوردة</div>
                                </div>
                            </div>

                            {report.errorsDetails && report.errorsDetails.length > 0 && (
                                <div className="border border-rose-100/50 rounded-[2rem] max-h-56 overflow-hidden bg-card shadow-sm">
                                    <div className="p-4 bg-rose-50 border-b border-rose-100/50 text-rose-800 font-black text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        تفاصيل الأخطاء المكتشفة
                                    </div>
                                    <div className="overflow-y-auto max-h-44 custom-scrollbar">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-muted/30 text-muted-foreground font-black sticky top-0 backdrop-blur-md">
                                                <tr>
                                                    <th className="p-4 border-b border-border/50">سطر</th>
                                                    <th className="p-4 border-b border-border/50">الاسم</th>
                                                    <th className="p-4 border-b border-border/50">الخطأ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30 font-bold text-foreground/80">
                                                {report.errorsDetails.map((err: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                                                        <td className="p-4">{err.row}</td>
                                                        <td className="p-4 text-indigo-600">{err.name || 'مجهول'}</td>
                                                        <td className="p-4 text-rose-600/80">{err.error}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end mt-8 border-t border-border/50 pt-6">
                    {step === 1 ? (
                        <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-xl font-black text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                            إلغاء
                        </Button>
                    ) : step === 2 ? (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-12 px-8 rounded-xl font-black text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                                سابق
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={loading || unresolvedEntities.some(e => !entityMapping[e])}
                                className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        بدء الاستيراد الفعلي
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} className="h-12 w-full bg-slate-900 hover:bg-black text-white font-black rounded-[1.25rem] shadow-lg shadow-slate-100 transition-all">
                            إغلاق التقرير و العودة
                        </Button>
                    )}
                </div>
            </ActionModal>
    );
};
