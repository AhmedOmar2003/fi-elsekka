"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ThemeProvider } from 'next-themes';

const SiteVisitTracker = dynamic(
    () => import('@/components/analytics/site-visit-tracker').then((mod) => mod.SiteVisitTracker),
    { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    const [shouldMountTracker, setShouldMountTracker] = React.useState(false);

    React.useEffect(() => {
        const win = window as Window & {
            requestIdleCallback?: (callback: IdleRequestCallback) => number
            cancelIdleCallback?: (handle: number) => void
        }

        const schedule = (callback: IdleRequestCallback) => {
            if (typeof win.requestIdleCallback === 'function') {
                return win.requestIdleCallback(callback)
            }

            return win.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1000)
        }

        const cancelSchedule = (taskId: number) => {
            if (typeof win.cancelIdleCallback === 'function') {
                win.cancelIdleCallback(taskId)
                return
            }

            win.clearTimeout(taskId)
        }

        const taskId = schedule(() => setShouldMountTracker(true));
        return () => cancelSchedule(taskId as number);
    }, []);

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AppSettingsProvider>
                <AuthProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            {shouldMountTracker ? <SiteVisitTracker /> : null}
                            {children}
                        </FavoritesProvider>
                    </CartProvider>
                </AuthProvider>
            </AppSettingsProvider>
        </ThemeProvider>
    );
}
