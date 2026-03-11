"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from '@/services/authService';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Force clear any existing user session when entering the admin login page
    useEffect(() => {
        signOut();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
            return;
        }

        setIsLoading(true);
        const { error } = await signIn(email, password);
        
        if (error) {
            setIsLoading(false);
            if (error.message.includes('Invalid login credentials')) {
                toast.error("بيانات الدخول غير صحيحة.");
            } else {
                toast.error("حدث خطأ أثناء تسجيل الدخول.");
            }
            return;
        }

        toast.success("مرحباً بك في لوحة التحكم!");
        router.push('/admin');
    };

    return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-heading font-black text-white mb-2">تسجيل الدخول للإدارة</h1>
                    <p className="text-sm font-bold text-gray-500">مرحباً بك مجدداً في نظام إدارة "في السكة"</p>
                </div>

                {/* Form Card */}
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
                                    placeholder="admin@admin.com"
                                    dir="ltr"
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
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-primary hover:bg-primary-hover active:bg-primary/80 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "دخول إلى لوحة التحكم"
                            )}
                        </button>
                    </form>
                </div>
                
                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <a href="/" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
                        &larr; العودة للمتجر
                    </a>
                </div>
            </div>
        </div>
    );
}
