"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
    LayoutDashboard, Package, ShoppingCart, Users, ShoppingBag, Factory,
    Target, DollarSign, Building2, Layers, Shield, BarChart3, BrainCircuit,
    CheckCircle2, XCircle, ArrowRight, ChevronDown, Zap, Star, Play,
    Eye, Edit, Trash2, Plus, Settings
} from "lucide-react";

const NAV_LINKS = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Guide", href: "/guide" },
    { label: "Contact", href: "/contact" },
];

/* ─── Animated number ticker ───────────────────────── */
function Ticker({ n, suffix = "" }: { n: number; suffix?: string }) {
    const [val, setVal] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        const dur = 1600;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            setVal(Math.round((1 - Math.pow(1 - p, 3)) * n));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [inView, n]);
    return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Modules ─────────────────────────────────────── */
const MODULES = [
    {
        id: "dashboard",
        icon: LayoutDashboard,
        name: "Dashboard",
        tagline: "Your bird's-eye view of everything happening in the business.",
        color: "text-[#E2FF00]",
        bg: "bg-[#E2FF00]/10",
        border: "border-[#E2FF00]/30",
        what: "The dashboard is the first screen you see when you log in. Think of it like a cockpit — it shows you the health of your entire business in one place. You'll see total revenue, pending orders, stock alerts, and how your team is doing, all without digging through menus.",
        features: [
            "Live revenue and order counts updated in real time",
            "AI Health Score — a single number (0-100) rating your business's financial health",
            "Low stock alerts so you never run out of products unexpectedly",
            "Recent activity feed showing what your team has been doing",
            "Quick-action buttons to jump to the most common tasks",
        ],
        example: "You arrive in the morning, open Core, and immediately see that revenue is up 12% this week, 3 products are running low, and two invoices are overdue. You deal with the urgent things first without hunting for them.",
        accent: "#E2FF00",
    },
    {
        id: "inventory",
        icon: Package,
        name: "Inventory",
        tagline: "Know exactly what you have, where it is, and when to reorder.",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/30",
        what: "Inventory is where you manage every physical product your business handles. You set up products, track how many you have in stock across multiple warehouses, organise them into categories, and manage the suppliers you buy from.",
        features: [
            "Product catalogue with SKU codes, prices, and stock levels",
            "Automatic low-stock alerts when quantity drops below your set minimum",
            "Multiple warehouse support — track stock per location separately",
            "Supplier directory with contact details and product links",
            "AI Demand Forecast — tells you how much of each product you'll need next month based on past sales",
        ],
        example: "You sell 50 units of Product A. Core automatically deducts from stock, sees the remaining quantity is below the reorder level you set, and highlights it red on the dashboard. You click 'Forecast' and the AI tells you to order 120 more units to cover the next 30 days.",
        accent: "#f59e0b",
    },
    {
        id: "sales",
        icon: ShoppingCart,
        name: "Sales & Orders",
        tagline: "From the moment a customer says 'yes' to the moment you get paid.",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/30",
        what: "Sales is where you manage the full journey of a sale. You create sales orders when a customer commits to buying, convert those to invoices, and track payments. It's the financial heartbeat of your business.",
        features: [
            "Create, edit, and track sales orders with line items and taxes",
            "Convert orders to professional PDF invoices with one click",
            "Payment recording — mark invoices as partially or fully paid",
            "Order status tracking: Draft → Confirmed → Shipped → Paid",
            "Customer purchase history so you always know what they've bought",
        ],
        example: "A customer calls wanting to buy 10 units. You open Sales, create an order in 30 seconds, and email them a PDF invoice directly from Core. A week later, when they pay, you mark it as 'Paid' and the revenue appears on your dashboard instantly.",
        accent: "#60a5fa",
    },
    {
        id: "customers",
        icon: Users,
        name: "Customers",
        tagline: "Every client relationship, organized and searchable.",
        color: "text-sky-400",
        bg: "bg-sky-400/10",
        border: "border-sky-400/30",
        what: "The customers module is your client database. Every company or person you've ever sold to lives here, along with their contact details, full order history, and outstanding balances.",
        features: [
            "Complete client directory with contact details and company info",
            "Full purchase history — every order and invoice per customer",
            "Outstanding balance tracking — see who owes you money",
            "Customer notes for context ('only contact on weekday mornings')",
            "Search and filter by name, company, or email instantly",
        ],
        example: "A client calls with a question about a past order. You search their name, instantly see their last 12 orders, find the invoice in question, and answer in seconds — without digging through emails or spreadsheets.",
        accent: "#38bdf8",
    },
    {
        id: "procurement",
        icon: ShoppingBag,
        name: "Procurement",
        tagline: "Manage everything you buy — from first quote to final receipt.",
        color: "text-violet-400",
        bg: "bg-violet-400/10",
        border: "border-violet-400/30",
        what: "Procurement covers the buying side of your business. When you need to purchase goods or services from a supplier, this is where it all happens. You request quotes, approve purchase orders, and record when goods arrive.",
        features: [
            "Purchase Orders (POs) — formal documents sent to suppliers when you want to buy something",
            "Request for Quotation (RFQ) — send out requests asking multiple vendors to quote their prices",
            "Vendor directory with rating scores so you know who performs best",
            "Goods Receipt Notes — confirm and record when stock physically arrives",
            "Approval workflow for high-value purchases",
        ],
        example: "You need to buy 500 units of a component. You create an RFQ in Core, which goes out to 3 vendors. They respond with prices. You pick the best offer, convert it to a Purchase Order, and track it until the delivery arrives.",
        accent: "#a78bfa",
    },
    {
        id: "manufacturing",
        icon: Factory,
        name: "Manufacturing",
        tagline: "Track what you make, not just what you buy.",
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/30",
        what: "Manufacturing is for businesses that build or assemble products. You define what ingredients (components) go into each product using a Bill of Materials, then schedule and track production runs.",
        features: [
            "Bill of Materials (BOM) — the recipe for each product you make",
            "Production Orders — schedule manufacturing runs with start/end dates",
            "Work Centers — track which machines or stations are doing what",
            "Real-time progress bars showing how far through production you are",
            "Quality Control — log inspection results and pass/fail outcomes",
        ],
        example: "Your factory makes battery packs. The BOM says each pack needs 40 cells, 1 circuit board, and 1 casing. When you create a Production Order for 100 packs, Core knows you'll need 4,000 cells — and can alert you if you don't have enough in stock.",
        accent: "#fb923c",
    },
    {
        id: "crm",
        icon: Target,
        name: "CRM",
        tagline: "Turn strangers into customers, systematically.",
        color: "text-pink-400",
        bg: "bg-pink-400/10",
        border: "border-pink-400/30",
        what: "CRM (Customer Relationship Management) is about finding new customers and nurturing them until they're ready to buy. It's separate from Customers — Customers tracks people who have already bought; CRM tracks people you're trying to sell to.",
        features: [
            "Leads — anyone who might become a customer one day",
            "Opportunities — leads you're actively working on, with a deal value attached",
            "Pipeline — a visual board showing every deal at each stage (Proposal → Negotiation → Won)",
            "Activities — log calls, emails, and meetings so nothing falls through the cracks",
            "Win rate tracking so you know how good your team is at closing deals",
        ],
        example: "You meet someone at a trade show. You create a Lead in Core with their details. Over the next few weeks you log calls and emails as Activities. When they're ready to buy, you convert them to an Opportunity, move them through the pipeline, and eventually mark it Won — at which point they become a Customer.",
        accent: "#f472b6",
    },
    {
        id: "finance",
        icon: DollarSign,
        name: "Finance & Accounts",
        tagline: "The complete financial picture — income, expenses, and everything in between.",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/30",
        what: "Finance is your accounting module. It tracks all money coming in and going out of the business, lets you set budgets, and keeps a Chart of Accounts — the organized list of all financial categories your business uses.",
        features: [
            "Chart of Accounts — organized categories for all income, expenses, assets, and liabilities",
            "Transaction ledger — every financial movement recorded and searchable",
            "Budget management — set targets per department or category and track progress",
            "Expense tracking — log business expenses with receipts and approvals",
            "Accounts Receivable and Payable summaries",
        ],
        example: "At the end of the month you go to Finance, set a 'Marketing' budget of $5,000 for Q2, and log each marketing spend against it. When the team submits a $2,000 campaign expense, you approve it from Finance and it automatically reduces the available budget.",
        accent: "#34d399",
    },
    {
        id: "hr",
        icon: Building2,
        name: "HR & People",
        tagline: "Every person in your organization, properly managed.",
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        border: "border-indigo-400/30",
        what: "HR is where you manage your team. Every employee has a profile here with their job title, department, salary, and work history. You also manage leave requests — employees apply, managers approve, and everything is tracked in one place.",
        features: [
            "Employee profiles with personal details, department, and role",
            "Department structure — organize employees into logical teams",
            "Leave requests — employees submit, managers approve or reject",
            "Leave balance tracking — see how many days each person has left",
            "Organization headcount dashboard",
        ],
        example: "An employee wants 5 days off next week. They log into Core and submit a leave request. You get notified, check that no other team members are off that week, and approve it with one click. The employee's leave balance automatically decreases by 5 days.",
        accent: "#818cf8",
    },
    {
        id: "assets",
        icon: Layers,
        name: "Asset Management",
        tagline: "Track expensive equipment from purchase to disposal.",
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        border: "border-cyan-400/30",
        what: "Assets are things your business owns that have significant value and last for years — vehicles, machinery, computers, furniture. Core helps you track what you own, how much it's worth now (after depreciation), and when it needs maintenance.",
        features: [
            "Fixed Asset Register — the official list of everything your business owns",
            "Depreciation schedules — Core automatically calculates how value decreases over time",
            "Maintenance records — log and schedule service work for each asset",
            "Disposal tracking — record when you sell or scrap an asset and any gain or loss",
            "Book value reporting for accounting and insurance purposes",
        ],
        example: "Your company buys a CNC machine for $120,000. You register it in Assets with a 10-year useful life. Core automatically calculates $12,000/year in depreciation and shows the current book value as the machine ages. When the machine breaks down, you log a maintenance record and track the repair cost.",
        accent: "#22d3ee",
    },
    {
        id: "audit",
        icon: Shield,
        name: "Audit Trail",
        tagline: "An unchangeable record of everything that ever happened.",
        color: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/30",
        what: "The Audit Trail is a read-only log of every single action taken in the system. If anyone creates, edits, or deletes anything — or even just logs in — it's recorded here permanently. This is essential for compliance, catching errors, and preventing fraud.",
        features: [
            "Every create, edit, and delete logged with timestamp and user name",
            "Field-level change tracking — see exactly what changed (e.g. price from $100 to $90)",
            "Login and logout events with IP addresses",
            "Severity levels — Info, Warning, Critical",
            "Filter by user, action type, or date range",
        ],
        example: "An invoice amount was changed and you don't know why. You open Audit Trail, filter by that invoice number, and see that at 11:42pm a specific user changed the amount from $5,000 to $4,200. You have the full context to investigate further.",
        accent: "#f87171",
    },
    {
        id: "analytics",
        icon: BarChart3,
        name: "Analytics",
        tagline: "Turn your data into decisions you can act on today.",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/30",
        what: "Analytics is the intelligence layer. Instead of raw tables of data, you get visual charts, rankings, and trend lines that make it obvious what's working and what isn't. The AI Insights tab takes it further by automatically surfacing recommendations you didn't know to look for.",
        features: [
            "Revenue trend charts across 12 months",
            "Top products ranked by revenue and units sold",
            "Sales rep performance league table",
            "Inventory turnover by product category",
            "HR headcount and workforce analytics",
            "AI Insights — automatically generated recommendations for pricing, procurement, and production",
        ],
        example: "You open Analytics → AI Insights and see: 'Smart Inverter 5kW has a 94% sell-through rate. AI recommends testing a 12% price increase.' You didn't know to look for this — the AI found it by analyzing demand patterns across thousands of transactions.",
        accent: "#c084fc",
    },
    {
        id: "reports",
        icon: BarChart3,
        name: "Reports",
        tagline: "Generate any report, export it as PDF or Excel, in seconds.",
        color: "text-teal-400",
        bg: "bg-teal-400/10",
        border: "border-teal-400/30",
        what: "The Reports module lets you generate structured business reports on demand. Choose the data you need, apply date filters, and export as a formatted PDF or Excel spreadsheet. You can also schedule reports to auto-generate and email to stakeholders.",
        features: [
            "Report builder with field selection and date filters",
            "Export to PDF (print-ready) or Excel (for further analysis)",
            "Scheduled reports — set it once and receive it weekly or monthly by email",
            "Pre-built templates for common reports (Sales Summary, Stock Report, etc.)",
            "Role-based access — only finance staff can generate financial reports",
        ],
        example: "Every Monday, your investor wants a sales summary. Instead of manually compiling it, you set up a scheduled report in Core. Every Monday at 8am the report auto-generates and lands in their inbox — formatted, accurate, and requiring zero effort from you.",
        accent: "#2dd4bf",
    },
];

