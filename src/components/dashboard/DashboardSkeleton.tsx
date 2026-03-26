"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-64 bg-accent rounded-lg"></div>
                </div>
                <div className="h-10 w-40 bg-accent rounded-2xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border-border rounded-3xl overflow-hidden shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-16 bg-accent rounded"></div>
                                </div>
                            </div>
                            <div className="h-10 w-20 bg-slate-200 rounded-lg"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-border rounded-3xl overflow-hidden shadow-sm h-96">
                    <div className="h-20 border-b border-border/50 bg-muted/30 p-6">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center border-b border-border/50 pb-4 last:border-0">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent"></div>
                                    <div className="space-y-1.5">
                                        <div className="h-4 w-40 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-20 bg-accent rounded"></div>
                                    </div>
                                </div>
                                <div className="h-4 w-24 bg-accent rounded"></div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="border-border rounded-3xl overflow-hidden shadow-sm h-96">
                    <div className="h-20 border-b border-border/50 bg-muted/30 p-6">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-12 bg-accent rounded"></div>
                                </div>
                                <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden">
                                    <div className="h-full w-1/2 bg-slate-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
