"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PackageSearch, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    sku: string;
    unit_price: string;
    current_stock: number;
    reorder_level: number;
}

interface ForecastResult {
    product_id: string;
    forecast: Array<{ date: string; predicted_demand: number }>;
    total_predicted_demand: number;
    confidence_interval: { lower: number; upper: number };
    suggested_restock_quantity: number;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Forecasting State
    const [forecastingProductId, setForecastingProductId] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
    const [forecastError, setForecastError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products/');
            setProducts(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleForecast = async (product: Product) => {
        setForecastingProductId(product.id);
        setForecastData(null);
        setForecastError(null);

        try {
            // Calls the Django AIClient which forwards to FastAPI ARIMA model safely behind Redis
            const res = await api.post(`/inventory/products/${product.id}/forecast/`, {
                days: 30
            });
            setForecastData(res.data);
        } catch (err: any) {
            setForecastError(err.response?.data?.error || "AI Engine failed to compute forecast. Ensure sufficient historical data exists.");
        } finally {
            setForecastingProductId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Track current stock levels and run Machine Learning demand forecasts.
                    </p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Add New Product
                </button>
            </div>

            {/* Product Table */}
            <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Product & SKU</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Unit Price</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Current Stock</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500">
                                    <PackageSearch className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                    No products found in the catalog.
                                </td>
                            </tr>
                        ) : products.map((product) => (
                            <tr key={product.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                                    {product.name}
                                    <span className="block text-xs font-normal text-slate-500">{product.sku}</span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">${product.unit_price}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                    <span className="font-semibold">{product.current_stock}</span> / {product.reorder_level} (min)
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    {product.current_stock <= product.reorder_level ? (
                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                            Reorder Required
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                            In Stock
                                        </span>
                                    )}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button
                                        onClick={() => handleForecast(product)}
                                        disabled={forecastingProductId === product.id}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 ml-auto disabled:opacity-50"
                                    >
                                        {forecastingProductId === product.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <TrendingUp className="h-4 w-4" />
                                        )}
                                        AI Forecast
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Active AI Forecast Results Display */}
            {forecastError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Forecast Computation Failed</h3>
                            <div className="mt-2 text-sm text-red-700"><p>{forecastError}</p></div>
                        </div>
                    </div>
                </div>
            )}

            {forecastData && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm rounded-xl border border-indigo-100 p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-32 h-32 text-indigo-900" />
                    </div>

                    <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        30-Day ARIMA Demand Forecast Result
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 border border-indigo-50">
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Predicted Demand</p>
                            <p className="text-3xl font-bold text-slate-900">{forecastData.total_predicted_demand} units</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 border border-indigo-50">
                            <p className="text-sm font-medium text-slate-500 mb-1">Statistical Confidence Array</p>
                            <p className="text-xl font-semibold text-slate-700 mt-1">
                                {forecastData.confidence_interval.lower} <span className="text-sm text-slate-400 font-normal">min</span> — {forecastData.confidence_interval.upper} <span className="text-sm text-slate-400 font-normal">max</span>
                            </p>
                        </div>

                        <div className="bg-indigo-600 rounded-lg p-5 shadow-inner text-white">
                            <p className="text-sm font-medium text-indigo-100 mb-1">Optimal Restock Quantity</p>
                            <p className="text-3xl font-bold">+{forecastData.suggested_restock_quantity}</p>
                            <p className="text-xs text-indigo-200 mt-2 block">To satisfy entirely projected pipeline.</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
