"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, MapPin, Search, Loader2, X, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    credit_limit: string;
    outstanding_balance: string;
    notes: string;
    is_active: boolean;
}

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', city: '', country: '', credit_limit: '0', notes: '', is_active: true };
const stagger: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Customer | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/sales/customers/');
            setCustomers(res.data.results || res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...EMPTY_FORM });
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (c: Customer) => {
        setEditTarget(c);
        setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: '', city: c.city || '', country: c.country || '', credit_limit: c.credit_limit || '0', notes: c.notes || '', is_active: c.is_active });
        setFormError(null);
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            if (editTarget) {
                const res = await api.patch(`/sales/customers/${editTarget.id}/`, form);
                setCustomers(prev => prev.map(c => c.id === editTarget.id ? res.data : c));
                setSuccessMsg('Customer updated successfully.');
            } else {
                const res = await api.post('/sales/customers/', form);
                setCustomers(prev => [res.data, ...prev]);
                setSuccessMsg('Customer created successfully.');
            }
            setModalOpen(false);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            const d = err.response?.data;
            setFormError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save customer.');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer? This cannot be undone.')) return;
        try {
            await api.delete(`/sales/customers/${id}/`);
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch { alert('Failed to delete customer.'); }
    };

    const filtered = customers.filter(c =>
        [c.name, c.email, c.city, c.country, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );
    const totalCredit = customers.reduce((s, c) => s + parseFloat(c.credit_limit || '0'), 0);

    if (loading) return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-16">
            {/* Success Toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm">
                        <CheckCircle2 className="w-5 h-5" /> {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-4xl font-heading text-slate-900 dark:text-[#E2FF00]">Customers</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your customer relationships and accounts.</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md">
                    <Plus className="w-4 h-4" /> Add Customer
                </button>
            </motion.div>

            {/* KPIs */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Customers", value: customers.length, accent: "text-sky-600 dark:text-sky-400" },
                    { label: "Active Accounts", value: customers.filter(c => c.is_active).length, accent: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Inactive", value: customers.filter(c => !c.is_active).length, accent: "text-slate-500" },
                    { label: "Total Credit Extended", value: `$${totalCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, accent: "text-indigo-600 dark:text-indigo-400" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-[#0E0E0E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{kpi.label}</p>
                        <p className={`text-3xl font-heading ${kpi.accent}`}>{kpi.value}</p>
                    </div>
                ))}
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by name, email, city..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 shadow-sm" />
            </motion.div>

            {/* Cards Grid */}
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <motion.div variants={item} className="col-span-full text-center py-16">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="font-semibold text-slate-500">No customers found. Add your first one above.</p>
                    </motion.div>
                ) : filtered.map(c => (
                    <motion.div key={c.id} variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {c.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5 mb-4">
                            {c.email && <div className="flex items-center gap-2 text-sm text-slate-500"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{c.email}</span></div>}
                            {c.phone && <div className="flex items-center gap-2 text-sm text-slate-500"><Phone className="w-3.5 h-3.5 shrink-0" />{c.phone}</div>}
                            {(c.city || c.country) && <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-3.5 h-3.5 shrink-0" />{[c.city, c.country].filter(Boolean).join(', ')}</div>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Credit Limit</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200">${parseFloat(c.credit_limit || '0').toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(c)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Edit</button>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <button onClick={() => handleDelete(c.id)} className="text-xs font-bold text-rose-500 hover:underline">Delete</button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{editTarget ? 'Edit Customer' : 'New Customer'}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Fill in the customer details below.</p>
                                </div>
                                <button onClick={() => setModalOpen(false)} disabled={submitting} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50 max-h-[70vh] overflow-y-auto">
                                {formError && (
                                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{formError}
                                    </div>
                                )}
                                <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Full Name *</label>
                                            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="Acme Corp" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Email</label>
                                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="contact@company.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                                            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="+1 555 000 0000" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">City</label>
                                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="Dubai" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Country</label>
                                            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="UAE" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Credit Limit ($)</label>
                                            <input type="number" min="0" step="0.01" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div className="flex items-center gap-3 pt-4">
                                            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 rounded text-brand-600" />
                                            <label htmlFor="is_active" className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Account</label>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</label>
                                            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500 resize-none" />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setModalOpen(false)} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" form="customer-form" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'Saving...' : (editTarget ? 'Update Customer' : 'Create Customer')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
