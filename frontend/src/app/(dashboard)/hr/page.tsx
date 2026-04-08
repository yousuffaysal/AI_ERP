"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserCheck, Calendar, DollarSign, Briefcase,
    Loader2, X, AlertCircle, CheckCircle2, Plus, Search, Building2, Pencil, Trash2
} from 'lucide-react';

interface Department { id: string; name: string; code: string; }
interface LeaveType { id: string; name: string; days_allowed: number; is_paid: boolean; }
interface Employee {
    id: string; employee_id: string; first_name: string; last_name: string; full_name: string;
    email: string; phone: string; designation: string;
    department: string | null; department_name: string;
    employment_type: string; status: string; hire_date: string; salary: string;
}
interface LeaveRequest {
    id: string; employee: string; employee_name: string; leave_type: string;
    leave_type_name: string; start_date: string; end_date: string; status: string; reason: string;
}

const stagger: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

const EMPTY_EMP = { first_name: '', last_name: '', email: '', phone: '', designation: '', department: '', employment_type: 'full_time', status: 'active', hire_date: new Date().toISOString().split('T')[0], salary: '0', employee_id: '' };
const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    on_leave: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
const inp = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-brand-500";

type Tab = 'employees' | 'leaves' | 'departments';

export default function HRPage() {
    const [activeTab, setActiveTab] = useState<Tab>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Employee modal
    const [empModalOpen, setEmpModalOpen] = useState(false);
    const [editEmp, setEditEmp] = useState<Employee | null>(null);
    const [empForm, setEmpForm] = useState({ ...EMPTY_EMP });
    const [empSub, setEmpSub] = useState(false);
    const [empErr, setEmpErr] = useState<string | null>(null);

    // Leave modal
    const [leaveModal, setLeaveModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
    const [leaveSub, setLeaveSub] = useState(false);
    const [leaveErr, setLeaveErr] = useState<string | null>(null);

    // Department modal
    const [deptModal, setDeptModal] = useState(false);
    const [editDept, setEditDept] = useState<Department | null>(null);
    const [deptForm, setDeptForm] = useState({ name: '', code: '' });
    const [deptSub, setDeptSub] = useState(false);
    const [deptErr, setDeptErr] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [empRes, deptRes, leaveRes, ltRes] = await Promise.all([
                api.get('/hr/employees/'), api.get('/hr/departments/'),
                api.get('/hr/leave-requests/'), api.get('/hr/leave-types/'),
            ]);
            setEmployees(empRes.data.results || empRes.data);
            setDepartments(deptRes.data.results || deptRes.data);
            setLeaves(leaveRes.data.results || leaveRes.data);
            setLeaveTypes(ltRes.data.results || ltRes.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

    // ── Employee CRUD
    const openAddEmp = () => { setEditEmp(null); setEmpForm({ ...EMPTY_EMP }); setEmpErr(null); setEmpModalOpen(true); };
    const openEditEmp = (emp: Employee) => {
        setEditEmp(emp);
        setEmpForm({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, phone: emp.phone || '', designation: emp.designation, department: emp.department || '', employment_type: emp.employment_type, status: emp.status, hire_date: emp.hire_date, salary: emp.salary, employee_id: emp.employee_id });
        setEmpErr(null); setEmpModalOpen(true);
    };
    const handleEmpSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setEmpSub(true); setEmpErr(null);
        const payload: any = { ...empForm };
        if (!payload.department) delete payload.department;
        try {
            if (editEmp) {
                const res = await api.patch(`/hr/employees/${editEmp.id}/`, payload);
                setEmployees(prev => prev.map(e => e.id === editEmp.id ? res.data : e));
                showSuccess('Employee updated.');
            } else {
                const res = await api.post('/hr/employees/', payload);
                setEmployees(prev => [res.data, ...prev]);
                showSuccess('Employee added.');
            }
            setEmpModalOpen(false);
        } catch (err: any) {
            const d = err.response?.data; setEmpErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save employee.');
        } finally { setEmpSub(false); }
    };
    const deleteEmp = async (id: string) => {
        if (!confirm('Delete this employee?')) return;
        try { await api.delete(`/hr/employees/${id}/`); setEmployees(p => p.filter(e => e.id !== id)); } catch { alert('Failed.'); }
    };

    // ── Leave CRUD
    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLeaveSub(true); setLeaveErr(null);
        try {
            const payload: any = { ...leaveForm };
            if (!payload.leave_type) delete payload.leave_type;
            const res = await api.post('/hr/leave-requests/', payload);
            setLeaves(prev => [res.data, ...prev]);
            setLeaveModal(false);
            setLeaveForm({ employee: '', leave_type: '', start_date: '', end_date: '', reason: '' });
            showSuccess('Leave request submitted.');
        } catch (err: any) {
            const d = err.response?.data; setLeaveErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to submit leave request.');
        } finally { setLeaveSub(false); }
    };
    const approveLeave = async (id: string) => {
        try { await api.post(`/hr/leave-requests/${id}/approve/`); setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l)); showSuccess('Approved.'); }
        catch (err: any) { alert(err.response?.data?.error || 'Failed.'); }
    };
    const rejectLeave = async (id: string) => {
        try { await api.post(`/hr/leave-requests/${id}/reject/`); setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l)); showSuccess('Rejected.'); }
        catch (err: any) { alert(err.response?.data?.error || 'Failed.'); }
    };

    // ── Department CRUD
    const openAddDept = () => { setEditDept(null); setDeptForm({ name: '', code: '' }); setDeptErr(null); setDeptModal(true); };
    const openEditDept = (d: Department) => { setEditDept(d); setDeptForm({ name: d.name, code: d.code }); setDeptErr(null); setDeptModal(true); };
    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setDeptSub(true); setDeptErr(null);
        try {
            if (editDept) {
                const res = await api.patch(`/hr/departments/${editDept.id}/`, deptForm);
                setDepartments(prev => prev.map(d => d.id === editDept.id ? res.data : d));
                showSuccess('Department updated.');
            } else {
                const res = await api.post('/hr/departments/', deptForm);
                setDepartments(prev => [res.data, ...prev]);
                showSuccess('Department created.');
            }
            setDeptModal(false);
        } catch (err: any) {
            const d = err.response?.data; setDeptErr(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save department.');
        } finally { setDeptSub(false); }
    };
    const deleteDept = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        try { await api.delete(`/hr/departments/${id}/`); setDepartments(p => p.filter(d => d.id !== id)); } catch { alert('Failed.'); }
    };

    const totalActive = employees.filter(e => e.status === 'active').length;
    const onLeaveCount = employees.filter(e => e.status === 'on_leave').length;
    const totalPayroll = employees.reduce((s, e) => s + parseFloat(e.salary || '0'), 0);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const filtered = employees.filter(e => [e.first_name, e.last_name, e.email, e.designation, e.department_name].some(v => v?.toLowerCase().includes(search.toLowerCase())));

    if (loading) return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 pb-16">
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
                    <h1 className="text-4xl font-heading text-slate-900 dark:text-[#E2FF00]">HR & People</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your workforce, departments and leave.</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'employees' && <button onClick={openAddEmp} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md"><Plus className="w-4 h-4" />Add Employee</button>}
                    {activeTab === 'leaves' && <button onClick={() => { setLeaveErr(null); setLeaveModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md"><Plus className="w-4 h-4" />Request Leave</button>}
                    {activeTab === 'departments' && <button onClick={openAddDept} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md"><Plus className="w-4 h-4" />Add Department</button>}
                </div>
            </motion.div>

            {/* KPIs */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Employees", value: employees.length, icon: Users, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
                    { label: "Active Staff", value: totalActive, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { label: "On Leave", value: onLeaveCount, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                    { label: "Monthly Payroll", value: `$${totalPayroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-[#0E0E0E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">{kpi.label}</span><div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div></div>
                        <span className="text-3xl font-heading text-slate-900 dark:text-white">{kpi.value}</span>
                    </div>
                ))}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={item} className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                {[{ id: 'employees', label: 'Employees', icon: Briefcase }, { id: 'leaves', label: 'Leave Requests', icon: Calendar }, { id: 'departments', label: 'Departments', icon: Building2 }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                        {tab.id === 'leaves' && pendingLeaves > 0 && <span className="ml-1 text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full font-black">{pendingLeaves}</span>}
                    </button>
                ))}
            </motion.div>

            {/* ── Employees Tab ── */}
            {activeTab === 'employees' && (
                <>
                    <motion.div variants={item} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0E0E0E] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-400 shadow-sm" />
                    </motion.div>
                    <motion.div variants={item} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>{['Name', 'Designation', 'Dept', 'Type', 'Status', 'Salary', ''].map(h => <th key={h} className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">No employees yet.</td></tr>
                                        : filtered.map(emp => (
                                            <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{emp.first_name[0]}{emp.last_name[0]}</div>
                                                        <div><p className="text-sm font-bold text-slate-900 dark:text-white">{emp.full_name}</p><p className="text-xs text-slate-500">{emp.email}</p></div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{emp.designation}</td>
                                                <td className="py-3 px-4 text-sm text-slate-500">{emp.department_name || '—'}</td>
                                                <td className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{emp.employment_type.replace('_', ' ')}</td>
                                                <td className="py-3 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[emp.status] || ''}`}>{emp.status.replace('_', ' ')}</span></td>
                                                <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">${parseFloat(emp.salary).toLocaleString()}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditEmp(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteEmp(emp.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}

            {/* ── Leave Requests Tab ── */}
            {activeTab === 'leaves' && (
                <motion.div variants={item} className="space-y-3">
                    {leaves.length === 0 ? <p className="text-center py-16 text-slate-500 font-medium">No leave requests found.</p>
                        : leaves.map(leave => (
                            <div key={leave.id} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{leave.employee_name}</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{leave.leave_type_name || 'Leave'} · {leave.start_date} → {leave.end_date}</p>
                                        {leave.reason && <p className="text-sm text-slate-400 mt-1 italic">"{leave.reason}"</p>}
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[leave.status] || ''}`}>{leave.status}</span>
                                </div>
                                {leave.status === 'pending' && (
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => approveLeave(leave.id)} className="flex-1 py-2 text-sm font-bold rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 transition-colors">✓ Approve</button>
                                        <button onClick={() => rejectLeave(leave.id)} className="flex-1 py-2 text-sm font-bold rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors">✕ Reject</button>
                                    </div>
                                )}
                            </div>
                        ))}
                </motion.div>
            )}

            {/* ── Departments Tab ── */}
            {activeTab === 'departments' && (
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {departments.length === 0 ? <p className="col-span-full text-center py-16 text-slate-500 font-medium">No departments yet.</p>
                        : departments.map(dept => (
                            <div key={dept.id} className="bg-white dark:bg-[#0E0E0E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">{dept.name[0]}</div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditDept(dept)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => deleteDept(dept.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white">{dept.name}</p>
                                <p className="text-xs font-mono text-slate-400 mt-0.5">{dept.code}</p>
                                <p className="text-xs text-slate-500 mt-3 font-medium">{employees.filter(e => e.department === dept.id).length} employees</p>
                            </div>
                        ))}
                </motion.div>
            )}

            {/* ── Employee Modal ── */}
            <AnimatePresence>
                {empModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !empSub && setEmpModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{editEmp ? 'Edit Employee' : 'New Employee'}</h3><p className="text-sm text-slate-500 mt-0.5">Fill in the employment details below.</p></div>
                                <button onClick={() => setEmpModalOpen(false)} disabled={empSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 max-h-[70vh] overflow-y-auto">
                                {empErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{empErr}</div>}
                                <form id="emp-form" onSubmit={handleEmpSubmit} className="grid grid-cols-2 gap-4">
                                    {!editEmp && <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Employee ID *</label><input required value={empForm.employee_id} onChange={e => setEmpForm(f => ({ ...f, employee_id: e.target.value }))} className={inp} placeholder="EMP-001" /></div>}
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">First Name *</label><input required value={empForm.first_name} onChange={e => setEmpForm(f => ({ ...f, first_name: e.target.value }))} className={inp} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Last Name *</label><input required value={empForm.last_name} onChange={e => setEmpForm(f => ({ ...f, last_name: e.target.value }))} className={inp} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Email *</label><input required type="email" value={empForm.email} onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))} className={inp} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Phone</label><input value={empForm.phone} onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))} className={inp} /></div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Designation *</label><input required value={empForm.designation} onChange={e => setEmpForm(f => ({ ...f, designation: e.target.value }))} className={inp} placeholder="Software Engineer" /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Department</label><select value={empForm.department} onChange={e => setEmpForm(f => ({ ...f, department: e.target.value }))} className={inp}><option value="">None</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Employment Type</label><select value={empForm.employment_type} onChange={e => setEmpForm(f => ({ ...f, employment_type: e.target.value }))} className={inp}><option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Status</label><select value={empForm.status} onChange={e => setEmpForm(f => ({ ...f, status: e.target.value }))} className={inp}><option value="active">Active</option><option value="on_leave">On Leave</option><option value="terminated">Terminated</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Hire Date *</label><input required type="date" value={empForm.hire_date} onChange={e => setEmpForm(f => ({ ...f, hire_date: e.target.value }))} className={inp} /></div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Monthly Salary ($)</label><input type="number" min="0" step="0.01" value={empForm.salary} onChange={e => setEmpForm(f => ({ ...f, salary: e.target.value }))} className={inp} /></div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setEmpModalOpen(false)} disabled={empSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="emp-form" disabled={empSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">{empSub && <Loader2 className="w-4 h-4 animate-spin" />}{empSub ? 'Saving...' : (editEmp ? 'Update Employee' : 'Add Employee')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Leave Request Modal ── */}
            <AnimatePresence>
                {leaveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !leaveSub && setLeaveModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Request Leave</h3><p className="text-sm text-slate-500 mt-0.5">Submit a leave request for approval.</p></div>
                                <button onClick={() => setLeaveModal(false)} disabled={leaveSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {leaveErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{leaveErr}</div>}
                                <form id="leave-form" onSubmit={handleLeaveSubmit} className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Employee *</label><select required className={inp} value={leaveForm.employee} onChange={e => setLeaveForm(f => ({ ...f, employee: e.target.value }))}><option value="">Select employee...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Leave Type</label><select className={inp} value={leaveForm.leave_type} onChange={e => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))}><option value="">Select type...</option>{leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.days_allowed} days)</option>)}</select></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Start Date *</label><input required type="date" className={inp} value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                                        <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">End Date *</label><input required type="date" className={inp} value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Reason</label><textarea rows={3} className={inp + ' resize-none'} value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} /></div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setLeaveModal(false)} disabled={leaveSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="leave-form" disabled={leaveSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">{leaveSub && <Loader2 className="w-4 h-4 animate-spin" />}{leaveSub ? 'Submitting...' : 'Submit Request'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Department Modal ── */}
            <AnimatePresence>
                {deptModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deptSub && setDeptModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div><h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{editDept ? 'Edit Department' : 'New Department'}</h3></div>
                                <button onClick={() => setDeptModal(false)} disabled={deptSub} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                {deptErr && <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-semibold"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{deptErr}</div>}
                                <form id="dept-form" onSubmit={handleDeptSubmit} className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Department Name *</label><input required className={inp} value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="Engineering" /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Code *</label><input required className={inp + ' font-mono'} value={deptForm.code} onChange={e => setDeptForm(f => ({ ...f, code: e.target.value }))} placeholder="ENG" /></div>
                                </form>
                            </div>
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setDeptModal(false)} disabled={deptSub} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" form="dept-form" disabled={deptSub} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-slate-900 text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md disabled:opacity-60">{deptSub && <Loader2 className="w-4 h-4 animate-spin" />}{deptSub ? 'Saving...' : (editDept ? 'Update' : 'Create Department')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
