"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { usePageTheme } from '@/hooks/usePageTheme';
import { usePageThemeContext } from '@/context/PageThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { API_BASE, getAuthHeader } from '@/lib/api';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PALETTES, PageTheme, getThemeByPath } from '@/lib/themes';
import { SIDEBAR_STRUCTURE } from '@/lib/nav';

// ─── CSS hex values for each Tailwind color at -600 shade ─────────────────────
const COLOR_HEX: Record<string, string> = {
    slate: '#475569', gray: '#4b5563', zinc: '#52525b', neutral: '#525252', stone: '#57534e',
    red: '#dc2626', orange: '#ea580c', amber: '#d97706', yellow: '#ca8a04', lime: '#65a30d',
    green: '#16a34a', emerald: '#059669', teal: '#0d9488', cyan: '#0891b2', sky: '#0284c7',
    blue: '#2563eb', indigo: '#4f46e5', violet: '#7c3aed', purple: '#9333ea',
    fuchsia: '#c026d3', pink: '#db2777', rose: '#e11d48',
};


const COLOR_GROUPS = [
    { label: 'محايد', colors: ['slate', 'gray', 'zinc', 'neutral', 'stone'] },
    { label: 'دافئ', colors: ['red', 'orange', 'amber', 'yellow', 'lime'] },
    { label: 'بارد', colors: ['green', 'emerald', 'teal', 'cyan', 'sky'] },
    { label: 'بنفسجي / ورديّ', colors: ['blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] },
];

// Recursive helper to get all items with a path from nested structures
function getDeepItems(items: any[], groupTitle: string, parentName?: string): { name: string, path: string }[] {
    let result: { name: string, path: string }[] = [];
    for (const item of items) {
        const displayName = parentName ? `${parentName} > ${item.title}` : item.title;
        if (item.href) {
            result.push({ name: `${groupTitle} - ${displayName}`, path: item.href });
        }
        if (item.items && item.items.length > 0) {
            result = [...result, ...getDeepItems(item.items, groupTitle, displayName)];
        }
    }
    return result;
}

// Extract all flat items for theme selection
const APP_SECTIONS = SIDEBAR_STRUCTURE.flatMap(group => {
    const deepItems = getDeepItems(group.items || [], group.title);
    if ('href' in group && group.href) {
        return [{ name: group.title, path: group.href as string }, ...deepItems];
    }
    return deepItems;
}).filter((v, i, a) => v.path && a.findIndex(t => t.path === v.path) === i);

// Grouped sections for the UI
const APP_GROUPS = SIDEBAR_STRUCTURE.map(group => {
    const deepItems = getDeepItems(group.items || [], group.title).map(it => ({
        name: it.name.split(' - ')[1] || it.name,
        path: it.path
    }));
    
    let finalItems = deepItems;
    if ('href' in group && group.href) {
        finalItems = [{ name: 'الصفحة الرئيسية للقسم', path: group.href as string }, ...deepItems];
    }
    return {
        title: group.title,
        items: finalItems.filter((v, i, a) => v.path && a.findIndex(t => t.path === v.path) === i)
    };
}).filter(g => g.items.length > 0);

// ─── ThemePreview ──────────────────────────────────────────────────────────────
const ThemePreview = ({ theme, colorName, hex, sectionName }: { theme: PageTheme, colorName: string, hex: string, sectionName: string }) => {
    return (
        <div className={cn("p-6 rounded-[2.5rem] border bg-card/50 backdrop-blur-sm transition-all duration-700 shadow-2xl relative overflow-hidden group", theme.border)}>
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-all duration-700 group-hover:scale-150"
                style={{ backgroundColor: hex }} />
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between border-b pb-4 border-border/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-foreground/80">{sectionName}</h4>
                            <div className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-muted text-foreground/50">
                                معاينة
                            </div>
                        </div>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md inline-block" style={{ backgroundColor: hex }} />
                            {colorName}
                        </p>
                    </div>
                    <div className="p-3 rounded-2xl shadow-lg transition-all duration-500" style={{ backgroundColor: hex }}>
                        <APP_ICONS.NAV.THEMES size={20} className="text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Buttons & Badges */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black opacity-30 uppercase">UI Elements</p>
                        <div className="flex flex-wrap gap-3">
                            <button className="rounded-xl font-black text-xs px-5 h-9 text-white shadow-lg" style={{ backgroundColor: hex }}>
                                زر أساسي
                            </button>
                            <div className="px-3 py-1.5 rounded-full font-black text-[10px]" style={{ backgroundColor: hex + '18', color: hex }}>
                                حالة نشطة
                            </div>
                        </div>
                        <button className="rounded-xl font-black text-xs px-5 h-9 border-2 w-full" style={{ borderColor: hex + '40', color: hex }}>
                            زر بإطار ملون
                        </button>
                    </div>
                    {/* Table Header */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black opacity-30 uppercase">Table Layout</p>
                        <div className="overflow-hidden rounded-2xl border border-border shadow-md">
                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: hex }}>
                                <span className="text-white font-black text-[10px]">البيانات</span>
                                <span className="text-white font-black text-[10px]">القيمة</span>
                            </div>
                            <div className="p-3 bg-secondary/10 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
                                <span className="text-[10px] font-bold opacity-60">نموذج لبيان مالي...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ThemeSettingsPage() {
    const page_theme = usePageTheme();
    const { themes, refreshThemes } = usePageThemeContext();

    const [selectedPath, setSelectedPath] = useState<string>(APP_SECTIONS[0]?.path || '');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // Group expansion state (all expanded by default)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        APP_GROUPS.forEach(g => { initial[g.title] = true; });
        return initial;
    });

    // Pending changes: path -> color name (not yet saved)
    const [pendingColors, setPendingColors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Get saved config for a path
    const getSavedColor = useCallback((path: string) => {
        return themes.find(t => t.path === path)?.colorName || null;
    }, [themes]);

    // Get system default color name for a path
    const getDefaultColor = useCallback((path: string) => {
        const defaultTheme = getThemeByPath(path);
        // Extract color name from primary class (e.g., 'bg-blue-600' -> 'blue', 'bg-emerald-700' -> 'emerald')
        const match = defaultTheme.primary.match(/bg-([a-z]+)-/);
        return match ? match[1] : 'blue';
    }, []);

    // Get the currently active color for the selected path (pending > saved > default)
    const activeColor = useMemo(() => {
        if (selectedPath && pendingColors[selectedPath] !== undefined) return pendingColors[selectedPath];
        return (selectedPath ? getSavedColor(selectedPath) : null) || getDefaultColor(selectedPath);
    }, [pendingColors, selectedPath, getSavedColor, getDefaultColor]);

    const sectionName = useMemo(() => APP_SECTIONS.find(s => s.path === selectedPath)?.name || '', [selectedPath]);
    const previewTheme = PALETTES[activeColor.toUpperCase()] || PALETTES.BLUE;
    const previewHex = COLOR_HEX[activeColor.toLowerCase()] || '#2563eb';

    const hasPending = selectedPath ? pendingColors[selectedPath] !== undefined : false;
    const savedColor = getSavedColor(selectedPath);
    const isCustomized = !!savedColor;

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // When color is changed in picker - only updates preview, not the page theme
    const handleColorChange = (color: string) => {
        setPendingColors(prev => ({ ...prev, [selectedPath]: color }));
        setDropdownOpen(false);
    };

    const handleSave = async () => {
        const colorToSave = selectedPath ? pendingColors[selectedPath] : null;
        if (!colorToSave) {
            toast.error('يرجى اختيار لون مختلف أولاً');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/meta/themes`, {
                method: 'PATCH',
                headers: { ...getAuthHeader().headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: selectedPath, colorName: colorToSave }),
            });
            if (res.ok) {
                toast.success('تم حفظ اللون بنجاح');
                setPendingColors(prev => {
                    const next = { ...prev };
                    delete next[selectedPath];
                    return next;
                });
                await refreshThemes();
            } else {
                const errBody = await res.json().catch(() => ({}));
                toast.error(`فشل الحفظ (${res.status}): ${errBody?.error || 'خطأ غير معروف'}`);
            }
        } catch (e: any) {
            toast.error(`خطأ في الاتصال: ${e?.message || e}`);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        // If only a pending (unsaved) change, just clear it locally — no API needed
        if (!savedColor) {
            setPendingColors(prev => {
                const next = { ...prev };
                delete next[selectedPath];
                return next;
            });
            toast.success('تم إلغاء التغيير');
            return;
        }

        setResetting(true);
        try {
            const res = await fetch(`${API_BASE}/meta/themes`, {
                method: 'DELETE',
                headers: { ...getAuthHeader().headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: selectedPath }),
            });
            if (res.ok) {
                toast.success('تمت إعادة اللون الافتراضي');
                setPendingColors(prev => {
                    const next = { ...prev };
                    delete next[selectedPath];
                    return next;
                });
                await refreshThemes();
            } else {
                toast.error('فشل الإعادة للافتراضي');
            }
        } catch {
            toast.error('خطأ في الاتصال');
        } finally {
            setResetting(false);
        }
    };

    const pendingCount = Object.keys(pendingColors).length;

    return (
        <ProtectedRoute permission="THEMES_VIEW">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
                <PageHeader
                    icon={APP_ICONS.NAV.THEMES}
                    title="سمات ألوان النظام"
                    description="تخصيص الهوية البصرية لجميع أقسام التطبيق"
                >
                    <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-[10px] font-black flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {pendingCount} تغييرات غير محفوظة
                            </div>
                        )}
                        <div className={cn("px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-3", page_theme.muted, page_theme.border)}>
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", page_theme.primary)} />
                            <span className={cn("font-black text-[10px] tracking-tight uppercase", page_theme.accent)}>Admin Mode</span>
                        </div>
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Section List */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-card rounded-[2.5rem] border shadow-xl overflow-hidden flex flex-col h-[650px]">
                            <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
                                <h3 className="font-black text-[13px] flex items-center gap-2">
                                    <APP_ICONS.ACTIONS.LIST size={18} className="opacity-50" />
                                    أقسام التطبيق
                                </h3>
                                <div className="text-[10px] font-bold opacity-30 uppercase">{APP_SECTIONS.length} Sections</div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                                {APP_GROUPS.map((group, groupIdx) => {
                                    const isExpanded = expandedGroups[group.title];
                                    return (
                                        <div key={groupIdx} className="space-y-1">
                                            <button
                                                onClick={() => toggleGroup(group.title)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors group/header"
                                            >
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                    {group.title}
                                                </h4>
                                                <APP_ICONS.ACTIONS.CHEVRON_DOWN
                                                    size={14}
                                                    className={cn(
                                                        "text-foreground/40 transition-transform duration-300",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            </button>
                                            
                                            <div className={cn(
                                                "space-y-1 overflow-hidden transition-all duration-300",
                                                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                            )}>
                                                {group.items.map((section) => {
                                                    const pending = pendingColors[section.path];
                                                    const saved = getSavedColor(section.path);
                                                    const defColor = getDefaultColor(section.path);
                                                    const displayColor = pending ?? saved ?? defColor;
                                                    const dotHex = COLOR_HEX[displayColor.toLowerCase()] || '#64748b';
                                                    const hasPendingChange = pending !== undefined;

                                                    return (
                                                        <button
                                                            key={section.path}
                                                            onClick={() => setSelectedPath(section.path)}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group text-right",
                                                                selectedPath === section.path
                                                                    ? "shadow-lg scale-[1.01]"
                                                                    : "hover:bg-muted/50 text-foreground/60 hover:text-foreground"
                                                            )}
                                                            style={{
                                                                backgroundColor: selectedPath === section.path ? `${dotHex}15` : undefined,
                                                                color: selectedPath === section.path ? dotHex : undefined
                                                            }}
                                                        >
                                                            <div className="w-3 h-3 rounded-full shrink-0 transition-all duration-500 shadow-sm"
                                                                style={{ backgroundColor: dotHex,
                                                                    boxShadow: selectedPath === section.path ? `0 0 0 3px ${dotHex}30` : undefined
                                                                }} />
                                                            <div className="flex flex-col items-start overflow-hidden flex-1">
                                                                <span className="text-xs font-black truncate w-full">{section.name}</span>
                                                                <span className={cn(
                                                                    "text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1",
                                                                    selectedPath === section.path ? "opacity-50" : "opacity-30"
                                                                )}>
                                                                    {hasPendingChange && <span className="w-1 h-1 rounded-full bg-amber-400 inline-block" />}
                                                                    {hasPendingChange ? `pending` : saved ? `✦ saved` : `default`}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Editor & Preview */}
                    <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-8 animate-in fade-in zoom-in-95 duration-700">
                        <div className="bg-card rounded-[2.5rem] border shadow-2xl p-8 space-y-8 relative overflow-hidden">
                            {/* Section Info */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-black text-xl text-foreground/90">{sectionName}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold opacity-30 font-mono bg-muted px-2 py-0.5 rounded-md">{selectedPath}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1.5",
                                        hasPending ? "bg-amber-500/10 text-amber-600"
                                            : isCustomized ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-slate-500/10 text-slate-500"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                            hasPending ? "bg-amber-500 animate-pulse"
                                                : isCustomized ? "bg-emerald-500 animate-pulse"
                                                    : "bg-slate-500"
                                        )} />
                                        {hasPending ? `معاينة: ${selectedPath ? pendingColors[selectedPath] : ''}`
                                            : isCustomized ? `محفوظ: ${savedColor}`
                                                : 'افتراضي'}
                                    </div>
                                </div>
                            </div>

                            {/* Color Dropdown */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black opacity-40 uppercase tracking-widest block">اختيار اللون</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(o => !o)}
                                        type="button"
                                        className={cn(
                                            "w-full flex items-center gap-3 h-13 px-4 py-3 rounded-2xl border bg-background shadow-sm transition-all",
                                            dropdownOpen ? "border-foreground/40 ring-2 ring-foreground/10" : "border-border hover:border-foreground/30"
                                        )}
                                    >
                                        <div className="w-7 h-7 rounded-xl shrink-0 shadow-md" style={{ backgroundColor: previewHex }} />
                                        <span className="flex-1 text-left font-black text-sm capitalize">{activeColor}</span>
                                        <APP_ICONS.ACTIONS.CHEVRON_DOWN size={16} className={cn("opacity-40 transition-transform duration-300", dropdownOpen && "rotate-180")} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                                            <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
                                                {COLOR_GROUPS.map(group => (
                                                    <div key={group.label}>
                                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-30 px-3 pt-2 pb-1">{group.label}</p>
                                                        {group.colors.map(color => {
                                                            const hex = COLOR_HEX[color] || '#64748b';
                                                            const isSelected = activeColor.toLowerCase() === color;
                                                            return (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => handleColorChange(color)}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left",
                                                                        isSelected ? "bg-foreground text-background" : "hover:bg-muted/60"
                                                                    )}
                                                                >
                                                                    <div className="w-5 h-5 rounded-lg shrink-0 shadow-sm" style={{ backgroundColor: hex }} />
                                                                    <span className="font-black text-sm capitalize flex-1">{color}</span>
                                                                    {isSelected && <APP_ICONS.ACTIONS.CHECK size={14} />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview */}
                            <ThemePreview
                                theme={previewTheme}
                                colorName={activeColor}
                                hex={previewHex}
                                sectionName={sectionName}
                            />

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-2 border-t border-border/10">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !hasPending}
                                    className="flex-1 h-13 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95"
                                    style={{ backgroundColor: hasPending ? previewHex : undefined }}
                                >
                                    {saving ? (
                                        <APP_ICONS.STATE.LOADING className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <APP_ICONS.ACTIONS.SAVE size={18} className="ml-2" />
                                            حفظ اللون
                                        </>
                                    )}
                                </Button>

                                {(isCustomized || hasPending) && (
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={resetting}
                                        className="h-13 rounded-2xl font-black text-sm border-2 text-rose-500 border-rose-500/20 hover:bg-rose-500/5 transition-all w-1/3"
                                    >
                                        {resetting ? (
                                            <APP_ICONS.STATE.LOADING className="animate-spin" size={20} />
                                        ) : 'إلغاء / افتراضي'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="bg-card/30 rounded-3xl p-6 border-2 border-dashed border-border/20 flex gap-4 items-center">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                                <APP_ICONS.ACTIONS.INFO size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black tracking-tight">ملاحظة</p>
                                <p className="text-[10px] font-bold opacity-50 leading-relaxed">
                                    التغييرات غير محفوظة (باللون الأصفر) لن تُطبّق حتى تضغط "حفظ اللون". يمكنك تغيير ألوان عدة صفحات ثم حفظها واحدة تلو الأخرى.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
