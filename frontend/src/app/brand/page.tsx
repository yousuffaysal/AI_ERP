"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft,
  Download, 
  Type, 
  Palette, 
  Layout, 
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";
import Footer from "@/components/Layout/Footer";

const COLORS = [
  { name: "CORE Black", hex: "#030303", usage: "Primary Background" },
  { name: "CORE Neon", hex: "#E2FF00", usage: "Primary Accent / Action" },
  { name: "CORE White", hex: "#EAEAEA", usage: "Main Typography" },
  { name: "CORE Gray", hex: "#888888", usage: "Secondary Text" },
  { name: "Neural Gray", hex: "#1A1A1A", usage: "Borders / Grids" },
];

function ColorCard({ color }: { color: typeof COLORS[0] }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group border border-[#1A1A1A] p-6 hover:border-white/20 transition-all">
      <div 
        className="aspect-video w-full mb-6 relative cursor-pointer overflow-hidden" 
        style={{ backgroundColor: color.hex }}
        onClick={copyToClipboard}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
           {copied ? <Check className="w-8 h-8 text-white" /> : <Copy className="w-8 h-8 text-white" />}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] font-black text-[#444444] uppercase tracking-widest mb-1">{color.usage}</p>
           <h3 className="text-xl font-bold text-white tracking-tight">{color.name}</h3>
        </div>
        <span className="font-mono text-sm text-[#888888]">{color.hex}</span>
      </div>
    </div>
  );
}

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#EAEAEA] selection:bg-[#E2FF00] selection:text-black font-sans overflow-x-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Nav */}
      <nav className="relative z-50 w-full py-8 px-6 md:px-16 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="group flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-[#E2FF00] transition-colors" />
          <span className="font-heading text-2xl tracking-tight text-[#EAEAEA]">
            CORE<span className="text-[#E2FF00] italic">.</span>BRAND
          </span>
        </Link>
        <button className="h-10 px-6 flex items-center gap-2 bg-[#E2FF00] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
          <Download className="w-4 h-4" /> Download Kit (.ZIP)
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-32 px-6 md:px-16">
        {/* Header */}
        <section className="mb-40">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs tracking-[0.4em] text-[#E2FF00] uppercase mb-8">
            — VISUAL IDENTITY —
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-heading text-6xl md:text-[8rem] font-bold tracking-tighter leading-[0.8] text-white mb-16">
            Brutalist<br />
            <span className="italic text-[#E2FF00]">Intelligence.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-2xl text-[#888888] text-2xl font-medium leading-relaxed">
            The CORE brand is defined by high-contrast aesthetics, industrial grids, and technical precision. We prioritize clarity, velocity, and raw power.
          </motion.p>
        </section>

        {/* Logos */}
        <section className="mb-40">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
               <Layout className="w-8 h-8 text-[#E2FF00]" /> Logotype
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-[#050505] border border-[#1A1A1A] aspect-video flex items-center justify-center p-20 group relative overflow-hidden">
               <div className="font-heading text-8xl md:text-[10rem] font-bold tracking-tighter text-white">CORE.</div>
               <div className="absolute top-6 right-6 text-[10px] font-black text-[#444444] uppercase tracking-widest">Primary Mark</div>
            </div>
            <div className="bg-[#E2FF00] aspect-video flex items-center justify-center p-20 group relative overflow-hidden">
               <div className="font-heading text-8xl md:text-[10rem] font-bold tracking-tighter text-black">CORE.</div>
               <div className="absolute top-6 right-6 text-[10px] font-black text-black/40 uppercase tracking-widest">Inverted Mark</div>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-40">
           <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4 mb-16">
               <Palette className="w-8 h-8 text-[#E2FF00]" /> Color Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
               {COLORS.map(color => <ColorCard key={color.hex} color={color} />)}
            </div>
        </section>

        {/* Typography */}
        <section className="mb-40">
           <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4 mb-16">
               <Type className="w-8 h-8 text-[#E2FF00]" /> Typography
            </h2>
            <div className="border border-[#1A1A1A] p-12 space-y-24">
               <div>
                  <p className="text-[10px] font-black text-[#444444] uppercase tracking-[0.4em] mb-8">Heading Font — Inter Black / Custom</p>
                  <h3 className="font-heading text-6xl md:text-9xl text-white tracking-tighter leading-none mb-4">THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.</h3>
                  <p className="text-[#888888] font-medium">Used for high-impact displays, titles, and brand elements.</p>
               </div>
               <div className="h-px bg-[#1A1A1A]" />
               <div>
                  <p className="text-[10px] font-black text-[#444444] uppercase tracking-[0.4em] mb-8">Interface Font — Inter Medium</p>
                  <p className="text-4xl text-[#EAEAEA] leading-snug max-w-4xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890 !@#$%^&*()</p>
                  <p className="text-[#888888] font-medium mt-8">Used for all interface text, descriptions, and operational data.</p>
               </div>
            </div>
        </section>

        {/* Call to action */}
        <section className="bg-[#E2FF00] p-16 text-black text-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">Need custom assets?</h2>
              <p className="text-lg font-medium mb-12 max-w-xl mx-auto">Our design team can provide high-resolution vectors, 3D renders, and motion guidelines for approved partners.</p>
              <Link href="/contact" className="inline-flex items-center gap-3 h-14 px-10 bg-black text-[#E2FF00] font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors">
                Contact Design Team <ArrowRight className="w-4 h-4" />
              </Link>
           </div>
           {/* Brutalist patterns */}
           <div className="absolute top-0 right-0 p-8 opacity-20 font-heading text-[20rem] leading-none tracking-tighter select-none pointer-events-none">C.</div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
