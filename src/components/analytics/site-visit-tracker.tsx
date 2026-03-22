"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_ID_KEY = 'fi-elsekka-visitor-id';
const EXCLUDED_PREFIXES = ['/admin', '/driver', '/system-access', '/api', '/_next'];

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getVisitorId() {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;

    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(VISITOR_ID_KEY, next);
    return next;
}

export function SiteVisitTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
            return;
        }

        const visitKey = `fi-elsekka-site-visit:${todayKey()}`;
        if (window.localStorage.getItem(visitKey) === '1') {
            return;
        }

        const visitorId = getVisitorId();
        window.localStorage.setItem(visitKey, '1');

        fetch('/api/analytics/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: pathname,
                visitorId,
            }),
            keepalive: true,
        }).catch(() => {
            // Ignore transient visit tracking failures so navigation stays smooth.
        });
    }, [pathname]);

    return null;
}
