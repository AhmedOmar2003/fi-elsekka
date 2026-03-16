import { NextRequest, NextResponse } from 'next/server';
import { extractAccessToken, verifyAdminToken } from './lib/admin-guard';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAdminPage = pathname.startsWith('/admin');
    const isAdminApi  = pathname.startsWith('/api/admin');

    // Skip the secure admin access pages themselves
    if (pathname.startsWith('/system-access')) {
        return NextResponse.next();
    }

    // Allow password reset/update flow
    if (pathname.startsWith('/update-password')) {
        return NextResponse.next();
    }

    if (!isAdminPage && !isAdminApi) {
        return NextResponse.next();
    }

    // Allow the login page redirect target (internal admin/login was removed,
    // but keep this guard for safety so we don't redirect-loop)
    if (pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/system-access/login', request.url));
    }

    const token = extractAccessToken(request);

    if (!token) {
        if (isAdminApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/system-access/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const { isAdmin, role, disabled } = await verifyAdminToken(token);

    if (!isAdmin || disabled) {
        if (isAdminApi) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        const loginUrl = new URL('/system-access/login', request.url);
        loginUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(loginUrl);
    }

    // Route-level role gate: staff management only for super_admin
    if (pathname.startsWith('/admin/staff') && role !== 'super_admin') {
        if (isAdminApi) {
            return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 });
        }
        const loginUrl = new URL('/admin', request.url);
        loginUrl.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(loginUrl);
    }

    // Admin verified — pass through
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
    ],
};
