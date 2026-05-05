"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Globe, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Mail,
  ExternalLink
} from "lucide-react";

const FOOTER_LINKS = {
  product: [
    { label: "Architecture", href: "/#architecture" },
    { label: "Pricing", href: "/pricing" },
    { label: "Documentation", href: "/guide" },
    { label: "System Status", href: "/status" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Manifesto", href: "/#manifesto" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  resources: [
    { label: "Community", href: "/community" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Open Source", href: "/github" },
    { label: "Brand Kit", href: "/brand" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Security", href: "/security" },
  ]
};

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#050505] text-[#EAEAEA] pt-32 pb-12 px-6 md:px-16 overflow-hidden border-t border-[#1A1A1A]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E2FF00]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="group mb-8">
              <h2 className="font-heading text-7xl font-bold tracking-tighter text-white leading-none group-hover:text-[#E2FF00] transition-colors">
                CORE<span className="italic">.</span>
              </h2>
              <div className="flex items-center gap-2 mt-4 px-2 py-1 bg-white/5 border border-white/10 rounded-sm">
                <div className="w-2 h-2 rounded-full bg-[#E2FF00] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888]">Enterprise Intelligence OS</span>
              </div>
            </Link>
            
            <p className="text-[#666666] text-lg font-medium leading-relaxed mb-8 max-w-sm">
              The high-velocity operating system for the next generation of global commerce. Powered by predictive neural matrices.
            </p>

            {/* Foxmen Studio Branding */}
            <div className="mt-auto pt-8 border-t border-[#1A1A1A] w-full">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#444444] uppercase tracking-[0.3em]">Developed By</span>
                <Link 
                  href="https://foxmen.studio" 
                  target="_blank"
                  className="group flex items-center gap-3 text-white hover:text-[#E2FF00] transition-all"
                >
                  <span className="font-heading text-2xl tracking-tighter font-bold">Foxmen Studio</span>
                  <div className="h-px w-8 bg-[#333333] group-hover:w-12 group-hover:bg-[#E2FF00] transition-all" />
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Product</h4>
              <ul className="space-y-4">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#888888] hover:text-[#E2FF00] transition-colors font-medium text-sm flex items-center group">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Company</h4>
              <ul className="space-y-4">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#888888] hover:text-[#E2FF00] transition-colors font-medium text-sm flex items-center group">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Resources</h4>
              <ul className="space-y-4">
                {FOOTER_LINKS.resources.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#888888] hover:text-[#E2FF00] transition-colors font-medium text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Legal</h4>
              <ul className="space-y-4">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#888888] hover:text-[#E2FF00] transition-colors font-medium text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Status Bar & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-y border-[#1A1A1A] mb-12">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#444444] uppercase tracking-[0.3em]">Neural Load</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#E2FF00]"
                    animate={{ width: ["14%", "18%", "12%", "16%"] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  />
                </div>
                <span className="font-mono text-xs text-[#E2FF00]">14.2%</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#444444] uppercase tracking-[0.3em]">Active Nodes</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="font-mono text-xs text-white">1,024 ONLINE</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#444444] uppercase tracking-[0.3em]">Integrity</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span className="font-mono text-xs text-white">99.9% SECURE</span>
              </div>
            </div>
          </div>

          {/* Newsletter / Stay Sync */}
          <div className="flex flex-col md:items-end gap-4">
             <div className="w-full max-w-sm">
                <span className="text-[10px] font-bold text-[#444444] uppercase tracking-[0.3em] mb-4 block">Synchronize Updates</span>
                <div className="relative group">
                  <input 
                    type="email" 
                    placeholder="terminal@enterprise.ai"
                    className="w-full bg-white/5 border border-[#222222] focus:border-[#E2FF00] rounded-sm py-4 px-6 text-sm font-medium outline-none transition-all placeholder:text-[#333333]"
                  />
                  <button className="absolute right-2 top-2 bottom-2 px-6 bg-[#E2FF00] text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors">
                    Join
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-[#444444]">
          <div className="flex gap-8 items-center">
            <p>© 2026 CORE. ALL RIGHTS RESERVED.</p>
            <div className="hidden md:block w-px h-4 bg-[#222222]" />
            <p className="hidden md:block">BUILD 2.0.4-STABLE</p>
          </div>

          <div className="flex gap-8 items-center">
            <Link href="/github" className="hover:text-[#E2FF00] transition-colors flex items-center gap-2">
              <Github className="w-4 h-4" /> GITHUB
            </Link>
            <Link href="/twitter" className="hover:text-[#E2FF00] transition-colors flex items-center gap-2">
              <Twitter className="w-4 h-4" /> TWITTER
            </Link>
            <Link href="/linkedin" className="hover:text-[#E2FF00] transition-colors flex items-center gap-2">
              <Linkedin className="w-4 h-4" /> LINKEDIN
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
