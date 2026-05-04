"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Factory, Layers, Wrench, ClipboardCheck, PlusCircle, Pencil, Trash2,
    X, AlertCircle, Loader2, Play, Pause, CheckCircle2, Clock, BrainCircuit,
    GitBranch, Zap
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

type Tab = 'orders' | 'bom' | 'workcenters' | 'quality';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'orders', label: 'Production Orders', icon: Factory },
    { id: 'bom', label: 'Bill of Materials', icon: Layers },
    { id: 'workcenters', label: 'Work Centers', icon: Wrench },
    { id: 'quality', label: 'Quality Control', icon: ClipboardCheck },
];

interface ProductionOrder {
    id: string; order_number: string; product: string; quantity: number;
    status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
    start_date: string; end_date: string; progress: number; work_center: string;
}
interface BOMItem {
    id: string; product: string; version: string; components: number;
    status: 'active' | 'draft' | 'obsolete'; created_at: string;
}
interface BOMComponent {
    id: string; name: string; quantity: number; unit: string; sku: string;
}
interface WorkCenter {
    id: string; name: string; code: string; capacity: number; efficiency: number;
    status: 'active' | 'maintenance' | 'idle'; current_order?: string;
}
interface QualityCheck {
    id: string; check_number: string; product: string; batch: string;
    status: 'pass' | 'fail' | 'pending'; inspector: string; checked_at: string; notes?: string;
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
        planned: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-200 dark:ring-blue-500/20',
        in_progress: 'bg-[#E2FF00]/20 text-yellow-800 dark:bg-[#E2FF00]/10 dark:text-[#E2FF00] ring-yellow-300 dark:ring-[#E2FF00]/20',
        completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        on_hold: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
        active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
        obsolete: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
        maintenance: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
        idle: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
        pass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        fail: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
        pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
    };
    const label = status.replace('_', ' ');
    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset capitalize ${map[status] || map.draft}`}>{label}</span>;
}

const MOCK_ORDERS: ProductionOrder[] = [
    { id: '1', order_number: 'MO-2025-001', product: 'Lithium Battery Pack 48V', quantity: 200, status: 'in_progress', start_date: '2025-05-01', end_date: '2025-05-10', progress: 65, work_center: 'Assembly Line A' },
    { id: '2', order_number: 'MO-2025-002', product: 'Solar Panel Module 300W', quantity: 100, status: 'planned', start_date: '2025-05-12', end_date: '2025-05-20', progress: 0, work_center: 'Assembly Line B' },
    { id: '3', order_number: 'MO-2025-003', product: 'Control Unit PCB', quantity: 500, status: 'completed', start_date: '2025-04-20', end_date: '2025-04-30', progress: 100, work_center: 'Electronics Bay' },
    { id: '4', order_number: 'MO-2025-004', product: 'Enclosure Frame S-Type', quantity: 150, status: 'on_hold', start_date: '2025-05-05', end_date: '2025-05-15', progress: 30, work_center: 'Fabrication' },
];

const MOCK_BOMS: BOMItem[] = [
    { id: '1', product: 'Lithium Battery Pack 48V', version: 'v3.2', components: 12, status: 'active', created_at: '2025-03-01' },
    { id: '2', product: 'Solar Panel Module 300W', version: 'v1.0', components: 8, status: 'active', created_at: '2025-02-15' },
    { id: '3', product: 'Control Unit PCB', version: 'v2.1', components: 24, status: 'draft', created_at: '2025-04-10' },
];

const MOCK_BOM_COMPONENTS: Record<string, BOMComponent[]> = {
    '1': [
        { id: 'c1', name: 'Li-Ion Cell 18650', quantity: 40, unit: 'pcs', sku: 'CELL-18650-3.7V' },
        { id: 'c2', name: 'BMS Circuit Board', quantity: 1, unit: 'pcs', sku: 'BMS-48V-20A' },
        { id: 'c3', name: 'Enclosure Case', quantity: 1, unit: 'pcs', sku: 'CASE-BAT-48V' },
    ],
};

const MOCK_WORKCENTERS: WorkCenter[] = [
    { id: '1', name: 'Assembly Line A', code: 'WC-A01', capacity: 200, efficiency: 87, status: 'active', current_order: 'MO-2025-001' },
    { id: '2', name: 'Assembly Line B', code: 'WC-A02', capacity: 150, efficiency: 92, status: 'idle' },
    { id: '3', name: 'Electronics Bay', code: 'WC-E01', capacity: 500, efficiency: 95, status: 'active', current_order: 'MO-2025-003' },
    { id: '4', name: 'Fabrication', code: 'WC-F01', capacity: 300, efficiency: 78, status: 'maintenance' },
];

const MOCK_QUALITY: QualityCheck[] = [
    { id: '1', check_number: 'QC-2025-001', product: 'Lithium Battery Pack 48V', batch: 'BATCH-001', status: 'pass', inspector: 'Ahmad Al-Rashid', checked_at: '2025-05-03T10:00:00Z' },
    { id: '2', check_number: 'QC-2025-002', product: 'Control Unit PCB', batch: 'BATCH-002', status: 'fail', inspector: 'Sara Johnson', checked_at: '2025-05-02T14:00:00Z', notes: 'Solder joint failure on IC-4.' },
    { id: '3', check_number: 'QC-2025-003', product: 'Solar Panel Module 300W', batch: 'BATCH-003', status: 'pending', inspector: 'David Kim', checked_at: '2025-05-04T08:00:00Z' },
];

export default function ManufacturingPage() {
    const [activeTab, setActiveTab] = useState<Tab>('orders');
    const [orders, setOrders] = useState<ProductionOrder[]>(MOCK_ORDERS);
    const [boms, setBoms] = useState<BOMItem[]>(MOCK_BOMS);
    const [workcenters, setWorkcenters] = useState<WorkCenter[]>(MOCK_WORKCENTERS);
    const [quality, setQuality] = useState<QualityCheck[]>(MOCK_QUALITY);
    const [expandedBom, setExpandedBom] = useState<string | null>(null);
    const [orderModal, setOrderModal] = useState(false);
    const [orderForm, setOrderForm] = useState({ order_number: '', product: '', quantity: '', start_date: '', end_date: '', work_center: '', status: 'planned' });
    const [submitting, setSubmitting] = useState(false);

    const kpis = [
        { label: 'In Production', value: orders.filter(o => o.status === 'in_progress').length, color: 'text-[#E2FF00]', bg: 'bg-brand-500/10', icon: Factory },
        { label: 'Planned Orders', value: orders.filter(o => o.status === 'planned').length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Clock },
        { label: 'Avg. Efficiency', value: `${Math.round(workcenters.reduce((s, w) => s + w.efficiency, 0) / workcenters.length)}%`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: Zap },
        { label: 'QC Pass Rate', value: `${Math.round((quality.filter(q => q.status === 'pass').length / quality.length) * 100)}%`, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', icon: ClipboardCheck },
    ];

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        const newOrder: ProductionOrder = { id: Date.now().toString(), order_number: orderForm.order_number || `MO-2025-00${orders.length + 1}`, product: orderForm.product, quantity: parseInt(orderForm.quantity) || 0, status: orderForm.status as any, start_date: orderForm.start_date, end_date: orderForm.end_date, progress: 0, work_center: orderForm.work_center };
        setOrders(prev => [newOrder, ...prev]);
        setOrderModal(false); setOrderForm({ order_number: '', product: '', quantity: '', start_date: '', end_date: '', work_center: '', status: 'planned' });
        setSubmitting(false);
    };

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Manufacturing</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Production orders, bill of materials, work centers and quality control.</p>
                </div>
                {activeTab === 'orders' && (
                    <button onClick={() => setOrderModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md">
                        <PlusCircle className="w-4 h-4" /> New Production Order
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

            {/* Production Orders */}
            {activeTab === 'orders' && (
                <motion.div variants={iV} className="space-y-3">
                    {orders.map(o => (
                        <div key={o.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">{o.order_number}</p>
                                        <StatusBadge status={o.status} />
                                    </div>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{o.product}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{o.work_center} · {o.quantity} units · {o.start_date} → {o.end_date}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {o.status === 'in_progress' && <button className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"><Pause className="w-4 h-4" /></button>}
                                    {o.status === 'planned' && <button className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"><Play className="w-4 h-4" /></button>}
                                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => setOrders(prev => prev.filter(x => x.id !== o.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{o.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all duration-500" style={{ width: `${o.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* BOM */}
            {activeTab === 'bom' && (
                <motion.div variants={iV} className="space-y-3">
                    {boms.map(b => (
                        <div key={b.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <button className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                onClick={() => setExpandedBom(expandedBom === b.id ? null : b.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                        <GitBranch className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{b.product}</p>
                                        <p className="text-xs text-slate-400 font-medium">{b.version} · {b.components} components · Created {b.created_at}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={b.status} />
                                    <span className="text-slate-400 text-sm">{expandedBom === b.id ? '▲' : '▼'}</span>
                                </div>
                            </button>
                            {expandedBom === b.id && (
                                <div className="border-t border-slate-100 dark:border-slate-800">
                                    <div className="p-5">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Components</p>
                                        {(MOCK_BOM_COMPONENTS[b.id] || [{ id: 'x1', name: 'Sample Component A', quantity: 2, unit: 'pcs', sku: 'COMP-001' }, { id: 'x2', name: 'Sample Component B', quantity: 1, unit: 'kg', sku: 'COMP-002' }]).map(comp => (
                                            <div key={comp.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{comp.name}</p>
                                                    <p className="text-xs font-mono text-slate-400">{comp.sku}</p>
                                                </div>
                                                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{comp.quantity} {comp.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Work Centers */}
            {activeTab === 'workcenters' && (
                <motion.div variants={iV} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workcenters.map(w => (
                        <div key={w.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{w.name}</p>
                                    <p className="text-xs font-mono text-slate-400">{w.code}</p>
                                </div>
                                <StatusBadge status={w.status} />
                            </div>
                            {w.current_order && (
                                <div className="mb-4 p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Order</p>
                                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5">{w.current_order}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                                    <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">{w.capacity} <span className="text-sm text-slate-400 font-sans">u/hr</span></p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Efficiency</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">{w.efficiency}%</p>
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${w.efficiency}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Quality Control */}
            {activeTab === 'quality' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Check No.', 'Product', 'Batch', 'Inspector', 'Date', 'Status', 'Notes'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {quality.map(q => (
                                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4"><p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{q.check_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-[180px] truncate">{q.product}</p></td>
                                        <td className="py-4 px-4"><p className="text-xs font-mono text-slate-500">{q.batch}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500">{q.inspector}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500 font-medium">{new Date(q.checked_at).toLocaleDateString()}</p></td>
                                        <td className="py-4 px-4"><StatusBadge status={q.status} /></td>
                                        <td className="py-4 px-4"><p className="text-xs text-slate-400 max-w-[150px] truncate">{q.notes || '—'}</p></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Order Modal */}
            <Modal open={orderModal} onClose={() => setOrderModal(false)} title="New Production Order" subtitle="Schedule a manufacturing run." onSubmit={handleOrderSubmit} submitting={submitting} error={null}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Order Number"><input className={inp + ' font-mono'} value={orderForm.order_number} onChange={e => setOrderForm(f => ({ ...f, order_number: e.target.value }))} placeholder="MO-2025-005" /></Field>
                    <Field label="Status">
                        <select className={inp} value={orderForm.status} onChange={e => setOrderForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="planned">Planned</option><option value="in_progress">In Progress</option>
                        </select>
                    </Field>
                </div>
                <Field label="Product"><input required className={inp} value={orderForm.product} onChange={e => setOrderForm(f => ({ ...f, product: e.target.value }))} placeholder="Battery Pack 48V" /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Quantity"><input required type="number" min="1" className={inp} value={orderForm.quantity} onChange={e => setOrderForm(f => ({ ...f, quantity: e.target.value }))} /></Field>
                    <Field label="Work Center"><input className={inp} value={orderForm.work_center} onChange={e => setOrderForm(f => ({ ...f, work_center: e.target.value }))} placeholder="Assembly Line A" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Date"><input required type="date" className={inp} value={orderForm.start_date} onChange={e => setOrderForm(f => ({ ...f, start_date: e.target.value }))} /></Field>
                    <Field label="End Date"><input required type="date" className={inp} value={orderForm.end_date} onChange={e => setOrderForm(f => ({ ...f, end_date: e.target.value }))} /></Field>
                </div>
            </Modal>
        </motion.div>
    );
}
