"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, TrendingDown, Wrench, PlusCircle, Pencil, Trash2,
    X, AlertCircle, Loader2, DollarSign, Calendar, BarChart3,
    Cpu, Car, Monitor, Package
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

type Tab = 'assets' | 'depreciation' | 'maintenance' | 'disposal';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'assets', label: 'Assets Register', icon: Building2 },
    { id: 'depreciation', label: 'Depreciation', icon: TrendingDown },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'disposal', label: 'Disposal', icon: BarChart3 },
];

interface Asset {
    id: string; asset_number: string; name: string; category: string;
    purchase_date: string; purchase_cost: number; current_value: number;
    useful_life: number; depreciation_method: 'straight_line' | 'declining_balance';
    status: 'active' | 'under_maintenance' | 'disposed';
    location: string; assigned_to?: string;
}
interface DepreciationEntry {
    id: string; asset_name: string; asset_number: string;
    period: string; amount: number; accumulated: number; book_value: number;
}
interface MaintenanceRecord {
    id: string; asset_name: string; asset_number: string;
    type: 'preventive' | 'corrective' | 'inspection';
    scheduled_date: string; completed_date?: string;
    cost: number; technician: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
    notes?: string;
}
interface DisposalRecord {
    id: string; asset_name: string; asset_number: string;
    disposal_date: string; disposal_value: number; book_value: number;
    gain_loss: number; method: string; notes?: string;
}

