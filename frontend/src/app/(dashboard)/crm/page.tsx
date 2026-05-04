"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, Phone, Mail, MessageSquare, PlusCircle,
    Pencil, Trash2, X, AlertCircle, Loader2, User, Calendar,
    DollarSign, ArrowRight, CheckCircle2, Clock, XCircle
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

type Tab = 'pipeline' | 'leads' | 'opportunities' | 'activities';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'opportunities', label: 'Opportunities', icon: DollarSign },
    { id: 'activities', label: 'Activities', icon: MessageSquare },
];

interface Lead {
    id: string; name: string; company: string; email: string; phone: string;
    source: string; status: 'new' | 'contacted' | 'qualified' | 'disqualified';
    value: number; assigned_to: string; created_at: string;
}
interface Opportunity {
    id: string; title: string; company: string; contact: string;
    stage: 'proposal' | 'negotiation' | 'won' | 'lost';
    value: number; probability: number; close_date: string; assigned_to: string;
}
interface Activity {
    id: string; type: 'call' | 'email' | 'meeting' | 'task';
    subject: string; contact: string; company: string;
    due_date: string; status: 'pending' | 'done' | 'overdue'; notes?: string;
}

const PIPELINE_STAGES = ['New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won'] as const;

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

const ACTIVITY_ICON: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, task: CheckCircle2 };
const ACTIVITY_COLOR: Record<string, string> = {
    call: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    email: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    meeting: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    task: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

const MOCK_LEADS: Lead[] = [
    { id: '1', name: 'Mohammed Al-Farsi', company: 'Gulf Dynamics LLC', email: 'mfarsi@gulfdyn.ae', phone: '+971-50-1234567', source: 'LinkedIn', status: 'qualified', value: 85000, assigned_to: 'Sara Johnson', created_at: '2025-04-28' },
    { id: '2', name: 'Elena Petrov', company: 'EuroTech Solutions', email: 'epetrov@eurotech.eu', phone: '+49-30-1234567', source: 'Trade Show', status: 'contacted', value: 42000, assigned_to: 'David Kim', created_at: '2025-05-01' },
    { id: '3', name: 'James Whitfield', company: 'Pacific Rim Imports', email: 'j.whitfield@pacrim.com', phone: '+1-415-5550101', source: 'Referral', status: 'new', value: 120000, assigned_to: 'Ahmad Al-Rashid', created_at: '2025-05-03' },
    { id: '4', name: 'Priya Sharma', company: 'Indigo Ventures', email: 'priya@indigovc.in', phone: '+91-98-12345678', source: 'Website', status: 'disqualified', value: 15000, assigned_to: 'Sara Johnson', created_at: '2025-04-20' },
];

const MOCK_OPPS: Opportunity[] = [
    { id: '1', title: 'Enterprise ERP Suite — Gulf Dynamics', company: 'Gulf Dynamics LLC', contact: 'Mohammed Al-Farsi', stage: 'negotiation', value: 85000, probability: 75, close_date: '2025-05-30', assigned_to: 'Sara Johnson' },
    { id: '2', title: 'Hardware Supply Q3 — EuroTech', company: 'EuroTech Solutions', contact: 'Elena Petrov', stage: 'proposal', value: 42000, probability: 40, close_date: '2025-06-15', assigned_to: 'David Kim' },
    { id: '3', title: 'Logistics Partnership — Pacific Rim', company: 'Pacific Rim Imports', contact: 'James Whitfield', stage: 'won', value: 120000, probability: 100, close_date: '2025-04-30', assigned_to: 'Ahmad Al-Rashid' },
];

const MOCK_ACTIVITIES: Activity[] = [
    { id: '1', type: 'call', subject: 'Follow-up call with Mohammed', contact: 'Mohammed Al-Farsi', company: 'Gulf Dynamics LLC', due_date: '2025-05-05', status: 'done' },
    { id: '2', type: 'meeting', subject: 'Demo presentation — EuroTech', contact: 'Elena Petrov', company: 'EuroTech Solutions', due_date: '2025-05-08', status: 'pending', notes: 'Prepare slides on AI features.' },
    { id: '3', type: 'email', subject: 'Send proposal PDF', contact: 'James Whitfield', company: 'Pacific Rim Imports', due_date: '2025-05-04', status: 'overdue' },
    { id: '4', type: 'task', subject: 'Update CRM records Q2', contact: '—', company: 'Internal', due_date: '2025-05-10', status: 'pending' },
];

const STAGE_COLOR: Record<string, string> = {
    proposal: 'border-blue-400 bg-blue-50 dark:bg-blue-500/5',
    negotiation: 'border-amber-400 bg-amber-50 dark:bg-amber-500/5',
    won: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/5',
    lost: 'border-red-400 bg-red-50 dark:bg-red-500/5',
};

export default function CRMPage() {
    const [activeTab, setActiveTab] = useState<Tab>('pipeline');
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [opps, setOpps] = useState<Opportunity[]>(MOCK_OPPS);
    const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
    const [leadModal, setLeadModal] = useState(false);
    const [oppModal, setOppModal] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: '', company: '', email: '', phone: '', source: '', value: '', assigned_to: '', status: 'new' });
    const [oppForm, setOppForm] = useState({ title: '', company: '', contact: '', value: '', probability: '', close_date: '', assigned_to: '', stage: 'proposal' });
    const [submitting, setSubmitting] = useState(false);

    const kpis = [
        { label: 'Active Leads', value: leads.filter(l => l.status !== 'disqualified').length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Target },
        { label: 'Pipeline Value', value: `$${opps.reduce((s, o) => s + o.value, 0).toLocaleString()}`, color: 'text-[#E2FF00]', bg: 'bg-brand-500/10', icon: DollarSign },
        { label: 'Win Rate', value: `${Math.round((opps.filter(o => o.stage === 'won').length / opps.length) * 100)}%`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2 },
        { label: 'Pending Tasks', value: activities.filter(a => a.status === 'pending').length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
    ];

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setLeads(prev => [{ id: Date.now().toString(), ...leadForm, value: parseFloat(leadForm.value) || 0, status: leadForm.status as any, created_at: new Date().toISOString().split('T')[0] }, ...prev]);
        setLeadModal(false); setLeadForm({ name: '', company: '', email: '', phone: '', source: '', value: '', assigned_to: '', status: 'new' });
        setSubmitting(false);
    };
    const handleOppSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setOpps(prev => [{ id: Date.now().toString(), ...oppForm, value: parseFloat(oppForm.value) || 0, probability: parseInt(oppForm.probability) || 0, stage: oppForm.stage as any }, ...prev]);
        setOppModal(false); setOppForm({ title: '', company: '', contact: '', value: '', probability: '', close_date: '', assigned_to: '', stage: 'proposal' });
        setSubmitting(false);
    };

    const LEAD_STATUS_COLOR: Record<string, string> = {
        new: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        contacted: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        qualified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        disqualified: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">CRM</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Leads, opportunities, pipeline and activity tracking.</p>
                </div>
                <div className="flex gap-2">
                    {(activeTab === 'leads' || activeTab === 'pipeline') && (
                        <button onClick={() => setLeadModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <PlusCircle className="w-4 h-4" /> Add Lead
                        </button>
                    )}
                    {(activeTab === 'opportunities' || activeTab === 'pipeline') && (
                        <button onClick={() => setOppModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md">
                            <PlusCircle className="w-4 h-4" /> Add Opportunity
                        </button>
                    )}
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

            <motion.div variants={iV} className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </motion.div>

            {/* Pipeline View */}
            {activeTab === 'pipeline' && (
                <motion.div variants={iV} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['proposal', 'negotiation', 'won'] as const).map(stage => {
                        const stageOpps = opps.filter(o => o.stage === stage);
                        const stageValue = stageOpps.reduce((s, o) => s + o.value, 0);
                        const stageLabel = { proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won' }[stage];
                        return (
                            <div key={stage} className={`rounded-2xl border-2 ${STAGE_COLOR[stage]} p-4 space-y-3`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{stageLabel}</p>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{stageOpps.length} deals</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">${stageValue.toLocaleString()}</p>
                                    </div>
                                </div>
                                {stageOpps.map(opp => (
                                    <div key={opp.id} className="bg-white dark:bg-[#0a0f1c] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{opp.title}</p>
                                        <p className="text-xs text-slate-400 mb-3">{opp.company} · {opp.contact}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">${opp.value.toLocaleString()}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${opp.probability}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">{opp.probability}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </motion.div>
            )}

            {/* Leads */}
            {activeTab === 'leads' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Contact', 'Company', 'Source', 'Value', 'Assigned To', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {leads.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{l.name[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{l.name}</p>
                                                    <p className="text-xs text-slate-400">{l.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{l.company}</p></td>
                                        <td className="py-4 px-4"><p className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{l.source}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">${l.value.toLocaleString()}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500">{l.assigned_to}</p></td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold capitalize ${LEAD_STATUS_COLOR[l.status]}`}>{l.status}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex gap-2">
                                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => setLeads(prev => prev.filter(x => x.id !== l.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Opportunities */}
            {activeTab === 'opportunities' && (
                <motion.div variants={iV} className="space-y-3">
                    {opps.map(o => (
                        <div key={o.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="font-bold text-slate-900 dark:text-white">{o.title}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${o.stage === 'won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : o.stage === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : o.stage === 'negotiation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{o.stage}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3">{o.company} · {o.contact} · Close: {o.close_date}</p>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Deal Value</p>
                                            <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">${o.value.toLocaleString()}</p>
                                        </div>
                                        <div className="flex-1 max-w-xs">
                                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1"><span>Probability</span><span>{o.probability}%</span></div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${o.probability}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <p className="text-xs text-slate-400">{o.assigned_to}</p>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => setOpps(prev => prev.filter(x => x.id !== o.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Activities */}
            {activeTab === 'activities' && (
                <motion.div variants={iV} className="space-y-3">
                    {activities.map(a => {
                        const Icon = ACTIVITY_ICON[a.type] || MessageSquare;
                        const statusColor = a.status === 'done' ? 'text-emerald-500' : a.status === 'overdue' ? 'text-red-500' : 'text-amber-500';
                        const StatusIcon = a.status === 'done' ? CheckCircle2 : a.status === 'overdue' ? XCircle : Clock;
                        return (
                            <div key={a.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-all">
                                <div className={`p-2.5 rounded-xl shrink-0 ${ACTIVITY_COLOR[a.type]}`}><Icon className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{a.subject}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{a.contact} · {a.company}</p>
                                    {a.notes && <p className="text-xs text-slate-500 mt-1 italic">{a.notes}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`flex items-center gap-1 justify-end ${statusColor}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold capitalize">{a.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{a.due_date}</p>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}

            {/* Lead Modal */}
            <Modal open={leadModal} onClose={() => setLeadModal(false)} title="Add Lead" subtitle="Capture a new prospect." onSubmit={handleLeadSubmit} submitting={submitting} error={null}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name"><input required className={inp} value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} placeholder="Mohammed Al-Farsi" /></Field>
                    <Field label="Company"><input required className={inp} value={leadForm.company} onChange={e => setLeadForm(f => ({ ...f, company: e.target.value }))} placeholder="Gulf Dynamics LLC" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Email"><input type="email" className={inp} value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} /></Field>
                    <Field label="Phone"><input className={inp} value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Source"><select className={inp} value={leadForm.source} onChange={e => setLeadForm(f => ({ ...f, source: e.target.value }))}><option value="">Select source</option><option>LinkedIn</option><option>Referral</option><option>Trade Show</option><option>Website</option><option>Cold Call</option></select></Field>
                    <Field label="Est. Value ($)"><input type="number" className={inp} value={leadForm.value} onChange={e => setLeadForm(f => ({ ...f, value: e.target.value }))} placeholder="50000" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Assigned To"><input className={inp} value={leadForm.assigned_to} onChange={e => setLeadForm(f => ({ ...f, assigned_to: e.target.value }))} /></Field>
                    <Field label="Status"><select className={inp} value={leadForm.status} onChange={e => setLeadForm(f => ({ ...f, status: e.target.value }))}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option></select></Field>
                </div>
            </Modal>

            {/* Opportunity Modal */}
            <Modal open={oppModal} onClose={() => setOppModal(false)} title="Add Opportunity" subtitle="Create a new deal." onSubmit={handleOppSubmit} submitting={submitting} error={null}>
                <Field label="Opportunity Title"><input required className={inp} value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} placeholder="Enterprise Deal — Company Name" /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Company"><input required className={inp} value={oppForm.company} onChange={e => setOppForm(f => ({ ...f, company: e.target.value }))} /></Field>
                    <Field label="Contact"><input className={inp} value={oppForm.contact} onChange={e => setOppForm(f => ({ ...f, contact: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Deal Value ($)"><input required type="number" className={inp} value={oppForm.value} onChange={e => setOppForm(f => ({ ...f, value: e.target.value }))} /></Field>
                    <Field label="Probability (%)"><input type="number" min="0" max="100" className={inp} value={oppForm.probability} onChange={e => setOppForm(f => ({ ...f, probability: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Stage"><select className={inp} value={oppForm.stage} onChange={e => setOppForm(f => ({ ...f, stage: e.target.value }))}><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option><option value="won">Won</option></select></Field>
                    <Field label="Close Date"><input required type="date" className={inp} value={oppForm.close_date} onChange={e => setOppForm(f => ({ ...f, close_date: e.target.value }))} /></Field>
                </div>
                <Field label="Assigned To"><input className={inp} value={oppForm.assigned_to} onChange={e => setOppForm(f => ({ ...f, assigned_to: e.target.value }))} /></Field>
            </Modal>
        </motion.div>
    );
}
