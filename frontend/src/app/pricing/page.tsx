"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowRight, Check, X, Zap, Shield, Globe, BrainCircuit, Star, ChevronDown } from "lucide-react";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Guide", href: "/guide" },
    { label: "Contact", href: "/contact" },
];

/* ─── Animated Counter ──────────────────────────────────── */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 1800;
        const step = (timestamp: number, startTime: number) => {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(t => step(t, startTime));
        };
        requestAnimationFrame(t => step(t, t));
    }, [inView, target]);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const PLANS = [
    {
        name: "Starter",
        tagline: "For growing teams ready to leave spreadsheets behind.",
        price: 299,
        period: "per month",
        highlight: false,
        badge: null,
        color: "border-[#2A2A2A]",
        btnClass: "bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] border border-[#3A3A3A]",
        features: [
            { label: "Up to 10 users", included: true },
            { label: "Dashboard & Analytics", included: true },
            { label: "Inventory Management", included: true },
            { label: "Sales & Invoicing", included: true },
            { label: "Customer Management", included: true },
            { label: "Basic HR Module", included: true },
            { label: "PDF / Excel Reports", included: true },
            { label: "Email support (48h SLA)", included: true },
            { label: "Procurement Module", included: false },
            { label: "Manufacturing & BOM", included: false },
            { label: "CRM & Pipeline", included: false },
            { label: "AI Demand Forecasting", included: false },
            { label: "Asset Management", included: false },
            { label: "Multi-warehouse", included: false },
            { label: "Custom API Access", included: false },
            { label: "Dedicated Account Manager", included: false },
        ],
    },
    {
        name: "Professional",
        tagline: "The complete operating system for serious operations.",
        price: 799,
        period: "per month",
        highlight: true,
        badge: "Most Popular",
        color: "border-[#E2FF00]",
        btnClass: "bg-[#E2FF00] text-black hover:bg-white",
        features: [
            { label: "Up to 50 users", included: true },
            { label: "Dashboard & Analytics", included: true },
            { label: "Inventory Management", included: true },
            { label: "Sales & Invoicing", included: true },
            { label: "Customer Management", included: true },
            { label: "Full HR Module", included: true },
            { label: "PDF / Excel Reports", included: true },
            { label: "Priority support (4h SLA)", included: true },
            { label: "Procurement Module", included: true },
            { label: "Manufacturing & BOM", included: true },
            { label: "CRM & Pipeline", included: true },
            { label: "AI Demand Forecasting", included: true },
            { label: "Asset Management", included: true },
            { label: "Multi-warehouse (up to 5)", included: true },
            { label: "Custom API Access", included: false },
            { label: "Dedicated Account Manager", included: false },
        ],
    },
    {
        name: "Enterprise",
        tagline: "Unlimited scale. Dedicated infrastructure. White-glove service.",
        price: null,
        period: "custom pricing",
        highlight: false,
        badge: "Custom",
        color: "border-[#2A2A2A]",
        btnClass: "bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] border border-[#3A3A3A]",
        features: [
            { label: "Unlimited users", included: true },
            { label: "Dashboard & Analytics", included: true },
            { label: "Inventory Management", included: true },
            { label: "Sales & Invoicing", included: true },
            { label: "Customer Management", included: true },
            { label: "Full HR Module", included: true },
            { label: "PDF / Excel Reports", included: true },
            { label: "24/7 support (< 1h SLA)", included: true },
            { label: "Procurement Module", included: true },
            { label: "Manufacturing & BOM", included: true },
            { label: "CRM & Pipeline", included: true },
            { label: "AI Demand Forecasting", included: true },
            { label: "Asset Management", included: true },
            { label: "Unlimited warehouses", included: true },
            { label: "Custom API Access", included: true },
            { label: "Dedicated Account Manager", included: true },
        ],
    },
];

