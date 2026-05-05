"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Github, 
  ArrowRight, 
  ArrowLeft,
  GitPullRequest, 
  Star, 
  Code2, 
  Terminal,
  ExternalLink
} from "lucide-react";
import Footer from "@/components/Layout/Footer";

export default function GitHubPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      
      {/* Nav */}
      <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="group flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
          <span className="font-heading text-2xl tracking-tight text-[#EAEAEA]">
            CORE<span className="text-[#E2FF00] italic">.</span>OSS
          </span>
        </Link>
        <Link 
          href="https://github.com" 
          target="_blank"
          className="h-10 px-6 flex items-center gap-2 bg-[#E2FF00] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
        >
          <Github className="w-4 h-4" /> Go to GitHub
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-32 px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
              — OPEN SOURCE CORE —
            </motion.p>
            <h1 className="font-heading text-6xl md:text-[8rem] font-bold tracking-tighter leading-[0.8] text-white mb-12">
              Built in the<br />
              <span className="italic">Light.</span>
            </h1>
            <p className="text-[#888888] text-2xl font-medium leading-relaxed mb-12">
              CORE isn't just a platform; it's an ecosystem. We open-source our most critical neural modules and UI components to set a new standard for enterprise architecture.
            </p>
            
            <div className="flex flex-wrap gap-8 mb-16">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-[#E2FF00]" />
                <span className="font-mono text-xl text-white">4.2k Stars</span>
              </div>
              <div className="flex items-center gap-3">
                <GitPullRequest className="w-5 h-5 text-blue-500" />
                <span className="font-mono text-xl text-white">850+ PRs</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-mono text-xl text-white">120+ Contribs</span>
              </div>
            </div>

            <Link 
              href="https://github.com" 
              target="_blank"
              className="inline-flex items-center gap-4 h-16 px-10 border border-[#E2FF00] text-[#E2FF00] font-black uppercase tracking-widest text-sm hover:bg-[#E2FF00] hover:text-black transition-all group"
            >
              Explore Repository <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-1 rounded-sm overflow-hidden">
               <div className="bg-[#050505] p-8 border border-[#1A1A1A]">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    <span className="ml-4 font-mono text-[10px] text-[#444444] uppercase tracking-widest">core-engine-v2 / src / neural / matrix.py</span>
                  </div>
                  <pre className="font-mono text-sm text-[#888888] leading-relaxed overflow-x-auto">
{`class NeuralMatrix:
    def __init__(self, nodes: int = 1024):
        self.capacity = nodes
        self.load = 0.14
        self.state = "STABLE"

    async def initialize(self):
        """Bootstraps the enterprise OS"""
        print("Initializing CORE Neural Matrix...")
        await self.sync_gateways()
        return True

    def calculate_velocity(self, delta):
        # Predictive demand curve logic
        return (self.load * delta) ** 0.85`}
                  </pre>
               </div>
            </div>
            
            {/* Decorative background orb */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E2FF00]/10 rounded-full blur-[100px]" />
          </motion.div>
        </div>

        {/* Contribution stats */}
        <section className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 py-24 border-t border-[#1A1A1A]">
          <div>
            <Code2 className="w-8 h-8 text-[#E2FF00] mb-6" />
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Code Integrity</h3>
            <p className="text-[#666666] leading-relaxed text-sm">Every commit is cryptographically signed and passes through 42 automated security layers before deployment.</p>
          </div>
          <div>
            <Terminal className="w-8 h-8 text-[#E2FF00] mb-6" />
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">CI/CD Velocity</h3>
            <p className="text-[#666666] leading-relaxed text-sm">We maintain a sub-60-second build time for the entire platform, ensuring maximum development speed.</p>
          </div>
          <div>
            <Github className="w-8 h-8 text-[#E2FF00] mb-6" />
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Open Governance</h3>
            <p className="text-[#666666] leading-relaxed text-sm">Key architectural decisions are made in public RFCs. Join the discussion on GitHub Discussions.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Users({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
