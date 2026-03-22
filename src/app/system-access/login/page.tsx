"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

// Force dynamic render to avoid static prerender errors during build
export const dynamic = "force-dynamic";

function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Always clear any existing session on entry
  useEffect(() => {
    signOut();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('أدخل البريد وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    // Rate limit now fail-open (server returns ok); keep call for future
    await fetch('/api/system-access/rate-limit', { method: 'POST', cache: 'no-store' }).catch(() => {});

    const { error } = await signIn(email.trim().toLowerCase(), password);

    if (error) {
      setIsLoading(false);
      toast.error('بيانات الدخول غير صحيحة أو الحساب مقيد.');
      return;
    }

    // Force-load session to ensure cookies/localStorage are set before redirect
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax;${window.location.protocol === 'https:' ? ' Secure' : ''}`;
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug('[auth] post-login session', data?.session ? 'present' : 'missing');
    }

    setIsLoading(false);
    router.replace(redirect);
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-black text-white mb-2">
            دخول الإدارة الآمن
          </h1>
          <p className="text-sm font-bold text-gray-500">
            يتم تتبع المحاولات واللوغين محمي
          </p>
        </div>

        <div className="bg-[#0a0e14] border border-white/5 shadow-2xl rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 ms-1 uppercase tracking-widest">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl ps-12 pe-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold"
                  placeholder="admin@example.com"
                  dir="ltr"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 ms-1 uppercase tracking-widest">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl ps-12 pe-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all tracking-widest font-bold"
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-primary hover:bg-primary-hover active:bg-primary/80 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جار التحقق...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  دخول الإدارة
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
            &larr; العودة للمتجر
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SecureAdminLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">جار التحميل...</div>}>
      <LoginClient />
    </Suspense>
  );
}
