"use client";

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Search, Bell } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="flex-1 px-4 sm:px-6 md:px-8 flex justify-between items-center w-full h-full">
                
                {/* Global Search */}
                <div className="flex-1 flex max-w-2xl">
                    <div className="w-full relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search anywhere..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-full leading-5 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#1e293b] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>
                </div>

                {/* Right side Profile & Notifications */}
                <div className="ml-4 flex items-center md:ml-6 gap-3">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors">
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0a0f1c]" />
                    </button>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                    {/* Profile Dropdown Trigger */}
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                            </span>
                            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">
                                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'Employee'}
                            </span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-brand-100 dark:from-indigo-900/50 dark:to-brand-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                            {(user?.first_name?.[0] || 'A').toUpperCase()}
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="ml-2 p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none transition-colors"
                        title="Sign out"
                    >
                        <span className="sr-only">Sign out</span>
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
