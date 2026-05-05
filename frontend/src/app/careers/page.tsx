"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft,
  Briefcase, 
  MapPin, 
  Clock, 
  Code2, 
  BrainCircuit, 
  Sparkles,
  Zap
} from "lucide-react";
import Footer from "@/components/Layout/Footer";

const JOBS = [
  {
    title: "Lead AI Engineer",
    department: "Neural Core",
    location: "Dubai, UAE / Remote",
    type: "Full-time",
    salary: "$180k - $240k",
    icon: BrainCircuit
  },
  {
    title: "Senior Full-Stack Developer",
    department: "Interface Labs",
    location: "Global Remote",
    type: "Full-time",
    salary: "$140k - $190k",
    icon: Code2
  },
  {
    title: "Product Designer (Brutalist)",
    department: "Experience",
    location: "London, UK / Remote",
    type: "Contract",
    salary: "$900 - $1.2k / Day",
    icon: Sparkles
  },
  {
    title: "Infrastructure Architect",
    department: "Platform Velocity",
    location: "Global Remote",
    type: "Full-time",
    salary: "$160k - $210k",
    icon: Zap
  }
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #E2FF00 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
      
      <div className="fixed -bottom-[200px] -left-[100px] w-[800px] h-[800px] bg-[#E2FF00]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="group flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
          <span className="font-heading text-2xl tracking-tight text-[#EAEAEA]">
            CORE<span className="text-[#E2FF00] italic">.</span>CAREERS
          </span>
        </Link>
        <Link href="/contact" className="h-10 px-6 flex items-center bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-[#E2FF00] hover:text-black transition-all">
          General Inquiry
        </Link>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-40 px-6 md:px-16 max-w-7xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
            — JOIN THE NEURAL MATRIX —
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-heading text-6xl md:text-[9rem] font-bold tracking-tighter leading-[0.8] text-white mb-16">
            Build the<br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white to-[#E2FF00]">future OS.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-2xl text-[#888888] text-2xl font-medium leading-relaxed mb-24">
            We are looking for extreme talent. Individuals who think in systems, optimize for velocity, and want to redefine how global commerce operates.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-y border-[#1A1A1A]">
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Mission First</h4>
              <p className="text-[#666666] text-sm leading-relaxed">We don't build features; we build leverage. Every line of code should accelerate an enterprise's ability to scale.</p>
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Hyper-Growth</h4>
              <p className="text-[#666666] text-sm leading-relaxed">Operating in 40+ countries. Your work will touch billions in global trade volume from day one.</p>
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Radical Autonomy</h4>
              <p className="text-[#666666] text-sm leading-relaxed">No middle management. We hire experts and stay out of their way. Ship daily, iterate constantly.</p>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-24">
            <h2 className="font-heading text-5xl md:text-7xl text-white tracking-tight">Open<br /><span className="italic text-[#E2FF00]">Positions.</span></h2>
            <div className="hidden md:block text-right">
              <span className="text-[10px] font-black text-[#444444] uppercase tracking-[0.4em] mb-2 block">Filter by Division</span>
              <div className="flex gap-4">
                {["All", "Engineering", "Design", "Ops"].map(cat => (
                  <button key={cat} className={`text-[10px] font-black uppercase tracking-widest py-2 px-4 border ${cat === 'All' ? 'bg-[#E2FF00] text-black border-[#E2FF00]' : 'border-[#222222] text-[#666666] hover:text-white hover:border-white'} transition-all`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {JOBS.map((job, i) => (
              <motion.div 
                key={job.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-[#050505] border border-[#1A1A1A] p-8 md:p-12 hover:border-[#E2FF00] transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex items-center gap-8">
                    <div className="hidden md:flex w-16 h-16 items-center justify-center bg-white/5 border border-white/10 group-hover:bg-[#E2FF00]/10 group-hover:border-[#E2FF00]/20 transition-all">
                      <job.icon className="w-6 h-6 text-[#444444] group-hover:text-[#E2FF00] transition-colors" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#E2FF00] uppercase tracking-[0.3em] mb-2 block">{job.department}</span>
                      <h3 className="text-3xl font-bold text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">{job.title}</h3>
                      <div className="flex flex-wrap gap-6 text-[#666666] text-xs font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {job.type}</span>
                        <span className="flex items-center gap-2 text-[#E2FF00] opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-3 h-3" /> Apply Now</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-[#444444] uppercase tracking-[0.4em]">Comp Range</span>
                    <span className="font-mono text-xl text-white">{job.salary}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-32 p-12 bg-[#0A0A0A] border border-[#1A1A1A] text-center">
            <h3 className="text-2xl font-bold text-white mb-6">Don't see your role?</h3>
            <p className="text-[#666666] mb-8 max-w-xl mx-auto font-medium">We're always looking for geniuses who can contribute in ways we haven't thought of yet. Send us your portfolio or GitHub profile.</p>
            <Link href="/contact" className="inline-flex items-center gap-3 h-14 px-10 bg-[#E2FF00] text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors">
              Submit Open Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