/* ─── Roles ───────────────────────────────────────── */
const ROLES = [
    {
        name: "Admin",
        color: "text-[#E2FF00]",
        bg: "bg-[#E2FF00]/10",
        dot: "bg-[#E2FF00]",
        summary: "The person in charge. Admins can see and do everything in the system — all modules, all settings, all users.",
        canDo: [
            "Access every single module in the system",
            "Create, edit, and delete any record",
            "Add new users and assign their roles",
            "Change company settings (logo, currency, tax rates)",
            "View the Audit Trail",
            "Generate any report",
            "Approve any workflow (expenses, leave, orders)",
        ],
        cannotDo: ["Nothing — full access to everything"],
        badge: "God Mode",
    },
    {
        name: "Manager",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        dot: "bg-blue-400",
        summary: "Department heads and senior operations staff. Managers can approve things and see everything except system administration.",
        canDo: [
            "View all operational modules (Inventory, Sales, HR, Finance)",
            "Approve expense claims and leave requests",
            "View and generate reports",
            "Access Analytics and Audit Trail",
            "Create and edit records in all operational areas",
        ],
        cannotDo: [
            "Cannot change system settings",
            "Cannot add or remove users",
            "Cannot change role assignments",
        ],
        badge: "Senior Access",
    },
    {
        name: "Finance",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        dot: "bg-emerald-400",
        summary: "Accountants and finance team members. They have deep access to all money-related modules but stay out of HR and operations.",
        canDo: [
            "Full access to Finance & Accounts (ledger, budgets, expenses)",
            "View and create invoices and payments in Sales",
            "Generate and schedule financial reports",
            "View Asset Management and depreciation records",
            "View the Audit Trail",
        ],
        cannotDo: [
            "Cannot access HR or employee records",
            "Cannot manage inventory or production",
            "Cannot change system settings or users",
        ],
        badge: "Finance Access",
    },
    {
        name: "Sales",
        color: "text-sky-400",
        bg: "bg-sky-400/10",
        dot: "bg-sky-400",
        summary: "Sales reps and account managers. They live in Sales, Customers, and CRM — the modules where revenue is generated.",
        canDo: [
            "Create and manage sales orders and invoices",
            "View and update customer records",
            "Full access to CRM (leads, opportunities, activities)",
            "View inventory stock levels (read-only)",
            "View their own sales performance in Analytics",
        ],
        cannotDo: [
            "Cannot access Finance or HR modules",
            "Cannot view other staff's salary or personal info",
            "Cannot approve expenses or leave requests",
            "Cannot access Audit Trail",
        ],
        badge: "Sales Access",
    },
    {
        name: "HR Manager",
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        dot: "bg-indigo-400",
        summary: "HR professionals responsible for managing people. Full access to HR but restricted from financial and operational systems.",
        canDo: [
            "Create and edit employee profiles",
            "Manage departments and organization structure",
            "Approve and reject leave requests",
            "View workforce analytics and headcount reports",
            "Generate HR-specific reports",
        ],
        cannotDo: [
            "Cannot view invoices, budgets, or financial transactions",
            "Cannot access Inventory, Procurement, or Manufacturing",
            "Cannot access CRM or Sales orders",
            "Cannot access the Audit Trail",
        ],
        badge: "HR Access",
    },
    {
        name: "Auditor",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        dot: "bg-amber-400",
        summary: "Internal or external auditors who need to review records without being able to change anything. Read-only with deep access.",
        canDo: [
            "View all transactions and financial records (read-only)",
            "Full access to the Audit Trail — every event in history",
            "View inventory, sales orders, and customer records",
            "Generate and download any report",
            "View Analytics dashboards",
        ],
        cannotDo: [
            "Cannot create, edit, or delete any record",
            "Cannot approve workflows",
            "Cannot access HR module",
            "Cannot change any system setting",
        ],
        badge: "Read-Only",
    },
    {
        name: "Staff",
        color: "text-slate-400",
        bg: "bg-slate-400/10",
        dot: "bg-slate-400",
        summary: "General operational staff — warehouse workers, purchasing clerks, general operations. Enough access to do their daily job, nothing more.",
        canDo: [
            "View and update inventory records",
            "View and create basic sales records",
            "Access Procurement (purchase orders and receipts)",
            "View their own employee profile and submit leave requests",
            "View the Dashboard",
        ],
        cannotDo: [
            "Cannot access Finance or budgets",
            "Cannot access CRM, Analytics, or Reports",
            "Cannot view other employees' salary or personal info",
            "Cannot access the Audit Trail or Settings",
            "Cannot approve anything",
        ],
        badge: "Limited Access",
    },
];

