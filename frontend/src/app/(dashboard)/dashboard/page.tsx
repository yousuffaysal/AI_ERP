"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Activity,
    TrendingUp,
    DollarSign,
    Users,
    AlertTriangle,
    CheckCircle2,
    Package
} from 'lucide-react';

interface HealthData {
    score: number;
    status: 'Green' | 'Yellow' | 'Red';
    explanation: string;
    metrics: {
        revenue_growth_pct: number;
        operating_cash_ratio: number;
        inventory_turnover_rate: number;
        revenue_per_employee: number;
    };
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                // Fetch from Django, which asynchronously fetches from FastAPI and caches it in Redis
                const res = await api.get(`/accounts/companies/${user?.id}/health/`);
                setHealthData(res.data);
            } catch (err) {
                setError('Failed to load AI Health Metrics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchHealth();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const statusColors = {
        Green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        Yellow: 'text-amber-600 bg-amber-50 border-amber-200',
        Red: 'text-rose-600 bg-rose-50 border-rose-200',
    };

    const statusColor = healthData ? statusColors[healthData.status] : '';

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Welcome back, {user?.first_name}. Here is your AI-computed business health.
                </p>
            </div>

            {error ? (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    {/* Top Level Score Card */}
                    <div className={`rounded-2xl border p-6 ${statusColor}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    {healthData?.status === 'Red' && <AlertTriangle className="h-5 w-5" />}
                                    {healthData?.status === 'Green' && <CheckCircle2 className="h-5 w-5" />}
                                    Composite Health Score
                                </h2>
                                <div className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight">
                                    {healthData?.score.toFixed(1)}
                                    <span className="ml-1 text-xl font-medium text-slate-500">/ 100</span>
                                </div>
                                <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90">
                                    <strong>AI Analysis:</strong> {healthData?.explanation}
                                </p>
                            </div>
                            <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                                <Activity className="h-10 w-10 opacity-75" />
                            </div>
                        </div>
                    </div>

                    {/* Core Metrics Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                        {/* Revenue Growth */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-slate-500 truncate">30-Day Revenue Growth</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-slate-900">
                                                    {healthData?.metrics?.revenue_growth_pct?.toFixed(2)}%
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operating Cash Ratio */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <DollarSign className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-slate-500 truncate">Cash Stability Ratio</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-slate-900">
                                                    {healthData?.metrics?.operating_cash_ratio?.toFixed(2)}x
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Turnover */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Package className="h-6 w-6 text-amber-500" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-slate-500 truncate">Inventory Turnover (Annual)</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-slate-900">
                                                    {healthData?.metrics?.inventory_turnover_rate?.toFixed(2)}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employee Productivity */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-sky-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-slate-500 truncate">Revenue / Employee</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-slate-900">
                                                    ${healthData?.metrics?.revenue_per_employee?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8">
                        {/* Future placement for Anomaly table */}
                        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
                            <h3 className="text-base font-semibold leading-6 text-slate-900">Recent AI Anomaly Detections</h3>
                            <p className="mt-2 text-sm text-slate-500">Automated fraud and error tracking across your supply chain.</p>

                            <div className="mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                <AlertTriangle className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-sm font-medium text-slate-600">No anomalies detected in the last 7 days.</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
