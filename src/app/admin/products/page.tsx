"use client"

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
    fetchAdminProducts, fetchAdminCategories, createProduct,
    updateProduct, deleteProduct, uploadProductImage, saveProductSpecifications
} from '@/services/adminService';
import { Plus, Pencil, Trash2, Search, X, Upload, Loader2, ImageOff, Tag } from 'lucide-react';
import { toast } from 'sonner';

type Product = {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    discount_percentage: number;
    category_id: string | null;
    image_url: string | null;
    description: string | null;
    is_best_seller?: boolean;
    show_in_offers?: boolean;
    product_specifications?: { id?: string, label: string, description: string }[];
    categories?: { name: string } | null;
};

type Category = { id: string; name: string };

const EMPTY_FORM = {
    name: '', description: '', price: '', stock_quantity: '',
    discount_percentage: '', category_id: '', image_url: '',
    is_best_seller: false,
    show_in_offers: false,
    specs: [] as { id?: string, label: string, description: string }[]
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const load = async () => {
        setIsLoading(true);
        const [p, c] = await Promise.all([fetchAdminProducts(), fetchAdminCategories()]);
        setProducts(p as Product[]);
        setCategories(c as Category[]);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openNew = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setIsModalOpen(true);
    };

    const openEdit = (p: Product) => {
        setEditingId(p.id);
        setForm({
            name: p.name, description: p.description || '',
            price: String(p.price), stock_quantity: String(p.stock_quantity || 0),
            discount_percentage: String(p.discount_percentage || 0),
            category_id: p.category_id || '',
            image_url: p.image_url || '',
            is_best_seller: !!p.is_best_seller,
            show_in_offers: !!p.show_in_offers,
            specs: p.product_specifications || [],
        });
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const url = await uploadProductImage(file);
        if (url) setForm(prev => ({ ...prev, image_url: url }));
        setIsUploading(false);
    };

    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) return;
        setSaveError(null);
        setSaveSuccess(false);
        setIsSaving(true);

        const payload: Record<string, unknown> = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: parseFloat(form.price),
            stock_quantity: parseInt(form.stock_quantity) || 0,
            discount_percentage: parseFloat(form.discount_percentage) || 0,
            category_id: form.category_id || null,
            image_url: form.image_url || null,
            is_best_seller: form.is_best_seller,
            show_in_offers: form.show_in_offers,
        };

        try {
            let result;
            if (editingId) {
                result = await updateProduct(editingId, payload);
                if (!result.error) await saveProductSpecifications(editingId, form.specs);
            } else {
                result = await createProduct(payload);
                if (!result.error && result.data?.id) await saveProductSpecifications(result.data.id, form.specs);
            }

            if (result?.error) {
                const msg = (result.error as any).message || JSON.stringify(result.error);
                setSaveError(`فشل الحفظ: ${msg}`);
                toast.error(`فشل الحفظ: ${msg}`);
                return;
            }

            // ✅ Success
            setSaveSuccess(true);
            toast.success(editingId ? 'تم تعديل المنتج بنجاح ✅' : 'تم إضافة المنتج بنجاح ✅');
            setTimeout(() => {
                setIsModalOpen(false);
                setSaveSuccess(false);
                load();
            }, 800);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
            setSaveError(`فشل الحفظ: ${msg}`);
            toast.error(`فشل الحفظ: ${msg}`);
        } finally {
            // ✅ ALWAYS reset the loading state — no more infinite spinner
            setIsSaving(false);
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        const res = await deleteProduct(id);
        if (!res.success) {
            if (res.error?.includes('foreign key constraint') || res.error?.includes('order_items')) {
                toast.error('لا يمكن حذف المنتج لأنه مرتبط بطلبات سابقة.');
            } else {
                toast.error(`خطأ في الحذف: ${res.error}`);
            }
            return;
        }
        toast.success('تم حذف المنتج بنجاح ✅');
        load();
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-heading font-black text-white">المنتجات</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{products.length} منتج في المتجر</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" /> إضافة منتج
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث عن منتج..."
                    className="w-full bg-[#0a0e14] border border-white/5 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
            </div>

            {/* Table */}
            <div className="bg-[#0a0e14] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">المنتج</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden sm:table-cell">القسم</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">السعر</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden md:table-cell">المخزون</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden md:table-cell">خصم</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-10 bg-white/5 rounded-lg animate-pulse" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-500 py-12">لا توجد منتجات</td></tr>
                            ) : (
                                filtered.map((p) => {
                                    const discounted = p.discount_percentage > 0
                                        ? p.price * (1 - p.discount_percentage / 100)
                                        : null;
                                    return (
                                        <tr key={p.id} className="hover:bg-white/3 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {p.image_url ? (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0">
                                                            <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-contain w-full h-full p-0.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                            <ImageOff className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-white line-clamp-1">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-gray-300 font-medium">
                                                    {p.categories?.name || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {discounted ? (
                                                    <div>
                                                        <span className="text-primary font-black">{discounted.toFixed(0)} ج.م</span>
                                                        <span className="text-xs text-gray-500 line-through block">{p.price} ج.م</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-white">{p.price} ج.م</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`font-bold ${p.stock_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {p.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {p.discount_percentage > 0 ? (
                                                    <span className="bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-lg text-xs font-bold">
                                                        {p.discount_percentage}%
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0e14] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0a0e14]">
                            <h2 className="font-heading font-black text-white">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Image */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">صورة المنتج</label>
                                <div
                                    onClick={() => fileInput.current?.click()}
                                    className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                                >
                                    {form.image_url ? (
                                        <Image src={form.image_url} alt="Preview" fill className="object-contain p-2" />
                                    ) : isUploading ? (
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-gray-500">
                                            <Upload className="w-5 h-5" />
                                            <span className="text-xs">اضغط لرفع صورة</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInput} accept="image/*" className="hidden" onChange={handleImageUpload} />
                                {form.image_url && (
                                    <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                                        placeholder="أو أدخل رابط الصورة..."
                                        className="mt-2 w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-primary/50"
                                    />
                                )}
                            </div>

                            {[
                                { key: 'name', label: 'اسم المنتج *', placeholder: 'اسم المنتج', type: 'text' },
                                { key: 'description', label: 'الوصف', placeholder: 'وصف مختصر للمنتج', type: 'textarea' },
                                { key: 'price', label: 'السعر (ج.م) *', placeholder: '100', type: 'number' },
                                { key: 'stock_quantity', label: 'الكمية في المخزن', placeholder: '0', type: 'number' },
                                { key: 'discount_percentage', label: 'الخصم (%)', placeholder: '0', type: 'number' },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
                                    {type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            value={(form as any)[key]}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            value={(form as any)[key]}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Best Seller */}
                            <label className="flex items-center gap-3 mt-2 cursor-pointer p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={form.is_best_seller}
                                    onChange={e => setForm(f => ({ ...f, is_best_seller: e.target.checked }))}
                                    className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 accent-primary"
                                />
                                <span className="text-sm font-bold text-white">⭐ تمييز كمنتج الأكثر مبيعاً (Best Seller)</span>
                            </label>

                            {/* Show in Offers */}
                            <label className="flex items-center gap-3 mt-2 cursor-pointer p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={form.show_in_offers}
                                    onChange={e => setForm(f => ({ ...f, show_in_offers: e.target.checked }))}
                                    className="w-4 h-4 rounded text-rose-500 bg-white/5 border-white/10 accent-rose-500"
                                />
                                <span className="text-sm font-bold text-white">🔥 إظهار في قسم العروض</span>
                            </label>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5">القسم</label>
                                <div className="relative">
                                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <select
                                        value={form.category_id}
                                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl pr-9 pl-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                                    >
                                        <option value="">— بدون قسم —</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Specifications */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-bold text-white">المواصفات الإضافية (اختياري)</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, specs: [...f.specs, { label: '', description: '' }] }))}
                                        className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> إضافة صفة
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {form.specs.map((spec, idx) => (
                                        <div key={idx} className="flex gap-2 items-start p-3 bg-white/3 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={spec.label}
                                                    onChange={e => {
                                                        const newSpecs = [...form.specs];
                                                        newSpecs[idx].label = e.target.value;
                                                        setForm(f => ({ ...f, specs: newSpecs }));
                                                    }}
                                                    placeholder="الاسم (مثل: اللون, الماركة, الخامة)"
                                                    className="w-full bg-[#0a0e14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 focus:outline-none"
                                                />
                                                <input
                                                    value={spec.description}
                                                    onChange={e => {
                                                        const newSpecs = [...form.specs];
                                                        newSpecs[idx].description = e.target.value;
                                                        setForm(f => ({ ...f, specs: newSpecs }));
                                                    }}
                                                    placeholder="القيمة (مثل: أحمر, Apple, قطن 100%)"
                                                    className="w-full bg-[#0a0e14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSpecs = form.specs.filter((_, i) => i !== idx);
                                                    setForm(f => ({ ...f, specs: newSpecs }));
                                                }}
                                                className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 shrink-0 mt-2 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {form.specs.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                            لا يوجد مواصفات مضافة بعد.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 p-5 border-t border-white/5">
                            {/* Error banner */}
                            {saveError && (
                                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium px-3 py-2.5 rounded-xl">
                                    <span className="shrink-0 mt-0.5">⚠️</span>
                                    <span>{saveError}</span>
                                </div>
                            )}
                            {/* Success banner */}
                            {saveSuccess && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-2.5 rounded-xl">
                                    ✅ تم الحفظ بنجاح!
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setIsModalOpen(false); setSaveError(null); }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || saveSuccess || !form.name || !form.price}
                                    className="flex-[2] py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {saveSuccess ? 'تم ✅' : editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