/* ─── Permission matrix ────────────────────────────── */
const MATRIX_MODULES = ["Dashboard", "Inventory", "Sales", "Customers", "Procurement", "Manufacturing", "CRM", "Finance", "Assets", "HR", "Audit", "Analytics", "Reports", "Settings"];
const MATRIX_ROLES = ["Admin", "Manager", "Finance", "Sales", "HR Manager", "Auditor", "Staff"];
const MATRIX: Record<string, string[]> = {
    "Dashboard":      ["Admin", "Manager", "Finance", "Sales", "HR Manager", "Auditor", "Staff"],
    "Inventory":      ["Admin", "Manager", "Sales", "Auditor", "Staff"],
    "Sales":          ["Admin", "Manager", "Finance", "Sales", "Auditor", "Staff"],
    "Customers":      ["Admin", "Manager", "Sales", "Auditor", "Staff"],
    "Procurement":    ["Admin", "Manager", "Staff"],
    "Manufacturing":  ["Admin", "Manager", "Staff"],
    "CRM":            ["Admin", "Manager", "Sales"],
    "Finance":        ["Admin", "Manager", "Finance", "Auditor"],
    "Assets":         ["Admin", "Manager", "Finance", "Auditor"],
    "HR":             ["Admin", "Manager", "HR Manager"],
    "Audit":          ["Admin", "Auditor"],
    "Analytics":      ["Admin", "Manager", "Finance", "Sales", "Auditor"],
    "Reports":        ["Admin", "Manager", "Finance", "Auditor"],
    "Settings":       ["Admin"],
};

