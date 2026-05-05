"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Database, 
  Cloud, 
  Server,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Footer from "@/components/Layout/Footer";

const SYSTEMS = [
  { name: "Neural Engine", status: "operational", uptime: "99.98%", load: "12.4%", icon: BrainCircuit },
  { name: "Global Edge Network", status: "operational", uptime: "100%", latency: "14ms", icon: Globe },
  { name: "Identity Shield", status: "operational", uptime: "99.99%", active_nodes: "1,024", icon: ShieldCheck },
  { name: "Postgres Cluster", status: "operational", uptime: "99.95%", iops: "12.5k", icon: Database },
  { name: "AI Inference (AWS)", status: "operational", uptime: "99.99%", model: "Claude 3.5 Sonnet", icon: Cpu },
  { name: "Vector Cache", status: "operational", uptime: "100%", hit_rate: "94.2%", icon: Zap },
];

const INCIDENTS = [
  { date: "May 04, 2026", title: "Partial Latency in EU-West-1", status: "Resolved", duration: "14 mins" },
  { date: "April 28, 2026", title: "Scheduled Database Maintenance", status: "Completed", duration: "120 mins" },
  { date: "April 15, 2026", title: "API Rate Limiting Anomaly", status: "Resolved", duration: "4 mins" },
];

function BrainCircuit({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .94 4.92 2.5 2.5 0 0 0 4.01 1.05A2.5 2.5 0 1 0 12 4.5z" />
      <path d="M12.5 13a2.5 2.5 0 1 0 3.51-3.51 2.5 2.5 0 1 0-3.51 3.51z" />
      <path d="M16 11a2.5 2.5 0 1 0 3.51-3.51 2.5 2.5 0 1 0-3.51 3.51z" />
      <path d="M10 13a2.5 2.5 0 1 0 3.51-3.51 2.5 2.5 0 1 0-3.51 3.51z" />
      <path d="M14 15a2.5 2.5 0 1 0 3.51-3.51 2.5 2.5 0 1 0-3.51 3.51z" />
    </svg>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#E2FF00]/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <Link href="/" className="group flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
          <span className="font-heading text-2xl tracking-tight text-[#EAEAEA]">
            CORE<span className="text-[#E2FF00] italic">.</span>STATUS
          </span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#E2FF00]/10 border border-[#E2FF00]/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#E2FF00] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E2FF00]">All Systems Operational</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-24 px-6 md:px-16">
        {/* Hero Section */}
        <div className="mb-24">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-6">
            — REAL-TIME TELEMETRY —
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-heading text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8">
            System <br /> <span className="italic">Integrity.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-2xl text-[#888888] text-xl font-medium leading-relaxed">
            Live infrastructure monitoring for the global CORE network. Our distributed architecture ensures zero-latency intelligence at scale.
          </motion.p>
        </div>

        {/* System Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {SYSTEMS.map((system, i) => (
            <motion.div 
              key={system.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 hover:border-[#E2FF00]/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-sm group-hover:bg-[#E2FF00]/10 transition-colors">
                  <system.icon className="w-6 h-6 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-widest">{system.status}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#E2FF00]" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-6 tracking-tight">{system.name}</h3>
              
              <div className="grid grid-cols-2 gap-4 border-t border-[#1A1A1A] pt-6">
                <div>
                  <p className="text-[10px] font-bold text-[#444444] uppercase tracking-widest mb-1">Uptime</p>
                  <p className="font-mono text-sm text-white">{system.uptime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#444444] uppercase tracking-widest mb-1">
                    {system.load ? "Load" : system.latency ? "Latency" : system.active_nodes ? "Nodes" : system.iops ? "IOPS" : system.model ? "Engine" : "Hit Rate"}
                  </p>
                  <p className="font-mono text-sm text-[#888888]">
                    {system.load || system.latency || system.active_nodes || system.iops || system.model || system.hit_rate}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Uptime History Chart Placeholder */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 mb-24 overflow-hidden relative">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-bold text-white tracking-tight">Global Availability (90 Days)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E2FF00]" />
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Degraded</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1 h-12">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`flex-1 rounded-full ${i === 42 ? 'bg-orange-500' : 'bg-[#E2FF00]/40'}`} 
              />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">90 days ago</span>
            <span className="text-[10px] font-bold text-[#E2FF00] uppercase tracking-widest">99.99% Average</span>
            <span className="text-[10px] font-bold text-[#444444] uppercase tracking-widest">Today</span>
          </div>
        </div>

        {/* Past Incidents */}
        <div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-12 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-[#444444]" />
            Past Incidents
          </h3>
          <div className="space-y-4">
            {INCIDENTS.map((incident, i) => (
              <div key={i} className="group border border-[#1A1A1A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">{incident.date}</p>
                  <h4 className="text-lg font-bold text-white group-hover:text-[#E2FF00] transition-colors">{incident.title}</h4>
                </div>
                <div className="flex gap-8 items-center">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#444444] uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-mono text-sm text-[#888888]">{incident.duration}</p>
                  </div>
                  <div className="px-4 py-1 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#888888]">
                    {incident.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
