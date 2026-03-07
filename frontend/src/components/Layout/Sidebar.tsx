"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    FileText,
    Building2,
    Settings
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory & AI', href: '/inventory', icon: Package },
    { name: 'Sales & Pricing', href: '/sales', icon: ShoppingCart },
    { name: 'Smart Reports', href: '/reports', icon: FileText },
    { name: 'HR & Teams', href: '/hr', icon: Building2 },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 border-r border-slate-200 bg-slate-50">
                <div className="flex flex-col h-0 flex-1 pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-6">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Core ERP
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                            AI
                        </span>
                    </div>
                    <nav className="mt-8 flex-1 px-4 space-y-1 block">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                    ${isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }
                  `}
                                >
                                    <item.icon
                                        className={`
                      flex-shrink-0 -ml-1 mr-3 h-5 w-5
                      ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}
                    `}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Settings Footer */}
                <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
                    <button className="flex-shrink-0 w-full group block">
                        <div className="flex items-center">
                            <div>
                                <Settings className="inline-block h-5 w-5 rounded-full text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                    Settings
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
