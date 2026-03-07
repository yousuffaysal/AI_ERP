"use client";

import { useState } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function ReportsPage() {
    const [modelType, setModelType] = useState('sales_invoice');
    const [exportFormat, setExportFormat] = useState('excel');
    const [isGenerating, setIsGenerating] = useState(false);

    const [emailSchedule, setEmailSchedule] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleSuccess, setScheduleSuccess] = useState(false);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            // For binary files, axios needs responseType: 'blob'
            const res = await api.post('/reports/generate/', {
                model: modelType,
                export_format: exportFormat,
                filters: {} // In a real app we'd map UI filters here
            }, {
                responseType: 'blob'
            });

            // HTML5 Download Blob trick mapping the REST API response directly
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;

            const extension = exportFormat === 'excel' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `${modelType}_report_${new Date().toISOString().split('T')[0]}.${extension}`);

            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Report generation failed", err);
            alert("Failed to generate the report. Please contact support.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleScheduleReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailSchedule) return;

        setIsScheduling(true);
        setScheduleSuccess(false);

        try {
            await api.post('/reports/schedule/', {
                model: modelType,
                export_format: exportFormat,
                email_to: emailSchedule,
                filters: {}
            });
            setScheduleSuccess(true);
            setEmailSchedule('');
        } catch (err) {
            console.error("Scheduling failed", err);
            alert("Failed to schedule the report.");
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-indigo-600" />
                    Smart Reporting Engine
                </h1>
                <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                    Utilize our dynamic query builder to extract real-time datasets. Export massive records as styled Excel sheets or formatted PDFs, or schedule background Celery workers to deliver them via email automatically.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Instant Download Configuration */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">1. Instant Download</h2>
                        <p className="text-sm text-slate-500 mt-1">Configure your dataset parameters.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Data Target Model</label>
                        <select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                        >
                            <option value="sales_invoice">Sales Invoices</option>
                            <option value="inventory_product">Inventory Products</option>
                            <option value="hr_employee">Human Resources Roster</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Export Format</label>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setExportFormat('excel')}
                                className={`border rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${exportFormat === 'excel'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 hover:border-emerald-200 text-slate-500'
                                    }`}
                            >
                                <span className="font-semibold text-lg mb-1">.XLSX</span>
                                <span className="text-xs">Live Spreadsheet</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setExportFormat('pdf')}
                                className={`border rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${exportFormat === 'pdf'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-200 hover:border-red-200 text-slate-500'
                                    }`}
                            >
                                <span className="font-semibold text-lg mb-1">.PDF</span>
                                <span className="text-xs">Executive Document</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Download className="h-5 w-5 mr-2" />
                        )}
                        Generate & Download
                    </button>
                </div>

                {/* Automated Background Scheduling */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">2. Scheduled Delivery</h2>
                        <p className="text-sm text-slate-500 mt-1">Offload heavy reports to the Celery Background Workers.</p>
                    </div>

                    {scheduleSuccess && (
                        <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200">
                            <div className="flex">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-emerald-800">Job successfully injected into Redis Message Broker.</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleScheduleReport} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Recipient Email</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={emailSchedule}
                                    onChange={(e) => setEmailSchedule(e.target.value)}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                                    placeholder="manager@company.com"
                                />
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                                Upon submission, the active configuration will be piped to Django. The worker node will query the database securely, compile the target <strong>{exportFormat.toUpperCase()}</strong> format into RAM, and transmit it via SMTP natively.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isScheduling || !emailSchedule}
                            className="w-full flex justify-center items-center py-3 px-4 border border-indigo-200 rounded-md shadow-sm text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {isScheduling ? 'Queueing Job...' : 'Schedule Autonomous Report'}
                        </button>
                    </form>

                </div>

            </div>

        </div>
    );
}
