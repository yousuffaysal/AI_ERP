"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, BarChart3, Loader2,
    Receipt, PiggyBank, AlertTriangle, CheckCircle2, Plus, X, AlertCircle, Check, XCircle
} from 'lucide-react';

interface Account { id: string; code: string; name: string; account_type: string; is_active: boolean; }
interface Transaction { id: string; reference: string; account: string; account_name?: string; transaction_type: string; amount: string; date: string; description: string; }
interface Expense { id: string; title: string; amount: string; date: string; status: string; account_name?: string; account?: string; }

const stagger: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } } };

const TYPE_COLORS: Record<string, string> = {
    debit: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    credit: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    paid: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
const ACCT_COLORS: Record<string, string> = {
    asset: 'text-sky-600 dark:text-sky-400', liability: 'text-rose-600 dark:text-rose-400',
    equity: 'text-violet-600 dark:text-violet-400', revenue: 'text-emerald-600 dark:text-emerald-400',
    expense: 'text-amber-600 dark:text-amber-400',
};
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

export default function FinancePage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Transaction modal
    const [txModal, setTxModal] = useState(false);
    const [txForm, setTxForm] = useState({ reference: '', account: '', transaction_type: 'credit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    const [txErr, setTxErr] = useState<string | null>(null);
    const [txSub, setTxSub] = useState(false);

    // Expense modal
    const [expModal, setExpModal] = useState(false);
    const [expForm, setExpForm] = useState({ title: '', account: '', amount: '', date: new Date().toISOString().split('T')[0] });
    const [expErr, setExpErr] = useState<string | null>(null);
    const [expSub, setExpSub] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [acctRes, txRes, expRes] = await Promise.all([
                api.get('/finance/accounts/'), api.get('/finance/transactions/'), api.get('/finance/expenses/')
            ]);
            setAccounts(acctRes.data.results || acctRes.data);
            setTransactions(txRes.data.results || txRes.data);
            setExpenses(expRes.data.results || expRes.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

    // ── Create Transaction
    const handleTxSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setTxSub(true); setTxErr(null);
        try {
            const res = await api.post('/finance/transactions/', txForm);
            setTransactions(prev => [res.data, ...prev]);
            setTxModal(false);
            setTxForm({ reference: '', account: '', transaction_type: 'credit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
            showSuccess('Transaction recorded successfully.');
        } catch (err: any) {
            const d = err.response?.data; setTxErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to create transaction.');
        } finally { setTxSub(false); }
    };

    // ── Create Expense
    const handleExpSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setExpSub(true); setExpErr(null);
        try {
            const res = await api.post('/finance/expenses/', expForm);
            setExpenses(prev => [res.data, ...prev]);
            setExpModal(false);
            setExpForm({ title: '', account: '', amount: '', date: new Date().toISOString().split('T')[0] });
            showSuccess('Expense claim submitted.');
        } catch (err: any) {
            const d = err.response?.data; setExpErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to submit expense.');
        } finally { setExpSub(false); }
    };

    // ── Approve / Reject Expense
    const approveExpense = async (id: string) => {
        try {
            const res = await api.post(`/finance/expenses/${id}/approve/`);
            setExpenses(prev => prev.map(e => e.id === id ? res.data : e));
            showSuccess('Expense approved.');
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to approve.'); }
    };
    const rejectExpense = async (id: string) => {
        try {
            const res = await api.post(`/finance/expenses/${id}/reject/`);
            setExpenses(prev => prev.map(e => e.id === id ? res.data : e));
            showSuccess('Expense rejected.');
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to reject.'); }
    };

    const totalCredits = transactions.filter(t => t.transaction_type === 'credit').reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
    const totalDebits = transactions.filter(t => t.transaction_type === 'debit').reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
    const netPosition = totalCredits - totalDebits;
    const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

    if (loading) return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-16">
            {/* Success Toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm">
                        <CheckCircle2 className="w-5 h-5" />{successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div variants={item} className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-4xl font-heading text-slate-900 dark:text-[#E2FF00]">Finance & Accounts</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Chart of accounts, transactions, and expense management.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setExpErr(null); setExpModal(true); }}
                        className="px-4 py-2.5 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-sm font-bold rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors">
                        + New Expense
                    </button>
                    <button onClick={() => { setTxErr(null); setTxModal(true); }}
                        className="px-5 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md">
                        + New Transaction
                    </button>
                </div>
            </motion.div>

            {/* KPIs */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Credits", value: `$${totalCredits.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { label: "Total Debits", value: `$${totalDebits.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
                    { label: "Net Position", value: `$${netPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: netPosition >= 0 ? CheckCircle2 : AlertTriangle, color: netPosition >= 0 ? "text-teal-500" : "text-amber-500", bg: netPosition >= 0 ? "bg-teal-50 dark:bg-teal-500/10" : "bg-amber-50 dark:bg-amber-500/10" },
                    { label: "Pending Expenses", value: `${pendingExpenses} claims`, icon: Receipt, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-[#0E0E0E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{kpi.label}</span>
                            <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
                        </div>
                        <span className="text-2xl font-heading text-slate-900 dark:text-white">{kpi.value}</span>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions */}
                <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand-500" />Recent Transactions</h2>
                        <span className="text-xs text-slate-500 font-semibold">{transactions.length} entries</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Reference', 'Account', 'Type', 'Amount', 'Date'].map(h => <th key={h} className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {transactions.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium">No transactions yet. Create one above.</td></tr>
                                    : transactions.slice(0, 12).map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3 px-4 text-sm font-mono font-bold text-brand-600 dark:text-brand-400">{tx.reference}</td>
                                            <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{tx.account_name || '—'}</td>
                                            <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[tx.transaction_type] || ''}`}>{tx.transaction_type}</span></td>
                                            <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">${parseFloat(tx.amount).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-xs text-slate-500 font-medium">{tx.date}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Chart of Accounts */}
                    <motion.div variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><PiggyBank className="w-4 h-4 text-violet-500" />Chart of Accounts</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            {accounts.length === 0 ? <p className="text-center text-slate-400 text-sm py-4">No accounts configured.</p>
                                : accounts.slice(0, 8).map(acct => (
                                    <div key={acct.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{acct.name}</p>
                                            <p className="text-xs font-mono text-slate-400">{acct.code}</p>
                                        </div>
                                        <span className={`text-xs font-bold uppercase ${ACCT_COLORS[acct.account_type] || ''}`}>{acct.account_type}</span>
                                    </div>
                                ))}
                        </div>
                    </motion.div>

                    {/* Expense Claims */}
                    <motion.div variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" />Expense Claims</h2>
                            <button onClick={() => { setExpErr(null); setExpModal(true); }} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">+ Add</button>
                        </div>
                        <div className="p-4 space-y-2">
                            {expenses.length === 0 ? <p className="text-center text-slate-400 text-sm py-4">No expense claims.</p>
                                : expenses.slice(0, 5).map(exp => (
                                    <div key={exp.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{exp.title}</p>
                                                <p className="text-xs text-slate-400 font-medium">{exp.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">${parseFloat(exp.amount).toLocaleString()}</p>
                                                <span className={`text-xs font-bold ${TYPE_COLORS[exp.status] || ''} px-1.5 py-0.5 rounded-full`}>{exp.status}</span>
                                            </div>
                                        </div>
                                        {exp.status === 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => approveExpense(exp.id)} className="flex-1 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1"><Check className="w-3 h-3" />Approve</button>
                                                <button onClick={() => rejectExpense(exp.id)} className="flex-1 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />Reject</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── New Transaction Modal ── */}
            <AnimatePresence>
                {txModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !txSub && setTxModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">New Transaction</h3><p className="text-sm text-slate-500 mt-0.5">Record a financial transaction.</p></div>
                                <button onClick={() => setTxModal(false)} disabled={txSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {txErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{txErr}</div>}
                                <form id="tx-form" onSubmit={handleTxSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Reference *</label>
                                        <input required className={inp} value={txForm.reference} onChange={e => setTxForm(f => ({ ...f, reference: e.target.value }))} placeholder="TXN-2024-001" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Account *</label>
                                        <select required className={inp} value={txForm.account} onChange={e => setTxForm(f => ({ ...f, account: e.target.value }))}>
                                            <option value="">Select account...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Type</label>
                                            <select className={inp} value={txForm.transaction_type} onChange={e => setTxForm(f => ({ ...f, transaction_type: e.target.value }))}>
                                                <option value="credit">Credit</option>
                                                <option value="debit">Debit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Amount ($) *</label>
                                            <input required type="number" step="0.01" min="0" className={inp} value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="1000.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Date *</label>
                                        <input required type="date" className={inp} value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Description</label>
                                        <textarea rows={2} className={inp + ' resize-none'} value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setTxModal(false)} disabled={txSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" form="tx-form" disabled={txSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">
                                    {txSub && <Loader2 className="w-4 h-4 animate-spin" />}{txSub ? 'Saving...' : 'Record Transaction'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── New Expense Modal ── */}
            <AnimatePresence>
                {expModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !expSub && setExpModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">New Expense Claim</h3><p className="text-sm text-slate-500 mt-0.5">Submit an expense for approval.</p></div>
                                <button onClick={() => setExpModal(false)} disabled={expSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {expErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{expErr}</div>}
                                <form id="exp-form" onSubmit={handleExpSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                                        <input required className={inp} value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} placeholder="Office Supplies" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Account</label>
                                        <select className={inp} value={expForm.account} onChange={e => setExpForm(f => ({ ...f, account: e.target.value }))}>
                                            <option value="">None</option>
                                            {accounts.filter(a => a.account_type === 'expense').map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Amount ($) *</label>
                                            <input required type="number" step="0.01" min="0" className={inp} value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} placeholder="250.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Date *</label>
                                            <input required type="date" className={inp} value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setExpModal(false)} disabled={expSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="exp-form" disabled={expSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">
                                    {expSub && <Loader2 className="w-4 h-4 animate-spin" />}{expSub ? 'Submitting...' : 'Submit Expense'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
