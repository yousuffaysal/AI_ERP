"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Box, BrainCircuit, Fingerprint, Layers, Activity, LineChart, Globe, ShieldCheck, Zap, Cpu, Lock } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Reveal Section Scroll Tracking
  const { scrollYProgress: revealProgress } = useScroll({
    target: revealRef,
    offset: ["start end", "end start"]
  });

  const maskSize = useTransform(revealProgress, [0.1, 0.9], ["20%", "150%"]);
  const opacityReveal = useTransform(revealProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 1]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      
      {/* Background Grids & Orbs */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, 
             backgroundSize: '80px 80px' 
           }}>
      </div>
      <div className="fixed top-1/4 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] rounded-full z-0 opacity-[0.15] pointer-events-none mix-blend-screen"
           style={{
             background: 'radial-gradient(circle, rgba(226,255,0,0.8) 0%, rgba(203,229,0,0.2) 30%, transparent 70%)',
             filter: 'blur(80px)'
           }}>
      </div>
      <div className="fixed bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[800px] h-[800px] rounded-full z-0 opacity-10 pointer-events-none mix-blend-screen"
           style={{
             background: 'radial-gradient(circle, rgba(120,0,255,1) 0%, rgba(60,0,255,0.2) 40%, transparent 70%)',
             filter: 'blur(100px)'
           }}>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] w-full py-6 px-6 md:px-16 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="font-heading text-3xl tracking-tight text-[#EAEAEA]">
          CORE<span className="text-[#E2FF00] italic">.</span>ERP
        </div>
        <div className="flex gap-8 items-center">
          <Link href="/about" className="hidden md:block text-xs font-bold tracking-[0.2em] text-[#A0A0A0] hover:text-[#E2FF00] transition-colors uppercase">About</Link>
          <Link href="/pricing" className="hidden md:block text-xs font-bold tracking-[0.2em] text-[#A0A0A0] hover:text-[#E2FF00] transition-colors uppercase">Pricing</Link>
          <Link href="/guide" className="hidden md:block text-xs font-bold tracking-[0.2em] text-[#A0A0A0] hover:text-[#E2FF00] transition-colors uppercase">Guide</Link>
          <Link href="/login" className="hidden sm:block text-xs font-bold tracking-[0.2em] text-[#A0A0A0] hover:text-white transition-colors uppercase">Sign In</Link>
          <Link href="/login" className="h-10 px-5 inline-flex items-center justify-center bg-[#E2FF00] text-black text-sm font-black uppercase tracking-[0.15em] hover:bg-white transition-all rounded-sm">
            Access Terminal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] px-6 text-center pt-20">
        <div className="inline-block mb-10 overflow-hidden">
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-mono text-xs md:text-sm tracking-[0.4em] text-[#E2FF00] uppercase"
          >
            System Build 2.0.4 — Online
          </motion.p>
        </div>

        <motion.h1 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="font-heading text-[4rem] sm:text-[7xl] md:text-8xl lg:text-[10rem] xl:text-[12rem] leading-[0.8] text-white tracking-tighter mb-12 drop-shadow-2xl"
        >
          Compute <br/>
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#A0A0A0] to-[#555555] font-normal">Business.</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="max-w-3xl text-[#888888] text-xl md:text-2xl font-medium leading-relaxed mb-16"
        >
          Transcend traditional resource planning. Core ERP unifies sales, inventory, and human capital into a singular, high-velocity intelligence matrix powered by predictive AI.
        </motion.p>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-6"
        >
          <Link href="/login" className="group relative h-16 w-full sm:w-72 flex items-center justify-center bg-white text-black font-extrabold text-lg uppercase tracking-widest overflow-hidden transition-transform hover:scale-[1.02]">
            <span className="absolute inset-0 bg-[#E2FF00] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center gap-4">
              Initialize
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </Link>
          
          <a href="#manifesto" className="h-16 w-full sm:w-72 flex items-center justify-center border border-[#333333] text-white font-extrabold text-lg uppercase tracking-widest hover:bg-[#111111] transition-colors">
            Read Manifesto
          </a>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
           <span className="text-[10px] font-mono tracking-[0.3em] text-[#444444] uppercase">Scroll</span>
           <div className="w-px h-12 bg-gradient-to-b from-[#E2FF00] to-transparent" />
        </motion.div>
      </main>

      {/* Metrics Section */}
      <section className="relative z-10 py-32 px-6 md:px-16 border-y border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
          {[
            { value: "0.4ms", label: "Prediction Latency" },
            { value: "100%", label: "Ledger Cryptography" },
            { value: "$14B", label: "Assets Optimized" }
          ].map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col border-l-4 border-[#E2FF00] pl-8"
            >
              <h4 className="font-heading text-6xl md:text-8xl text-white tracking-tighter mb-4">{metric.value}</h4>
              <p className="text-[#888888] font-bold uppercase tracking-widest text-sm">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* NEW: Scroll Reveal Mask Section */}
      <section ref={revealRef} className="relative z-10 h-[140vh] bg-[#030303]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          {/* Background Layer (Hidden) */}
          <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center">
             <div className="max-w-3xl text-center px-6">
                <h2 className="text-[#333333] text-[10vw] font-black uppercase tracking-tighter opacity-10">Intelligence</h2>
             </div>
          </div>

          {/* Reveal Layer (Masked) */}
          <motion.div 
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#E2FF00]"
            style={{
              clipPath: `circle(${maskSize} at center)`,
              opacity: opacityReveal
            }}
          >
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
               <img 
                 src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070" 
                 className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale mix-blend-multiply"
                 alt="Neural Grid"
               />
               <div className="relative z-10 max-w-5xl text-center px-6">
                  <motion.span className="inline-block px-4 py-1 border-2 border-black text-black font-mono text-sm font-black uppercase mb-8">Neural Synchronization</motion.span>
                  <h2 className="font-heading text-6xl md:text-9xl text-black tracking-tighter leading-none mb-12">
                    The Invisible <br/> Hand.
                  </h2>
                  <p className="max-w-2xl mx-auto text-black/70 text-xl md:text-2xl font-bold leading-tight">
                    CORE doesn't just record inventory; it prophecies it. A hidden matrix of predictive nodes recalculating your success at every pulse.
                  </p>
               </div>
            </div>
          </motion.div>

          <motion.div 
            style={{ opacity: useTransform(revealProgress, [0.1, 0.3], [1, 0]) }}
            className="relative z-10 text-center"
          >
             <h3 className="text-4xl md:text-6xl font-heading tracking-tight text-[#444444]">Reveal the Core.</h3>
             <p className="mt-4 font-mono text-[#444444] uppercase tracking-widest">Keep scrolling to synchronize</p>
          </motion.div>
        </div>
      </section>

      {/* NEW: Data Storm Transition (After Effects Style) */}
      <section className="relative z-10 h-[100vh] w-full overflow-hidden bg-black border-y border-white/5">
         <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           transition={{ duration: 1.5 }}
           className="absolute inset-0 z-0"
         >
            <img 
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070" 
              className="w-full h-full object-cover opacity-20 scale-110"
              alt="Data Circuits"
            />
            {/* The Cinematic Data Storm Image */}
            <motion.div 
              className="absolute inset-0 z-10"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.4,
                mixBlendMode: 'screen'
              }}
              animate={{ 
                scale: [1, 1.1, 1],
                filter: ['hue-rotate(0deg)', 'hue-rotate(30deg)', 'hue-rotate(0deg)']
              }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            />
         </motion.div>

         <div className="relative z-20 h-full w-full flex flex-col items-center justify-center text-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl"
            >
               <h2 className="font-heading text-7xl md:text-[12rem] text-white tracking-tighter leading-none mb-12 drop-shadow-[0_0_80px_rgba(255,255,255,0.2)]">
                  Velocity <br/>
                  <span className="italic text-[#E2FF00]">Matrix.</span>
               </h2>
               <div className="flex items-center justify-center gap-12">
                  <div className="flex flex-col items-center">
                     <span className="font-mono text-[#E2FF00] text-3xl md:text-5xl mb-2">94TB/s</span>
                     <span className="text-xs font-bold text-[#888888] uppercase tracking-[0.4em]">Throughput</span>
                  </div>
                  <div className="w-px h-16 bg-white/10" />
                  <div className="flex flex-col items-center">
                     <span className="font-mono text-white text-3xl md:text-5xl mb-2">0.001%</span>
                     <span className="text-xs font-bold text-[#888888] uppercase tracking-[0.4em]">Error Rate</span>
                  </div>
               </div>
            </motion.div>

            {/* Floating Data Particles (Simulated AE style) */}
            {isMounted && Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#E2FF00] rounded-full blur-[1px]"
                initial={{ 
                  x: Math.random() * 2000 - 1000, 
                  y: Math.random() * 1000 - 500, 
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.random() * 2000 - 1000, 
                  y: Math.random() * 1000 - 500, 
                  opacity: [0, 1, 0],
                  scale: [1, 2, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2 + Math.random() * 5, 
                  ease: "easeInOut" 
                }}
              />
            ))}
         </div>

         {/* Vignette Overlay */}
         <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-b from-black via-transparent to-black opacity-80" />
         <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-r from-black via-transparent to-black opacity-60" />
      </section>

      {/* The Manifesto Section */}
      <section id="manifesto" className="relative z-10 py-40 px-6 md:px-16 bg-[#E2FF00] text-black">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-5xl md:text-8xl tracking-tighter leading-[0.85] mb-16"
          >
            Algorithms <br/> Over Instincts.
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="columns-1 md:columns-2 gap-16 text-lg md:text-xl font-medium leading-relaxed"
          >
            <p className="mb-8 break-inside-avoid">
              Legacy enterprise software is a graveyard of historic data. It tells you exactly what happened yesterday, completely blind to what will happen tomorrow. 
              We engineered CORE because modern logistics networks and pricing elasticity operate on permutations too vast for human intuition to map.
            </p>
            <p className="mb-8 break-inside-avoid">
              CORE anchors our architecture to distributed Python machine learning nodes running XGBoost and 
              deep neural nets, the platform continuously recalculates operational health, rendering human guesswork obsolete.
            </p>
            <p className="break-inside-avoid font-black uppercase tracking-widest text-sm border-t-2 border-black pt-8">
              "We trade the illusion of control for the certainty of mathematics."
            </p>
          </motion.div>
        </div>
      </section>

      {/* NEW: Operational Pulse Section */}
      <section className="relative z-10 py-40 px-6 md:px-16 bg-[#030303] overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
           <div className="lg:w-1/2">
              <span className="flex items-center gap-3 text-[#E2FF00] font-mono text-xs tracking-[0.4em] uppercase mb-8">
                 <Activity className="w-4 h-4 animate-pulse" /> Kinetic Operations
              </span>
              <h2 className="font-heading text-5xl md:text-8xl text-white tracking-tighter leading-none mb-10">
                Pulse of <br/> the Machine.
              </h2>
              <div className="space-y-8">
                 {[
                   { icon: Zap, title: "Real-time Processing", desc: "Every transaction, every movement, processed in sub-millisecond windows." },
                   { icon: Cpu, title: "Distributed Compute", desc: "Parallel processing across multi-region nodes ensures zero downtime." },
                   { icon: Lock, title: "Immutable Security", desc: "End-to-end encryption at the hardware level for all financial data." }
                 ].map((item, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="flex gap-6 items-start"
                   >
                      <div className="mt-1 p-3 bg-white/5 border border-white/10 rounded-xl text-[#E2FF00]">
                         <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-white font-bold text-xl mb-2">{item.title}</h4>
                         <p className="text-[#666666] leading-relaxed">{item.desc}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
           
           <div className="lg:w-1/2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#E2FF00]/20 to-purple-500/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-4 md:p-8 overflow-hidden aspect-square flex items-center justify-center">
                 <div className="absolute inset-0 opacity-10" 
                      style={{ 
                        backgroundImage: 'radial-gradient(#E2FF00 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                      }} />
                 
                 {/* Visual Representation of Pulse */}
                 <div className="relative w-full h-full flex items-center justify-center">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        className="absolute border-2 border-[#E2FF00]/30 rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 2], 
                          opacity: [0.5, 0.2, 0],
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 3, 
                          delay: i * 0.25,
                          ease: "linear"
                        }}
                        style={{ 
                          width: `${(i + 1) * 10}%`,
                          height: `${(i + 1) * 10}%`,
                        }}
                      />
                    ))}
                    <div className="z-10 bg-[#E2FF00] p-8 rounded-full shadow-[0_0_50px_rgba(226,255,0,0.4)]">
                       <Activity className="w-12 h-12 text-black" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="architecture" className="relative z-10 py-40 px-6 md:px-16 bg-[#030303] border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row justify-between items-end mb-32"
          >
            <h2 className="font-heading text-6xl md:text-[7rem] leading-[0.85] text-white tracking-tight">
              System <br/>
              <span className="italic text-[#E2FF00] font-normal">Topology.</span>
            </h2>
            <p className="max-w-md text-[#888888] font-medium leading-relaxed mt-12 md:mt-0 text-left md:text-right text-xl">
              A meticulously engineered stack designed for high-frequency operations and predictive scaling.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
            {[
              { title: "Neural Forecasts", desc: "Predictive inventory models that adapt in real-time to micro-market fluctuations.", icon: <BrainCircuit className="w-10 h-10" /> },
              { title: "Omni-Ledger", desc: "Unbreakable financial tracing with cryptographic security validating every transaction.", icon: <Layers className="w-10 h-10" /> },
              { title: "Human Capital", desc: "Algorithmic resource allocation and operational mapping maximizing team velocity.", icon: <Fingerprint className="w-10 h-10" /> },
              { title: "Kinetic Routing", desc: "Supply chain visualization with millimeter precision and autonomous rerouting.", icon: <Box className="w-10 h-10" /> },
            ].map((module, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-[#050505] p-12 hover:bg-[#0A0A0A] transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-12 text-[#444444] group-hover:text-[#E2FF00] transition-colors duration-500">
                    {module.icon}
                  </div>
                  <h3 className="text-2xl font-black text-[#EAEAEA] mb-6 uppercase tracking-widest leading-snug">{module.title}</h3>
                </div>
                <p className="text-[#666666] font-medium leading-relaxed">{module.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Logistics Map Section */}
      <section className="relative z-10 py-40 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#000000] overflow-hidden">
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 mb-6 text-[#E2FF00]">
                <Globe className="w-8 h-8" />
                <span className="font-mono text-sm tracking-widest uppercase">Global Node Network</span>
              </div>
              <h2 className="font-heading text-5xl md:text-7xl leading-none text-white tracking-tight mb-8">
                Supply Chain <br/> Cartography.
              </h2>
              <p className="text-[#888888] text-xl font-medium leading-relaxed mb-10">
                Visualize multi-warehouse vectors. CORE continuously routes hardware, capital, and assets through the path of maximum kinetic efficiency, cutting transit latency by 32% across borders.
              </p>
            </motion.div>
            
            <motion.div 
              className="lg:w-1/2 relative h-[400px] w-full border border-[#222222] bg-[#0A0A0A] flex flex-col justify-center items-center overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* ASCII / Dot Grid Map Abstracted */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-2 opacity-30 animate-pulse">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i % 17 === 0 || i % 23 === 0 ? 'bg-[#E2FF00]' : 'bg-[#333333]'}`} />
                ))}
              </div>
              
              {/* Overlay Node Links */}
              <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path 
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d="M20,30 L40,50 L70,20 L80,60" fill="none" stroke="#E2FF00" strokeWidth="0.5" strokeDasharray="2,2" 
                />
                <circle cx="20" cy="30" r="1.5" fill="#E2FF00" />
                <circle cx="40" cy="50" r="1.5" fill="#E2FF00" />
                <circle cx="70" cy="20" r="1.5" fill="white" />
                <circle cx="80" cy="60" r="1.5" fill="#E2FF00" />
              </svg>
            </motion.div>
         </div>
      </section>

      {/* Split-Screen Editorial Deep Dive: Pricing AI */}
      <section className="relative z-10 py-40 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#030303]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-16 h-1 bg-[#E2FF00] mb-8" />
            <h2 className="font-heading text-5xl md:text-7xl leading-none text-white tracking-tight mb-8">
              The Cognitive <br/> Engine.
            </h2>
            <p className="text-[#888888] text-xl font-medium leading-relaxed mb-10">
              Beneath the interface lies a cluster of XGBoost and Deep Learning models analyzing permutations across your sales, inventory, and expenditures simultaneously. It doesn't just report the past—it writes your future strategy.
            </p>
            <Link href="/docs" className="inline-flex items-center text-[#E2FF00] font-bold text-lg uppercase tracking-widest hover:text-white transition-colors group">
              Read the Tutorials
              <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="aspect-square bg-[#0A0A0A] border border-[#1A1A1A] p-8 md:p-16 relative overflow-hidden group"
          >
            {/* Abstract Wireframe Art */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                 style={{ 
                   background: 'radial-gradient(circle at 70% 30%, rgba(226,255,0,0.4) 0%, transparent 50%)',
                 }} />
                 
            <div className="w-full h-full border border-[#222222] relative flex flex-col justify-end p-8 bg-gradient-to-t from-[#050505] to-transparent">
              <div className="flex justify-between items-end border-b border-[#333333] pb-4 mb-4">
                <span className="font-mono text-sm text-[#555555]">MODEL.ACCURACY</span>
                <span className="font-mono text-3xl text-[#E2FF00]">99.4%</span>
              </div>
              <div className="flex justify-between items-end border-b border-[#333333] pb-4 mb-4">
                <span className="font-mono text-sm text-[#555555]">PRICE.ELASTICITY</span>
                <span className="font-mono text-3xl text-white">+14.2%</span>
              </div>
              <div className="w-full h-32 mt-8 opacity-50">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10" fill="none" stroke="#E2FF00" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10 L100,100 L0,100 Z" fill="rgba(226,255,0,0.1)" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* NEW: Intelligence Mesh Section */}
      <section className="relative z-10 py-40 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#000000] overflow-hidden">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 className="relative aspect-video bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden group"
               >
                  <img 
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=2000" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-[2s]"
                    alt="Datacenter"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                     <div className="flex items-center gap-4 text-[#E2FF00] mb-4">
                        <ShieldCheck className="w-6 h-6" />
                        <span className="font-mono text-xs tracking-widest uppercase">Verified Node.042</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#E2FF00]"
                          animate={{ width: ["0%", "85%", "70%", "95%"] }}
                          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                        />
                     </div>
                  </div>
               </motion.div>

               <div>
                  <h2 className="font-heading text-5xl md:text-8xl text-white tracking-tighter leading-none mb-8">
                    Scale Without <br/> Friction.
                  </h2>
                  <p className="text-[#888888] text-xl font-medium leading-relaxed mb-12">
                    CORE handles the complexity of global scale so you can focus on the velocity of your growth. Our distributed architecture ensures that as you add warehouses, users, and territories, the system actually gets faster through data-locality optimization.
                  </p>
                  <div className="grid grid-cols-2 gap-8">
                     <div>
                        <p className="text-3xl font-heading text-white mb-2">99.999%</p>
                        <p className="text-xs font-bold text-[#444444] uppercase tracking-widest">Uptime SLA</p>
                     </div>
                     <div>
                        <p className="text-3xl font-heading text-white mb-2">Multi-Region</p>
                        <p className="text-xs font-bold text-[#444444] uppercase tracking-widest">Failover Support</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Massive Call to Action */}
      <section className="relative z-10 py-60 px-6 md:px-16 border-t border-[#1A1A1A] bg-[#E2FF00] flex flex-col items-center justify-center group overflow-hidden cursor-pointer" onClick={() => window.location.href='/login'}>
        {/* Animated Background Rays */}
        <div className="absolute inset-0 z-0 opacity-10 scale-150 rotate-45 group-hover:rotate-90 transition-transform duration-[3s]" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, black 40px, black 80px)' }} />

        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 font-heading text-6xl md:text-[10rem] font-black tracking-tighter text-black uppercase leading-none text-center"
        >
          Initialize <br/> System.
        </motion.h2>
        <div className="relative z-10 mt-12 w-20 h-20 bg-black text-[#E2FF00] rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-500 shadow-2xl">
          <ArrowRight className="w-10 h-10 group-hover:translate-x-1 transition-transform" />
        </div>
      </section>

      {/* Massive Brutalist Footer */}
      <footer className="relative z-10 bg-[#050505] text-[#EAEAEA] py-32 px-6 md:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-16 mb-24">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-8xl md:text-[10rem] font-bold tracking-tighter text-white leading-none">CORE.</h2>
            <p className="font-bold text-xl uppercase tracking-widest mt-2 px-2 text-[#E2FF00]">Enterprise OS</p>
          </div>
          <div className="flex gap-16 md:gap-32 font-bold uppercase tracking-widest text-sm text-[#888888]">
            <div className="flex flex-col gap-6">
              <Link href="/about" className="hover:text-[#E2FF00] transition-colors">About</Link>
              <Link href="/pricing" className="hover:text-[#E2FF00] transition-colors">Pricing</Link>
              <Link href="/guide" className="hover:text-[#E2FF00] transition-colors">Guide</Link>
            </div>
            <div className="flex flex-col gap-6">
              <Link href="/contact" className="hover:text-[#E2FF00] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#E2FF00] transition-colors">Privacy</Link>
              <a href="#manifesto" className="hover:text-[#E2FF00] transition-colors">Manifesto</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-[#222222] pt-8 text-[#555555] font-bold uppercase text-[10px] tracking-[0.3em]">
          <div className="flex gap-8 mb-4 md:mb-0">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#E2FF00] animate-pulse" /> Neural Load: 14%</span>
            <span className="flex items-center gap-2 text-white/20"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active Nodes: 1,024</span>
            <span className="flex items-center gap-2 text-white/20"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Latency: 0.4ms</span>
          </div>
          <p>© 2026 Foxmen Studio. All rights reserved. Built for precision.</p>
        </div>
      </footer>
    </div>
  );
}
