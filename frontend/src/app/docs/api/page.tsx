"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Terminal, 
  Code2, 
  Copy, 
  ChevronRight, 
  Globe, 
  Cpu, 
  Zap,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/auth/status",
    desc: "Check current authentication handshake status.",
    response: "{\"status\": \"active\", \"node\": \"DXB-04\"}"
  },
  {
    method: "POST",
    path: "/api/v1/intelligence/forecast",
    desc: "Generate a 30-day demand forecast for a specific SKU.",
    response: "{\"prediction\": [120.5, 122.1, 125.4, 118.9], \"confidence\": 0.94}"
  },
  {
    method: "GET",
    path: "/api/v1/accounts/me",
    desc: "Retrieve synchronized company and user profile.",
    response: "{\"user\": \"Yusuf\", \"company_id\": \"FOX-001\"}"
  },
  {
    method: "PATCH",
    path: "/api/v1/inventory/{id}",
    desc: "Update kinetic stock levels for an asset.",
    response: "{\"success\": true, \"updated_at\": \"2026-05-05T07:34:00Z\"}"
  }
];

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(`https://api.coreerp.io${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      {/* Sidebar Nav */}
      <aside className="fixed left-0 top-0 bottom-0 w-80 bg-[#050505] border-r border-[#1A1A1A] z-50 hidden lg:block overflow-y-auto">
        <div className="p-8 border-b border-[#1A1A1A]">
           <Link href="/" className="font-heading text-3xl tracking-tight text-white">
              CORE<span className="text-[#E2FF00] italic">.</span>API
           </Link>
           <p className="text-[10px] font-black text-[#444444] uppercase tracking-widest mt-2">v2.0.4 Stable</p>
        </div>
        <nav className="p-8 space-y-12">
           <div>
              <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.4em] mb-6">Introduction</h4>
              <ul className="space-y-4">
                 <li><Link href="/docs" className="text-sm font-bold text-[#EAEAEA] hover:text-[#E2FF00] transition-colors flex items-center gap-2"><ArrowLeft className="w-3 h-3" /> Tutorials</Link></li>
                 <li className="text-sm font-bold text-[#E2FF00]">API Reference</li>
                 <li className="text-sm font-bold text-[#444444] cursor-not-allowed">Webhooks (Alpha)</li>
              </ul>
           </div>
           <div>
              <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.4em] mb-6">Endpoints</h4>
              <ul className="space-y-3">
                 {ENDPOINTS.map(ep => (
                    <li key={ep.path}>
                       <a href={`#${ep.path}`} className="text-xs font-bold text-[#666666] hover:text-white transition-colors flex items-center gap-2 group">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-sm ${ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : ep.method === 'POST' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>{ep.method}</span>
                          <span className="truncate">{ep.path.split('/').pop()}</span>
                       </a>
                    </li>
                 ))}
              </ul>
           </div>
        </nav>
      </aside>

      <main className="lg:pl-80 relative z-10">
        {/* Mobile Nav */}
        <nav className="lg:hidden p-6 border-b border-[#1A1A1A] bg-black/80 backdrop-blur-xl flex justify-between items-center">
           <Link href="/" className="font-heading text-2xl tracking-tight text-white">CORE.API</Link>
           <Link href="/docs" className="p-2 bg-white/5 border border-white/10"><ArrowLeft className="w-5 h-5" /></Link>
        </nav>

        <section className="pt-24 pb-40 px-6 md:px-16 max-w-5xl">
           <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
              — SYSTEM INTERFACE —
           </motion.p>
           <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="font-heading text-6xl md:text-8xl font-bold tracking-tighter leading-none text-white mb-12">
              The API<br /><span className="italic text-[#E2FF00]">Matrix.</span>
           </motion.h1>
           <p className="text-[#888888] text-xl font-medium leading-relaxed mb-16">
              Programmatic access to the CORE ecosystem. Build custom dashboards, integrate third-party logistics, and automate your entire enterprise via our RESTful neural layer.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8">
                 <Globe className="w-6 h-6 text-[#E2FF00] mb-6" />
                 <h3 className="text-white font-bold mb-2">Base URL</h3>
                 <code className="text-[#E2FF00] font-mono text-sm">https://api.coreerp.io/v1</code>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8">
                 <Terminal className="w-6 h-6 text-[#E2FF00] mb-6" />
                 <h3 className="text-white font-bold mb-2">Authentication</h3>
                 <p className="text-[#888888] text-xs leading-relaxed">Include <code>Authorization: Bearer [JWT]</code> in all headers. Tokens are generated via the Auth handshake.</p>
              </div>
           </div>

           <div className="space-y-32">
              {ENDPOINTS.map((ep, i) => (
                 <div key={ep.path} id={ep.path} className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                       <span className={`text-xs font-black px-3 py-1 rounded-sm ${ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : ep.method === 'POST' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>{ep.method}</span>
                       <h2 className="text-2xl font-mono font-bold text-white tracking-tight">{ep.path}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                       <div>
                          <p className="text-[#888888] font-medium leading-relaxed mb-8">{ep.desc}</p>
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-[10px] font-black text-[#444444] uppercase tracking-widest mb-4">Request Headers</h4>
                                <div className="font-mono text-xs text-[#666666] bg-[#050505] border border-[#1A1A1A] p-4">
                                   Content-Type: application/json<br />
                                   Authorization: Bearer YOUR_TOKEN
                                </div>
                             </div>
                             <button 
                                onClick={() => copyPath(ep.path)}
                                className="flex items-center gap-2 text-[10px] font-black text-[#E2FF00] uppercase tracking-widest hover:text-white transition-colors"
                             >
                                {copied === ep.path ? "Copied Link!" : "Copy Endpoint Link"} <Copy className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                       
                       <div className="bg-[#050505] border border-[#1A1A1A] rounded-sm overflow-hidden">
                          <div className="bg-[#0A0A0A] px-4 py-2 border-b border-[#1A1A1A] flex justify-between items-center">
                             <span className="text-[10px] font-black text-[#444444] uppercase tracking-widest">Example Response</span>
                             <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                                <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                                <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                             </div>
                          </div>
                          <pre className="p-6 font-mono text-sm text-emerald-500/80 overflow-x-auto">
                             {(() => {
                               try {
                                 return JSON.stringify(JSON.parse(ep.response), null, 2);
                               } catch (e) {
                                 return ep.response;
                               }
                             })()}
                          </pre>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Footer for the main content area */}
        <footer className="py-24 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#050505]">
           <div className="flex flex-col md:flex-row justify-between items-center gap-12">
              <div>
                 <h4 className="text-white font-bold mb-2">Ready to scale?</h4>
                 <p className="text-[#666666] text-sm">Request a high-velocity API key for enterprise production use.</p>
              </div>
              <Link href="/contact" className="h-14 px-10 flex items-center bg-[#E2FF00] text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors">
                 Contact Developer Relations <ExternalLink className="w-4 h-4 ml-3" />
              </Link>
           </div>
        </footer>
      </main>
    </div>
  );
}