const FAQS = [
    { q: "Can I switch plans at any time?", a: "Yes. You can upgrade or downgrade your plan at any billing cycle. Upgrades are prorated immediately; downgrades take effect at the next renewal." },
    { q: "Is there a free trial?", a: "We offer a 14-day full-access trial of the Professional plan — no credit card required. You'll have access to all modules including AI forecasting." },
    { q: "How does per-user pricing work?", a: "Starter and Professional include a flat user count. If you need more users on a fixed plan, we offer user add-on packs at $29/user/month." },
    { q: "Where is my data stored?", a: "Data is stored in your chosen region (UAE, EU, or APAC) on ISO 27001-certified infrastructure. We never co-mingle data between tenants." },
    { q: "Do you support on-premise deployment?", a: "Enterprise plans can be deployed on your own cloud account (AWS, Azure, GCP) or fully on-premise. Contact sales for the dedicated deployment guide." },
    { q: "What does 'AI API Integration' mean?", a: "When you bring your own AI API key (e.g. Claude, OpenAI), Core routes requests through your account so all AI features — forecasting, anomaly detection, pricing — are powered by your own contract." },
];

export default function PricingPage() {
    const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    const discount = billing === "annual" ? 0.8 : 1;

    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
            {/* Fixed bg grid */}
            <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* Orbs */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full z-0 opacity-[0.06] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(226,255,0,1) 0%, transparent 70%)', filter: 'blur(80px)' }} />

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
            <section ref={heroRef} className="relative z-10 pt-24 pb-32 px-6 md:px-16 text-center overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroOpacity }}>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8 inline-block">
                        — Transparent Pricing —
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-heading text-6xl md:text-[10rem] leading-[0.85] text-white tracking-tighter mb-8">
                        No surprises.<br />
                        <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#E2FF00] to-[#a3b800]">Ever.</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                        className="max-w-2xl mx-auto text-[#888888] text-xl font-medium leading-relaxed mb-16">
                        One price. Every feature at that tier. No implementation fees, no per-module charges, no consultant hours just to run a report.
                    </motion.p>

                    {/* Billing toggle */}
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                        className="inline-flex items-center gap-4 bg-[#0A0A0A] border border-[#2A2A2A] p-1.5 rounded-none">
                        <button onClick={() => setBilling("monthly")}
                            className={`px-6 py-2.5 text-sm font-black uppercase tracking-widest transition-all ${billing === "monthly" ? "bg-[#E2FF00] text-black" : "text-[#666666] hover:text-white"}`}>
                            Monthly
                        </button>
                        <button onClick={() => setBilling("annual")}
                            className={`px-6 py-2.5 text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billing === "annual" ? "bg-[#E2FF00] text-black" : "text-[#666666] hover:text-white"}`}>
                            Annual
                            <span className={`text-[10px] font-black px-1.5 py-0.5 ${billing === "annual" ? "bg-black text-[#E2FF00]" : "bg-[#E2FF00]/20 text-[#E2FF00]"}`}>
                                SAVE 20%
                            </span>
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Plans */}
            <section className="relative z-10 pb-32 px-6 md:px-16">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#2A2A2A]">
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.name}
                            initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative flex flex-col bg-[#050505] border-r border-[#2A2A2A] last:border-r-0 ${plan.highlight ? "bg-[#0A0A0A]" : ""}`}>
                            {plan.highlight && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-[#E2FF00]" />
                            )}
                            {plan.badge && (
                                <div className={`absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest px-2 py-1 ${plan.highlight ? "bg-[#E2FF00] text-black" : "border border-[#3A3A3A] text-[#888888]"}`}>
                                    {plan.badge}
                                </div>
                            )}

                            <div className="p-10 border-b border-[#1A1A1A] flex-none">
                                <p className="font-heading text-4xl text-white mb-2">{plan.name}</p>
                                <p className="text-[#666666] text-sm font-medium leading-relaxed mb-10">{plan.tagline}</p>

                                {plan.price !== null ? (
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="font-heading text-7xl text-white tracking-tighter leading-none">
                                            ${Math.round(plan.price * discount)}
                                        </span>
                                        <span className="text-[#555555] font-bold text-sm uppercase tracking-wider mb-2">{plan.period}</span>
                                    </div>
                                ) : (
                                    <div className="mb-2">
                                        <span className="font-heading text-5xl text-[#E2FF00] tracking-tighter">Contact Sales</span>
                                    </div>
                                )}
                                {billing === "annual" && plan.price && (
                                    <p className="text-xs font-bold text-[#E2FF00]">
                                        Billed ${Math.round(plan.price * 12 * discount).toLocaleString()}/yr · saves ${Math.round(plan.price * 12 * 0.2).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="p-10 flex-1 flex flex-col">
                                <Link href={plan.price === null ? "/contact" : "/login"}
                                    className={`w-full h-14 flex items-center justify-center text-sm font-black uppercase tracking-widest transition-all mb-10 group ${plan.btnClass}`}>
                                    {plan.price === null ? "Talk to Sales" : "Start Free Trial"}
                                    <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <div className="space-y-3 flex-1">
                                    <p className="text-[10px] font-black text-[#444444] uppercase tracking-widest mb-4">What's included</p>
                                    {plan.features.map((f, j) => (
                                        <motion.div key={j}
                                            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                            transition={{ duration: 0.3, delay: j * 0.03 }}
                                            className="flex items-center gap-3">
                                            {f.included
                                                ? <Check className="w-4 h-4 text-[#E2FF00] shrink-0" />
                                                : <X className="w-4 h-4 text-[#333333] shrink-0" />
                                            }
                                            <span className={`text-sm font-medium ${f.included ? "text-[#AAAAAA]" : "text-[#444444] line-through"}`}>{f.label}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Social proof strip */}
            <section className="relative z-10 py-24 px-6 md:px-16 bg-[#0A0A0A] border-y border-[#1A1A1A] overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16">
                    {[
                        { target: 48, suffix: "+", label: "Enterprise clients" },
                        { target: 99, suffix: ".97%", label: "Uptime SLA" },
                        { target: 14, suffix: " day", label: "Free trial, no CC" },
                        { target: 2100000000, prefix: "$", suffix: "", label: "Assets on platform" },
                    ].map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.1 }}
                            className="text-center">
                            <p className="font-heading text-5xl md:text-6xl text-[#E2FF00] tracking-tighter mb-2">
                                <Counter target={s.target} suffix={s.suffix} prefix={s.prefix} />
                            </p>
                            <p className="text-[#555555] font-bold uppercase tracking-widest text-xs">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Comparison table */}
            <section className="relative z-10 py-40 px-6 md:px-16">
                <div className="max-w-5xl mx-auto">
                    <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-4">
                        Compare<br /><span className="italic text-[#E2FF00] font-normal">the details.</span>
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[#666666] text-lg font-medium mb-16">Every feature across every plan, side by side.</motion.p>

                    <div className="border border-[#2A2A2A] overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-4 bg-[#0A0A0A] border-b border-[#2A2A2A]">
                            <div className="p-6 text-xs font-black text-[#555555] uppercase tracking-widest">Feature</div>
                            {PLANS.map(p => (
                                <div key={p.name} className={`p-6 text-xs font-black uppercase tracking-widest ${p.highlight ? "text-[#E2FF00]" : "text-[#888888]"}`}>{p.name}</div>
                            ))}
                        </div>
                        {[
                            { label: "Users included", values: ["10", "50", "Unlimited"] },
                            { label: "Warehouses", values: ["1", "5", "Unlimited"] },
                            { label: "AI modules", values: ["—", "All", "All + custom"] },
                            { label: "API access", values: ["Read-only", "Full REST", "Full REST + webhooks"] },
                            { label: "Data retention", values: ["12 months", "36 months", "Unlimited"] },
                            { label: "Support SLA", values: ["48 hours", "4 hours", "< 1 hour"] },
                            { label: "Onboarding", values: ["Self-serve docs", "Guided setup", "White-glove (30-day)"] },
                            { label: "Uptime SLA", values: ["99.5%", "99.9%", "99.97%"] },
                            { label: "SSO / SAML", values: ["—", "—", "✓"] },
                            { label: "Custom domain", values: ["—", "—", "✓"] },
                        ].map((row, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                className="grid grid-cols-4 border-b border-[#1A1A1A] last:border-0 hover:bg-[#0A0A0A] transition-colors">
                                <div className="p-6 text-sm font-bold text-[#888888]">{row.label}</div>
                                {row.values.map((v, j) => (
                                    <div key={j} className={`p-6 text-sm font-bold ${j === 1 ? "text-[#E2FF00]" : "text-[#AAAAAA]"}`}>{v}</div>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-32 px-6 md:px-16 bg-[#E2FF00] text-black overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                    style={{ background: 'repeating-linear-gradient(45deg, black 0px, black 1px, transparent 1px, transparent 10px)' }} />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="font-heading text-5xl md:text-7xl tracking-tight mb-20">
                        What they<br />actually say.
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black border border-black">
                        {[
                            { quote: "We replaced SAP with Core in 6 weeks. Our CFO still doesn't believe it was that fast.", name: "Mohammed Al-Farsi", title: "COO, Gulf Dynamics LLC" },
                            { quote: "The AI forecasting alone paid for 3 years of the Pro subscription in the first quarter. The inventory write-off reduction was immediate.", name: "Elena Petrov", title: "VP Operations, EuroTech Solutions" },
                            { quote: "I can finally generate a department P&L without emailing the finance team. That alone is revolutionary.", name: "David Kim", title: "Director, Pacific Rim Imports" },
                        ].map((t, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.12 }}
                                className="bg-[#E2FF00] p-10 hover:bg-white transition-colors group">
                                <div className="flex gap-1 mb-6">
                                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-black text-black" />)}
                                </div>
                                <p className="text-xl font-medium leading-relaxed mb-8">"{t.quote}"</p>
                                <div>
                                    <p className="font-black text-base">{t.name}</p>
                                    <p className="text-sm font-bold opacity-60">{t.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="relative z-10 py-40 px-6 md:px-16 bg-[#030303]">
                <div className="max-w-4xl mx-auto">
                    <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-20">
                        Frequently<br /><span className="italic text-[#E2FF00] font-normal">asked.</span>
                    </motion.h2>

                    <div className="space-y-0 border border-[#1A1A1A]">
                        {FAQS.map((faq, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.07 }}
                                className="border-b border-[#1A1A1A] last:border-0">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-8 text-left hover:bg-[#0A0A0A] transition-colors group">
                                    <span className="text-base font-bold text-[#EAEAEA] group-hover:text-[#E2FF00] transition-colors pr-8">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-[#555555] shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-[#E2FF00]" : ""}`} />
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden">
                                    <p className="px-8 pb-8 text-[#888888] font-medium leading-relaxed">{faq.a}</p>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-60 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#030303] flex flex-col items-center justify-center overflow-hidden group cursor-pointer" onClick={() => window.location.href = '/login'}>
                <div className="absolute inset-0 z-0">
                    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(226,255,0,1) 0%, transparent 60%)' }} />
                </div>
                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="relative z-10 font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
                    14-day free trial · No credit card required
                </motion.p>
                <motion.h2 initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                    className="relative z-10 font-heading text-6xl md:text-[10rem] font-black tracking-tighter text-white uppercase leading-none text-center">
                    Start free<br />today.
                </motion.h2>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                    className="relative z-10 mt-12 flex gap-4">
                    <Link href="/login" className="h-16 px-10 flex items-center gap-3 bg-[#E2FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors group/btn">
                        Initialize System <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/contact" className="h-16 px-10 flex items-center gap-3 border border-[#3A3A3A] text-[#888888] font-black uppercase tracking-widest text-sm hover:border-[#E2FF00] hover:text-[#E2FF00] transition-colors">
                        Talk to Sales
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-[#050505] text-[#EAEAEA] py-20 px-6 md:px-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-12">
                    <Link href="/" className="font-heading text-6xl font-bold tracking-tighter text-white leading-none">CORE.</Link>
                    <div className="flex gap-16 font-bold uppercase tracking-widest text-sm text-[#888888]">
                        <div className="flex flex-col gap-4">
                            <Link href="/about" className="hover:text-[#E2FF00] transition-colors">About</Link>
                            <Link href="/pricing" className="hover:text-[#E2FF00] transition-colors">Pricing</Link>
                            <Link href="/guide" className="hover:text-[#E2FF00] transition-colors">Guide</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Link href="/contact" className="hover:text-[#E2FF00] transition-colors">Contact</Link>
                            <Link href="/privacy" className="hover:text-[#E2FF00] transition-colors">Privacy</Link>
                            <Link href="/login" className="hover:text-[#E2FF00] transition-colors">Sign In</Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-[#222222] pt-8 text-[#555555] font-bold uppercase text-xs tracking-widest">
                    <p>© 2026 Foxmen Studio. All rights reserved.</p>
                    <p className="mt-4 md:mt-0">Built for precision.</p>
                </div>
            </footer>
        </div>
    );
}