const ROLE_DOT: Record<string, string> = {
    "Admin": "bg-[#E2FF00]", "Manager": "bg-blue-400", "Finance": "bg-emerald-400",
    "Sales": "bg-sky-400", "HR Manager": "bg-indigo-400", "Auditor": "bg-amber-400", "Staff": "bg-slate-400"
};

export default function GuidePage() {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
            {/* Background grid */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* Animated orb */}
            <motion.div className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full z-0 pointer-events-none"
                animate={{ scale: [1, 1.08, 1], opacity: [0.05, 0.09, 0.05] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: 'radial-gradient(circle, rgba(226,255,0,1) 0%, transparent 70%)', filter: 'blur(100px)' }} />

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

            {/* ── Hero ────────────────────────────────────── */}
            <section ref={heroRef} className="relative z-10 pt-24 pb-40 px-6 md:px-16 overflow-hidden border-b border-[#1A1A1A]">
                <motion.div style={{ y, opacity }}>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8 inline-block">
                        — Platform Guide —
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-heading text-6xl md:text-[11rem] leading-[0.82] text-white tracking-tighter mb-10">
                        What can<br />
                        <span className="italic text-[#E2FF00] font-normal">Core do?</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                        className="max-w-2xl text-[#888888] text-xl font-medium leading-relaxed mb-12">
                        No jargon. No MBA required. This guide explains every module in plain English — and tells you exactly who in your team can use what.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap gap-4">
                        <a href="#modules" className="h-14 px-8 flex items-center gap-3 bg-[#E2FF00] text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors group">
                            Explore Modules <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="#roles" className="h-14 px-8 flex items-center gap-3 border border-[#3A3A3A] text-[#888888] font-black uppercase tracking-widest text-sm hover:border-[#E2FF00] hover:text-[#E2FF00] transition-colors">
                            View Role Permissions
                        </a>
                    </motion.div>
                </motion.div>

                {/* Floating stats */}
                <div className="absolute bottom-12 right-16 hidden xl:flex gap-12">
                    {[
                        { n: 13, suffix: "", label: "Modules" },
                        { n: 7, suffix: "", label: "User Roles" },
                        { n: 100, suffix: "+", label: "Features" },
                    ].map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                            className="text-right">
                            <p className="font-heading text-5xl text-white tracking-tighter"><Ticker n={s.n} suffix={s.suffix} /></p>
                            <p className="text-[#555555] font-bold uppercase tracking-widest text-xs">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Quick nav pills ─────────────────────────── */}
            <section className="relative z-10 py-8 px-6 md:px-16 bg-[#0A0A0A] border-b border-[#1A1A1A] sticky top-0">
                <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    <a href="#modules" className="shrink-0 px-4 py-2 bg-[#E2FF00] text-black text-xs font-black uppercase tracking-widest">Modules</a>
                    <a href="#roles" className="shrink-0 px-4 py-2 border border-[#3A3A3A] text-[#888888] text-xs font-black uppercase tracking-widest hover:border-[#E2FF00] hover:text-[#E2FF00] transition-colors">Roles</a>
                    <a href="#matrix" className="shrink-0 px-4 py-2 border border-[#3A3A3A] text-[#888888] text-xs font-black uppercase tracking-widest hover:border-[#E2FF00] hover:text-[#E2FF00] transition-colors">Permission Matrix</a>
                    {MODULES.slice(0, 6).map(m => (
                        <a key={m.id} href={`#${m.id}`} className="shrink-0 px-4 py-2 border border-[#1A1A1A] text-[#555555] text-xs font-bold uppercase tracking-widest hover:text-[#E2FF00] hover:border-[#E2FF00]/30 transition-colors">
                            {m.name}
                        </a>
                    ))}
                </div>
            </section>

            {/* ── Modules section ─────────────────────────── */}
            <section id="modules" className="relative z-10 py-40 px-6 md:px-16">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="mb-24">
                        <p className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-6">Every module, explained simply</p>
                        <h2 className="font-heading text-5xl md:text-8xl text-white tracking-tight">
                            The<br /><span className="italic text-[#E2FF00] font-normal">Modules.</span>
                        </h2>
                    </motion.div>

                    {/* Module grid overview */}
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1A1A1A] border border-[#1A1A1A] mb-32">
                        {MODULES.map((m, i) => (
                            <motion.a key={m.id} href={`#${m.id}`}
                                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                className="bg-[#050505] p-6 hover:bg-[#0F0F0F] transition-all group cursor-pointer flex flex-col gap-3">
                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${m.bg} group-hover:scale-110 transition-transform`}>
                                    <m.icon className={`w-5 h-5 ${m.color}`} />
                                </div>
                                <p className="font-black text-sm text-[#EAEAEA] uppercase tracking-wide group-hover:text-white transition-colors">{m.name}</p>
                                <p className="text-[#555555] text-xs font-medium leading-relaxed group-hover:text-[#888888] transition-colors">{m.tagline}</p>
                            </motion.a>
                        ))}
                    </motion.div>

                    {/* Individual module deep dives */}
                    <div className="space-y-40">
                        {MODULES.map((m, idx) => (
                            <motion.div key={m.id} id={m.id}
                                initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

                                {/* Header */}
                                <div className={`border-l-4 pl-8 mb-12`} style={{ borderColor: m.accent }}>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-12 h-12 flex items-center justify-center ${m.bg}`}>
                                            <m.icon className={`w-6 h-6 ${m.color}`} />
                                        </div>
                                        <span className="font-mono text-xs text-[#555555] uppercase tracking-widest">{String(idx + 1).padStart(2, '0')} / {String(MODULES.length).padStart(2, '0')}</span>
                                    </div>
                                    <h3 className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-2">{m.name}</h3>
                                    <p className={`text-lg font-bold ${m.color}`}>{m.tagline}</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                                    {/* Left: explanation */}
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-xs font-black text-[#555555] uppercase tracking-widest mb-4">What is it?</p>
                                            <p className="text-[#AAAAAA] text-lg font-medium leading-relaxed">{m.what}</p>
                                        </div>

                                        {/* Example */}
                                        <div className={`border ${m.border} ${m.bg} p-6`}>
                                            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: m.accent }}>
                                                Real-world example
                                            </p>
                                            <p className="text-[#CCCCCC] font-medium leading-relaxed text-sm">{m.example}</p>
                                        </div>
                                    </div>

                                    {/* Right: features */}
                                    <div>
                                        <p className="text-xs font-black text-[#555555] uppercase tracking-widest mb-6">Key features</p>
                                        <div className="space-y-3">
                                            {m.features.map((f, fi) => (
                                                <motion.div key={fi}
                                                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                                    transition={{ duration: 0.4, delay: fi * 0.06 }}
                                                    className="flex items-start gap-4 p-4 border border-[#1A1A1A] bg-[#050505] hover:bg-[#0A0A0A] hover:border-[#2A2A2A] transition-all group">
                                                    <div className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.accent }} />
                                                    </div>
                                                    <p className="text-[#888888] font-medium text-sm leading-relaxed group-hover:text-[#CCCCCC] transition-colors">{f}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                {idx < MODULES.length - 1 && (
                                    <div className="mt-20 h-px bg-gradient-to-r from-transparent via-[#2A2A2A] to-transparent" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Roles section ───────────────────────────── */}
            <section id="roles" className="relative z-10 py-40 px-6 md:px-16 bg-[#080808] border-y border-[#1A1A1A]">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="mb-24">
                        <p className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-6">Who can do what</p>
                        <h2 className="font-heading text-5xl md:text-8xl text-white tracking-tight">
                            The<br /><span className="italic text-[#E2FF00] font-normal">Roles.</span>
                        </h2>
                        <p className="text-[#666666] text-xl font-medium mt-6 max-w-xl">
                            Every user in Core has exactly one role. That role determines which modules they can see, and what they can do inside them.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {ROLES.map((role, i) => (
                            <motion.div key={role.name}
                                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-[#050505] p-8 hover:bg-[#0A0A0A] transition-colors group">

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${role.dot} group-hover:scale-125 transition-transform`} />
                                        <p className={`font-heading text-3xl tracking-tight ${role.color}`}>{role.name}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border ${role.bg} ${role.color} border-current/20`}>
                                        {role.badge}
                                    </span>
                                </div>

                                <p className="text-[#888888] font-medium text-sm leading-relaxed mb-8">{role.summary}</p>

                                <div className="space-y-2 mb-6">
                                    <p className="text-[10px] font-black text-[#555555] uppercase tracking-widest mb-3">Can do</p>
                                    {role.canDo.map((item, ci) => (
                                        <motion.div key={ci}
                                            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                            transition={{ duration: 0.3, delay: ci * 0.04 }}
                                            className="flex items-start gap-2">
                                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${role.color}`} />
                                            <span className="text-xs text-[#777777] font-medium leading-relaxed">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="space-y-2 pt-6 border-t border-[#1A1A1A]">
                                    <p className="text-[10px] font-black text-[#555555] uppercase tracking-widest mb-3">Cannot do</p>
                                    {role.cannotDo.map((item, ci) => (
                                        <div key={ci} className="flex items-start gap-2">
                                            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#333333]" />
                                            <span className="text-xs text-[#444444] font-medium leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Permission Matrix ───────────────────────── */}
            <section id="matrix" className="relative z-10 py-40 px-6 md:px-16">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="mb-16">
                        <p className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-6">At a glance</p>
                        <h2 className="font-heading text-5xl md:text-7xl text-white tracking-tight">
                            Permission<br /><span className="italic text-[#E2FF00] font-normal">Matrix.</span>
                        </h2>
                        <p className="text-[#666666] text-lg font-medium mt-4 max-w-xl">
                            Green dot = can access. Empty = no access. Every column is a role, every row is a module.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="overflow-x-auto border border-[#2A2A2A]">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                                    <th className="py-5 px-6 text-left text-xs font-black text-[#555555] uppercase tracking-widest w-40">Module</th>
                                    {MATRIX_ROLES.map(r => (
                                        <th key={r} className="py-5 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${ROLE_DOT[r]}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#888888]">{r}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MATRIX_MODULES.map((mod, mi) => (
                                    <motion.tr key={mod}
                                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: mi * 0.04 }}
                                        className="border-b border-[#1A1A1A] last:border-0 hover:bg-[#0A0A0A] transition-colors group">
                                        <td className="py-4 px-6 text-sm font-bold text-[#AAAAAA] group-hover:text-white transition-colors">{mod}</td>
                                        {MATRIX_ROLES.map(role => {
                                            const hasAccess = MATRIX[mod]?.includes(role);
                                            return (
                                                <td key={role} className="py-4 px-4 text-center">
                                                    {hasAccess ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                            className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center ${ROLE_DOT[role]} shadow-lg`}>
                                                            <div className="w-2 h-2 rounded-full bg-black/40" />
                                                        </motion.div>
                                                    ) : (
                                                        <div className="w-5 h-5 mx-auto rounded-full border border-[#222222]" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>

                    {/* Legend */}
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                        className="mt-8 flex flex-wrap gap-4">
                        {MATRIX_ROLES.map(r => (
                            <div key={r} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${ROLE_DOT[r]}`} />
                                <span className="text-xs font-bold text-[#555555] uppercase tracking-widest">{r}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Getting started ─────────────────────────── */}
            <section className="relative z-10 py-32 px-6 md:px-16 bg-[#0A0A0A] border-y border-[#1A1A1A]">
                <div className="max-w-7xl mx-auto">
                    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-20">
                        Getting<br /><span className="italic text-[#E2FF00] font-normal">Started.</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
                        {[
                            { step: "01", title: "Create your company", desc: "Sign up and set up your company profile — name, currency, tax number, and logo. Takes 2 minutes." },
                            { step: "02", title: "Add your team", desc: "Invite your colleagues and assign each one a role. They'll receive an email with login instructions." },
                            { step: "03", title: "Load your products", desc: "Import your product catalogue via Excel or add products manually. Set stock levels and reorder points." },
                            { step: "04", title: "Start operating", desc: "Create your first sales order, send an invoice, or run a demand forecast. The system is live immediately." },
                        ].map((s, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="bg-[#050505] p-10 hover:bg-[#0A0A0A] transition-colors group">
                                <p className="font-heading text-6xl text-[#E2FF00]/20 group-hover:text-[#E2FF00]/40 transition-colors tracking-tighter mb-6">{s.step}</p>
                                <p className="font-black text-white text-base mb-3 uppercase tracking-wide">{s.title}</p>
                                <p className="text-[#666666] font-medium leading-relaxed text-sm">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────── */}
            <section className="relative z-10 py-60 px-6 md:px-16 bg-[#E2FF00] flex flex-col items-center justify-center overflow-hidden group cursor-pointer" onClick={() => window.location.href = '/login'}>
                <div className="absolute inset-0 z-0 opacity-10 scale-150 rotate-45 group-hover:rotate-90 transition-transform duration-[3s]"
                    style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, black 40px, black 80px)' }} />
                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="relative z-10 font-mono text-xs tracking-[0.4em] text-black/50 uppercase mb-8">
                    Ready to start?
                </motion.p>
                <motion.h2 initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                    className="relative z-10 font-heading text-6xl md:text-[9rem] font-black tracking-tighter text-black uppercase leading-none text-center">
                    Try it free<br />for 14 days.
                </motion.h2>
                <div className="relative z-10 mt-12 flex gap-4">
                    <Link href="/login" onClick={e => e.stopPropagation()}
                        className="h-16 px-10 flex items-center gap-3 bg-black text-[#E2FF00] font-black uppercase tracking-widest text-sm hover:bg-[#111111] transition-colors group/btn">
                        Initialize System <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/pricing" onClick={e => e.stopPropagation()}
                        className="h-16 px-10 flex items-center gap-3 border-2 border-black text-black font-black uppercase tracking-widest text-sm hover:bg-black hover:text-[#E2FF00] transition-colors">
                        View Pricing
                    </Link>
                </div>
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
