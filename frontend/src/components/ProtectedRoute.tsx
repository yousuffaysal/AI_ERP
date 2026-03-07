"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            if (!isAuthenticated && pathname !== '/login') {
                router.push('/login');
            }
        }
    }, [isAuthenticated, isMounted, pathname, router]);

    // Prevent hydration mismatch by holding render until mounted
    if (!isMounted) return null;

    // If unauthed and on a protected route, render nothing while redirecting
    if (!isAuthenticated && pathname !== '/login') return null;

    return <>{children}</>;
}
