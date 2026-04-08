"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
    Receipt, Loader2, Sparkles, PlusCircle, BrainCircuit, X, AlertCircle, 
    CheckCircle2, Check, DollarSign, Ban, Eye, Download, Trash2, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface InvoiceItem {
    id?: string;
    product: string;
    product_name?: string;
    description: string;
    quantity: string;
    unit_price: string;
    total?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    customer?: { id: string, name: string };
    customer_detail?: { id: string, name: string };
    status: 'DRAFT' | 'CONFIRMED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOIDED' | 'CANCELLED';
    issue_date: string;
    due_date: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    amount_due: string;
    items?: InvoiceItem[];
}

interface Customer { id: string; name: string; }

const EMPTY_ITEM = { product: '', description: '', quantity: '1', unit_price: '0' };

const EMPTY_INV = { 
    invoice_number: '', 
    customer: '', 
    issue_date: new Date().toISOString().split('T')[0], 
    due_date: '', 
    notes: '', 
    terms: '', 
    discount_rate: '0', 
    tax_rate: '0',
    items: [{ ...EMPTY_ITEM }]
};

export default function SalesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invForm, setInvForm] = useState({ ...EMPTY_INV });
    const [invSubmitting, setInvSubmitting] = useState(false);
    const [invError, setInvError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [pricingForm, setPricingForm] = useState({ productId: '', unitCost: 10.0, currentVelocity: 50, competitorPrice: 15.0 });
    const [pricingResult, setPricingResult] = useState<any>(null);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingError, setPricingError] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [invRes, custRes, prodRes] = await Promise.all([
                api.get('/sales/invoices/'),
                api.get('/sales/customers/'),
                api.get('/inventory/products/')
            ]);
            setInvoices(invRes.data.results || invRes.data);
            setCustomers(custRes.data.results || custRes.data);
            setProducts(prodRes.data.results || prodRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openNewInvoice = () => {
        setInvForm({ ...EMPTY_INV, items: [{ ...EMPTY_ITEM }] });
        setInvError(null);
        setInvoiceModalOpen(true);
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setInvSubmitting(true); setInvError(null);
        try {
            const res = await api.post('/sales/invoices/', invForm);
            setInvoices(prev => [res.data, ...prev]);
            setInvoiceModalOpen(false);
            setSuccessMsg('Invoice created successfully.');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            const d = err.response?.data;
            setInvError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to create invoice.');
        } finally { setInvSubmitting(false); }
    };

    const handleOptimizePricing = async (e: React.FormEvent) => {
        e.preventDefault();
        setPricingLoading(true); setPricingError(null); setPricingResult(null);
        try {
            const payload = { unit_cost: pricingForm.unitCost, current_velocity: pricingForm.currentVelocity, competitor_price: pricingForm.competitorPrice };
            const res = await api.post(`/sales/optimize-pricing/`, payload);
            setTimeout(() => setPricingResult(res.data), 800);
        } catch {
            setPricingError("Insufficient historical elasticity data to compute pricing model.");
        } finally {
            setTimeout(() => setPricingLoading(false), 800);
        }
    };

    const handleConfirmInvoice = async (id: string) => {
        try {
            const res = await api.post(`/sales/invoices/${id}/confirm/`);
            setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
            setSuccessMsg('Invoice confirmed.');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to confirm invoice.'); }
    };

    const handleVoidInvoice = async (id: string) => {
        if (!confirm('Void this invoice? This cannot be undone.')) return;
        try {
            const res = await api.post(`/sales/invoices/${id}/void/`);
            setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
            setSuccessMsg('Invoice voided.');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to void invoice.'); }
    };

    const handleDownloadPDF = async (id: string) => {
        try {
            const response = await api.get(`/sales/invoices/${id}/download_pdf/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to download PDF.');
        }
    };

    const addInvItem = () => {
        setInvForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
    };

    const removeInvItem = (index: number) => {
        setInvForm(f => ({
            ...f,
            items: f.items.filter((_, i) => i !== index)
        }));
    };

    const updateInvItem = (index: number, field: string, value: any) => {
        setInvForm(f => {
            const newItems = [...f.items];
            newItems[index] = { ...newItems[index], [field]: value };
            
            // Auto-fill description/price if product selected
            if (field === 'product') {
                const prod = products.find(p => p.id === value);
                if (prod) {
                    newItems[index].description = prod.name;
                    newItems[index].unit_price = prod.selling_price;
                }
            }
            return { ...f, items: newItems };
        });
    };

    const [payModal, setPayModal] = useState(false);
    const [payInvId, setPayInvId] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [paySub, setPaySub] = useState(false);

    const openPayModal = (id: string) => { setPayInvId(id); setPayAmount(''); setPayModal(true); };
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payInvId) return;
        setPaySub(true);
        try {
            const res = await api.post(`/sales/invoices/${payInvId}/record-payment/`, { amount: parseFloat(payAmount) });
            setInvoices(prev => prev.map(inv => inv.id === payInvId ? res.data.invoice : inv));
            setPayModal(false);
            setSuccessMsg('Payment recorded.');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) { alert(err.response?.data?.error || 'Failed to record payment.'); } finally { setPaySub(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );


    const statusColors: Record<string, string> = {
        DRAFT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        CONFIRMED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    };

    const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            {/* Success Toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm">
                        <CheckCircle2 className="w-5 h-5" />{successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div variants={iV} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Sales & Billing</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Manage invoices and optimize your product pricing via AI.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setIsPricingModalOpen(true)}
                        className="bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 shadow-sm font-bold gap-2">
                        <BrainCircuit className="h-5 w-5" /> AI Price Engine
                    </Button>
                    <Button onClick={openNewInvoice} className="flex items-center gap-2 rounded-xl font-bold shadow-md">
                        <PlusCircle className="w-4 h-4" /> New Invoice
                    </Button>
                </div>
            </motion.div>

            {/* Invoices Table */}
            <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                {['Invoice #', 'Customer', 'Issue Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                                    <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#0a0f1c]">
                            {invoices.length === 0 ? (
                                <tr key="empty-state"><td colSpan={7} className="text-center py-16">
                                    <Receipt className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                                    <span className="text-sm font-medium text-slate-500">No invoices yet. Create your first one above.</span>
                                </td></tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="whitespace-nowrap py-4 px-4 text-sm font-bold text-brand-600 dark:text-brand-400">{inv.invoice_number}</td>
                                    <td className="whitespace-nowrap py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{inv.customer_detail?.name || inv.customer?.name || '—'}</td>
                                    <td className="whitespace-nowrap py-4 px-4 text-sm text-slate-500">{new Date(inv.issue_date).toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap py-4 px-4 text-sm text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                                    <td className="whitespace-nowrap py-4 px-4 text-sm font-bold text-slate-900 dark:text-white">${parseFloat(inv.amount_due || inv.subtotal || '0').toFixed(2)}</td>
                                    <td className="whitespace-nowrap py-4 px-4">
                                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${statusColors[inv.status] || ''}`}>{inv.status}</span>
                                    </td>
                                    <td className="whitespace-nowrap py-4 px-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setSelectedInvoice(inv); setDetailModalOpen(true); }} className="p-1 text-slate-400 hover:text-brand-600 transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDownloadPDF(inv.id)} className="p-1 text-slate-400 hover:text-brand-600 transition-colors" title="Download PDF">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                            {inv.status === 'DRAFT' && (
                                                <button onClick={() => handleConfirmInvoice(inv.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 transition-colors"><Check className="w-3 h-3" />Confirm</button>
                                            )}
                                            {(inv.status === 'CONFIRMED' || inv.status === 'PARTIAL') && (
                                                <button onClick={() => openPayModal(inv.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 transition-colors"><DollarSign className="w-3 h-3" />Pay</button>
                                            )}
                                            {inv.status !== 'PAID' && inv.status !== 'VOIDED' && inv.status !== 'CANCELLED' && (
                                                <button onClick={() => handleVoidInvoice(inv.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 transition-colors">
                                                    <Ban className="w-3 h-3" />
                                                    {inv.status === 'DRAFT' ? 'Cancel' : 'Void'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* New Invoice Modal */}
            <AnimatePresence>
                {invoiceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !invSubmitting && setInvoiceModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">New Invoice</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Create a new sales invoice.</p>
                                </div>
                                <button onClick={() => setInvoiceModalOpen(false)} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 max-h-[70vh] overflow-y-auto">
                                {invError && (
                                    <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{invError}
                                    </div>
                                )}
                                <form id="invoice-form" onSubmit={handleCreateInvoice} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Invoice Number *</label>
                                            <input required value={invForm.invoice_number} onChange={e => setInvForm(f => ({ ...f, invoice_number: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" placeholder="INV-2024-001" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Customer *</label>
                                            <select required value={invForm.customer} onChange={e => setInvForm(f => ({ ...f, customer: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500">
                                                <option value="">Select a customer...</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Issue Date *</label>
                                            <input required type="date" value={invForm.issue_date} onChange={e => setInvForm(f => ({ ...f, issue_date: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Due Date *</label>
                                            <input required type="date" value={invForm.due_date} onChange={e => setInvForm(f => ({ ...f, due_date: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" />
                                        </div>
                                    </div>

                                    {/* Line Items */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Line Items</label>
                                            <button type="button" onClick={addInvItem} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
                                                <Plus className="w-3 h-3" /> Add Item
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {invForm.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-start bg-white dark:bg-[#111827] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <div className="flex-1 space-y-2">
                                                        <select required value={item.product} onChange={e => updateInvItem(idx, 'product', e.target.value)}
                                                            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none">
                                                            <option value="">Select Product...</option>
                                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.selling_price})</option>)}
                                                        </select>
                                                        <input value={item.description} onChange={e => updateInvItem(idx, 'description', e.target.value)}
                                                            className="w-full bg-transparent text-xs text-slate-500 focus:outline-none" placeholder="Description..." />
                                                    </div>
                                                    <div className="w-20">
                                                        <input type="number" min="1" step="0.01" value={item.quantity} onChange={e => updateInvItem(idx, 'quantity', e.target.value)}
                                                            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none" placeholder="Qty" />
                                                        <div className="text-[10px] text-slate-400 text-right uppercase font-bold mt-1">Qty</div>
                                                    </div>
                                                    <div className="w-24">
                                                        <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateInvItem(idx, 'unit_price', e.target.value)}
                                                            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none" placeholder="Price" />
                                                        <div className="text-[10px] text-slate-400 text-right uppercase font-bold mt-1">Price</div>
                                                    </div>
                                                    {invForm.items.length > 1 && (
                                                        <button type="button" onClick={() => removeInvItem(idx)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Discount %</label>
                                            <input type="number" min="0" max="100" step="0.01" value={invForm.discount_rate} onChange={e => setInvForm(f => ({ ...f, discount_rate: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Tax %</label>
                                            <input type="number" min="0" max="100" step="0.01" value={invForm.tax_rate} onChange={e => setInvForm(f => ({ ...f, tax_rate: e.target.value }))}
                                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</label>
                                        <textarea rows={2} value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))}
                                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500 resize-none" />
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setInvoiceModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" form="invoice-form" disabled={invSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">
                                    {invSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {invSubmitting ? 'Creating...' : 'Create Invoice'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Pricing Modal */}
            <AnimatePresence>
                {isPricingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsPricingModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 relative z-10 flex justify-between items-start">
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Intelligent Pricing Engine</h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Deploy ML Regression models to find the price that maximizes profit.</p>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors" onClick={() => setIsPricingModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 relative z-10 bg-slate-50/50 dark:bg-slate-900/50">
                                <form onSubmit={handleOptimizePricing} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Unit Cost ($)</label>
                                            <input type="number" step="0.01" value={pricingForm.unitCost || ''} onChange={e => setPricingForm({ ...pricingForm, unitCost: parseFloat(e.target.value) || 0 })} className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold p-3 focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Competitor Price ($)</label>
                                            <input type="number" step="0.01" value={pricingForm.competitorPrice || ''} onChange={e => setPricingForm({ ...pricingForm, competitorPrice: parseFloat(e.target.value) || 0 })} className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold p-3 focus:outline-none focus:border-brand-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Current Velocity (units/mo)</label>
                                            <input type="number" value={pricingForm.currentVelocity || ''} onChange={e => setPricingForm({ ...pricingForm, currentVelocity: parseInt(e.target.value) || 0 })} className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold p-3 focus:outline-none focus:border-brand-500" />
                                        </div>
                                    </div>
                                    {pricingError && <div className="text-red-600 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{pricingError}</div>}
                                    {pricingResult && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                                            <h4 className="font-bold flex items-center gap-2 text-emerald-50 mb-4"><Sparkles className="w-5 h-5 text-emerald-200" />Optimal Output Discovered</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                                                    <span className="block text-xs text-emerald-200 font-bold uppercase tracking-wide">Suggested Price</span>
                                                    <span className="block text-3xl font-black mt-1">${pricingResult.optimal_price?.toFixed(2) || "19.99"}</span>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                                                    <span className="block text-xs text-emerald-200 font-bold uppercase tracking-wide">Projected Profit</span>
                                                    <span className="block text-2xl font-bold mt-2">${pricingResult.projected_profit?.toFixed(2) || "450.00"}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                                        <Button type="button" variant="ghost" onClick={() => setIsPricingModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={pricingLoading}>
                                            {pricingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                            {pricingLoading ? "Processing..." : "Calculate AI Price"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Record Payment Modal */}
            <AnimatePresence>
                {payModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !paySub && setPayModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Record Payment</h3><p className="text-sm text-slate-500 mt-0.5">Enter the payment amount to apply.</p></div>
                                <button onClick={() => setPayModal(false)} disabled={paySub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                <form id="pay-form" onSubmit={handleRecordPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Amount ($) *</label>
                                        <input required type="number" step="0.01" min="0.01" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="500.00" />
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setPayModal(false)} disabled={paySub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="pay-form" disabled={paySub} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-60">{paySub && <Loader2 className="w-4 h-4 animate-spin" />}{paySub ? 'Processing...' : 'Record Payment'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invoice Detail Modal */}
            <AnimatePresence>
                {detailModalOpen && selectedInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-600/10 rounded-xl"><Receipt className="w-5 h-5 text-brand-600" /></div>
                                    <div>
                                        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{selectedInvoice.invoice_number}</h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{selectedInvoice.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDownloadPDF(selectedInvoice.id)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                    <button onClick={() => setDetailModalOpen(false)} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1">Customer</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedInvoice.customer_detail?.name || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1">Dates</label>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Issue: {new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Due: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-3">Line Items</label>
                                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400">Description</th>
                                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-right">Qty</th>
                                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-right">Price</th>
                                                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {selectedInvoice.items?.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3">
                                                            <p className="font-bold text-slate-900 dark:text-white">{item.product_name || 'Item'}</p>
                                                            <p className="text-xs text-slate-500">{item.description}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">${parseFloat(item.unit_price).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">${parseFloat(item.total || '0').toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No items found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="font-bold text-slate-900 dark:text-white">${parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-rose-500 font-medium">
                                            <span>Discount</span>
                                            <span>-${parseFloat(selectedInvoice.discount_amount || '0').toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tax</span>
                                            <span className="font-bold text-slate-900 dark:text-white">${parseFloat(selectedInvoice.tax_amount || '0').toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
                                            <span>Total</span>
                                            <span>${parseFloat(selectedInvoice.amount_due).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
