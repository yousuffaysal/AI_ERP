"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, FileText, Truck, Package, PlusCircle, Pencil, Trash2,
    X, AlertCircle, Loader2, BrainCircuit, CheckCircle2, Clock, Send,
    ClipboardList, DollarSign, Star
} from 'lucide-react';

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

type Tab = 'orders' | 'rfq' | 'vendors' | 'receipts';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'rfq', label: 'RFQ / Quotes', icon: FileText },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'receipts', label: 'Receipts', icon: Package },
];

interface PurchaseOrder {
    id: string; po_number: string; vendor: string; vendor_name?: string;
    status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
    total_amount: string; expected_delivery: string; created_at: string; notes?: string;
}
interface RFQ {
    id: string; rfq_number: string; title: string; vendor_name: string;
    status: 'open' | 'responded' | 'awarded' | 'closed';
    due_date: string; estimated_value: string;
}
interface Vendor {
    id: string; name: string; code: string; contact_name: string;
    email: string; phone: string; rating: number; is_approved: boolean; category: string;
}
interface Receipt {
    id: string; receipt_number: string; po_number: string; vendor_name: string;
    received_date: string; total_received: number; status: 'pending' | 'partial' | 'complete';
}

function Modal({ open, onClose, title, subtitle, onSubmit, submitting, error, children }: any) {
    if (!open) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{title}</h3>
                            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                        </div>
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
        draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
        sent: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-200 dark:ring-blue-500/20',
        confirmed: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-500/20',
        received: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20',
        open: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
        responded: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 ring-sky-200 dark:ring-sky-500/20',
        awarded: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
        partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20',
        complete: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20',
        pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset capitalize ${map[status] || map.draft}`}>
            {status}
        </span>
    );
}

const MOCK_ORDERS: PurchaseOrder[] = [
    { id: '1', po_number: 'PO-2025-001', vendor: 'v1', vendor_name: 'Alpha Supplies Co.', status: 'confirmed', total_amount: '15400.00', expected_delivery: '2025-05-15', created_at: '2025-05-01T09:00:00Z' },
    { id: '2', po_number: 'PO-2025-002', vendor: 'v2', vendor_name: 'TechParts Global', status: 'sent', total_amount: '8750.50', expected_delivery: '2025-05-20', created_at: '2025-05-02T11:00:00Z' },
    { id: '3', po_number: 'PO-2025-003', vendor: 'v3', vendor_name: 'FastShip Ltd.', status: 'received', total_amount: '3200.00', expected_delivery: '2025-04-30', created_at: '2025-04-25T08:00:00Z' },
    { id: '4', po_number: 'PO-2025-004', vendor: 'v1', vendor_name: 'Alpha Supplies Co.', status: 'draft', total_amount: '22000.00', expected_delivery: '2025-06-01', created_at: '2025-05-04T10:00:00Z' },
];
const MOCK_RFQS: RFQ[] = [
    { id: '1', rfq_number: 'RFQ-2025-001', title: 'Office Equipment Procurement', vendor_name: 'Multiple Vendors', status: 'open', due_date: '2025-05-10', estimated_value: '50000.00' },
    { id: '2', rfq_number: 'RFQ-2025-002', title: 'Server Hardware Refresh', vendor_name: 'TechParts Global', status: 'responded', due_date: '2025-05-08', estimated_value: '120000.00' },
    { id: '3', rfq_number: 'RFQ-2025-003', title: 'Warehouse Shelving Units', vendor_name: 'StoragePro Inc.', status: 'awarded', due_date: '2025-04-25', estimated_value: '18500.00' },
];
const MOCK_VENDORS: Vendor[] = [
    { id: '1', name: 'Alpha Supplies Co.', code: 'VEN-001', contact_name: 'James Miller', email: 'james@alphasupplies.com', phone: '+1-555-0101', rating: 4.8, is_approved: true, category: 'Raw Materials' },
    { id: '2', name: 'TechParts Global', code: 'VEN-002', contact_name: 'Sarah Chen', email: 'sarah@techparts.com', phone: '+1-555-0102', rating: 4.5, is_approved: true, category: 'Electronics' },
    { id: '3', name: 'FastShip Ltd.', code: 'VEN-003', contact_name: 'Omar Hassan', email: 'omar@fastship.com', phone: '+971-555-0103', rating: 4.2, is_approved: true, category: 'Logistics' },
    { id: '4', name: 'StoragePro Inc.', code: 'VEN-004', contact_name: 'Lisa Park', email: 'lisa@storagepro.com', phone: '+1-555-0104', rating: 3.9, is_approved: false, category: 'Equipment' },
];
const MOCK_RECEIPTS: Receipt[] = [
    { id: '1', receipt_number: 'GRN-2025-001', po_number: 'PO-2025-003', vendor_name: 'FastShip Ltd.', received_date: '2025-04-30', total_received: 150, status: 'complete' },
    { id: '2', receipt_number: 'GRN-2025-002', po_number: 'PO-2025-001', vendor_name: 'Alpha Supplies Co.', received_date: '2025-05-14', total_received: 80, status: 'partial' },
];

export default function ProcurementPage() {
    const [activeTab, setActiveTab] = useState<Tab>('orders');
    const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
    const [rfqs, setRfqs] = useState<RFQ[]>(MOCK_RFQS);
    const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
    const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);

    const [orderModal, setOrderModal] = useState(false);
    const [vendorModal, setVendorModal] = useState(false);
    const [rfqModal, setRfqModal] = useState(false);
    const [orderForm, setOrderForm] = useState({ po_number: '', vendor_name: '', total_amount: '', expected_delivery: '', status: 'draft', notes: '' });
    const [vendorForm, setVendorForm] = useState({ name: '', code: '', contact_name: '', email: '', phone: '', category: '', is_approved: true });
    const [rfqForm, setRfqForm] = useState({ rfq_number: '', title: '', vendor_name: '', due_date: '', estimated_value: '' });
    const [submitting, setSubmitting] = useState(false);
    const [modalErr, setModalErr] = useState<string | null>(null);

    const kpis = [
        { label: 'Open POs', value: orders.filter(o => ['draft','sent','confirmed'].includes(o.status)).length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: ShoppingBag },
        { label: 'Pending RFQs', value: rfqs.filter(r => r.status === 'open').length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: FileText },
        { label: 'Approved Vendors', value: vendors.filter(v => v.is_approved).length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: Truck },
        { label: 'Total PO Value', value: `$${orders.reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0).toLocaleString()}`, color: 'text-[#E2FF00]', bg: 'bg-brand-500/10', icon: DollarSign },
    ];

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setModalErr(null);
        await new Promise(r => setTimeout(r, 600));
        const newOrder: PurchaseOrder = { id: Date.now().toString(), po_number: orderForm.po_number || `PO-2025-00${orders.length + 1}`, vendor: 'new', vendor_name: orderForm.vendor_name, status: orderForm.status as any, total_amount: orderForm.total_amount, expected_delivery: orderForm.expected_delivery, created_at: new Date().toISOString(), notes: orderForm.notes };
        setOrders(prev => [newOrder, ...prev]);
        setOrderModal(false); setOrderForm({ po_number: '', vendor_name: '', total_amount: '', expected_delivery: '', status: 'draft', notes: '' });
        setSubmitting(false);
    };
    const handleVendorSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setModalErr(null);
        await new Promise(r => setTimeout(r, 600));
        const newVendor: Vendor = { id: Date.now().toString(), ...vendorForm, rating: 0 };
        setVendors(prev => [newVendor, ...prev]);
        setVendorModal(false); setVendorForm({ name: '', code: '', contact_name: '', email: '', phone: '', category: '', is_approved: true });
        setSubmitting(false);
    };
    const handleRfqSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setModalErr(null);
        await new Promise(r => setTimeout(r, 600));
        const newRfq: RFQ = { id: Date.now().toString(), ...rfqForm, status: 'open' };
        setRfqs(prev => [newRfq, ...prev]);
        setRfqModal(false); setRfqForm({ rfq_number: '', title: '', vendor_name: '', due_date: '', estimated_value: '' });
        setSubmitting(false);
    };

    const openModal = () => {
        setModalErr(null);
        if (activeTab === 'orders') setOrderModal(true);
        else if (activeTab === 'vendors') setVendorModal(true);
        else if (activeTab === 'rfq') setRfqModal(true);
    };

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Procurement</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Manage purchase orders, RFQs, vendors and goods receipts.</p>
                </div>
                {activeTab !== 'receipts' && (
                    <button onClick={openModal} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-md">
                        <PlusCircle className="w-4 h-4" />
                        Add {activeTab === 'orders' ? 'Purchase Order' : activeTab === 'vendors' ? 'Vendor' : 'RFQ'}
                    </button>
                )}
            </motion.div>

            {/* KPIs */}
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

            {/* Tabs */}
            <motion.div variants={iV} className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </motion.div>

            {/* Purchase Orders */}
            {activeTab === 'orders' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['PO Number', 'Vendor', 'Status', 'Total Amount', 'Expected Delivery', 'Actions'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {orders.map(o => (
                                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{o.po_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{o.vendor_name}</p></td>
                                        <td className="py-4 px-4"><StatusBadge status={o.status} /></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">${parseFloat(o.total_amount).toLocaleString()}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500 font-medium">{o.expected_delivery}</p></td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => setOrders(prev => prev.filter(x => x.id !== o.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* RFQs */}
            {activeTab === 'rfq' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['RFQ Number', 'Title', 'Vendor', 'Status', 'Due Date', 'Est. Value', 'Actions'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {rfqs.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4"><p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{r.rfq_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate">{r.title}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500">{r.vendor_name}</p></td>
                                        <td className="py-4 px-4"><StatusBadge status={r.status} /></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500 font-medium">{r.due_date}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">${parseFloat(r.estimated_value).toLocaleString()}</p></td>
                                        <td className="py-4 px-4">
                                            <div className="flex gap-2">
                                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => setRfqs(prev => prev.filter(x => x.id !== r.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Vendors */}
            {activeTab === 'vendors' && (
                <motion.div variants={iV} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {vendors.map(v => (
                        <div key={v.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{v.name}</p>
                                    <p className="text-xs font-mono text-slate-400">{v.code}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.is_approved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                    {v.is_approved ? 'Approved' : 'Pending'}
                                </span>
                            </div>
                            <div className="space-y-1 mb-3">
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{v.contact_name}</p>
                                <p className="text-xs text-slate-400">{v.email}</p>
                                <p className="text-xs text-slate-400">{v.phone}</p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.floor(v.rating) ? 'text-[#E2FF00] fill-[#E2FF00]' : 'text-slate-300 dark:text-slate-700'}`} />
                                    ))}
                                    <span className="text-xs font-bold text-slate-500 ml-1">{v.rating}</span>
                                </div>
                                <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{v.category}</span>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => setVendors(prev => prev.filter(x => x.id !== v.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Receipts */}
            {activeTab === 'receipts' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['GRN Number', 'PO Reference', 'Vendor', 'Received Date', 'Items Received', 'Status'].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {receipts.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-4"><p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{r.receipt_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-mono text-slate-500">{r.po_number}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{r.vendor_name}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm text-slate-500 font-medium">{r.received_date}</p></td>
                                        <td className="py-4 px-4"><p className="text-sm font-bold text-slate-900 dark:text-white">{r.total_received} units</p></td>
                                        <td className="py-4 px-4"><StatusBadge status={r.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Order Modal */}
            <Modal open={orderModal} onClose={() => setOrderModal(false)} title="New Purchase Order" subtitle="Create a procurement order." onSubmit={handleOrderSubmit} submitting={submitting} error={modalErr}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="PO Number"><input className={inp + ' font-mono'} value={orderForm.po_number} onChange={e => setOrderForm(f => ({ ...f, po_number: e.target.value }))} placeholder="PO-2025-005" /></Field>
                    <Field label="Status">
                        <select className={inp} value={orderForm.status} onChange={e => setOrderForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="draft">Draft</option><option value="sent">Sent</option><option value="confirmed">Confirmed</option>
                        </select>
                    </Field>
                </div>
                <Field label="Vendor Name"><input required className={inp} value={orderForm.vendor_name} onChange={e => setOrderForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="Alpha Supplies Co." /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Total Amount ($)"><input required type="number" step="0.01" className={inp} value={orderForm.total_amount} onChange={e => setOrderForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="5000.00" /></Field>
                    <Field label="Expected Delivery"><input required type="date" className={inp} value={orderForm.expected_delivery} onChange={e => setOrderForm(f => ({ ...f, expected_delivery: e.target.value }))} /></Field>
                </div>
                <Field label="Notes"><textarea rows={3} className={inp + ' resize-none'} value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional instructions..." /></Field>
            </Modal>

            {/* Vendor Modal */}
            <Modal open={vendorModal} onClose={() => setVendorModal(false)} title="Add Vendor" subtitle="Register a new supplier." onSubmit={handleVendorSubmit} submitting={submitting} error={modalErr}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Vendor Name"><input required className={inp} value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" /></Field>
                    <Field label="Code"><input required className={inp + ' font-mono'} value={vendorForm.code} onChange={e => setVendorForm(f => ({ ...f, code: e.target.value }))} placeholder="VEN-005" /></Field>
                </div>
                <Field label="Contact Name"><input className={inp} value={vendorForm.contact_name} onChange={e => setVendorForm(f => ({ ...f, contact_name: e.target.value }))} /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Email"><input type="email" className={inp} value={vendorForm.email} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} /></Field>
                    <Field label="Phone"><input className={inp} value={vendorForm.phone} onChange={e => setVendorForm(f => ({ ...f, phone: e.target.value }))} /></Field>
                </div>
                <Field label="Category"><input className={inp} value={vendorForm.category} onChange={e => setVendorForm(f => ({ ...f, category: e.target.value }))} placeholder="Electronics, Raw Materials..." /></Field>
                <div className="flex items-center gap-3 pt-1">
                    <input type="checkbox" id="v_approved" checked={vendorForm.is_approved} onChange={e => setVendorForm(f => ({ ...f, is_approved: e.target.checked }))} className="w-5 h-5 rounded text-brand-600" />
                    <label htmlFor="v_approved" className="text-sm font-bold text-slate-700 dark:text-slate-300">Approved Vendor</label>
                </div>
            </Modal>

            {/* RFQ Modal */}
            <Modal open={rfqModal} onClose={() => setRfqModal(false)} title="New RFQ" subtitle="Request for quotation." onSubmit={handleRfqSubmit} submitting={submitting} error={modalErr}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="RFQ Number"><input className={inp + ' font-mono'} value={rfqForm.rfq_number} onChange={e => setRfqForm(f => ({ ...f, rfq_number: e.target.value }))} placeholder="RFQ-2025-004" /></Field>
                    <Field label="Est. Value ($)"><input type="number" step="0.01" className={inp} value={rfqForm.estimated_value} onChange={e => setRfqForm(f => ({ ...f, estimated_value: e.target.value }))} placeholder="10000.00" /></Field>
                </div>
                <Field label="Title"><input required className={inp} value={rfqForm.title} onChange={e => setRfqForm(f => ({ ...f, title: e.target.value }))} placeholder="Equipment procurement for Q3" /></Field>
                <Field label="Vendor / Vendor Pool"><input className={inp} value={rfqForm.vendor_name} onChange={e => setRfqForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="Multiple Vendors" /></Field>
                <Field label="Response Due Date"><input required type="date" className={inp} value={rfqForm.due_date} onChange={e => setRfqForm(f => ({ ...f, due_date: e.target.value }))} /></Field>
            </Modal>
        </motion.div>
    );
}
