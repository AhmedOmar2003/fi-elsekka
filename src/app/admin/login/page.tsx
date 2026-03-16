"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/services/authService';

export default function DeprecatedAdminLogin() {
    const router = useRouter();
    const params = useSearchParams();
    const redirect = params.get('redirect') || '/admin';

    useEffect(() => {
        signOut().finally(() => {
            router.replace(`/system-access/login?redirect=${encodeURIComponent(redirect)}`);
        });
    }, [redirect, router]);

    return null;
}
