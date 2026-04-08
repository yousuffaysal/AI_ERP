"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Terminal, AlertTriangle, BookOpen, Activity, PlayCircle, Key } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans scroll-smooth">
      
      {/* Background Grids */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, 
             backgroundSize: '20px 20px' 
           }}>
      </div>

      <nav className="sticky top-0 z-50 w-full py-4 px-6 md:px-12 border-b border-[#1A1A1A] bg-[#030303]/80 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-[#888888] hover:text-[#E2FF00] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="font-heading text-xl tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E2FF00]" />
            CORE.TUTORIALS
          </div>
        </div>
        <Link href="/login" className="px-5 py-2 border border-[#E2FF00] text-[#E2FF00] text-xs font-bold uppercase tracking-widest hover:bg-[#E2FF00] hover:text-black transition-colors">
          Initialize System
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row relative z-10">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="w-full md:w-64 border-r border-[#1A1A1A] p-6 md:p-12 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto">
          <div className="flex flex-col gap-8">
            <div>
              <h4 className="font-mono text-xs text-[#555555] uppercase tracking-widest mb-4">Phase 1: Setup</h4>
              <ul className="flex flex-col gap-3 font-medium text-sm">
                <li><a href="#authentication" className="text-[#EAEAEA] hover:text-[#E2FF00] transition-colors">1.1 Authentication</a></li>
                <li><a href="#company-sync" className="text-[#888888] hover:text-[#E2FF00] transition-colors">1.2 Company Sync</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs text-[#555555] uppercase tracking-widest mb-4">Phase 2: Execution</h4>
              <ul className="flex flex-col gap-3 font-medium text-sm">
                <li><a href="#reading-health" className="text-[#888888] hover:text-[#E2FF00] transition-colors">2.1 Reading AI Health</a></li>
                <li><a href="#demand-forecast" className="text-[#888888] hover:text-[#E2FF00] transition-colors">2.2 Demand Forecasting</a></li>
                <li><a href="#price-engine" className="text-[#888888] hover:text-[#E2FF00] transition-colors">2.3 Price Optimization</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs text-[#555555] uppercase tracking-widest mb-4">Troubleshooting</h4>
              <ul className="flex flex-col gap-3 font-medium text-sm">
                <li><a href="#anomalies" className="text-[#888888] hover:text-[#E2FF00] transition-colors">Resolving 403 Errors</a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content Body */}
        <main className="flex-1 p-6 md:p-16 lg:p-24 pb-40">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-heading text-6xl md:text-8xl leading-none text-white tracking-tight mb-8">
              System <br/> Tutorials.
            </h1>
            <p className="text-[#888888] text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mb-16">
              A comprehensive step-by-step guide to operating the Core ERP platform. 
              Learn how to initialize your workspace, execute neural predictions, and interpret the algorithmic health scores.
            </p>
          </motion.div>

          {/* Tutorial Phase 1: Authentication */}
          <div className="mb-24" id="authentication">
            <div className="flex items-center gap-4 mb-8">
              <Key className="w-8 h-8 text-[#E2FF00]" />
              <h2 className="font-heading text-4xl text-white tracking-tight">Step 1.1: Authentication</h2>
            </div>
            <div className="prose prose-invert prose-lg max-w-none text-[#AAAAAA]">
              <p>
                Accessing the ERP requires a strictly validated JSON Web Token (JWT). The system utilizes an access-refresh token lifecycle. Upon your first session, you must establish node access via the central `Access Terminal`.
              </p>
              
              <div className="my-8 bg-[#050505] border border-[#222222] rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222222] bg-[#0A0A0A]">
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <span className="ml-4 font-mono text-xs text-[#666666] uppercase">Action: Authenticate</span>
                </div>
                <div className="p-6">
                  <ol className="list-decimal pl-6 space-y-4">
                    <li>Navigate to the <strong><Link href="/login" className="text-[#E2FF00] no-underline hover:underline">Sign In</Link></strong> route.</li>
                    <li>Input your administrator email (e.g., <code>yousuf.h.faysal@foxmenstudio.com</code>).</li>
                    <li>Input the initialization passphrase (e.g., <code>Faisal1234</code>).</li>
                    <li>Upon successful handshake, the system will inject the cryptographic JWT into your LocalStorage layer and redirect you to the Executive Dashboard.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial Phase 1.2: Company Sync */}
          <div className="mb-24" id="company-sync">
            <div className="flex items-center gap-4 mb-8">
              <Activity className="w-8 h-8 text-[#E2FF00]" />
              <h2 className="font-heading text-4xl text-white tracking-tight">Step 1.2: Corporate Synchronization</h2>
            </div>
            <div className="prose prose-invert prose-lg max-w-none text-[#AAAAAA]">
              <p>
                Because CORE enforces row-level multi-tenancy hardware isolation, logging in without an assigned company limits system access entirely. 
              </p>
              
              <div className="my-8 p-6 bg-rose-950/20 border-l-4 border-rose-500">
                <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" /> Critical Authorization Step
                </h4>
                <p className="text-sm font-medium leading-relaxed text-rose-200/80 mb-0">
                  If the Dashboard displays "Failed to load AI Health Metrics" or the Inventory page shows a "Request failed with status code 403", your cached JWT lacks a `company_id`. 
                  <strong>Resolution: Simply log out and log back in to pull down your synchronized company identity.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2: Reading Health */}
          <div className="mb-24 border-t border-[#1A1A1A] pt-24" id="reading-health">
            <div className="flex items-center gap-4 mb-8">
              <PlayCircle className="w-8 h-8 text-[#E2FF00]" />
              <h2 className="font-heading text-4xl text-white tracking-tight">Step 2.1: Interpreting AI Health</h2>
            </div>
            <div className="space-y-6 text-lg text-[#AAAAAA] leading-relaxed">
              <p>
                The Executive Dashboard immediately queries back-end Python microservices to calculate a dynamic `0` to `100` health score. This is not a static average. It is computed actively against historical data.
              </p>
              
              <div className="my-8 bg-[#050505] border border-[#222222] p-8">
                <h4 className="text-white font-mono text-sm tracking-widest uppercase mb-6 border-b border-[#222222] pb-4">Mock API Trajectory</h4>
                <pre className="font-mono text-sm text-[#888888] overflow-x-auto">
{`GET /api/v1/accounts/companies/{id}/health/
Response:
{
  "score": 87.4,
  "status": "Green",
  "explanation": "Revenue velocity is outpacing operational friction.",
  "metrics": {
    "revenue_growth_pct": 12.5,
    "operating_cash_ratio": 1.2,
    "inventory_turnover_rate": 4.2
  }
}`}
                </pre>
              </div>
              <p>The top-level card shifts color dynamically: <strong>Green</strong> (High stability), <strong>Yellow</strong> (Minor efficiency loss), or <strong>Red</strong> (Critical capital/stockout risk).</p>
            </div>
          </div>

          {/* Phase 2.2: Demand Forecasting */}
          <div className="mb-24" id="demand-forecast">
            <div className="flex items-center gap-4 mb-8">
              <Terminal className="w-8 h-8 text-[#E2FF00]" />
              <h2 className="font-heading text-4xl text-white tracking-tight">Step 2.2: Generating Forecasts</h2>
            </div>
            <div className="prose prose-invert prose-lg max-w-none text-[#AAAAAA]">
              <p>
                Navigate to <strong>Inventory & AI</strong> via the left-hand navigation sidebar.
              </p>
              <ol className="list-decimal pl-6 space-y-4 my-8">
                <li>Locate the <strong>XGBoost Prophecy</strong> panel in the upper right.</li>
                <li>Wait for the loading indicator; the system is actively polling the FastAPI AI microservice (`port 8001`).</li>
                <li>Review the line-chart rendering. The Y-Axis represents predicted demand volume, while the X-Axis spans the upcoming 30 day window.</li>
                <li>Use this predictive curve to trigger wholesale supplier orders <em>before</em> your current kinetic stock dips below the reorder threshold.</li>
              </ol>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-12 border-t border-[#1A1A1A] pt-24" id="anomalies">
             <div className="flex items-center gap-4 mb-8">
              <AlertTriangle className="w-8 h-8 text-[#E2FF00]" />
              <h2 className="font-heading text-4xl text-white tracking-tight">Troubleshooting: The 403 Forbidden</h2>
            </div>
            <div className="prose prose-invert prose-lg max-w-none text-[#AAAAAA]">
              <p>
                Core ERP enforces absolute cryptographic isolation between companies. If you encounter a `403 Forbidden` wall when clicking 'Sales' or 'Inventory', your session lacks context.
              </p>
              <div className="my-8 bg-[#E2FF00]/10 border-l-4 border-[#E2FF00] p-6 text-white text-sm font-mono leading-relaxed">
                # Solution Checklist<br/><br/>
                [ ] Did the admin assign your User object a Company Foreign Key?<br/>
                [ ] Did you generate a new JWT token AFTER the company assignment?<br/>
                [ ] If not, click "LOGOUT" in the top right user dropdown and authenticate again.
              </div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}
