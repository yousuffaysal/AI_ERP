"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import Footer from "@/components/Layout/Footer";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Docs", href: "/docs" },
];

const OFFICES = [
    {
        city: "Dubai",
        country: "UAE",
        address: "Level 14, DIFC Gate Avenue\nDubai International Financial Centre",
        phone: "+971 4 123 4567",
        email: "dubai@coreerp.io",
        hours: "Sun–Thu, 9:00 – 18:00 GST",
    },
    {
        city: "London",
        country: "UK",
        address: "22 Bishopsgate, 22nd Floor\nLondon EC2N 4BQ",
        phone: "+44 20 7946 0123",
        email: "london@coreerp.io",
        hours: "Mon–Fri, 9:00 – 18:00 GMT",
    },
    {
        city: "Singapore",
        country: "SG",
        address: "One Raffles Place, Tower 2\nSingapore 048616",
        phone: "+65 6123 4567",
        email: "apac@coreerp.io",
        hours: "Mon–Fri, 9:00 – 18:00 SGT",
    },
];

const INQUIRY_TYPES = [
    "Enterprise Sales Inquiry",
    "Demo Request",
    "Partnership & Integration",
    "Technical Support",
    "Pricing Information",
    "Press & Media",
    "Other",
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", type: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1400));
        setSubmitting(false);
        setSubmitted(true);
    };

    const inp = "w-full bg-[#0A0A0A] border border-[#2A2A2A] text-[#EAEAEA] text-sm font-medium py-4 px-5 focus:outline-none focus:border-[#E2FF00] transition-colors placeholder:text-[#555555]";

    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

            {/* Nav */}
            <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center">
                <Link href="/" className="font-heading text-3xl tracking-tight text-[#EAEAEA]">
                    CORE<span className="text-[#E2FF00] italic">.</span>ERP
                </Link>
                <div className="flex gap-8 items-center">
                    {NAV_LINKS.map(l => (
                        <Link key={l.href} href={l.href} className="hidden md:block text-sm font-bold tracking-widest text-[#A0A0A0] hover:text-[#E2FF00] transition-colors uppercase">
                            {l.label}
                        </Link>
                    ))}
                    <Link href="/login" className="h-12 px-6 inline-flex items-center justify-center bg-[#E2FF00] text-black text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors">
                        Access Terminal
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative z-10 pt-24 pb-32 px-6 md:px-16 border-b border-[#1A1A1A]">
                <div className="max-w-7xl mx-auto">
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
                        Get In Touch
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-heading text-6xl md:text-[9rem] leading-[0.85] text-white tracking-tight mb-12">
                        Start a<br />
                        <span className="italic text-[#E2FF00] font-normal">conversation.</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-xl text-[#888888] text-xl font-medium leading-relaxed">
                        Whether you're evaluating Core for your enterprise or looking to extend the platform, our team responds within one business day.
                    </motion.p>
                </div>
            </section>

            {/* Contact Form + Info */}
            <section className="relative z-10 py-32 px-6 md:px-16">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">

                    {/* Form */}
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <h2 className="font-heading text-4xl text-white tracking-tight mb-12">Send a message.</h2>

                        {submitted ? (
                            <div className="bg-[#E2FF00] p-12 text-black">
                                <p className="font-heading text-5xl font-black tracking-tighter mb-4">Received.</p>
                                <p className="font-medium text-lg leading-relaxed mb-8">
                                    Your message has been logged. A member of our team will contact <strong>{form.email}</strong> within one business day.
                                </p>
                                <button onClick={() => setSubmitted(false)} className="text-sm font-black uppercase tracking-widest underline underline-offset-4 hover:no-underline">
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-0 border border-[#2A2A2A]">
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    <div className="border-b border-r border-[#2A2A2A]">
                                        <input required className={inp} placeholder="Full Name *" value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                    </div>
                                    <div className="border-b border-[#2A2A2A]">
                                        <input required className={inp} placeholder="Company *" value={form.company}
                                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    <div className="border-b border-r border-[#2A2A2A]">
                                        <input required type="email" className={inp} placeholder="Email Address *" value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                    </div>
                                    <div className="border-b border-[#2A2A2A]">
                                        <input className={inp} placeholder="Phone (optional)" value={form.phone}
                                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="border-b border-[#2A2A2A]">
                                    <select required className={inp + " appearance-none cursor-pointer"} value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                        <option value="">Inquiry Type *</option>
                                        {INQUIRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="border-b border-[#2A2A2A]">
                                    <textarea required rows={6} className={inp + " resize-none"} placeholder="Your message *"
                                        value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                                </div>
                                <button type="submit" disabled={submitting}
                                    className="w-full h-16 bg-[#E2FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors flex items-center justify-center gap-3 disabled:opacity-70">
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Send Message</>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
                        className="space-y-16">
                        <div>
                            <h2 className="font-heading text-4xl text-white tracking-tight mb-8">Direct channels.</h2>
                            <div className="space-y-6">
                                {[
                                    { icon: Mail, label: "General", value: "hello@coreerp.io" },
                                    { icon: Mail, label: "Enterprise Sales", value: "enterprise@coreerp.io" },
                                    { icon: Mail, label: "Security", value: "security@coreerp.io" },
                                    { icon: Phone, label: "Support Hotline", value: "+971 4 123 4567" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 group">
                                        <div className="w-10 h-10 border border-[#2A2A2A] flex items-center justify-center shrink-0 group-hover:border-[#E2FF00] transition-colors">
                                            <item.icon className="w-4 h-4 text-[#555555] group-hover:text-[#E2FF00] transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#555555] uppercase tracking-widest mb-0.5">{item.label}</p>
                                            <p className="text-[#EAEAEA] font-medium">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="font-heading text-4xl text-white tracking-tight mb-8">Response SLA.</h2>
                            <div className="space-y-4 border border-[#1A1A1A]">
                                {[
                                    { tier: "Enterprise / Critical", time: "< 2 hours", color: "text-[#E2FF00]" },
                                    { tier: "Sales Inquiry", time: "< 4 hours", color: "text-white" },
                                    { tier: "General Inquiry", time: "1 business day", color: "text-[#888888]" },
                                    { tier: "Press & Media", time: "1–2 business days", color: "text-[#888888]" },
                                ].map((s, i) => (
                                    <div key={i} className="flex justify-between items-center px-6 py-4 border-b border-[#1A1A1A] last:border-0 hover:bg-[#0A0A0A] transition-colors">
                                        <span className="text-sm font-bold text-[#888888] uppercase tracking-wider">{s.tier}</span>
                                        <span className={`text-sm font-black ${s.color}`}>{s.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Office Locations */}
            <section className="relative z-10 py-32 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto">
                    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-24">
                        Global<br /><span className="italic text-[#E2FF00] font-normal">Offices.</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {OFFICES.map((office, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.12 }}
                                className="bg-[#050505] p-10 hover:bg-[#0A0A0A] transition-colors group">
                                <div className="mb-8">
                                    <p className="font-heading text-5xl text-white tracking-tighter">{office.city}</p>
                                    <p className="text-[#E2FF00] font-bold uppercase tracking-widest text-xs mt-1">{office.country}</p>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div className="flex gap-3">
                                        <MapPin className="w-4 h-4 text-[#444444] shrink-0 mt-0.5" />
                                        <p className="text-[#888888] font-medium leading-relaxed whitespace-pre-line">{office.address}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Phone className="w-4 h-4 text-[#444444] shrink-0" />
                                        <p className="text-[#888888] font-medium">{office.phone}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Mail className="w-4 h-4 text-[#444444] shrink-0" />
                                        <p className="text-[#888888] font-medium">{office.email}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Clock className="w-4 h-4 text-[#444444] shrink-0" />
                                        <p className="text-[#888888] font-medium">{office.hours}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
