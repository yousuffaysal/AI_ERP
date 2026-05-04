"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, DollarSign, Users, Package, BrainCircuit,
    ArrowUpRight, ArrowDownRight, Zap, Target, Activity, Calendar,
    ShoppingCart, AlertTriangle
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

type Tab = 'overview' | 'sales' | 'inventory' | 'hr' | 'ai';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'hr', label: 'People', icon: Users },
    { id: 'ai', label: 'AI Insights', icon: BrainCircuit },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REVENUE_DATA = [42000, 58000, 53000, 71000, 68000, 89000, 95000, 88000, 102000, 115000, 108000, 132000];
const ORDERS_DATA = [48, 62, 55, 78, 74, 96, 103, 91, 112, 128, 119, 145];
const TOP_PRODUCTS = [
    { name: 'Lithium Battery Pack 48V', revenue: 145000, units: 290, growth: 18.4 },
    { name: 'Solar Panel Module 300W', revenue: 98000, units: 327, growth: 12.1 },
    { name: 'Control Unit PCB', revenue: 67000, units: 670, growth: 8.3 },
    { name: 'Enclosure Frame S-Type', revenue: 42000, units: 280, growth: -2.1 },
    { name: 'Smart Inverter 5kW', revenue: 38500, units: 77, growth: 24.8 },
];
const SALES_REPS = [
    { name: 'Sara Johnson', revenue: 245000, deals: 42, win_rate: 78 },
    { name: 'David Kim', revenue: 198000, deals: 35, win_rate: 71 },
    { name: 'Ahmad Al-Rashid', revenue: 187000, deals: 31, win_rate: 84 },
    { name: 'Emma Wilson', revenue: 156000, deals: 28, win_rate: 68 },
];
const INVENTORY_TURNOVER = [
    { category: 'Electronics', turnover: 8.4, value: 245000 },
    { category: 'Machinery', turnover: 3.2, value: 420000 },
    { category: 'Vehicles', turnover: 1.8, value: 380000 },
    { category: 'IT Equipment', turnover: 5.6, value: 180000 },
    { category: 'Furniture', turnover: 2.1, value: 45000 },
];
const HR_METRICS = [
    { label: 'Total Headcount', value: '48', change: +4 },
    { label: 'Avg. Salary', value: '$64,200', change: +5.2 },
    { label: 'Turnover Rate', value: '8.3%', change: -1.4 },
    { label: 'Training Hours', value: '240', change: +32 },
];
const AI_INSIGHTS = [
    { type: 'forecast', priority: 'high', title: 'Demand Surge Expected', body: 'AI forecasts a 34% demand increase for Lithium Battery packs in Q3. Recommend increasing production by 120 units.', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
    { type: 'anomaly', priority: 'critical', title: 'Pricing Anomaly Detected', body: 'Invoice INV-2025-0112 is priced 32% below market rate for Solar Panels. Potential data entry error or unauthorized discount.', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
    { type: 'recommendation', priority: 'medium', title: 'Vendor Consolidation Opportunity', body: 'Consolidating 4 suppliers into 2 preferred vendors could save approximately $18,400/year in procurement overhead.', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
    { type: 'pricing', priority: 'medium', title: 'Dynamic Pricing Suggestion', body: 'Smart Inverter 5kW has 94% sell-through rate. AI recommends testing a 12% price increase given inelastic demand.', icon: DollarSign, color: 'text-[#E2FF00]', bg: 'bg-brand-500/5 border-brand-500/20' },
    { type: 'hr', priority: 'low', title: 'Workforce Optimization', body: 'Assembly Line A is running at 87% efficiency. Adding one technician could increase throughput by 15% based on ML analysis.', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
];

function BarViz({ data, labels, color = 'bg-brand-500', max }: { data: number[]; labels: string[]; color?: string; max?: number }) {
    const maxVal = max || Math.max(...data);
    return (
        <div className="flex items-end gap-1.5 h-32 w-full">
            {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end" style={{ height: '100%' }}>
                        <div className={`w-full ${color} rounded-t-sm group-hover:opacity-80 transition-opacity`}
                            style={{ height: `${(v / maxVal) * 100}%` }} title={`${labels[i]}: ${v.toLocaleString()}`} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 rotate-0">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [period, setPeriod] = useState<'ytd' | 'q1' | 'q2' | 'monthly'>('ytd');

    const totalRevenue = REVENUE_DATA.reduce((s, v) => s + v, 0);
    const totalOrders = ORDERS_DATA.reduce((s, v) => s + v, 0);
    const avgOrder = totalRevenue / totalOrders;

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Business Analytics</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Revenue trends, performance KPIs, and AI-powered insights.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {([['ytd', 'YTD'], ['q1', 'Q1'], ['q2', 'Q2'], ['monthly', 'Monthly']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => setPeriod(id as any)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{label}</button>
                    ))}
                </div>
            </motion.div>

            {/* Top KPIs */}
            <motion.div variants={iV} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, change: 23.4, icon: DollarSign, color: 'text-[#E2FF00]', bg: 'bg-brand-500/10' },
                    { label: 'Total Orders', value: totalOrders.toLocaleString(), change: 18.1, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Avg. Order Value', value: `$${avgOrder.toFixed(0)}`, change: 4.2, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Revenue Growth', value: '23.4%', change: 23.4, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                ].map((k, i) => (
                    <div key={i} className="bg-white dark:bg-[#0E0E0E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${k.bg}`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${k.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {k.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                {Math.abs(k.change)}%
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                        <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{k.value}</p>
                    </div>
                ))}
            </motion.div>

            <motion.div variants={iV} className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </motion.div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Monthly Revenue</h3>
                                <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1">${(totalRevenue / 1000).toFixed(0)}K YTD</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><ArrowUpRight className="w-4 h-4" />23.4% vs LY</span>
                        </div>
                        <BarViz data={REVENUE_DATA} labels={MONTHS} color="bg-brand-500" />
                    </motion.div>
                    <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Monthly Orders</h3>
                                <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1">{totalOrders} Total</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><ArrowUpRight className="w-4 h-4" />18.1%</span>
                        </div>
                        <BarViz data={ORDERS_DATA} labels={MONTHS} color="bg-indigo-500" />
                    </motion.div>
                    <motion.div variants={iV} className="lg:col-span-2 bg-slate-900 dark:bg-black rounded-2xl border border-slate-800 shadow-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Revenue vs Orders Trend</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[{ label: 'Best Month', value: 'Dec 2024', sub: '$132K' }, { label: 'Avg Monthly', value: `$${(totalRevenue / 12 / 1000).toFixed(0)}K`, sub: 'Revenue' }, { label: 'Peak Orders', value: '145', sub: 'December' }, { label: 'Growth Rate', value: '23.4%', sub: 'Year on Year' }].map((s, i) => (
                                    <div key={i}>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className="text-3xl font-heading text-white">{s.value}</p>
                                        <p className="text-xs text-slate-500 font-medium">{s.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="h-24 mt-8 flex items-end gap-1">
                                {REVENUE_DATA.map((v, i) => (
                                    <div key={i} className="flex-1 bg-white/10 hover:bg-[#E2FF00]/60 rounded-t-sm transition-colors cursor-pointer" style={{ height: `${(v / 132000) * 100}%` }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Sales Analytics */}
            {activeTab === 'sales' && (
                <div className="space-y-6">
                    <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Top Products by Revenue</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {TOP_PRODUCTS.map((p, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-2xl font-heading font-bold text-slate-200 dark:text-slate-700 w-8 text-center">{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">{p.units} units sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">${p.revenue.toLocaleString()}</p>
                                        <span className={`text-xs font-bold flex items-center justify-end gap-0.5 ${p.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {p.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(p.growth)}%
                                        </span>
                                    </div>
                                    <div className="w-24">
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(p.revenue / 145000) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Sales Representative Performance</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {SALES_REPS.map((r, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{r.name[0]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">{r.deals} deals · {r.win_rate}% win rate</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">${r.revenue.toLocaleString()}</p>
                                    </div>
                                    <div className="w-20">
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.win_rate}%` }} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5 text-center">Win %</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Inventory Analytics */}
            {activeTab === 'inventory' && (
                <motion.div variants={iV} className="space-y-6">
                    <div className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Inventory Turnover by Category</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Higher turnover = faster selling inventory</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {INVENTORY_TURNOVER.map((cat, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 w-32 shrink-0">{cat.category}</p>
                                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full" style={{ width: `${(cat.turnover / 10) * 100}%` }} />
                                    </div>
                                    <div className="text-right w-24">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{cat.turnover}x</p>
                                        <p className="text-xs text-slate-400">${(cat.value / 1000).toFixed(0)}K</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ label: 'Avg. Turnover', value: '4.2x', icon: Activity, color: 'text-brand-500', bg: 'bg-brand-500/10' }, { label: 'Total Inventory Value', value: '$1.27M', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }, { label: 'Low Stock SKUs', value: '12', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' }].map((k, i) => (
                            <div key={i} className="bg-white dark:bg-[#0E0E0E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${k.bg}`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                                    <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{k.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* HR Analytics */}
            {activeTab === 'hr' && (
                <motion.div variants={iV} className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {HR_METRICS.map((m, i) => (
                            <div key={i} className="bg-white dark:bg-[#0E0E0E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{m.label}</p>
                                <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{m.value}</p>
                                <span className={`text-xs font-bold flex items-center gap-0.5 mt-1 ${m.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {m.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(m.change)}{typeof m.change === 'number' && m.label.includes('Rate') ? 'pp' : m.label.includes('Salary') ? '%' : ''} vs last year
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Headcount by Department</h3>
                        <div className="space-y-4">
                            {[
                                { dept: 'Engineering', count: 14, color: 'bg-blue-500' },
                                { dept: 'Sales & Marketing', count: 10, color: 'bg-brand-500' },
                                { dept: 'Operations', count: 12, color: 'bg-emerald-500' },
                                { dept: 'Finance & Admin', count: 7, color: 'bg-purple-500' },
                                { dept: 'HR & People', count: 5, color: 'bg-amber-500' },
                            ].map((d, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 w-36 shrink-0">{d.dept}</p>
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${d.color} rounded-full`} style={{ width: `${(d.count / 14) * 100}%` }} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white w-12 text-right">{d.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* AI Insights */}
            {activeTab === 'ai' && (
                <motion.div variants={iV} className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl">
                        <BrainCircuit className="w-6 h-6 text-brand-500 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">AI Engine Active</p>
                            <p className="text-xs text-slate-500">Analyzing patterns across all modules. Last updated: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#E2FF00] animate-pulse" />
                            <span className="text-xs font-bold text-slate-500">Live</span>
                        </div>
                    </div>
                    {AI_INSIGHTS.map((insight, i) => {
                        const Icon = insight.icon;
                        return (
                            <div key={i} className={`rounded-2xl border p-5 ${insight.bg}`}>
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 mt-0.5">
                                        <Icon className={`w-5 h-5 ${insight.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{insight.title}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${insight.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : insight.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : insight.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{insight.priority}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{insight.body}</p>
                                    </div>
                                    <button className="shrink-0 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800">
                                        Review
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}
