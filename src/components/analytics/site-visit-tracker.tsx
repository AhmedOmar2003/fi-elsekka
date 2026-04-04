"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSafeLocalStorage } from '@/lib/browser-storage';

const VISITOR_ID_KEY = 'fi-elsekka-visitor-id';
const SESSION_ID_KEY = 'fi-elsekka-session-id';
const LAST_PATH_KEY = 'fi-elsekka-last-path';
const EXCLUDED_PREFIXES = ['/admin', '/driver', '/system-access', '/api', '/_next'];
const PAGE_VIEW_DEBOUNCE_MS = 5000;
const storage = getSafeLocalStorage();

function getSafeSessionStorage() {
    if (typeof window === 'undefined') {
        return {
            getItem: () => null as string | null,
            setItem: () => {},
        };
    }

    try {
        return window.sessionStorage;
    } catch {
        return {
            getItem: () => null as string | null,
            setItem: () => {},
        };
    }
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getVisitorId() {
    const existing = storage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;

    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    storage.setItem(VISITOR_ID_KEY, next);
    return next;
}

function getSessionId() {
    const sessionStorage = getSafeSessionStorage();
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    sessionStorage.setItem(SESSION_ID_KEY, next);
    return next;
}

export function SiteVisitTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
            return;
        }

        if (typeof navigator !== 'undefined') {
            const networkInformation = navigator as Navigator & {
                connection?: {
                    saveData?: boolean
                }
            }
            const prefersReducedData =
                !!networkInformation.connection &&
                !!networkInformation.connection.saveData;

            if (prefersReducedData || navigator.doNotTrack === '1') {
                return;
            }
        }

        const visitKey = `fi-elsekka-site-visit:${todayKey()}`;
        const sessionStorage = getSafeSessionStorage();
        const win = window as Window & {
            requestIdleCallback?: (callback: IdleRequestCallback) => number
            cancelIdleCallback?: (handle: number) => void
        }
        const schedule = (callback: IdleRequestCallback) => {
            if (typeof win.requestIdleCallback === 'function') {
                return win.requestIdleCallback(callback)
            }

            return win.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1200)
        }

        const cancelSchedule = (taskId: number) => {
            if (typeof win.cancelIdleCallback === 'function') {
                win.cancelIdleCallback(taskId)
                return
            }

            win.clearTimeout(taskId)
        }

        const taskId = schedule(() => {
            const visitorId = getVisitorId();
            const sessionId = getSessionId();
            const previousPath = sessionStorage.getItem(LAST_PATH_KEY) || null;
            const pageViewKey = `fi-elsekka-page-view:${pathname}`;
            const lastPageViewAt = Number(sessionStorage.getItem(pageViewKey) || 0);
            const now = Date.now();
            if (now - lastPageViewAt < PAGE_VIEW_DEBOUNCE_MS) {
                return;
            }

            sessionStorage.setItem(pageViewKey, String(now));
            sessionStorage.setItem(LAST_PATH_KEY, pathname);
            const shouldCountVisitor = storage.getItem(visitKey) !== '1';
            if (shouldCountVisitor) {
                storage.setItem(visitKey, '1');
            }

            const payload = JSON.stringify({
                path: pathname,
                visitorId,
                sessionId,
                previousPath,
            });

            const beaconSent =
                typeof navigator !== 'undefined' &&
                typeof navigator.sendBeacon === 'function' &&
                navigator.sendBeacon('/api/analytics/visit', new Blob([payload], { type: 'application/json' }));

            if (beaconSent) {
                return;
            }

            fetch('/api/analytics/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).then(async (res) => {
                if (!res.ok && shouldCountVisitor) {
                    storage.removeItem(visitKey);
                }
            }).catch(() => {
                if (shouldCountVisitor) {
                    storage.removeItem(visitKey);
                }
                // Ignore transient visit tracking failures so navigation stays smooth.
            });
        });

        return () => cancelSchedule(taskId as number);
    }, [pathname]);

    return null;
}
