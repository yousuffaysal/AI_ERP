"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Shield, Zap, Globe, Users, Target } from "lucide-react";
import Footer from "@/components/Layout/Footer";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Docs", href: "/docs" },
];

const TEAM = [
    { name: "Yusuf Faisal", role: "Founder & CEO", bio: "Previously led engineering at two Fortune 500 logistics firms. Obsessed with turning operational complexity into mathematical clarity.", initials: "YF" },
    { name: "Sara Al-Hassan", role: "Chief Technology Officer", bio: "10 years building ML infrastructure at scale. Architect of the Core predictive engine and real-time anomaly detection systems.", initials: "SH" },
    { name: "David Kim", role: "Head of Product", bio: "Former SAP and Oracle implementation lead. Turned that institutional knowledge into a framework for building ERP that people actually want to use.", initials: "DK" },
    { name: "Elena Petrov", role: "Head of AI Research", bio: "PhD in Applied Mathematics (ETH Zürich). Developed the ARIMA demand forecasting models and the price-elasticity optimization engine.", initials: "EP" },
    { name: "Ahmad Al-Rashid", role: "Head of Operations", bio: "Built and scaled supply chain systems across GCC markets. Brings real-world procurement and logistics intelligence to the platform.", initials: "AR" },
    { name: "Emma Wilson", role: "Head of Customer Success", bio: "Helped 40+ enterprises migrate off legacy ERP. Ensures every deployment goes from signed contract to operational in under 30 days.", initials: "EW" },
];

const VALUES = [
    { title: "Algorithms Over Instincts", desc: "Every decision in Core is traceable to a model, a dataset, or a mathematical proof. We build tools that remove the guesswork from running a business.", icon: BrainCircuit },
    { title: "Radical Transparency", desc: "Our audit trail is immutable. Every change, every login, every export is recorded with field-level precision. Your data's history belongs to you.", icon: Shield },
    { title: "Operational Velocity", desc: "Slow software is a tax on your business. Core is built on async-first architecture to ensure sub-400ms response times at any scale.", icon: Zap },
    { title: "Global by Default", desc: "Multi-currency, multi-warehouse, multi-tenant from day one. We built for the way modern businesses actually operate — across borders.", icon: Globe },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
            <div className="fixed top-0 right-0 w-[800px] h-[800px] rounded-full z-0 opacity-[0.08] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(226,255,0,1) 0%, transparent 70%)', filter: 'blur(120px)' }} />

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
            <section className="relative z-10 pt-24 pb-40 px-6 md:px-16 border-b border-[#1A1A1A]">
                <div className="max-w-7xl mx-auto">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
                        Who We Are
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-heading text-6xl md:text-[9rem] leading-[0.85] text-white tracking-tight mb-12">
                        Built by<br />
                        <span className="italic text-[#E2FF00] font-normal">operators.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-2xl text-[#888888] text-xl md:text-2xl font-medium leading-relaxed">
                        We didn't build Core in a vacuum. Every feature came from running warehouses, closing invoices at 11pm, and watching dashboards crash on quarter-end. We know what actually needs to work.
                    </motion.p>
                </div>
            </section>

            {/* Mission */}
            <section className="relative z-10 py-40 px-6 md:px-16 bg-[#E2FF00] text-black">
                <div className="max-w-5xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-8xl tracking-tighter leading-[0.85] mb-16">
                        Our Mission.
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="columns-1 md:columns-2 gap-16 text-lg md:text-xl font-medium leading-relaxed">
                        <p className="mb-8 break-inside-avoid">
                            The enterprise software industry has been selling complexity as a feature for thirty years. Multi-million dollar implementations that take eighteen months and still require consultants to generate a basic report.
                        </p>
                        <p className="mb-8 break-inside-avoid">
                            Core is our answer. An AI-native operating system for businesses that treats your time as the scarcest resource. Every screen exists to remove a decision or accelerate one. Nothing more.
                        </p>
                        <p className="break-inside-avoid font-black uppercase tracking-widest text-sm border-t-2 border-black pt-8">
                            "Software should make you faster, not require you to slow down for it."
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Values */}
            <section className="relative z-10 py-40 px-6 md:px-16 bg-[#030303] border-b border-[#1A1A1A]">
                <div className="max-w-7xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-7xl tracking-tight text-white mb-24">
                        Operating<br /><span className="italic text-[#E2FF00] font-normal">Principles.</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {VALUES.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="bg-[#050505] p-12 hover:bg-[#0A0A0A] transition-colors group">
                                <div className="mb-8 text-[#444444] group-hover:text-[#E2FF00] transition-colors duration-500">
                                    <v.icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-[#EAEAEA] mb-4 uppercase tracking-widest">{v.title}</h3>
                                <p className="text-[#666666] font-medium leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Numbers */}
            <section className="relative z-10 py-32 px-6 md:px-16 border-b border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16">
                    {[
                        { value: "2022", label: "Founded" },
                        { value: "48+", label: "Enterprise Clients" },
                        { value: "$2.1B", label: "Assets Managed" },
                        { value: "99.97%", label: "Uptime SLA" },
                    ].map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.12 }}
                            className="border-l-4 border-[#E2FF00] pl-8">
                            <p className="font-heading text-5xl md:text-7xl text-white tracking-tighter mb-2">{s.value}</p>
                            <p className="text-[#888888] font-bold uppercase tracking-widest text-xs">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Team */}
            <section className="relative z-10 py-40 px-6 md:px-16 border-b border-[#1A1A1A] bg-[#030303]">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="mb-24">
                        <h2 className="font-heading text-5xl md:text-7xl tracking-tight text-white mb-4">
                            The<br /><span className="italic text-[#E2FF00] font-normal">Team.</span>
                        </h2>
                        <p className="text-[#666666] text-xl font-medium max-w-xl">Six people who've seen the worst of legacy ERP and decided to build the alternative.</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {TEAM.map((member, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className="bg-[#050505] p-10 hover:bg-[#0A0A0A] transition-colors group">
                                <div className="w-16 h-16 rounded-sm bg-[#E2FF00] flex items-center justify-center text-black font-black text-xl mb-8 group-hover:scale-105 transition-transform">
                                    {member.initials}
                                </div>
                                <p className="font-black text-white text-lg mb-1">{member.name}</p>
                                <p className="text-[#E2FF00] text-xs font-bold uppercase tracking-widest mb-6">{member.role}</p>
                                <p className="text-[#666666] font-medium leading-relaxed text-sm">{member.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-40 px-6 md:px-16 bg-[#E2FF00] flex flex-col items-center justify-center overflow-hidden cursor-pointer group" onClick={() => window.location.href='/contact'}>
                <div className="absolute inset-0 z-0 opacity-10 scale-150 rotate-45 group-hover:rotate-90 transition-transform duration-[3s]"
                    style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, black 40px, black 80px)' }} />
                <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 font-heading text-5xl md:text-[8rem] font-black tracking-tighter text-black uppercase leading-none text-center">
                    Talk to<br />the Team.
                </motion.h2>
                <div className="relative z-10 mt-12 w-20 h-20 bg-black text-[#E2FF00] rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-500 shadow-2xl">
                    <ArrowRight className="w-10 h-10" />
                </div>
            </section>

            <Footer />
        </div>
    );
}
