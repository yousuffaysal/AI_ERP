"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Trash2, Globe, FileText } from "lucide-react";
import Footer from "@/components/Layout/Footer";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Guide", href: "/guide" },
    { label: "Contact", href: "/contact" },
];

const SECTIONS = [
    {
        id: "collection",
        icon: Eye,
        title: "What We Collect",
        content: [
            { heading: "Account Data", body: "When you register, we collect your name, email address, company name, job title, and a hashed password. We never store plaintext passwords." },
            { heading: "Usage Data", body: "We log which pages you visit, which actions you perform (create, update, delete), and approximate timestamps. This forms the audit trail you can view inside the platform." },
            { heading: "Device & Connection", body: "We record your IP address, browser type, and operating system for security monitoring. Unusual login locations trigger alerts visible in the Audit Trail module." },
            { heading: "Business Data", body: "All inventory records, invoices, HR data, financial transactions, and reports you create inside Core belong entirely to you. We treat them as confidential and never analyse them for our own purposes." },
        ],
    },
    {
        id: "use",
        icon: FileText,
        title: "How We Use Your Data",
        content: [
            { heading: "To Run the Platform", body: "Your data powers the features you pay for: forecasting, anomaly detection, report generation. Without it the platform cannot function." },
            { heading: "Security & Fraud Prevention", body: "We analyse login patterns and API call volumes to detect abuse. Anomalous activity triggers automated alerts and, if necessary, account suspension." },
            { heading: "Product Improvement", body: "We use aggregated, anonymised usage patterns (e.g. 'X% of users open the Procurement tab first') to decide what to build next. Individual records are never included." },
            { heading: "Communications", body: "We send transactional emails (password resets, invoice alerts, SLA notifications) and, only if you opt in, product update newsletters. You can unsubscribe from marketing at any time." },
        ],
    },
    {
        id: "sharing",
        icon: Globe,
        title: "Who We Share Data With",
        content: [
            { heading: "Infrastructure Providers", body: "We use AWS (or your chosen cloud region) for hosting and PostgreSQL for storage. These providers are bound by strict data processing agreements and are ISO 27001 certified." },
            { heading: "No Data Brokers, Ever", body: "We do not sell, rent, or trade your personal or business data to third-party advertisers, data brokers, or analytics companies. This is unconditional." },
            { heading: "Legal Requirements", body: "If required by a court order or regulatory authority in your jurisdiction, we may be obligated to disclose data. We will notify you as soon as legally permitted if this occurs." },
            { heading: "Successors", body: "In the event of a merger or acquisition, your data may transfer to a successor entity. We will notify you 30 days in advance and you can export or delete your data before any transfer." },
        ],
    },
    {
        id: "security",
        icon: Lock,
        title: "How We Protect Data",
        content: [
            { heading: "Encryption in Transit", body: "All data between your browser and our servers is encrypted with TLS 1.3. Our API endpoints do not accept unencrypted connections." },
            { heading: "Encryption at Rest", body: "All database volumes are encrypted using AES-256. Backups are separately encrypted before being written to cold storage." },
            { heading: "Role-Based Access", body: "Inside Core, your own RBAC system controls who sees what. Our own internal staff follow the same principle — engineers cannot access your tenant's data without a support ticket you opened." },
            { heading: "Penetration Testing", body: "We commission independent penetration tests quarterly. Critical findings are patched within 48 hours. Reports are available to Enterprise clients on request under NDA." },
        ],
    },
    {
        id: "rights",
        icon: Shield,
        title: "Your Rights",
        content: [
            { heading: "Access & Portability", body: "You can export all of your company's data at any time via Settings → Data Export. The export is a structured JSON archive you can import into any system." },
            { heading: "Correction", body: "If any of your account data is inaccurate, you can update it directly in Settings. For data inside your business records (invoices, employees, etc.), you have full CRUD access." },
            { heading: "Deletion", body: "You can delete your account and all associated data from Settings → Danger Zone. Deletion is irreversible and completed within 30 days, after which no backup retains identifiable records." },
            { heading: "GDPR & CCPA", body: "If you are in the EU or California, you have specific statutory rights including the right to object to processing and the right to restrict processing. Contact privacy@coreerp.io to exercise these rights." },
        ],
    },
    {
        id: "cookies",
        icon: Trash2,
        title: "Cookies",
        content: [
            { heading: "Strictly Necessary", body: "We set one session cookie to keep you logged in. This cookie is httpOnly and SameSite=Strict. It expires when you log out or after 8 hours of inactivity." },
            { heading: "No Tracking Cookies", body: "We do not use Google Analytics, Facebook Pixel, Hotjar, or any third-party tracking cookies. Our analytics are first-party and privacy-preserving." },
            { heading: "Preference Cookies", body: "If you have enabled dark mode or changed language settings, a small localStorage value stores your preference. This is never transmitted to our servers." },
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans">
            <div className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* Nav */}
            <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center">
                <Link href="/" className="font-heading text-3xl tracking-tight text-[#EAEAEA]">
                    CORE<span className="text-[#E2FF00] italic">.</span>ERP
                </Link>
                <div className="flex gap-8 items-center">
                    {NAV_LINKS.map(l => (
                        <Link key={l.href} href={l.href} className="hidden md:block text-sm font-bold tracking-widest text-[#A0A0A0] hover:text-[#E2FF00] transition-colors uppercase">{l.label}</Link>
                    ))}
                    <Link href="/login" className="h-12 px-6 inline-flex items-center justify-center bg-[#E2FF00] text-black text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors">
                        Access Terminal
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative z-10 pt-24 pb-24 px-6 md:px-16 border-b border-[#1A1A1A]">
                <div className="max-w-5xl mx-auto">
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
                        Legal · Privacy Policy
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-heading text-6xl md:text-[8rem] leading-[0.85] text-white tracking-tight mb-10">
                        Privacy<br />
                        <span className="italic text-[#E2FF00] font-normal">Policy.</span>
                    </motion.h1>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
                        className="flex flex-col sm:flex-row gap-6 text-sm text-[#666666] font-medium">
                        <span>Last updated: <strong className="text-[#888888]">1 May 2026</strong></span>
                        <span className="hidden sm:block text-[#333333]">|</span>
                        <span>Applies to: <strong className="text-[#888888]">Core ERP platform (coreerp.io)</strong></span>
                        <span className="hidden sm:block text-[#333333]">|</span>
                        <span>Questions: <a href="mailto:privacy@coreerp.io" className="text-[#E2FF00] hover:underline">privacy@coreerp.io</a></span>
                    </motion.div>
                </div>
            </section>

            {/* Intro summary boxes */}
            <section className="relative z-10 py-20 px-6 md:px-16 border-b border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="max-w-5xl mx-auto">
                    <p className="text-xs font-black text-[#555555] uppercase tracking-widest mb-8">The short version</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {[
                            { icon: Shield, title: "Your data stays yours", desc: "Everything you create inside Core — invoices, employees, inventory — belongs to you. We never analyse or sell it." },
                            { icon: Lock, title: "No trackers, ever", desc: "We don't use Google Analytics or Facebook Pixel. Zero third-party tracking cookies. Our analytics are first-party only." },
                            { icon: Trash2, title: "Delete anytime", desc: "One click in Settings permanently and irreversibly deletes your account and all associated data within 30 days." },
                        ].map((box, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="bg-[#050505] p-8 hover:bg-[#0A0A0A] transition-colors group">
                                <div className="mb-5 text-[#444444] group-hover:text-[#E2FF00] transition-colors">
                                    <box.icon className="w-8 h-8" />
                                </div>
                                <p className="font-black text-white text-base mb-2 uppercase tracking-wide">{box.title}</p>
                                <p className="text-[#666666] font-medium leading-relaxed text-sm">{box.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main content */}
            <section className="relative z-10 py-20 px-6 md:px-16">
                <div className="max-w-5xl mx-auto">
                    {/* TOC */}
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className="mb-20 p-8 border border-[#1A1A1A] bg-[#0A0A0A]">
                        <p className="text-xs font-black text-[#555555] uppercase tracking-widest mb-5">Table of Contents</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SECTIONS.map((s, i) => (
                                <a key={s.id} href={`#${s.id}`}
                                    className="flex items-center gap-2 text-sm font-bold text-[#666666] hover:text-[#E2FF00] transition-colors group">
                                    <span className="text-[#333333] font-mono text-xs group-hover:text-[#E2FF00] transition-colors">{String(i + 1).padStart(2, '0')}.</span>
                                    {s.title}
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-24">
                        {SECTIONS.map((section, si) => (
                            <motion.div key={section.id} id={section.id}
                                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7 }}>
                                <div className="flex items-start gap-6 mb-12 pb-6 border-b border-[#1A1A1A]">
                                    <div className="w-12 h-12 border border-[#2A2A2A] flex items-center justify-center shrink-0 group-hover:border-[#E2FF00] transition-colors">
                                        <section.icon className="w-5 h-5 text-[#E2FF00]" />
                                    </div>
                                    <div>
                                        <span className="font-mono text-xs text-[#555555] uppercase tracking-widest">0{si + 1}</span>
                                        <h2 className="font-heading text-4xl text-white tracking-tight">{section.title}</h2>
                                    </div>
                                </div>

                                <div className="space-y-8 pl-18">
                                    {section.content.map((item, ci) => (
                                        <motion.div key={ci}
                                            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                            transition={{ duration: 0.4, delay: ci * 0.08 }}
                                            className="flex flex-col md:flex-row gap-4 md:gap-8 pl-0 md:pl-18">
                                            <p className="text-sm font-black text-[#E2FF00] uppercase tracking-widest md:w-48 shrink-0">{item.heading}</p>
                                            <p className="text-[#888888] font-medium leading-relaxed flex-1">{item.body}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact */}
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="mt-24 p-10 border border-[#E2FF00]/20 bg-[#E2FF00]/5">
                        <p className="font-heading text-3xl text-white mb-4">Questions about this policy?</p>
                        <p className="text-[#888888] font-medium leading-relaxed mb-6">
                            Our Data Protection Officer responds to all privacy inquiries within 5 business days. For GDPR erasure or portability requests, response time is within 30 days as required by law.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="mailto:privacy@coreerp.io"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E2FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors">
                                privacy@coreerp.io
                            </a>
                            <Link href="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-[#3A3A3A] text-[#888888] font-black uppercase tracking-widest text-sm hover:border-[#E2FF00] hover:text-[#E2FF00] transition-colors">
                                Contact Form
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