function Modal({ open, onClose, title, subtitle, onSubmit, submitting, error, children }: any) {
    if (!open) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                        <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{title}</h3>{subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
                        <button onClick={onClose} disabled={submitting} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 max-h-[65vh] overflow-y-auto">
                        {error && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
                        <form id="modal-form" onSubmit={onSubmit} className="space-y-4">{children}</form>
                    </div>
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit" form="modal-form" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md disabled:opacity-60">
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        under_maintenance: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
        disposed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
        scheduled: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-200 dark:ring-blue-500/20',
        in_progress: 'bg-[#E2FF00]/20 text-yellow-800 dark:bg-[#E2FF00]/10 dark:text-[#E2FF00] ring-yellow-300 dark:ring-[#E2FF00]/20',
        completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        overdue: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
    };
    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset capitalize ${map[status] || map.active}`}>{status.replace('_', ' ')}</span>;
}

const CATEGORY_ICON: Record<string, any> = { 'IT Equipment': Monitor, 'Vehicles': Car, 'Machinery': Cpu, 'Furniture': Package, 'Buildings': Building2 };

const MOCK_ASSETS: Asset[] = [
    { id: '1', asset_number: 'AST-001', name: 'Dell PowerEdge Server R750', category: 'IT Equipment', purchase_date: '2023-01-15', purchase_cost: 25000, current_value: 18750, useful_life: 5, depreciation_method: 'straight_line', status: 'active', location: 'Server Room', assigned_to: 'IT Department' },
    { id: '2', asset_number: 'AST-002', name: 'Toyota Hilux 2023', category: 'Vehicles', purchase_date: '2023-03-01', purchase_cost: 45000, current_value: 38250, useful_life: 8, depreciation_method: 'declining_balance', status: 'active', location: 'Main Office', assigned_to: 'Logistics Team' },
    { id: '3', asset_number: 'AST-003', name: 'CNC Milling Machine XL-500', category: 'Machinery', purchase_date: '2022-06-01', purchase_cost: 120000, current_value: 84000, useful_life: 10, depreciation_method: 'straight_line', status: 'under_maintenance', location: 'Factory Floor A' },
    { id: '4', asset_number: 'AST-004', name: 'MacBook Pro M3 (x5 units)', category: 'IT Equipment', purchase_date: '2024-01-10', purchase_cost: 15000, current_value: 12000, useful_life: 4, depreciation_method: 'straight_line', status: 'active', location: 'Main Office', assigned_to: 'Sales Team' },
];

const MOCK_DEPRECIATION: DepreciationEntry[] = [
    { id: '1', asset_name: 'Dell PowerEdge Server R750', asset_number: 'AST-001', period: 'Q1 2025', amount: 1250, accumulated: 6250, book_value: 18750 },
    { id: '2', asset_name: 'Toyota Hilux 2023', asset_number: 'AST-002', period: 'Q1 2025', amount: 1406, accumulated: 6750, book_value: 38250 },
    { id: '3', asset_name: 'CNC Milling Machine XL-500', asset_number: 'AST-003', period: 'Q1 2025', amount: 3000, accumulated: 36000, book_value: 84000 },
    { id: '4', asset_name: 'MacBook Pro M3', asset_number: 'AST-004', period: 'Q1 2025', amount: 938, accumulated: 3000, book_value: 12000 },
];

const MOCK_MAINTENANCE: MaintenanceRecord[] = [
    { id: '1', asset_name: 'CNC Milling Machine XL-500', asset_number: 'AST-003', type: 'corrective', scheduled_date: '2025-05-02', cost: 3500, technician: 'Ahmad Tech Services', status: 'in_progress', notes: 'Spindle bearing replacement required.' },
    { id: '2', asset_name: 'Dell PowerEdge Server R750', asset_number: 'AST-001', type: 'preventive', scheduled_date: '2025-06-01', cost: 800, technician: 'Internal IT', status: 'scheduled' },
    { id: '3', asset_name: 'Toyota Hilux 2023', asset_number: 'AST-002', type: 'preventive', scheduled_date: '2025-04-15', completed_date: '2025-04-16', cost: 450, technician: 'Toyota Service Center', status: 'completed' },
];

const MOCK_DISPOSALS: DisposalRecord[] = [
    { id: '1', asset_name: 'Lenovo ThinkPad T480', asset_number: 'AST-0098', disposal_date: '2025-03-01', disposal_value: 400, book_value: 250, gain_loss: 150, method: 'Sale', notes: 'Sold to staff member.' },
    { id: '2', asset_name: 'Forklift Toyota 8FG25', asset_number: 'AST-0042', disposal_date: '2025-02-15', disposal_value: 5000, book_value: 8000, gain_loss: -3000, method: 'Auction', notes: 'Replaced by newer model.' },
];

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('assets');
    const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
    const [assetModal, setAssetModal] = useState(false);
    const [assetForm, setAssetForm] = useState({ asset_number: '', name: '', category: '', purchase_date: '', purchase_cost: '', useful_life: '', depreciation_method: 'straight_line', location: '', assigned_to: '' });
    const [submitting, setSubmitting] = useState(false);

    const totalValue = assets.reduce((s, a) => s + a.current_value, 0);
    const totalCost = assets.reduce((s, a) => s + a.purchase_cost, 0);
    const totalDepreciation = totalCost - totalValue;

    const kpis = [
        { label: 'Total Assets', value: assets.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Building2 },
        { label: 'Book Value', value: `$${totalValue.toLocaleString()}`, color: 'text-[#E2FF00]', bg: 'bg-brand-500/10', icon: DollarSign },
        { label: 'Accumulated Depr.', value: `$${totalDepreciation.toLocaleString()}`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: TrendingDown },
        { label: 'Under Maintenance', value: assets.filter(a => a.status === 'under_maintenance').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', icon: Wrench },
    ];

    const handleAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        const cost = parseFloat(assetForm.purchase_cost) || 0;
        setAssets(prev => [{
            id: Date.now().toString(), asset_number: assetForm.asset_number || `AST-00${assets.length + 1}`,
            name: assetForm.name, category: assetForm.category,
            purchase_date: assetForm.purchase_date, purchase_cost: cost, current_value: cost,
            useful_life: parseInt(assetForm.useful_life) || 5,
            depreciation_method: assetForm.depreciation_method as any, status: 'active',
            location: assetForm.location, assigned_to: assetForm.assigned_to
        }, ...prev]);
        setAssetModal(false); setAssetForm({ asset_number: '', name: '', category: '', purchase_date: '', purchase_cost: '', useful_life: '', depreciation_method: 'straight_line', location: '', assigned_to: '' });
        setSubmitting(false);
    };

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Asset Management</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Fixed assets register, depreciation schedules and maintenance tracking.</p>
                </div>
                {activeTab === 'assets' && (
                    <button onClick={() => setAssetModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md">
                        <PlusCircle className="w-4 h-4" /> Register Asset
                    </button>
                )}
            </motion.div>

            <motion.div variants={iV} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={i} className="bg-white dark:bg-[#0E0E0E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${k.bg}`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                            <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{k.value}</p>
                        </div>
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

            {/* Assets Register */}
            {activeTab === 'assets' && (
                <motion.div variants={iV} className="space-y-3">
                    {assets.map(a => {
                        const CategoryIcon = CATEGORY_ICON[a.category] || Package;
                        const depPct = ((a.purchase_cost - a.current_value) / a.purchase_cost) * 100;
                        return (
                            <div key={a.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                                            <CategoryIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                                <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                                                <p className="text-xs font-mono text-slate-400">{a.asset_number}</p>
                                                <StatusBadge status={a.status} />
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3">{a.category} · {a.location}{a.assigned_to ? ` · ${a.assigned_to}` : ''}</p>
                                            <div className="grid grid-cols-3 gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Purchase Cost</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">${a.purchase_cost.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Book Value</p>
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${a.current_value.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Useful Life</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{a.useful_life} yrs</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-400 font-medium">Depreciation Progress</span>
                                                    <span className="text-xs font-bold text-slate-500">{depPct.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${depPct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => setAssets(prev => prev.filter(x => x.id !== a.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}

            {/* Depreciation */}
            {activeTab === 'depreciation' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Asset', 'Asset No.', 'Period', 'Period Amount', 'Accumulated', 'Book Value'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {MOCK_DEPRECIATION.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white max-w-[200px] truncate">{d.asset_name}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-mono text-slate-400">{d.asset_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{d.period}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-amber-600 dark:text-amber-400">-${d.amount.toLocaleString()}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-red-600 dark:text-red-400">-${d.accumulated.toLocaleString()}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${d.book_value.toLocaleString()}</p></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Maintenance */}
            {activeTab === 'maintenance' && (
                <motion.div variants={iV} className="space-y-3">
                    {MOCK_MAINTENANCE.map(m => (
                        <div key={m.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-slate-900 dark:text-white">{m.asset_name}</p>
                                        <span className="text-xs font-mono text-slate-400">{m.asset_number}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${m.type === 'preventive' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : m.type === 'corrective' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>{m.type}</span>
                                        <StatusBadge status={m.status} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Scheduled</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{m.scheduled_date}</p>
                                        </div>
                                        {m.completed_date && <div>
                                            <p className="text-xs text-slate-400 font-medium">Completed</p>
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{m.completed_date}</p>
                                        </div>}
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Cost</p>
                                            <p className="font-bold text-slate-900 dark:text-white">${m.cost.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Technician</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{m.technician}</p>
                                        </div>
                                    </div>
                                    {m.notes && <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">{m.notes}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Disposal */}
            {activeTab === 'disposal' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Asset', 'Disposal Date', 'Method', 'Disposal Value', 'Book Value', 'Gain / Loss', 'Notes'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {MOCK_DISPOSALS.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{d.asset_name}</p>
                                            <p className="text-xs font-mono text-slate-400">{d.asset_number}</p>
                                        </td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500 font-medium">{d.disposal_date}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500">{d.method}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">${d.disposal_value.toLocaleString()}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">${d.book_value.toLocaleString()}</p></td>
                                        <td className="py-4 px-4">
                                            <p className={`text-sm font-bold ${d.gain_loss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {d.gain_loss >= 0 ? '+' : ''}${d.gain_loss.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4"><p className="text-xs text-slate-400 max-w-[150px] truncate">{d.notes || '—'}</p></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Asset Modal */}
            <Modal open={assetModal} onClose={() => setAssetModal(false)} title="Register New Asset" subtitle="Add to fixed asset register." onSubmit={handleAssetSubmit} submitting={submitting} error={null}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Asset Number"><input className={inp + ' font-mono'} value={assetForm.asset_number} onChange={e => setAssetForm(f => ({ ...f, asset_number: e.target.value }))} placeholder="AST-005" /></Field>
                    <Field label="Category">
                        <select className={inp} value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))}>
                            <option value="">Select...</option>
                            {['IT Equipment', 'Vehicles', 'Machinery', 'Furniture', 'Buildings'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label="Asset Name"><input required className={inp} value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} placeholder="Dell PowerEdge Server R750" /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Purchase Date"><input required type="date" className={inp} value={assetForm.purchase_date} onChange={e => setAssetForm(f => ({ ...f, purchase_date: e.target.value }))} /></Field>
                    <Field label="Purchase Cost ($)"><input required type="number" step="0.01" className={inp} value={assetForm.purchase_cost} onChange={e => setAssetForm(f => ({ ...f, purchase_cost: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Useful Life (years)"><input required type="number" min="1" className={inp} value={assetForm.useful_life} onChange={e => setAssetForm(f => ({ ...f, useful_life: e.target.value }))} /></Field>
                    <Field label="Depreciation Method">
                        <select className={inp} value={assetForm.depreciation_method} onChange={e => setAssetForm(f => ({ ...f, depreciation_method: e.target.value }))}>
                            <option value="straight_line">Straight Line</option>
                            <option value="declining_balance">Declining Balance</option>
                        </select>
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Location"><input className={inp} value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} placeholder="Main Office" /></Field>
                    <Field label="Assigned To"><input className={inp} value={assetForm.assigned_to} onChange={e => setAssetForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="IT Department" /></Field>
                </div>
            </Modal>
        </motion.div>
    );
}
