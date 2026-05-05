"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Cpu, Globe, Server, AlertTriangle, Key } from "lucide-react";
import Footer from "@/components/Layout/Footer";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Guide", href: "/guide" },
    { label: "Contact", href: "/contact" },
];

const SECTIONS = [
    {
        id: "infrastructure",
        icon: Server,
        title: "Infrastructure Security",
        content: [
            { heading: "Cloud Isolation", body: "CORE runs on ISO 27001-certified infrastructure with hardware-level tenant isolation." },
            { heading: "Encryption", body: "AES-256 encryption at rest and TLS 1.3 for all data in transit." },
            { heading: "Audit Logs", body: "Immutable audit trails for every API call and database mutation." },
        ],
    },
    {
        id: "compliance",
        icon: ShieldCheck,
        title: "Compliance & Audits",
        content: [
            { heading: "SOC 2 Type II", body: "We maintain SOC 2 compliance for security, availability, and confidentiality." },
            { heading: "Penetration Testing", body: "Quarterly independent security audits by top-tier white-hat agencies." },
            { heading: "Vulnerability Disclosure", body: "Active Bug Bounty program to ensure zero-day threats are mitigated instantly." },
        ],
    },
    {
        id: "access",
        icon: Key,
        title: "Access Control",
        content: [
            { heading: "MFA / SSO", body: "Support for SAML, Okta, and hardware-based 2FA (Yubikey)." },
            { heading: "RBAC", body: "Granular Role-Based Access Control down to individual field levels." },
            { heading: "Session Security", body: "Automated session timeouts and concurrent login monitoring." },
        ],
    },
];

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans">
            <div className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center bg-black/50 backdrop-blur-xl">
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

            <section className="relative z-10 pt-24 pb-24 px-6 md:px-16 border-b border-[#1A1A1A]">
                <div className="max-w-5xl mx-auto">
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
                        Trust Center · Security
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-heading text-6xl md:text-[8rem] leading-[0.85] text-white tracking-tight mb-10">
                        Fortified<br />
                        <span className="italic text-[#E2FF00] font-normal">Intelligence.</span>
                    </motion.h1>
                    <div className="flex flex-col sm:flex-row gap-6 text-sm text-[#666666] font-medium">
                        <span>Status: <strong className="text-[#E2FF00]">HARDENED</strong></span>
                    </div>
                </div>
            </section>

            <section className="relative z-10 py-20 px-6 md:px-16">
                <div className="max-w-5xl mx-auto">
                    <div className="space-y-24">
                        {SECTIONS.map((section, si) => (
                            <motion.div key={section.id} id={section.id}
                                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                                <div className="flex items-start gap-6 mb-12 pb-6 border-b border-[#1A1A1A]">
                                    <div className="w-12 h-12 border border-[#2A2A2A] flex items-center justify-center shrink-0">
                                        <section.icon className="w-5 h-5 text-[#E2FF00]" />
                                    </div>
                                    <div>
                                        <span className="font-mono text-xs text-[#555555] uppercase tracking-widest">0{si + 1}</span>
                                        <h2 className="font-heading text-4xl text-white tracking-tight">{section.title}</h2>
                                    </div>
                                </div>
                                <div className="space-y-8 pl-18">
                                    {section.content.map((item, ci) => (
                                        <div key={ci} className="flex flex-col md:flex-row gap-4 md:gap-8">
                                            <p className="text-sm font-black text-[#E2FF00] uppercase tracking-widest md:w-48 shrink-0">{item.heading}</p>
                                            <p className="text-[#888888] font-medium leading-relaxed flex-1">{item.body}</p>
                                        </div>
                                    ))}
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
