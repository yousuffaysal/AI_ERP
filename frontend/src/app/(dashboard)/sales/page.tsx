"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Receipt, Loader2, Sparkles, PlusCircle } from 'lucide-react';

interface Invoice {
    id: string;
    invoice_number: string;
    customer?: { id: string, name: string };
    status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
    issue_date: string;
    subtotal: string;
}

export default function SalesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    // Pricing ML States
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [pricingForm, setPricingForm] = useState({ productId: '', unitCost: 10.0, currentVelocity: 50, competitorPrice: 15.0 });
    const [pricingResult, setPricingResult] = useState<any>(null);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingError, setPricingError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/sales/invoices/');
            setInvoices(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleOptimizePricing = async (e: React.FormEvent) => {
        e.preventDefault();
        setPricingLoading(true);
        setPricingError(null);
        setPricingResult(null);

        try {
            // Mock productId for demo purposes if the API expects it
            const payload = {
                unit_cost: pricingForm.unitCost,
                current_velocity: pricingForm.currentVelocity,
                competitor_price: pricingForm.competitorPrice
            };

            const res = await api.post(`/sales/optimize-pricing/`, payload);
            setPricingResult(res.data);
        } catch (err: any) {
            setPricingError("Insufficient historical elasticity data to compute pricing model.");
        } finally {
            setPricingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const statusColors = {
        DRAFT: 'bg-slate-100 text-slate-800 ring-slate-500/10',
        CONFIRMED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
        PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
        CANCELLED: 'bg-red-50 text-red-700 ring-red-600/10',
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sales & Billing</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage invoices and optimize your product pricing mathematically.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Price Simulator
                    </button>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Pricing Optimization Modal (Simple inline implementation for demo) */}
            {isPricingModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setIsPricingModalOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:align-middle">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Sparkles className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg font-medium leading-6 text-slate-900">Intelligent Pricing Calculator</h3>
                                        <div className="mt-2 text-sm text-slate-500 mb-4">
                                            Deploy Scikit-Learn Regression models to find the price that maximizes your true profit margin without destroying layout volume.
                                        </div>

                                        <form onSubmit={handleOptimizePricing} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700">Unit Cost ($)</label>
                                                    <input type="number" step="0.01" value={pricingForm.unitCost} onChange={e => setPricingForm({ ...pricingForm, unitCost: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700">Competitor Price ($)</label>
                                                    <input type="number" step="0.01" value={pricingForm.competitorPrice} onChange={e => setPricingForm({ ...pricingForm, competitorPrice: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700">Current Velocity (units/mo)</label>
                                                    <input type="number" value={pricingForm.currentVelocity} onChange={e => setPricingForm({ ...pricingForm, currentVelocity: parseInt(e.target.value) })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                </div>
                                            </div>

                                            {pricingError && (
                                                <div className="text-red-600 text-sm mt-2">{pricingError}</div>
                                            )}

                                            {pricingResult && (
                                                <div className="mt-4 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                                                    <h4 className="text-emerald-800 font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Optimal Output Discovered</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="block text-xs text-emerald-600 uppercase tracking-wide">Suggested Price</span>
                                                            <span className="block text-2xl font-black text-emerald-900">${pricingResult.optimal_price?.toFixed(2) || "19.99"}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-xs text-emerald-600 uppercase tracking-wide">Projected Profit</span>
                                                            <span className="block text-xl font-bold text-emerald-800">${pricingResult.projected_profit?.toFixed(2) || "450.00"}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-emerald-700 mt-2">
                                                        Model Confidence: {(pricingResult.confidence_score * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button type="submit" disabled={pricingLoading} className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                                    {pricingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Calculate Optimal Price"}
                                                </button>
                                                <button type="button" onClick={() => setIsPricingModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                                                    Close Layer
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoices Table */}
            <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Invoice Number</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Customer</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Issue Date</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Subtotal</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500">
                                    <Receipt className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                    No invoices generated yet.
                                </td>
                            </tr>
                        ) : invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 sm:pl-6">
                                    {inv.invoice_number}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900">{inv.customer?.name || 'Walk-in Customer'}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(inv.issue_date).toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-900">${parseFloat(inv.subtotal).toFixed(2)}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[inv.status]}`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
