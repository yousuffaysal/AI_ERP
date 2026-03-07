"use client";

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex justify-between">
                {/* Left side (Search could go here) */}
                <div className="flex-1 flex items-center">
                    <div className="w-full max-w-lg lg:max-w-xs relative hidden sm:block">
                        {/* Search box placeholder */}
                    </div>
                </div>

                {/* Right side Profile */}
                <div className="ml-4 flex items-center md:ml-6 gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 hidden sm:flex">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{user?.first_name} {user?.last_name}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs ml-2">{user?.role}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
                        title="Sign out"
                    >
                        <span className="sr-only">Sign out</span>
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
