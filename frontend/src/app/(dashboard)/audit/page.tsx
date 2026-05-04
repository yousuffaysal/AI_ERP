"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    Shield, Search, Filter, Download, Eye, RefreshCw,
    UserCircle, Edit3, Plus, Trash2, AlertTriangle, CheckCircle2,
    Clock, ArrowUpDown
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

interface AuditEntry {
    id: string; action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export';
    model: string; object_repr: string; user: string; user_email: string;
    timestamp: string; ip_address: string; changes?: Record<string, [any, any]>;
    severity: 'info' | 'warning' | 'critical';
}

const MOCK_AUDIT: AuditEntry[] = [
    { id: '1', action: 'update', model: 'SalesInvoice', object_repr: 'INV-2025-0042', user: 'Sara Johnson', user_email: 'sara@company.com', timestamp: '2025-05-04T10:23:00Z', ip_address: '192.168.1.15', changes: { status: ['draft', 'paid'], total_amount: [4500, 4800] }, severity: 'info' },
    { id: '2', action: 'delete', model: 'Product', object_repr: 'Old Sensor V1 (SKU: SENS-01)', user: 'Ahmad Al-Rashid', user_email: 'ahmad@company.com', timestamp: '2025-05-04T09:45:00Z', ip_address: '192.168.1.10', severity: 'warning' },
    { id: '3', action: 'create', model: 'Employee', object_repr: 'Fatima Hassan (EMP-0034)', user: 'Yusuf Admin', user_email: 'admin@company.com', timestamp: '2025-05-04T09:10:00Z', ip_address: '192.168.1.1', severity: 'info' },
    { id: '4', action: 'login', model: 'User', object_repr: 'david.kim@company.com', user: 'David Kim', user_email: 'david.kim@company.com', timestamp: '2025-05-04T08:55:00Z', ip_address: '10.0.0.42', severity: 'info' },
    { id: '5', action: 'export', model: 'Report', object_repr: 'Finance Q1 2025 - PDF', user: 'Sara Johnson', user_email: 'sara@company.com', timestamp: '2025-05-03T17:30:00Z', ip_address: '192.168.1.15', severity: 'info' },
    { id: '6', action: 'update', model: 'User', object_repr: 'guest_user@test.com', user: 'Yusuf Admin', user_email: 'admin@company.com', timestamp: '2025-05-03T16:00:00Z', ip_address: '192.168.1.1', changes: { role: ['staff', 'admin'] }, severity: 'critical' },
    { id: '7', action: 'delete', model: 'PurchaseOrder', object_repr: 'PO-2025-003', user: 'Ahmad Al-Rashid', user_email: 'ahmad@company.com', timestamp: '2025-05-03T14:20:00Z', ip_address: '192.168.1.10', severity: 'warning' },
    { id: '8', action: 'create', model: 'Budget', object_repr: 'Q2 2025 Operations Budget', user: 'Yusuf Admin', user_email: 'admin@company.com', timestamp: '2025-05-03T11:00:00Z', ip_address: '192.168.1.1', severity: 'info' },
    { id: '9', action: 'update', model: 'SalesOrder', object_repr: 'SO-2025-0118', user: 'David Kim', user_email: 'david.kim@company.com', timestamp: '2025-05-02T15:45:00Z', ip_address: '10.0.0.42', changes: { quantity: [50, 80] }, severity: 'info' },
    { id: '10', action: 'login', model: 'User', object_repr: 'unknown@malicious.com', user: 'Unknown', user_email: 'unknown@malicious.com', timestamp: '2025-05-02T03:15:00Z', ip_address: '45.133.1.92', severity: 'critical' },
];

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    create: { icon: Plus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Created' },
    update: { icon: Edit3, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Updated' },
    delete: { icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Deleted' },
    login: { icon: UserCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Login' },
    logout: { icon: UserCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Logout' },
    export: { icon: Download, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Exported' },
};

const SEVERITY_CONFIG: Record<string, string> = {
    info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
    critical: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
};

export default function AuditPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get('/audit/logs/');
                setEntries(res.data.results || res.data);
            } catch {
                setEntries(MOCK_AUDIT);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = entries.filter(e => {
        const matchSearch = !search ||
            e.user.toLowerCase().includes(search.toLowerCase()) ||
            e.model.toLowerCase().includes(search.toLowerCase()) ||
            e.object_repr.toLowerCase().includes(search.toLowerCase()) ||
            e.ip_address.includes(search);
        const matchAction = filterAction === 'all' || e.action === filterAction;
        const matchSeverity = filterSeverity === 'all' || e.severity === filterSeverity;
        return matchSearch && matchAction && matchSeverity;
    });

    const kpis = [
        { label: 'Total Events', value: entries.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Shield },
        { label: 'Critical Alerts', value: entries.filter(e => e.severity === 'critical').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', icon: AlertTriangle },
        { label: 'Data Changes', value: entries.filter(e => ['create', 'update', 'delete'].includes(e.action)).length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Edit3 },
        { label: 'Unique Users', value: new Set(entries.map(e => e.user_email)).size, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: UserCircle },
    ];

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
    );

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-7 h-7 text-brand-500" /> Audit Trail
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Immutable record of all system events, user actions, and data changes.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEntries(MOCK_AUDIT)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
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

            {/* Filters */}
            <motion.div variants={iV} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by user, model, object, or IP..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder:text-slate-400"
                    />
                </div>
                <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                    className="px-4 py-2.5 text-sm font-bold bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500">
                    <option value="all">All Actions</option>
                    <option value="create">Created</option>
                    <option value="update">Updated</option>
                    <option value="delete">Deleted</option>
                    <option value="login">Login</option>
                    <option value="export">Export</option>
                </select>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                    className="px-4 py-2.5 text-sm font-bold bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500">
                    <option value="all">All Severity</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                </select>
            </motion.div>

            {/* Audit Log Table */}
            <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                {['', 'Action', 'Model / Object', 'User', 'Timestamp', 'IP Address', 'Severity'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-slate-500 font-medium">No audit events match your filters.</td></tr>
                            ) : filtered.map(e => {
                                const cfg = ACTION_CONFIG[e.action] || ACTION_CONFIG.login;
                                const Icon = cfg.icon;
                                return (
                                    <>
                                        <tr key={e.id} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${e.severity === 'critical' ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                                            <td className="py-3 px-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-bold capitalize ${cfg.color}`}>{cfg.label}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{e.model}</p>
                                                <p className="text-xs text-slate-400 max-w-[200px] truncate">{e.object_repr}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{e.user}</p>
                                                <p className="text-xs text-slate-400">{e.user_email}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-500 font-medium">{new Date(e.timestamp).toLocaleString()}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{e.ip_address}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset capitalize ${SEVERITY_CONFIG[e.severity]}`}>{e.severity}</span>
                                            </td>
                                        </tr>
                                        {expandedId === e.id && e.changes && (
                                            <tr key={`${e.id}-detail`} className="bg-slate-50 dark:bg-slate-900/30">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Field Changes</p>
                                                    <div className="space-y-2">
                                                        {Object.entries(e.changes).map(([field, [before, after]]) => (
                                                            <div key={field} className="flex items-center gap-4 text-sm">
                                                                <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[140px] capitalize">{field.replace('_', ' ')}</span>
                                                                <span className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md font-mono text-xs">{String(before)}</span>
                                                                <span className="text-slate-400">→</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono text-xs">{String(after)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-400 font-medium">Showing {filtered.length} of {entries.length} events</p>
                    <p className="text-xs text-slate-400">Click a row to view field-level changes</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
