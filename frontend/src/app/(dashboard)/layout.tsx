"use client";

import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-screen overflow-hidden bg-slate-50">
                <Sidebar />
                <div className="flex flex-col flex-1 w-0 overflow-hidden">
                    <Header />
                    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none py-6 px-4 sm:px-6 md:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
