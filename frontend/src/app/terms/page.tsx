"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Shield, AlertTriangle, Scale, Globe, UserCheck } from "lucide-react";
import Footer from "@/components/Layout/Footer";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Guide", href: "/guide" },
    { label: "Contact", href: "/contact" },
];

const SECTIONS = [
    {
        id: "acceptance",
        icon: UserCheck,
        title: "Acceptance of Terms",
        content: [
            { heading: "Contractual Agreement", body: "By accessing CORE ERP, you agree to be bound by these Terms of Service. If you do not agree, you must immediately terminate your session." },
            { heading: "Eligibility", body: "You must be at least 18 years old and have the legal authority to bind your organization to these terms." },
        ],
    },
    {
        id: "usage",
        icon: Scale,
        title: "Platform Usage",
        content: [
            { heading: "License Grant", body: "We grant you a non-exclusive, non-transferable right to use the platform in accordance with your subscription tier." },
            { heading: "Restrictions", body: "You may not reverse engineer, scrape, or attempt to bypass security measures. Any automated access must use official API keys." },
        ],
    },
    {
        id: "billing",
        icon: Globe,
        title: "Billing & Payments",
        content: [
            { heading: "Subscription", body: "Fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law." },
            { heading: "Taxes", body: "Prices are exclusive of VAT or local sales taxes unless explicitly stated otherwise." },
        ],
    },
    {
        id: "liability",
        icon: AlertTriangle,
        title: "Liability & Warranty",
        content: [
            { heading: "As Is", body: "The platform is provided 'as is' without warranty of any kind. We do not guarantee 100% uptime, though we strive for 99.9%." },
            { heading: "Limitation", body: "Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim." },
        ],
    },
];

export default function TermsPage() {
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
                        Legal · Terms of Service
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-heading text-6xl md:text-[8rem] leading-[0.85] text-white tracking-tight mb-10">
                        Terms of<br />
                        <span className="italic text-[#E2FF00] font-normal">Service.</span>
                    </motion.h1>
                    <div className="flex flex-col sm:flex-row gap-6 text-sm text-[#666666] font-medium">
                        <span>Last updated: <strong className="text-[#888888]">1 May 2026</strong></span>
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
