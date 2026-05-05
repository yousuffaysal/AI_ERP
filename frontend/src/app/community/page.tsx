"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft,
  Users, 
  MessageSquare, 
  Github, 
  Twitter, 
  Slack, 
  Disc as Discord,
  Globe,
  Share2
} from "lucide-react";
import Footer from "@/components/Layout/Footer";

const PLATFORMS = [
  { name: "Discord", desc: "Join 12,000+ engineers in our official hub.", icon: Discord, color: "hover:bg-[#5865F2]", count: "12k+" },
  { name: "Slack", desc: "Enterprise collaboration for CORE partners.", icon: Slack, color: "hover:bg-[#4A154B]", count: "4.2k" },
  { name: "X / Twitter", desc: "Real-time updates and architectural insights.", icon: Twitter, color: "hover:bg-[#000000]", count: "48k" },
  { name: "GitHub", desc: "Contribute to the open-source neural modules.", icon: Github, color: "hover:bg-[#24292e]", count: "850+" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E2FF00]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="group flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
          <span className="font-heading text-2xl tracking-tight text-[#EAEAEA]">
            CORE<span className="text-[#E2FF00] italic">.</span>COMMUNITY
          </span>
        </Link>
        <div className="flex gap-4">
           <button className="p-3 bg-white/5 border border-white/10 hover:border-[#E2FF00] transition-all">
              <Share2 className="w-4 h-4 text-[#888888]" />
           </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-40 px-6 md:px-16 max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center p-4 bg-[#E2FF00]/10 rounded-full mb-12">
            <Users className="w-12 h-12 text-[#E2FF00]" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
            — THE HUMAN LAYER —
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-heading text-6xl md:text-[9rem] font-bold tracking-tighter leading-[0.85] text-white mb-16">
            Global Core<br />
            <span className="italic">Alliance.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-[#888888] text-2xl font-medium leading-relaxed mb-24">
            Connect with the architects, developers, and operators building the next generation of enterprise intelligence.
          </motion.p>
        </section>

        {/* Platforms Grid */}
        <section className="pb-32 px-6 md:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A1A1A] border border-[#1A1A1A]">
            {PLATFORMS.map((platform, i) => (
              <motion.div 
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-[#050505] p-12 transition-all group cursor-pointer ${platform.color}`}
              >
                <div className="flex justify-between items-start mb-12">
                  <platform.icon className="w-10 h-10 text-white" />
                  <span className="font-mono text-xs font-bold text-[#E2FF00]">{platform.count}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{platform.name}</h3>
                <p className="text-[#666666] group-hover:text-white/80 transition-colors text-sm font-medium leading-relaxed mb-12">
                  {platform.desc}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  Connect Now <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Community Highlight */}
        <section className="py-40 px-6 md:px-16 bg-[#E2FF00] text-black overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{ backgroundImage: 'linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }} />
          
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1">
              <h2 className="font-heading text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-12">
                Join the<br /><span className="italic">Inner Circle.</span>
              </h2>
              <p className="text-xl font-medium leading-relaxed mb-12 max-w-lg">
                Gain access to private betas, architectural workshops, and direct communication lines with the core engineering team.
              </p>
              <button className="h-16 px-10 bg-black text-[#E2FF00] font-black uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors">
                Apply for Early Access
              </button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-black/10 border border-black/20 flex items-center justify-center p-8 backdrop-blur-sm">
                   <div className="w-full h-full bg-black/5 rounded-full flex items-center justify-center">
                      <Users className="w-12 h-12 opacity-20" />
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-40 px-6 md:px-16 max-w-7xl mx-auto">
          <h2 className="font-heading text-5xl md:text-7xl text-white tracking-tight mb-24 text-center">Global<br /><span className="italic text-[#E2FF00]">Summits.</span></h2>
          <div className="space-y-8">
            {[
              { date: "JUNE 12", city: "SINGAPORE", title: "Neural Commerce Symposium" },
              { date: "AUG 24", city: "NEW YORK", title: "Brutalist UX Workshop" },
              { date: "NOV 05", city: "BERLIN", title: "The CORE Developers Summit" },
            ].map((event, i) => (
              <div key={i} className="group flex flex-col md:flex-row justify-between items-center p-12 border border-[#1A1A1A] hover:bg-white/5 transition-all cursor-pointer">
                <div className="flex items-center gap-12 text-center md:text-left mb-8 md:mb-0">
                  <div className="w-24">
                    <p className="font-mono text-xl text-[#E2FF00] font-bold">{event.date}</p>
                    <p className="text-[10px] font-black text-[#444444] uppercase tracking-widest">{event.city}</p>
                  </div>
                  <div className="h-12 w-px bg-[#1A1A1A] hidden md:block" />
                  <h3 className="text-3xl font-bold text-white group-hover:text-[#E2FF00] transition-colors">{event.title}</h3>
                </div>
                <button className="h-12 px-8 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-[#E2FF00] hover:text-[#E2FF00] transition-all">
                  Register Interest
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
