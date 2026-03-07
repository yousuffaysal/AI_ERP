"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Layers, Loader2 } from 'lucide-react';

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
            // Hit Django DRF endpoint
            const response = await api.post('/accounts/login/', {
                email: data.email,
                password: data.password,
            });

            const { refresh, access, user } = response.data;

            // Save to Zustand & LocalStorage
            login(access, refresh, user);

            // Redirect to Dashboard
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 401) {
                setGlobalError("Invalid email or password.");
            } else {
                setGlobalError("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center text-indigo-600 mb-6">
                    <Layers className="h-12 w-12" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
                    Sign in to Core ERP
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Powered by Enterprise AI
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

                        {globalError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-sm text-red-700">{globalError}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Email Address
                            </label>
                            <div className="mt-1">
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                        }`}
                                    placeholder="admin@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    {...register('password')}
                                    type="password"
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
