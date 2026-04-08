"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PackageSearch, TrendingUp, Loader2, AlertCircle, PlusCircle, BrainCircuit, X, Pencil, Trash2, Warehouse, Tag, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product { id: string; name: string; sku: string; selling_price: string; total_stock: number; reorder_level: number; category?: string; }
interface Category { id: string; name: string; description: string; product_count: number; }
interface Supplier { id: string; name: string; code: string; contact_name: string; email: string; phone: string; is_active: boolean; product_count: number; }
interface WarehouseItem { id: string; name: string; code: string; location: string; is_active: boolean; total_stock_value: string; }

interface ForecastResult {
    product_id: string; forecast: Array<{ date: string; predicted_demand: number }>;
    total_predicted_demand: number; confidence_interval: { lower: number; upper: number }; suggested_restock_quantity: number;
}

const cV: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iV: any = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

type Tab = 'products' | 'categories' | 'suppliers' | 'warehouses';

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'products', label: 'Products', icon: PackageSearch },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
];

// ─── Generic Modal ─────────────────────────────────────────────────────────────
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
                        <button type="submit" form="modal-form" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">
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
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<Tab>('products');
    const [loading, setLoading] = useState(true);

    // Products
    const [products, setProducts] = useState<Product[]>([]);
    const [forecastingProductId, setForecastingProductId] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [prodModal, setProdModal] = useState(false);
    const [editProd, setEditProd] = useState<Product | null>(null);
    const [prodForm, setProdForm] = useState({ name: '', sku: '', selling_price: '', reorder_level: 10 });
    const [prodErr, setProdErr] = useState<string | null>(null);
    const [prodSub, setProdSub] = useState(false);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [catModal, setCatModal] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: '', description: '' });
    const [catErr, setCatErr] = useState<string | null>(null);
    const [catSub, setCatSub] = useState(false);

    // Suppliers
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supModal, setSupModal] = useState(false);
    const [editSup, setEditSup] = useState<Supplier | null>(null);
    const [supForm, setSupForm] = useState({ name: '', code: '', contact_name: '', email: '', phone: '', is_active: true });
    const [supErr, setSupErr] = useState<string | null>(null);
    const [supSub, setSupSub] = useState(false);

    // Warehouses
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [whModal, setWhModal] = useState(false);
    const [editWh, setEditWh] = useState<WarehouseItem | null>(null);
    const [whForm, setWhForm] = useState({ name: '', code: '', location: '', is_active: true });
    const [whErr, setWhErr] = useState<string | null>(null);
    const [whSub, setWhSub] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pr, ca, su, wh] = await Promise.all([
                api.get('/inventory/products/'), api.get('/inventory/categories/'),
                api.get('/inventory/suppliers/'), api.get('/inventory/warehouses/'),
            ]);
            setProducts(pr.data.results || pr.data);
            setCategories(ca.data.results || ca.data);
            setSuppliers(su.data.results || su.data);
            setWarehouses(wh.data.results || wh.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // ── Forecast
    const handleForecast = async (product: Product) => {
        setForecastingProductId(product.id); setForecastData(null); setForecastError(null);
        try {
            const res = await api.post(`/inventory/products/${product.id}/forecast/`, { days: 30 });
            setForecastData(res.data);
        } catch (err: any) {
            setForecastError(err.response?.data?.error || "AI Engine failed to compute forecast. Ensure sufficient historical data exists.");
        } finally { setForecastingProductId(null); }
    };

    // ── Product CRUD
    const openAddProd = () => { setEditProd(null); setProdForm({ name: '', sku: '', selling_price: '', reorder_level: 10 }); setProdErr(null); setProdModal(true); };
    const openEditProd = (p: Product) => { setEditProd(p); setProdForm({ name: p.name, sku: p.sku, selling_price: p.selling_price, reorder_level: p.reorder_level }); setProdErr(null); setProdModal(true); };
    const handleProdSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProdSub(true); setProdErr(null);
        const payload = { name: prodForm.name, sku: prodForm.sku, selling_price: parseFloat(prodForm.selling_price || '0'), reorder_level: prodForm.reorder_level };
        try {
            if (editProd) {
                const res = await api.patch(`/inventory/products/${editProd.id}/`, payload);
                setProducts(prev => prev.map(x => x.id === editProd.id ? res.data : x));
            } else {
                const res = await api.post('/inventory/products/', payload);
                setProducts(prev => [res.data, ...prev]);
            }
            setProdModal(false);
        } catch (err: any) {
            const d = err.response?.data; setProdErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save product.');
        } finally { setProdSub(false); }
    };
    const deleteProd = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        try { await api.delete(`/inventory/products/${id}/`); setProducts(p => p.filter(x => x.id !== id)); } catch { alert('Failed to delete product.'); }
    };

    // ── Category CRUD
    const openAddCat = () => { setEditCat(null); setCatForm({ name: '', description: '' }); setCatErr(null); setCatModal(true); };
    const openEditCat = (c: Category) => { setEditCat(c); setCatForm({ name: c.name, description: c.description || '' }); setCatErr(null); setCatModal(true); };
    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setCatSub(true); setCatErr(null);
        try {
            if (editCat) {
                const res = await api.patch(`/inventory/categories/${editCat.id}/`, catForm);
                setCategories(prev => prev.map(x => x.id === editCat.id ? res.data : x));
            } else {
                const res = await api.post('/inventory/categories/', catForm);
                setCategories(prev => [res.data, ...prev]);
            }
            setCatModal(false);
        } catch (err: any) {
            const d = err.response?.data; setCatErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save category.');
        } finally { setCatSub(false); }
    };
    const deleteCat = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try { await api.delete(`/inventory/categories/${id}/`); setCategories(p => p.filter(x => x.id !== id)); } catch { alert('Failed to delete.'); }
    };

    // ── Supplier CRUD
    const openAddSup = () => { setEditSup(null); setSupForm({ name: '', code: '', contact_name: '', email: '', phone: '', is_active: true }); setSupErr(null); setSupModal(true); };
    const openEditSup = (s: Supplier) => { setEditSup(s); setSupForm({ name: s.name, code: s.code, contact_name: s.contact_name || '', email: s.email || '', phone: s.phone || '', is_active: s.is_active }); setSupErr(null); setSupModal(true); };
    const handleSupSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSupSub(true); setSupErr(null);
        try {
            if (editSup) {
                const res = await api.patch(`/inventory/suppliers/${editSup.id}/`, supForm);
                setSuppliers(prev => prev.map(x => x.id === editSup.id ? res.data : x));
            } else {
                const res = await api.post('/inventory/suppliers/', supForm);
                setSuppliers(prev => [res.data, ...prev]);
            }
            setSupModal(false);
        } catch (err: any) {
            const d = err.response?.data; setSupErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save supplier.');
        } finally { setSupSub(false); }
    };
    const deleteSup = async (id: string) => {
        if (!confirm('Delete this supplier?')) return;
        try { await api.delete(`/inventory/suppliers/${id}/`); setSuppliers(p => p.filter(x => x.id !== id)); } catch { alert('Failed to delete.'); }
    };

    // ── Warehouse CRUD
    const openAddWh = () => { setEditWh(null); setWhForm({ name: '', code: '', location: '', is_active: true }); setWhErr(null); setWhModal(true); };
    const openEditWh = (w: WarehouseItem) => { setEditWh(w); setWhForm({ name: w.name, code: w.code, location: w.location || '', is_active: w.is_active }); setWhErr(null); setWhModal(true); };
    const handleWhSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setWhSub(true); setWhErr(null);
        try {
            if (editWh) {
                const res = await api.patch(`/inventory/warehouses/${editWh.id}/`, whForm);
                setWarehouses(prev => prev.map(x => x.id === editWh.id ? res.data : x));
            } else {
                const res = await api.post('/inventory/warehouses/', whForm);
                setWarehouses(prev => [res.data, ...prev]);
            }
            setWhModal(false);
        } catch (err: any) {
            const d = err.response?.data; setWhErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save warehouse.');
        } finally { setWhSub(false); }
    };
    const deleteWh = async (id: string) => {
        if (!confirm('Delete this warehouse?')) return;
        try { await api.delete(`/inventory/warehouses/${id}/`); setWarehouses(p => p.filter(x => x.id !== id)); } catch { alert('Failed to delete.'); }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
    );

    return (
        <motion.div className="max-w-7xl mx-auto space-y-6 pb-12" variants={cV} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={iV} className="flex justify-between items-end bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Inventory Intelligence</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Manage products, categories, suppliers and warehouses.</p>
                </div>
                <Button size="sm" onClick={() => {
                    if (activeTab === 'products') openAddProd();
                    else if (activeTab === 'categories') openAddCat();
                    else if (activeTab === 'suppliers') openAddSup();
                    else openAddWh();
                }} className="hidden sm:flex rounded-xl gap-2 font-bold shadow-md">
                    <PlusCircle className="w-4 h-4" /> Add {activeTab === 'products' ? 'Product' : activeTab === 'categories' ? 'Category' : activeTab === 'suppliers' ? 'Supplier' : 'Warehouse'}
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={iV} className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Forecast Error */}
            {forecastError && (
                <motion.div variants={iV} className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800/50 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div><h3 className="text-sm font-bold text-red-800 dark:text-red-300">Forecast Computation Failed</h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-400 font-medium">{forecastError}</p></div>
                </motion.div>
            )}

            {/* Forecast Result */}
            {forecastData && activeTab === 'products' && (
                <motion.div variants={iV}>
                    <Card className="bg-gradient-to-br from-indigo-900 to-[#0a0f1c] shadow-2xl border border-brand-500/30 p-8 overflow-hidden relative text-white">
                        <div className="relative z-10 flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3">
                                <h2 className="text-xl font-heading font-black mb-2 flex items-center gap-2 text-brand-300"><BrainCircuit className="h-6 w-6" />ARIMA ML Forecast</h2>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Our machine learning engine computed the optimal restocking trajectory for this SKU.</p>
                            </div>
                            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                                    <p className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">Total Demand</p>
                                    <p className="text-3xl font-black">{forecastData.total_predicted_demand} <span className="text-sm font-bold text-slate-400">units</span></p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                                    <p className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">95% Confidence</p>
                                    <p className="text-xl font-bold">{forecastData.confidence_interval.lower} <span className="text-xs text-slate-400">min</span> — {forecastData.confidence_interval.upper} <span className="text-xs text-slate-400">max</span></p>
                                </div>
                                <div className="bg-brand-600 rounded-2xl p-5">
                                    <p className="text-xs font-bold text-brand-200 uppercase tracking-wider mb-1">Optimal Restock</p>
                                    <p className="text-3xl font-black">+{forecastData.suggested_restock_quantity}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* ── Products Tab ──────────────────────────────────────────────── */}
            {activeTab === 'products' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    {['Product & SKU', 'Unit Price', 'Stock', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {products.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-16 text-slate-500 font-medium">No products found.</td></tr>
                                ) : products.map((p) => {
                                    const low = (p.total_stock || 0) <= p.reorder_level;
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-4"><div className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</div><div className="text-xs text-slate-400 font-mono">{p.sku}</div></td>
                                            <td className="py-4 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">${parseFloat(p.selling_price || '0').toFixed(2)}</td>
                                            <td className="py-4 px-4 text-sm font-medium text-slate-500"><span className={`font-bold ${low ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{parseFloat((p.total_stock || 0).toString()).toFixed(0)}</span> / {p.reorder_level} min</td>
                                            <td className="py-4 px-4">
                                                {low ? <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-1 text-xs font-bold text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20">Action Required</span>
                                                    : <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">Healthy</span>}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => handleForecast(p)} disabled={forecastingProductId === p.id} className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">
                                                        {forecastingProductId === p.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <BrainCircuit className="h-4 w-4 mr-1" />}Forecast
                                                    </Button>
                                                    <button onClick={() => openEditProd(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteProd(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ── Categories Tab ──────────────────────────────────────────────── */}
            {activeTab === 'categories' && (
                <motion.div variants={iV} className="bg-white dark:bg-[#0a0f1c] shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>{['Name', 'Description', 'Products', 'Actions'].map(h => <th key={h} className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {categories.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500 font-medium">No categories found.</td></tr>
                                    : categories.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-4 text-sm font-bold text-slate-900 dark:text-white">{c.name}</td>
                                            <td className="py-4 px-4 text-sm text-slate-500 max-w-xs truncate">{c.description || '—'}</td>
                                            <td className="py-4 px-4"><span className="text-sm font-bold text-brand-600 dark:text-brand-400">{c.product_count} items</span></td>
                                            <td className="py-4 px-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditCat(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteCat(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ── Suppliers Tab ──────────────────────────────────────────────── */}
            {activeTab === 'suppliers' && (
                <motion.div variants={iV} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suppliers.length === 0 ? <p className="col-span-full text-center py-16 text-slate-500 font-medium">No suppliers found.</p>
                        : suppliers.map(s => (
                            <div key={s.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                                        <p className="text-xs font-mono text-slate-400">{s.code}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                                {s.contact_name && <p className="text-sm text-slate-500 font-medium">{s.contact_name}</p>}
                                {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                                {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">{s.product_count} products</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditSup(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => deleteSup(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </motion.div>
            )}

            {/* ── Warehouses Tab ──────────────────────────────────────────────── */}
            {activeTab === 'warehouses' && (
                <motion.div variants={iV} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {warehouses.length === 0 ? <p className="col-span-full text-center py-16 text-slate-500 font-medium">No warehouses found.</p>
                        : warehouses.map(w => (
                            <div key={w.id} className="bg-white dark:bg-[#0a0f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{w.name}</p>
                                        <p className="text-xs font-mono text-slate-400">{w.code}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{w.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                                {w.location && <p className="text-sm text-slate-500 font-medium">{w.location}</p>}
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <p className="text-xs text-slate-400 font-medium">Stock Value</p>
                                    <p className="font-bold text-slate-900 dark:text-white">${parseFloat(w.total_stock_value || '0').toLocaleString()}</p>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => openEditWh(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => deleteWh(w.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                </motion.div>
            )}

            {/* ── Product Modal ── */}
            <Modal open={prodModal} onClose={() => setProdModal(false)} title={editProd ? 'Edit Product' : 'Add New Product'} subtitle="Manage your product catalog." onSubmit={handleProdSubmit} submitting={prodSub} error={prodErr}>
                <Field label="Product Name"><input required className={inp} value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lithium Ion Battery" /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="SKU"><input required className={inp + ' font-mono'} value={prodForm.sku} onChange={e => setProdForm(f => ({ ...f, sku: e.target.value }))} placeholder="BAT-LI-01" /></Field>
                    <Field label="Unit Price ($)"><input required type="number" step="0.01" className={inp} value={prodForm.selling_price} onChange={e => setProdForm(f => ({ ...f, selling_price: e.target.value }))} placeholder="49.99" /></Field>
                </div>
                <Field label="Reorder Level (Min Stock)"><input required type="number" min="0" className={inp} value={prodForm.reorder_level} onChange={e => setProdForm(f => ({ ...f, reorder_level: parseInt(e.target.value) || 0 }))} /></Field>
            </Modal>

            {/* ── Category Modal ── */}
            <Modal open={catModal} onClose={() => setCatModal(false)} title={editCat ? 'Edit Category' : 'New Category'} subtitle="Organize your products." onSubmit={handleCatSubmit} submitting={catSub} error={catErr}>
                <Field label="Category Name"><input required className={inp} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Electronics" /></Field>
                <Field label="Description"><textarea rows={3} className={inp + ' resize-none'} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} /></Field>
            </Modal>

            {/* ── Supplier Modal ── */}
            <Modal open={supModal} onClose={() => setSupModal(false)} title={editSup ? 'Edit Supplier' : 'New Supplier'} subtitle="Manage your supply chain." onSubmit={handleSupSubmit} submitting={supSub} error={supErr}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Supplier Name"><input required className={inp} value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} placeholder="Alpha Corp" /></Field>
                    <Field label="Code"><input required className={inp + ' font-mono'} value={supForm.code} onChange={e => setSupForm(f => ({ ...f, code: e.target.value }))} placeholder="SUP-001" /></Field>
                </div>
                <Field label="Contact Name"><input className={inp} value={supForm.contact_name} onChange={e => setSupForm(f => ({ ...f, contact_name: e.target.value }))} /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Email"><input type="email" className={inp} value={supForm.email} onChange={e => setSupForm(f => ({ ...f, email: e.target.value }))} /></Field>
                    <Field label="Phone"><input className={inp} value={supForm.phone} onChange={e => setSupForm(f => ({ ...f, phone: e.target.value }))} /></Field>
                </div>
                <div className="flex items-center gap-3 pt-1">
                    <input type="checkbox" id="sup_active" checked={supForm.is_active} onChange={e => setSupForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 rounded text-brand-600" />
                    <label htmlFor="sup_active" className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Supplier</label>
                </div>
            </Modal>

            {/* ── Warehouse Modal ── */}
            <Modal open={whModal} onClose={() => setWhModal(false)} title={editWh ? 'Edit Warehouse' : 'New Warehouse'} subtitle="Manage storage locations." onSubmit={handleWhSubmit} submitting={whSub} error={whErr}>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Name"><input required className={inp} value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} placeholder="Main Warehouse" /></Field>
                    <Field label="Code"><input required className={inp + ' font-mono'} value={whForm.code} onChange={e => setWhForm(f => ({ ...f, code: e.target.value }))} placeholder="WH-001" /></Field>
                </div>
                <Field label="Location"><input className={inp} value={whForm.location} onChange={e => setWhForm(f => ({ ...f, location: e.target.value }))} placeholder="Dubai, UAE" /></Field>
                <div className="flex items-center gap-3 pt-1">
                    <input type="checkbox" id="wh_active" checked={whForm.is_active} onChange={e => setWhForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 rounded text-brand-600" />
                    <label htmlFor="wh_active" className="text-sm font-bold text-slate-700 dark:text-slate-300">Active</label>
                </div>
            </Modal>
        </motion.div>
    );
}
