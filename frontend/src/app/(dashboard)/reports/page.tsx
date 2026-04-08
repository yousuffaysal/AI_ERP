"use client";

import { useState } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Loader2, Mail, CheckCircle2, FileSpreadsheet, FileBox } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
            const res = await api.post('/reports/generate/', {
                model: modelType,
                export_format: exportFormat,
                filters: {}
            }, {
                responseType: 'blob'
            });

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

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    
    const itemVariants: any = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            className="max-w-5xl mx-auto space-y-8 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileText className="w-64 h-64 text-brand-900 dark:text-brand-100 absolute -top-10 -right-10 rotate-12" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <FileText className="h-6 w-6 text-white" />
                        </span>
                        Unified Reporting Engine
                    </h1>
                    <p className="mt-4 text-base text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Extract, transform, and load raw telemetry into beautiful presentations. Export massive records instantly, or distribute them asynchronously via background worker nodes.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Instant Download Configuration */}
                <motion.div variants={itemVariants}>
                    <Card glass className="p-8 h-full flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl group-hover:bg-brand-500/20 transition-colors pointer-events-none" />
                        
                        <div className="mb-8 relative z-10 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-brand-600 dark:text-brand-400 font-bold">1</span>
                                Instant Synthesis
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Compile and download structured data immediately.</p>
                        </div>

                        <div className="space-y-6 flex-1 relative z-10">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Data Target Model</label>
                                <select
                                    value={modelType}
                                    onChange={(e) => setModelType(e.target.value)}
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-brand-500 focus:ring-brand-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold py-3 px-4"
                                >
                                    <option value="sales_invoice">Sales Invoices</option>
                                    <option value="inventory_product">Inventory Products</option>
                                    <option value="hr_employee">Human Resources Roster</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Export Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('excel')}
                                        className={`rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 border-2 ${exportFormat === 'excel'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-md transform scale-[1.02]'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        <FileSpreadsheet className={`w-8 h-8 mb-2 ${exportFormat === 'excel' ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="font-bold text-sm tracking-wide">.XLSX</span>
                                        <span className="text-[10px] font-medium opacity-80 uppercase mt-0.5">Spreadsheet</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('pdf')}
                                        className={`rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 border-2 ${exportFormat === 'pdf'
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 shadow-md transform scale-[1.02]'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        <FileBox className={`w-8 h-8 mb-2 ${exportFormat === 'pdf' ? 'text-brand-500' : 'text-slate-400'}`} />
                                        <span className="font-bold text-sm tracking-wide">.PDF</span>
                                        <span className="text-[10px] font-medium opacity-80 uppercase mt-0.5">Document</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 relative z-10 mt-auto">
                            <Button
                                onClick={handleGenerateReport}
                                disabled={isGenerating}
                                className="w-full flex justify-center py-6 text-base shadow-xl"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Generating Object...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-5 w-5 mr-2" />
                                        Execute Runtime Download
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Automated Background Scheduling */}
                <motion.div variants={itemVariants}>
                    <Card className="p-8 h-full bg-slate-50 dark:bg-[#0a0f1c]/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
                        
                        <div className="mb-8 relative z-10 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">2</span>
                                Scheduled Routing
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Deploy asynchronous Celery workers.</p>
                        </div>

                        {scheduleSuccess && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 border border-emerald-200 dark:border-emerald-500/20 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Message Dispatched</h3>
                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">Job successfully injected into Redis Broker.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleScheduleReport} className="space-y-6 flex flex-col h-full relative z-10">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Target Recipient Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={emailSchedule}
                                        onChange={(e) => setEmailSchedule(e.target.value)}
                                        className="block w-full pl-10 rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold py-3"
                                        placeholder="director@enterprise.com"
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-xl shadow-inner mt-4 mb-4">
                                <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                                    <strong className="block mb-1 text-sm font-bold text-indigo-900 dark:text-indigo-200">System Architecture Note:</strong>
                                    Upon submission, the request payload is piped to Django. An isolated worker node queries the database securely, compiles the target <span className="font-bold underline underline-offset-2">{exportFormat.toUpperCase()}</span> model stream into RAM, and transmits the payload natively via SMTP protocols.
                                </p>
                            </div>

                            <div className="pt-2 mt-auto">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={isScheduling || !emailSchedule}
                                    className="w-full flex justify-center py-6 text-base border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-300 shadow-sm transition-all"
                                >
                                    {isScheduling ? 'Piping to Redis...' : 'Schedule Autonomous Chron'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
