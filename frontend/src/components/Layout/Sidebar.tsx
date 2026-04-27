"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    FileText,
    Building2,
    Settings,
    BrainCircuit,
    DollarSign,
    Users,
    BarChart3,
    ChevronDown,
    LogOut
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles?: string[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
    roles?: string[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: "Operations",
        roles: ['admin', 'manager', 'sales', 'staff', 'auditor'],
        items: [
            { name: 'Inventory', href: '/inventory', icon: Package },
            { name: 'Sales & Orders', href: '/sales', icon: ShoppingCart },
            { name: 'Customers', href: '/customers', icon: Users },
        ]
    },
    {
        label: "Finance",
        roles: ['admin', 'manager', 'finance', 'auditor'],
        items: [
            { name: 'Finance & Accounts', href: '/finance', icon: DollarSign },
            { name: 'Reports', href: '/reports', icon: BarChart3 },
        ]
    },
    {
        label: "People",
        roles: ['admin', 'manager', 'hr_manager'],
        items: [
            { name: 'HR & People', href: '/hr', icon: Building2 },
        ]
    },
    {
        label: "System",
        roles: ['admin', 'manager'],
        items: [
            { name: 'Smart Reports', href: '/reports', icon: FileText, roles: ['admin'] },
            { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] z-20 shadow-sm relative">
                {/* Branding */}
                <div className="flex h-16 shrink-0 items-center px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-white">Core ERP</span>
                    </Link>
                </div>

                {/* Nav Links */}
                <div className="flex flex-col h-0 flex-1 overflow-y-auto px-3 py-5 space-y-5">
                    {NAV_GROUPS.filter(group => !group.roles || (user?.role && group.roles.includes(user.role))).map((group) => (
                        <div key={group.label}>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 px-3">
                                {group.label}
                            </p>
                            <nav className="space-y-0.5">
                                {group.items
                                    .filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))
                                    .map((navItem) => {
                                        const isActive = pathname === navItem.href || pathname.startsWith(navItem.href + '/');
                                        return (
                                            <Link
                                                key={navItem.href}
                                                href={navItem.href}
                                                className={`
                                                    group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-100 dark:border-brand-500/20'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                                                    }
                                                `}
                                            >
                                                <navItem.icon
                                                    className={`flex-shrink-0 mr-3 h-4 w-4 transition-colors ${ isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                                                />
                                                {navItem.name}
                                            </Link>
                                        );
                                    })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* User Footer */}
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/50 p-3">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => logout?.()}
                            title="Sign out"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
