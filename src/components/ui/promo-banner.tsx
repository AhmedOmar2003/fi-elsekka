import Link from 'next/link';
import { fetchActivePromotionServer } from '@/services/serverPromotionsService';

export async function PromoBanner() {
    const promo = await fetchActivePromotionServer();

    // If no active promotion is set by admin, hide the section
    if (!promo) return null;

    return (
        <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="group relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,#237860_0%,#2f9274_100%)] p-7 text-white shadow-[var(--shadow-material-2)] sm:flex-row sm:p-14">

                    {/* Text */}
                    <div className="z-10 text-center sm:text-start">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-black tracking-[0.08em] backdrop-blur-sm">
                            <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse"></span>
                            عرض متاح دلوقتي
                        </div>
                        <h3 className="mb-3 text-3xl font-black leading-tight tracking-[-0.04em] drop-shadow-sm sm:text-4xl">
                            {promo.title}
                        </h3>
                        {promo.description && (
                            <p className="max-w-md text-base font-medium leading-relaxed text-white/90 sm:text-xl">
                                {promo.description}
                            </p>
                        )}
                        {promo.discount_code && (
                            <div
                                className="mt-4 inline-flex select-none items-center gap-2 rounded-2xl border border-white/15 bg-black/20 px-4 py-2.5 font-mono text-lg tracking-widest text-white backdrop-blur-sm"
                            >
                                <span className="text-sm text-white/60 font-sans ml-1">استخدم كود:</span>
                                {promo.discount_code}
                            </div>
                        )}
                    </div>

                    {/* CTA Button */}
                    <div className="shrink-0 z-10 w-full sm:w-auto mx-auto sm:mx-0">
                        <Link
                            href={promo.button_link || "/offers"}
                            className="flex items-center justify-center rounded-[24px] border border-white/40 bg-white px-10 py-4 text-center text-lg font-black text-primary shadow-[var(--shadow-material-2)] transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            {promo.button_text || 'شوف العروض'}
                        </Link>
                    </div>

                    {/* Decorative bg blobs */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_22%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
                    <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 translate-x-12 -translate-y-12 rounded-full bg-white opacity-20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-12 translate-y-12 rounded-full bg-black opacity-20 blur-2xl" />
                </div>
            </div>
        </section>
    );
}
