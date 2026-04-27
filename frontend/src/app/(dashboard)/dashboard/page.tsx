"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    TrendingUp,
    DollarSign,
    Users,
    AlertTriangle,
    CheckCircle2,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    ShieldAlert,
    BrainCircuit,
    Receipt,
    Plus,
    FileText,
    Settings,
    CheckSquare,
    Calendar,
    Briefcase,
    Building2,
    Zap
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

interface DashboardStats {
    total_revenue: number;
    accounts_receivable: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
    low_stock_items: number;
    total_employees: number;
    recent_activities: Array<{
        id: string;
        type: string;
        message: string;
        timestamp: string;
    }>;
}

interface QuickAction {
    name: string;
    icon: any;
    color: string;
    link: string;
    roles?: string[];
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/reports/dashboard-stats/`);
                setStats(res.data);
            } catch (err) {
                setError('Failed to load dashboard metrics.');
                console.error(err);
            } finally {
                setStatsLoading(false);
            }
        };

        // Load health score in background — doesn't block the main view
        const fetchHealth = async () => {
            if (!user?.company) return;
            try {
                const res = await api.get(`/accounts/companies/${user.company}/health/`);
                setHealthData(res.data);
            } catch (err) {
                console.error('Health fetch failed (non-blocking):', err);
            }
        };

        if (user?.company) {
            fetchStats();
            fetchHealth(); // fires in parallel, doesn't block render
        }
    }, [user]);

    if (statsLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-[#E2FF00]/40 to-emerald-500/30 animate-pulse"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-[#E2FF00] relative z-10"></div>
                </div>
            </div>
        );
    }

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, scale: 0.96, y: 15 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            className="mx-auto space-y-8 pb-16 font-sans"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header section focusing on pure editorial typography */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#E2FF00] rounded-r-md hidden md:block"></div>
                    <h1 className="text-4xl md:text-5xl font-heading font-normal text-slate-900 dark:text-[#E2FF00] tracking-tight">
                        {user?.role === 'admin' ? 'Command Center' : 
                         user?.role === 'finance' ? 'Financial Hub' :
                         user?.role === 'sales' ? 'Sales Pipeline' :
                         user?.role === 'hr_manager' ? 'People Portal' :
                         'Workstation'}
                    </h1>
                    <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
                        Welcome back, <span className="font-bold text-slate-800 dark:text-slate-200">{user?.first_name}</span>. Global overview synchronized.
                    </p>
                </div>
                
                {/* System Health Module (re-shaped from raw score) */}
                <div className="flex items-center gap-4 bg-white/40 dark:bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col items-end pr-4 border-r border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System AI Health</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl font-heading font-black text-slate-900 dark:text-white">
                                {healthData?.score.toFixed(1) || 'N/A'}
                            </span>
                            {healthData?.status === 'Green' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        </div>
                    </div>
                    <div className="pl-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[150px] leading-tight">
                            {healthData?.explanation || "Systems operating normally."}
                        </p>
                    </div>
                </div>
            </motion.div>

            {error && (
                <motion.div variants={itemVariants} className="bg-red-50 dark:bg-rose-950/30 p-4 rounded-xl border border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-400 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                    <p className="font-semibold">{error}</p>
                </motion.div>
            )}

            {/* 1. Quick Statistics (KPI Strip) - HIGH CONTRAST UNIQUE DESIGN */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-2">
                {[
                    { title: "Gross Revenue", value: `$${(stats?.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: DollarSign, color: "text-emerald-500 dark:text-[#E2FF00]", bg: "bg-emerald-50 dark:bg-[#E2FF00]/10", meta: "Tracking live" },
                    { title: "Total Orders", value: stats?.total_orders.toLocaleString() || '0', icon: Receipt, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", meta: "Total history" },
                    { title: "Active Customers", value: stats?.total_customers.toLocaleString() || '0', icon: Users, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", meta: "Verified accounts" },
                    { title: "Inventory Status", value: `${stats?.total_products || 0} items`, icon: Package, color: "text-amber-500 dark:text-orange-400", bg: "bg-amber-50 dark:bg-orange-500/10", meta: `${stats?.low_stock_items || 0} low stock alerts` }
                ].map((kpi, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-white dark:bg-[#0E0E0E] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-md transition-shadow group">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">
                                {kpi.title}
                            </span>
                            <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color} relative z-10`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-3xl lg:text-4xl font-heading font-medium text-slate-900 dark:text-white block mb-1">
                                {kpi.value}
                            </span>
                            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                                {kpi.meta}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* CENTER COLUMN: Financials & Analytics */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    
                    {/* Financial Overview (Stark Design) */}
                    <motion.div variants={itemVariants} className="bg-slate-900 dark:bg-black rounded-3xl p-8 shadow-xl text-white relative overflow-hidden border border-slate-800 dark:border-slate-800/80">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10 flex justify-between items-end mb-10 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-2xl font-heading font-normal tracking-tight text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-[#E2FF00]" />
                                    Financial Trajectory
                                </h2>
                                <p className="text-sm text-slate-400 mt-1 font-medium">Real-time revenue metrics vs liabilities.</p>
                            </div>
                            <button className="text-xs font-bold uppercase tracking-widest text-[#E2FF00] hover:text-white transition-colors">
                                View Report &rarr;
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                            <div>
                                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Accounts Receivable</span>
                                <span className="block text-2xl font-heading text-white">${(stats?.accounts_receivable || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Accounts Payable</span>
                                <span className="block text-2xl font-heading text-white">$4,250.00 <span className="text-xs text-rose-400 font-sans ml-1">Mock</span></span>
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly MRR Growth</span>
                                <span className="block text-2xl font-heading text-[#E2FF00]">{(healthData?.metrics?.revenue_growth_pct || 0).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cash Ratio</span>
                                <span className="block text-2xl font-heading text-white">{(healthData?.metrics?.operating_cash_ratio || 0).toFixed(2)}x</span>
                            </div>
                        </div>

                        {/* Abstract bar chart replacement */}
                        <div className="h-32 w-full mt-10 flex items-end gap-2 z-10 relative">
                            {[40, 70, 45, 90, 65, 85, 100, 50, 75, 40, 60, 80].map((height, i) => (
                                <div key={i} className="flex-1 overflow-hidden rounded-t-sm group cursor-pointer relative" style={{ height: `${height}%` }}>
                                    <div className="w-full h-full bg-white/10 group-hover:bg-[#E2FF00]/80 transition-colors duration-300"></div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Actions Grid */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Quick Commands</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(
                                [
                                    { name: "Create Invoice", icon: FileText, color: "bg-blue-500", link: "/sales", roles: ['admin', 'manager', 'sales', 'finance'] },
                                { name: "View Orders", icon: Plus, color: "bg-emerald-500", link: "/sales", roles: ['admin', 'manager', 'sales', 'staff', 'auditor'] },
                                { name: "New Product", icon: Package, color: "bg-amber-500", link: "/inventory", roles: ['admin', 'manager', 'sales'] },
                                { name: "HR & People", icon: Briefcase, color: "bg-indigo-500", link: "/hr", roles: ['admin', 'manager', 'hr_manager'] },
                                { name: "Audit Trail", icon: Activity, color: "bg-slate-500", link: "/audit", roles: ['admin', 'auditor'] },
                                { name: "Budgets", icon: DollarSign, color: "bg-purple-500", link: "/finance", roles: ['admin', 'finance'] },
                            ] as QuickAction[])
                            .filter(action => !action.roles || (user?.role && action.roles.includes(user.role)))
                            .slice(0, 4) // Keep it to 4 items for layout
                            .map((action, i) => (
                                <a href={action.link} key={i} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-slate-300 dark:hover:border-slate-600 transition-all group shadow-sm hover:shadow-md">
                                    <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{action.name}</span>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                </div>

                {/* RIGHT SIDEBAR: Activity, Tasks, Notifications */}
                <div className="space-y-6 lg:space-y-8">
                    
                    {/* Activity Feed */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#0E0E0E] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-brand-500" />
                                Activity Log
                            </h3>
                            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                            {(stats?.recent_activities || []).length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center w-full block bg-white dark:bg-[#0E0E0E] relative z-10 font-medium">No recent activity detected.</p>
                            ) : stats?.recent_activities.map((act, i) => (
                                <div key={i} className="relative flex items-start gap-4">
                                    <div className="absolute left-0 mt-1.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-[#0E0E0E] bg-brand-500 shadow-sm z-10" />
                                    <div className="pl-6 w-full">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{act.message}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">
                                            {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Operational Tasks */}
                    <motion.div variants={itemVariants} className="bg-[#f8f6f0] dark:bg-[#121212] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-gray-300 flex items-center gap-2 mb-5">
                            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-[#E2FF00]" />
                            Operational Tasks
                        </h3>
                        <div className="space-y-3">
                            {[
                                "Verify Supplier PO-8291",
                                "Approve Payroll (March)",
                                "Review Daily AI Forecast"
                            ].map((task, i) => (
                                <label key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-[#070707] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-brand-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600 dark:border-slate-700 dark:bg-slate-800" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{task}</span>
                                </label>
                            ))}
                        </div>
                    </motion.div>

                    {/* HR & Organization Snippet */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#0E0E0E] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-gray-300 flex items-center gap-2 mb-5">
                            <Building2 className="w-4 h-4 text-sky-500" />
                            Organization
                        </h3>
                        <div className="flex justify-between items-center px-2">
                            <div className="text-center">
                                <span className="block text-3xl font-heading font-normal text-slate-900 dark:text-white">{stats?.total_employees || 0}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Employees</span>
                            </div>
                            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
                            <div className="text-center">
                                <span className="block text-3xl font-heading font-normal text-slate-900 dark:text-white">2</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">On Leave</span>
                            </div>
                            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800"></div>
                            <div className="text-center">
                                <span className="block text-3xl font-heading font-normal text-slate-900 dark:text-white">1</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Open Req</span>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    );
}
