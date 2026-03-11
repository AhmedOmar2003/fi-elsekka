"use client"

import React, { useState, useEffect } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { validateDiscountCode, applyDiscount } from '@/services/discountCodesService';

interface DiscountCodeInputProps {
    originalPrice: number;
    onDiscountApplied: (finalPrice: number, savedAmount: number, label: string) => void;
    onDiscountRemoved: () => void;
}

export function DiscountCodeInput({ originalPrice, onDiscountApplied, onDiscountRemoved }: DiscountCodeInputProps) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [appliedCode, setAppliedCode] = useState('');
    const [message, setMessage] = useState('');

    // Load saved code on mount
    useEffect(() => {
        const loadSavedCode = async () => {
            const savedCode = localStorage.getItem('applied_discount_code');
            if (savedCode && originalPrice > 0) {
                setCode(savedCode);
                setStatus('loading');
                const { discount, error } = await validateDiscountCode(savedCode);
                
                if (discount) {
                    const result = applyDiscount(originalPrice, discount);
                    setStatus('success');
                    setAppliedCode(savedCode.trim().toUpperCase());
                    setMessage(result.label);
                    onDiscountApplied(result.finalPrice, result.savedAmount, result.label);
                } else {
                    setStatus('idle');
                    // Code is expired or maxed — remove it from storage
                    localStorage.removeItem('applied_discount_code');
                    if (error) setMessage(error);
                }
            }
        };
        
        loadSavedCode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const handleApply = async () => {
        if (!code.trim()) return;
        setStatus('loading');

        const { discount, error } = await validateDiscountCode(code);

        if (!discount) {
            setStatus('error');
            setMessage(error || 'الكود غير صالح. تحقق من الكود وحاول مجدداً.');
            return;
        }

        const result = applyDiscount(originalPrice, discount);
        setStatus('success');
        setAppliedCode(code.trim().toUpperCase());
        setMessage(result.label);
        localStorage.setItem('applied_discount_code', code.trim().toUpperCase());
        onDiscountApplied(result.finalPrice, result.savedAmount, result.label);
    };

    const handleRemove = () => {
        setCode('');
        setAppliedCode('');
        setStatus('idle');
        setMessage('');
        localStorage.removeItem('applied_discount_code');
        onDiscountRemoved();
    };

    const isApplied = status === 'success';

    return (
        <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                كود الخصم
            </p>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={isApplied ? appliedCode : code}
                    onChange={e => { if (!isApplied) setCode(e.target.value.toUpperCase()); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !isApplied) handleApply(); }}
                    placeholder="أدخل كود الخصم"
                    disabled={isApplied}
                    className={`flex-1 bg-surface border rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${isApplied
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                        : status === 'error'
                            ? 'border-rose-500/40 focus:border-rose-500/60'
                            : 'border-white/10 focus:border-primary/50'
                        }`}
                />

                {isApplied ? (
                    <button
                        onClick={handleRemove}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
                    >
                        <X className="w-4 h-4" />
                        إلغاء
                    </button>
                ) : (
                    <button
                        onClick={handleApply}
                        disabled={!code.trim() || status === 'loading'}
                        className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white border border-primary/30 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-primary/20"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        تطبيق
                    </button>
                )}
            </div>

            {/* Feedback message */}
            {message && (
                <div className={`mt-2.5 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl ${isApplied
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                    }`}>
                    {isApplied ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                    <span>{isApplied ? `تم تطبيق الكود بنجاح! ${message}` : message}</span>
                </div>
            )}
        </div>
    );
}
