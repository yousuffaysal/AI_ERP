"use client";

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { 
    Cpu, 
    Globe, 
    Mail, 
    Phone, 
    ArrowRight, 
    Zap, 
    Shield, 
    Star,
    Layers,
    MousePointer2
} from 'lucide-react';

export default function FoxmenStudioPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const backgroundY = useTransform(springScroll, [0, 1], ["0%", "20%"]);
    const textScale = useTransform(springScroll, [0, 0.2], [1, 1.1]);

    const features = [
        { title: "Next-Gen UI/UX", desc: "Crafting interfaces that breathe and interact.", icon: MousePointer2, color: "#9333ea" },
        { title: "AI Integration", desc: "Smarter workflows powered by neural intelligence.", icon: Cpu, color: "#E2FF00" },
        { title: "Global Scale", desc: "Architecture designed for the next billion users.", icon: Globe, color: "#3b82f6" },
        { title: "Vault Security", desc: "Military-grade encryption for enterprise data.", icon: Shield, color: "#10b981" }
    ];

    return (
        <div ref={containerRef} className="min-h-[200vh] bg-[#070707] text-white font-ibm-sans selection:bg-purple-500 selection:text-white overflow-hidden relative">
            
            {/* Animated Background Layers */}
            <motion.div 
                style={{ y: backgroundY }}
                className="fixed inset-0 pointer-events-none z-0"
            >
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#E2FF00]/5 blur-[100px] rounded-full" />
            </motion.div>

            {/* Grid Pattern Overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            {/* Content Container */}
            <div className="relative z-10">
                
                {/* Hero Section */}
                <section className="h-screen flex flex-col items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-8">
                            <Zap className="w-3 h-3" /> Partner Spotlight
                        </div>
                        
                        <motion.h1 
                            style={{ scale: textScale }}
                            className="text-6xl md:text-8xl lg:text-9xl font-ibm-serif font-bold tracking-tighter leading-none mb-6"
                        >
                            Foxmen <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 italic">Studio</span>
                        </motion.h1>
                        
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                            A premium collaboration between AI ERP and Foxmen Studio. 
                            Engineering the future of enterprise aesthetics and functional excellence.
                        </p>

                        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-[#E2FF00] transition-all flex items-center gap-3 group">
                                Explore Vision <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a href="https://foxmen.studio" target="_blank" className="text-slate-300 hover:text-white font-bold flex items-center gap-2 transition-colors">
                                Visit foxmen.studio
                            </a>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    >
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Scroll to dive</span>
                        <div className="w-px h-12 bg-gradient-to-b from-purple-500 to-transparent" />
                    </motion.div>
                </section>

                {/* Features Section - Interactive Horizontal Grid */}
                <section className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div 
                                    className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
                                    style={{ backgroundColor: f.color }}
                                />
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                    <f.icon className="w-6 h-6 text-white group-hover:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-ibm-serif font-bold mb-3">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Dynamic Product Showcase */}
                <section className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <motion.h2 
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-6xl font-ibm-serif font-bold mb-8"
                            >
                                Redefining the <br /> 
                                <span className="text-purple-500 italic underline decoration-[#E2FF00] decoration-4 underline-offset-8">Enterprise Edge</span>
                            </motion.h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Foxmen Studio doesn't just build software; we architect experiences. 
                                By merging our design-first philosophy with AI ERP's robust backbone, 
                                we've created a product that isn't just a tool—it's a masterpiece.
                            </p>
                            <ul className="space-y-4">
                                {["Unified Data Visualizer", "Neural Task Orchestrator", "Hyper-Responsive Dashboards"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-200 font-bold">
                                        <div className="w-2 h-2 rounded-full bg-[#E2FF00]" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="lg:w-1/2 relative">
                            <motion.div 
                                animate={{ 
                                    y: [0, -20, 0],
                                    rotateX: [15, 10, 15],
                                    rotateY: [-15, -10, -15]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full aspect-square bg-gradient-to-br from-purple-600/20 to-transparent rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl p-8 flex items-center justify-center relative perspective-[1000px]"
                            >
                                <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full" />
                                <div className="text-[12rem] font-ibm-serif font-black text-white/5 select-none absolute">F</div>
                                <Layers className="w-32 h-32 text-purple-400 relative z-10" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Footer / Contact Section */}
                <section className="py-32 bg-white/5 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="lg:col-span-2">
                            <h2 className="text-3xl font-ibm-serif font-bold mb-6">Let's craft your next <br /> masterpiece together.</h2>
                            <p className="text-slate-400 mb-8 max-w-lg">
                                Ready to elevate your enterprise intelligence? Foxmen Studio is ready 
                                to help you design, deploy, and dominate.
                            </p>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Us</p>
                                        <p className="font-bold">info@foxmenstudio.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#E2FF00]/10 flex items-center justify-center text-[#E2FF00]">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Call Us</p>
                                        <p className="font-bold">+880 1753973892</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end items-start lg:items-end">
                            <div className="text-right mb-8">
                                <h3 className="text-5xl font-ibm-serif font-bold text-white">Studio</h3>
                                <p className="text-purple-400 font-bold italic">Dhaka &bull; Global</p>
                            </div>
                            <button className="w-full lg:w-auto px-10 py-5 bg-[#E2FF00] text-black font-black uppercase tracking-tighter rounded-2xl hover:scale-105 transition-transform">
                                Connect with Us
                            </button>
                        </div>
                    </div>
                </section>

                {/* Legal / Sub-footer */}
                <footer className="py-12 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-bold">© 2026 FOXMEN STUDIO. ALL RIGHTS RESERVED.</p>
                    <div className="flex gap-8 text-slate-500 text-xs font-bold">
                        <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
                        <a href="#" className="hover:text-white transition-colors">TERMS</a>
                        <a href="#" className="hover:text-white transition-colors">SITEMAP</a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
