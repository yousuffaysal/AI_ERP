"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { BrainCircuit, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      const response = await api.post('/auth/login/', {
        email: data.email,
        password: data.password,
      });

      const { refresh, access, user } = response.data;
      login(access, refresh, user);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setGlobalError("Invalid email or password.");
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || !err.response) {
        setGlobalError("Cannot reach the server. Make sure the backend is running on port 8000.");
      } else {
        setGlobalError(`Server error (${err.response?.status ?? 'unknown'}). Please try again.`);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#060a12] text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-slate-900">
      {/* Left Pane - Branding & Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-[#0a0f1c] to-[#0a0f1c] z-0" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-brand-600/20 blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none mix-blend-screen" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 transition-transform group-hover:scale-105">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tight text-white">Core ERP</span>
          </Link>
        </div>

        <div className="relative z-10 mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-heading font-bold text-white leading-[1.1] mb-6"
          >
            Intelligence that <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">drives growth.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-slate-300 max-w-md leading-relaxed"
          >
            Access the centralized AI engine for inventory forecasting, secure financial audits, and automated sales insights.
          </motion.p>
        </div>

        {/* Decorative Graphic */}
        <div className="relative z-10 w-full max-w-md">
          <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-2xl">
            <div className="h-4 w-1/3 bg-white/10 rounded-full" />
            <div className="flex-1 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden flex items-end p-4 gap-2">
               {[40, 70, 45, 90, 65, 80].map((h, i) => (
                 <motion.div 
                   key={i}
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   transition={{ duration: 1, delay: 0.5 + (i * 0.1), type: "spring" }}
                   className="flex-1 bg-gradient-to-t from-brand-500/80 to-indigo-400/80 rounded-t-sm"
                 />
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight">Core ERP</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm space-y-8"
        >
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access your dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {globalError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="text-sm font-medium text-red-800 dark:text-red-300">{globalError}</div>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                suppressHydrationWarning
                {...register('email')}
                type="email"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                suppressHydrationWarning
                {...register('password')}
                type="password"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1 pl-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            Don't have an account?{' '}
            <a href="#" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
              Contact IT Support
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
