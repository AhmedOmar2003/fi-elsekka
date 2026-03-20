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
    images?: string[];
    description: string | null;
    is_best_seller?: boolean;
    show_in_offers?: boolean;
    specifications?: Record<string, any> | null;
    product_specifications?: { id?: string, label: string, description: string }[];
    categories?: { name: string } | null;
};

type Category = { id: string; name: string };

const EMPTY_FORM = {
    name: '', description: '', price: '', stock_quantity: '',
    discount_percentage: '', category_id: '', image_url: '',
    images: ['', '', '', ''],
    image_file: null as File | null,
    images_files: [null, null, null, null] as (File | null)[],
    is_best_seller: false,
    show_in_offers: false,
    specs: [] as { id?: string, label: string, description: string }[]
};

function normalizeSpecs(
    relationalSpecs?: { id?: string; label: string; description: string }[] | null,
    jsonSpecs?: Record<string, any> | null,
) {
    if (Array.isArray(relationalSpecs) && relationalSpecs.length > 0) {
        return relationalSpecs;
    }

    const fallbackSpecs = Array.isArray(jsonSpecs?.custom_specs) ? jsonSpecs.custom_specs : [];
    return fallbackSpecs
        .filter((spec: any) => spec?.label?.trim() && (spec?.description || spec?.value || '').trim())
        .map((spec: any) => ({
            label: spec.label.trim(),
            description: String(spec.description || spec.value).trim(),
        }));
}

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
        const pImages = p.images || [];
        setForm({
            name: p.name, description: p.description || '',
            price: String(p.price), stock_quantity: String(p.stock_quantity || 0),
            discount_percentage: String(p.discount_percentage || 0),
            category_id: p.category_id || '',
            image_url: p.image_url || '',
            images: [
                pImages[0] || '',
                pImages[1] || '',
                pImages[2] || '',
                pImages[3] || ''
            ],
            image_file: null,
            images_files: [null, null, null, null],
            is_best_seller: !!p.is_best_seller,
            show_in_offers: !!p.show_in_offers,
            specs: normalizeSpecs(p.product_specifications, p.specifications),
        });
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);

        if (index === undefined) {
            setForm(prev => ({ ...prev, image_url: previewUrl, image_file: file }));
        } else {
            setForm(prev => {
                const newImages = [...prev.images];
                newImages[index] = previewUrl;
                const newFiles = [...prev.images_files];
                newFiles[index] = file;
                return { ...prev, images: newImages, images_files: newFiles };
            });
        }
        
        // Reset file input
        e.target.value = '';
    };

    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) return;
        setSaveError(null);
        setSaveSuccess(false);
        setIsSaving(true);
        const loadingToast = toast.loading('جاري حفظ المنتج ورفع الصور...');

        try {
            // Upload main image and extra images concurrently
            let finalImageUrl = form.image_url;
            const finalImages = [...form.images];

            const uploadPromises: Promise<void>[] = [];

            if (form.image_file) {
                uploadPromises.push(
                    uploadProductImage(form.image_file).then(url => {
                        if (url) finalImageUrl = url;
                    })
                );
            }

            form.images_files.forEach((file, index) => {
                if (file) {
                    uploadPromises.push(
                        uploadProductImage(file).then(url => {
                            if (url) finalImages[index] = url;
                        })
                    );
                }
            });

            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises);
            }

            const payload: Record<string, unknown> = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: parseFloat(form.price),
                stock_quantity: parseInt(form.stock_quantity) || 0,
                discount_percentage: parseFloat(form.discount_percentage) || 0,
                category_id: form.category_id || null,
                image_url: finalImageUrl && !finalImageUrl.startsWith('blob:') ? finalImageUrl : null,
                images: finalImages.filter(url => url && url.trim() !== '' && !url.startsWith('blob:')),
                is_best_seller: form.is_best_seller,
                show_in_offers: form.show_in_offers,
                specifications: {
                    custom_specs: form.specs
                        .filter(spec => spec.label.trim() && spec.description.trim())
                        .map(spec => ({
                            label: spec.label.trim(),
                            description: spec.description.trim(),
                        })),
                },
            };
            let result;
            let specsResult = { error: null as any };
            if (editingId) {
                result = await updateProduct(editingId, payload);
                if (!result.error) specsResult = await saveProductSpecifications(editingId, form.specs);
            } else {
                result = await createProduct(payload);
                if (!result.error && result.data?.id) specsResult = await saveProductSpecifications(result.data.id, form.specs);
            }

            if (result?.error) {
                const msg = (result.error as any).message || JSON.stringify(result.error);
                setSaveError(`فشل الحفظ: ${msg}`);
                toast.error(`فشل الحفظ: ${msg}`, { id: loadingToast });
                return;
            }

            if (specsResult?.error) {
                const msg = (specsResult.error as any).message || JSON.stringify(specsResult.error);
                setSaveError(`المنتج اتحفظ بس المواصفات متسجلتش: ${msg}`);
                toast.error(`المنتج اتحفظ بس المواصفات متسجلتش: ${msg}`, { id: loadingToast });
                return;
            }

            // ✅ Success
            setSaveSuccess(true);
            toast.success(editingId ? 'تم تعديل المنتج بنجاح ✅' : 'تم إضافة المنتج بنجاح ✅', { id: loadingToast });
            setTimeout(() => {
                setIsModalOpen(false);
                setSaveSuccess(false);
                load();
            }, 800);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
            setSaveError(`فشل الحفظ: ${msg}`);
            toast.error(`فشل الحفظ: ${msg}`, { id: loadingToast });
        } finally {
            // ✅ ALWAYS reset the loading state — no more infinite spinner
            setIsSaving(false);
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">المنتجات</h1>
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
                    className="w-full bg-surface border border-surface-hover rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
            </div>

            {/* Table */}
            <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-surface-hover">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">المنتج</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden sm:table-cell">القسم</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right">السعر</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden md:table-cell">المخزون</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-right hidden md:table-cell">خصم</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-hover">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-10 bg-surface-hover rounded-lg animate-pulse" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-500 py-12">لا توجد منتجات</td></tr>
                            ) : (
                                filtered.map((p) => {
                                    const discounted = p.discount_percentage > 0
                                        ? p.price * (1 - p.discount_percentage / 100)
                                        : null;
                                    return (
                                        <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {p.image_url ? (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0">
                                                            <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-contain w-full h-full p-0.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
                                                            <ImageOff className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-foreground line-clamp-1">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="px-2.5 py-1 bg-surface-hover rounded-lg text-xs text-gray-500 font-medium">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-surface border border-surface-hover rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-surface-hover sticky top-0 bg-surface z-10">
                            <h2 className="font-heading font-black text-foreground">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-foreground hover:bg-surface-hover">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Images */}
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-3 border-b border-surface-hover pb-2">صور المنتج (صورة أساسية + 4 إضافية)</label>
                                <div className="space-y-4">
                                    {/* Main Image */}
                                    <div className="bg-surface-hover p-3 rounded-2xl border border-surface-hover">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">الصورة الأساسية (الغلاف)</label>
                                        <div
                                            onClick={() => fileInput.current?.click()}
                                            className="w-full h-32 rounded-xl border-2 border-dashed border-gray-400/30 hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                                        >
                                            {form.image_url ? (
                                                <Image src={form.image_url} alt="Preview Main" fill className="object-contain p-2" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 text-gray-500">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-xs">اضغط لرفع الغلاف</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInput} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                                        <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                                            placeholder="أو أدخل رابط الصورة..."
                                            className="mt-2 w-full bg-surface border border-surface-hover rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>

                                    {/* Extra Images Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[0, 1, 2, 3].map(index => {
                                            const imgStr = form.images[index];
                                            let isValidUrl = false;
                                            try {
                                                if (imgStr) {
                                                    new URL(imgStr);
                                                    isValidUrl = true;
                                                }
                                            } catch (e) {
                                                isValidUrl = imgStr.startsWith('blob:') || imgStr.startsWith('/');
                                            }

                                            return (
                                                <div key={index} className="bg-surface-hover p-2.5 rounded-2xl border border-surface-hover">
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5">صورة إضافية {index + 1}</label>
                                                    <label className="w-full h-20 rounded-lg border-2 border-dashed border-gray-400/30 hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden block">
                                                        {isValidUrl ? (
                                                            <Image src={imgStr} alt={`Preview Extra ${index + 1}`} fill className="object-contain p-1" />
                                                        ) : imgStr ? (
                                                            <img src={imgStr} alt={`Preview Extra ${index + 1}`} className="object-contain p-1 w-full h-full" />
                                                        ) : (
                                                            <Upload className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                                                </label>
                                                <input value={form.images[index]} onChange={e => {
                                                    const val = e.target.value;
                                                    setForm(f => {
                                                        const newImages = [...f.images];
                                                        newImages[index] = val;
                                                        return { ...f, images: newImages };
                                                    });
                                                }}
                                                    placeholder="أو رابط الصورة..."
                                                    className="mt-1.5 w-full bg-surface border border-surface-hover rounded-lg px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {[
                                { key: 'name', label: 'اسم المنتج *', placeholder: 'اسم المنتج', type: 'text' },
                                { key: 'description', label: 'الوصف', placeholder: 'وصف مختصر للمنتج', type: 'textarea' },
                                { key: 'price', label: 'السعر (ج.م) *', placeholder: '100', type: 'number' },
                                { key: 'stock_quantity', label: 'الكمية في المخزن', placeholder: '0', type: 'number' },
                                { key: 'discount_percentage', label: 'الخصم (%)', placeholder: '0', type: 'number' },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
                                    {type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            value={(form as any)[key]}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-surface border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            value={(form as any)[key]}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full bg-surface border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50"
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
                                    className="w-4 h-4 rounded text-primary bg-surface border-surface-hover accent-primary"
                                />
                                <span className="text-sm font-bold text-foreground">⭐ تمييز كمنتج الأكثر مبيعاً (Best Seller)</span>
                            </label>

                            {/* Show in Offers */}
                            <label className="flex items-center gap-3 mt-2 cursor-pointer p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={form.show_in_offers}
                                    onChange={e => setForm(f => ({ ...f, show_in_offers: e.target.checked }))}
                                    className="w-4 h-4 rounded text-rose-500 bg-surface border-surface-hover accent-rose-500"
                                />
                                <span className="text-sm font-bold text-foreground">🔥 إظهار في قسم العروض</span>
                            </label>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">القسم</label>
                                <div className="relative">
                                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <select
                                        value={form.category_id}
                                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                                        className="w-full bg-surface border border-surface-hover rounded-xl pr-9 pl-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 appearance-none"
                                    >
                                        <option value="">— بدون قسم —</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Specifications */}
                            <div className="pt-4 border-t border-surface-hover">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-bold text-foreground">المواصفات الإضافية (اختياري)</label>
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
                                        <div key={idx} className="flex gap-2 items-start p-3 bg-surface-hover rounded-xl border border-surface-hover">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={spec.label}
                                                    onChange={e => {
                                                        const newSpecs = [...form.specs];
                                                        newSpecs[idx].label = e.target.value;
                                                        setForm(f => ({ ...f, specs: newSpecs }));
                                                    }}
                                                    placeholder="الاسم (مثل: اللون, الماركة, الخامة)"
                                                    className="w-full bg-surface border border-surface-hover rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                                                />
                                                <input
                                                    value={spec.description}
                                                    onChange={e => {
                                                        const newSpecs = [...form.specs];
                                                        newSpecs[idx].description = e.target.value;
                                                        setForm(f => ({ ...f, specs: newSpecs }));
                                                    }}
                                                    placeholder="القيمة (مثل: أحمر, Apple, قطن 100%)"
                                                    className="w-full bg-surface border border-surface-hover rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
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
                                        <p className="text-xs text-gray-500 text-center py-4 bg-surface-hover rounded-xl border border-dashed border-gray-400/30">
                                            لا يوجد مواصفات مضافة بعد.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 p-5 border-t border-surface-hover">
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
                                <button onClick={() => { setIsModalOpen(false); setSaveError(null); }} className="flex-1 py-2.5 rounded-xl border border-surface-hover text-sm font-bold text-gray-500 hover:text-foreground hover:bg-surface-hover transition-all">
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
