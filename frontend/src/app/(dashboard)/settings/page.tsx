"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Bell, Shield, Globe, Building2, CreditCard, ChevronRight, Check, X, Loader2,
    Key, FileText, Clock, AlertCircle, CheckCircle2
} from 'lucide-react';

const stagger: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: any = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } } };

interface AuditLog { id: string; action: string; user: string; timestamp: string; object_repr?: string; model?: string; }

const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<null | 'profile' | 'password' | 'audit'>(null);
    const closeModal = () => setActiveModal(null);
    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3500); };

    // Profile form
    const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' });
    const [profileSub, setProfileSub] = useState(false);
    const [profileErr, setProfileErr] = useState<string | null>(null);

    // Password form
    const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [pwSub, setPwSub] = useState(false);
    const [pwErr, setPwErr] = useState<string | null>(null);

    // Audit logs
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditErr, setAuditErr] = useState<string | null>(null);

    const openProfile = () => { setProfileForm({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' }); setProfileErr(null); setActiveModal('profile'); };
    const openPassword = () => { setPwForm({ old_password: '', new_password: '', confirm_password: '' }); setPwErr(null); setActiveModal('password'); };
    const openAudit = async () => {
        setActiveModal('audit'); setAuditLoading(true); setAuditErr(null); setAuditLogs([]);
        try {
            const res = await api.get('/audit/logs/');
            setAuditLogs(res.data.results || res.data);
        } catch (err: any) { setAuditErr(err.response?.data?.detail || 'Failed to load audit logs.'); }
        finally { setAuditLoading(false); }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProfileSub(true); setProfileErr(null);
        try {
            const res = await api.patch('/auth/me/', profileForm);
            if (setUser) setUser(res.data);
            closeModal(); showSuccess('Profile updated successfully.');
        } catch (err: any) {
            const d = err.response?.data; setProfileErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to update profile.');
        } finally { setProfileSub(false); }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setPwErr(null);
        if (pwForm.new_password !== pwForm.confirm_password) { setPwErr('New passwords do not match.'); return; }
        if (pwForm.new_password.length < 8) { setPwErr('Password must be at least 8 characters.'); return; }
        setPwSub(true);
        try {
            await api.post('/auth/me/change-password/', { old_password: pwForm.old_password, new_password: pwForm.new_password });
            closeModal(); showSuccess('Password changed successfully. Please log in again if prompted.');
        } catch (err: any) {
            const d = err.response?.data; setPwErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to change password.');
        } finally { setPwSub(false); }
    };

    const SETTINGS_SECTIONS = [
        {
            title: "Account", icon: User, color: "text-brand-500 bg-brand-50 dark:bg-brand-500/10",
            items: [
                { label: "Profile Information", onClick: openProfile, tag: "Live" },
                { label: "Change Password", onClick: openPassword, tag: "Live" },
                { label: "Two-Factor Authentication", onClick: null, tag: "Soon" },
                { label: "Active Sessions", onClick: null, tag: "Soon" },
            ]
        },
        {
            title: "Notifications", icon: Bell, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
            items: [
                { label: "Email Alerts", onClick: null, tag: "Soon" },
                { label: "In-App Notifications", onClick: null, tag: "Soon" },
                { label: "Inventory Alerts", onClick: null, tag: "Soon" },
                { label: "Invoice Reminders", onClick: null, tag: "Soon" },
            ]
        },
        {
            title: "Company", icon: Building2, color: "text-sky-500 bg-sky-50 dark:bg-sky-500/10",
            items: [
                { label: "Company Profile", onClick: null, tag: "Soon" },
                { label: "Tax Settings", onClick: null, tag: "Soon" },
                { label: "Currency & Locale", onClick: null, tag: "Soon" },
                { label: "Fiscal Year", onClick: null, tag: "Soon" },
            ]
        },
        {
            title: "Security", icon: Shield, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
            items: [
                { label: "Audit Log", onClick: openAudit, tag: "Live" },
                { label: "Role Permissions", onClick: null, tag: "Soon" },
                { label: "IP Allowlist", onClick: null, tag: "Soon" },
                { label: "Data Export", onClick: null, tag: "Soon" },
            ]
        },
        {
            title: "Billing & Plan", icon: CreditCard, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10",
            items: [
                { label: "Current Plan", onClick: null, tag: "Soon" },
                { label: "Payment Methods", onClick: null, tag: "Soon" },
                { label: "Billing History", onClick: null, tag: "Soon" },
                { label: "Usage Limits", onClick: null, tag: "Soon" },
            ]
        },
        {
            title: "Localization", icon: Globe, color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
            items: [
                { label: "Language", onClick: null, tag: "Soon" },
                { label: "Time Zone", onClick: null, tag: "Soon" },
                { label: "Date Format", onClick: null, tag: "Soon" },
                { label: "Number Format", onClick: null, tag: "Soon" },
            ]
        }
    ];

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-16 max-w-5xl">
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
            <motion.div variants={item} className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h1 className="text-4xl font-heading text-slate-900 dark:text-[#E2FF00]">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your account, company, and system preferences.</p>
            </motion.div>

            {/* User Profile Card */}
            <motion.div variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-heading font-bold shadow-lg">
                    {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 px-2.5 py-1 rounded-full"><Check className="w-3 h-3" /> Admin</span>
                        <span className="text-xs font-medium text-slate-400">Main Company</span>
                    </div>
                </div>
                <button onClick={openProfile} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Edit Profile</button>
            </motion.div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SETTINGS_SECTIONS.map((section, i) => (
                    <motion.div key={i} variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.color}`}><section.icon className="w-4 h-4" /></div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{section.title}</h3>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {section.items.map((setting, j) => (
                                <button key={j} onClick={setting.onClick || undefined} disabled={!setting.onClick}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left group transition-colors ${setting.onClick ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer' : 'cursor-default opacity-70'}`}>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{setting.label}</span>
                                    <div className="flex items-center gap-2">
                                        {setting.tag === 'Live' ? (
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">LIVE</span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">SOON</span>
                                        )}
                                        {setting.onClick && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Danger Zone */}
            <motion.div variants={item} className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6">
                <h3 className="font-bold text-rose-900 dark:text-rose-400 mb-4">Danger Zone</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm font-bold text-rose-800 dark:text-rose-300">Reset All Data</p><p className="text-xs text-rose-600 dark:text-rose-500">Permanently removes all inventory, orders, and finance data.</p></div>
                        <button className="px-4 py-2 text-sm font-bold text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">Reset</button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm font-bold text-rose-800 dark:text-rose-300">Delete Company Account</p><p className="text-xs text-rose-600 dark:text-rose-500">This action cannot be undone.</p></div>
                        <button className="px-4 py-2 text-sm font-bold text-white bg-rose-600 border border-rose-700 rounded-xl hover:bg-rose-700 transition-colors">Delete</button>
                    </div>
                </div>
            </motion.div>

            {/* ── Profile Edit Modal ── */}
            <AnimatePresence>
                {activeModal === 'profile' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !profileSub && closeModal()} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Edit Profile</h3><p className="text-sm text-slate-500 mt-0.5">Update your personal information.</p></div>
                                <button onClick={closeModal} disabled={profileSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {profileErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{profileErr}</div>}
                                <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">First Name</label><input className={inp} value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                                        <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Last Name</label><input className={inp} value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} /></div>
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Email</label><input type="email" className={inp} value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} /></div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={closeModal} disabled={profileSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="profile-form" disabled={profileSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">{profileSub && <Loader2 className="w-4 h-4 animate-spin" />}{profileSub ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Change Password Modal ── */}
            <AnimatePresence>
                {activeModal === 'password' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !pwSub && closeModal()} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2"><Key className="w-5 h-5 text-brand-500" />Change Password</h3><p className="text-sm text-slate-500 mt-0.5">Enter your current and new password.</p></div>
                                <button onClick={closeModal} disabled={pwSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {pwErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{pwErr}</div>}
                                <form id="pw-form" onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Current Password</label><input required type="password" className={inp} value={pwForm.old_password} onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">New Password</label><input required type="password" className={inp} value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Confirm New Password</label><input required type="password" className={inp} value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} /></div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={closeModal} disabled={pwSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="pw-form" disabled={pwSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">{pwSub && <Loader2 className="w-4 h-4 animate-spin" />}{pwSub ? 'Changing...' : 'Change Password'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Audit Log Modal ── */}
            <AnimatePresence>
                {activeModal === 'audit' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" />System Audit Log</h3><p className="text-sm text-slate-500 mt-0.5">All user actions and system events.</p></div>
                                <button onClick={closeModal} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 max-h-[65vh] overflow-y-auto">
                                {auditLoading && <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>}
                                {auditErr && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{auditErr}</div>}
                                {!auditLoading && !auditErr && auditLogs.length === 0 && (
                                    <p className="text-center text-slate-400 font-medium py-12">No audit log entries found.</p>
                                )}
                                {!auditLoading && auditLogs.length > 0 && (
                                    <div className="space-y-2">
                                        {auditLogs.map((log, i) => (
                                            <div key={log.id || i} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</p>
                                                        {log.object_repr && <p className="text-xs text-slate-500 font-medium mt-0.5">{log.model}: {log.object_repr}</p>}
                                                        <p className="text-xs text-brand-500 font-medium mt-1">{log.user}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button onClick={closeModal} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
