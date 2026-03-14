"use client"

import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Phone, CreditCard, Mail, Trash2, ShieldCheck, Pencil, Loader2, X, AlertTriangle, Star } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { logError } from '@/services/adminService'
import { toast } from 'sonner'

interface Driver {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    national_id?: string;
    created_at: string;
    role: string;
}

export default function AdminDriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [driverRatings, setDriverRatings] = useState<Record<string, number>>({})

    // Edit modal state
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
    const [editFullName, setEditFullName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    // Delete confirmation modal state
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Add form state
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [nationalId, setNationalId] = useState('')

    useEffect(() => {
        fetchDrivers()
    }, [])

    const fetchDrivers = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'driver')
            .order('created_at', { ascending: false })
        
        if (error) logError('fetchDrivers', error)
        if (data) {
            setDrivers(data)
            // Fetch average ratings for each driver
            if (data.length > 0) {
                const driverIds = data.map((d: any) => d.id)
                const { data: reviews } = await supabase
                    .from('driver_reviews')
                    .select('driver_id, rating')
                    .in('driver_id', driverIds)
                if (reviews) {
                    const ratingMap: Record<string, number> = {}
                    const countMap: Record<string, number> = {}
                    for (const r of reviews) {
                        ratingMap[r.driver_id] = (ratingMap[r.driver_id] || 0) + r.rating
                        countMap[r.driver_id] = (countMap[r.driver_id] || 0) + 1
                    }
                    const avgMap: Record<string, number> = {}
                    for (const id of driverIds) {
                        if (countMap[id]) avgMap[id] = parseFloat((ratingMap[id] / countMap[id]).toFixed(1))
                    }
                    setDriverRatings(avgMap)
                }
            }
        }
        setIsLoading(false)
    }

    const handleCreateDriver = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName || !email || !password || !phone) {
            toast.error("يرجى تعبئة جميع الحقول المطلوبة")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/create-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    phone,
                    national_id: nationalId
                })
            })

            const responseData = await res.json()

            if (!res.ok) {
                toast.error(responseData.error || "خطأ أثناء إنشاء حساب المندوب")
            } else {
                toast.success("تم إنشاء حساب المندوب بنجاح! 🎉")
                setIsAddModalOpen(false)
                setFullName(''); setEmail(''); setPassword(''); setPhone(''); setNationalId('')
                fetchDrivers()
            }
        } catch (err) {
            console.error(err)
            toast.error("حدث خطأ في الاتصال بالخادم")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditModal = (driver: Driver) => {
        setEditingDriver(driver)
        setEditFullName(driver.full_name)
        setEditPhone(driver.phone || '')
        setEditEmail(driver.email || '')
        setEditPassword('')
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingDriver) return
        setIsSavingEdit(true)

        try {
            const res = await fetch('/api/admin/update-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: editingDriver.id,
                    full_name: editFullName,
                    phone: editPhone,
                    email: editEmail !== editingDriver.email ? editEmail : undefined,
                    password: editPassword || undefined
                })
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'حدث خطأ أثناء حفظ التعديلات')
            } else {
                toast.success('تم تحديث بيانات المندوب ✅')
                setDrivers(prev => prev.map(d => d.id === editingDriver.id
                    ? { ...d, full_name: editFullName, phone: editPhone, email: editEmail }
                    : d
                ))
                setEditingDriver(null)
            }
        } catch (err) {
            toast.error('حدث خطأ في الاتصال بالخادم')
        } finally {
            setIsSavingEdit(false)
        }
    }

    const confirmDeleteDriver = async () => {
        if (!driverToDelete) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/delete-driver?id=${driverToDelete.id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            
            if (!res.ok) {
                toast.error(data.error || "حدث خطأ أثناء الحذف")
            } else {
                toast.success("تم حذف المندوب نهائياً ✅")
                setDrivers(prev => prev.filter(d => d.id !== driverToDelete.id))
                setDriverToDelete(null)
            }
        } catch(err) {
             console.error(err)
             toast.error("حدث خطأ في الاتصال بالخادم")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground flex items-center gap-2">
                        إدارة المندوبين 🛵
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">تتبع فريق التوصيل وإضافة مندوبين جدد</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="shrink-0 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5" />
                    إضافة مندوب جديد
                </button>
            </div>

            {/* Content Table */}
            <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-surface-hover text-xs uppercase text-gray-500 bg-surface-hover/30">
                                <th className="px-5 py-4 font-bold">معلومات المندوب</th>
                                <th className="px-5 py-4 font-bold">رقم الهاتف</th>
                                <th className="px-5 py-4 font-bold">التقييم</th>
                                <th className="px-5 py-4 font-bold">تاريخ الانضمام</th>
                                <th className="px-5 py-4 font-bold text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-hover text-sm">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-10 w-48 bg-surface-hover rounded-lg"></div></td>
                                        <td className="px-5 py-4"><div className="h-4 w-28 bg-surface-hover rounded"></div></td>
                                        <td className="px-5 py-4"><div className="h-4 w-24 bg-surface-hover rounded"></div></td>
                                        <td className="px-5 py-4"><div className="h-8 w-16 bg-surface-hover rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
                                                <ShieldCheck className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="font-bold text-foreground">لا يوجد مندوبين حالياً</p>
                                            <p className="text-xs">قم بإضافة مندوب لتتمكن من تعيين الطلبات له.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-surface-hover/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                                    {driver.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{driver.full_name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{driver.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 font-mono text-xs" dir="ltr">
                                            {driver.phone || <span className="text-gray-400 italic">غير محدد</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            {driverRatings[driver.id] ? (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span className="font-black text-sm text-amber-500">{driverRatings[driver.id]}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                                            {new Date(driver.created_at).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="px-5 py-4 text-left">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => openEditModal(driver)}
                                                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="تعديل بيانات المندوب"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDriverToDelete(driver)}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="حذف المندوب"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Driver Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-hover w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-surface-hover flex items-center justify-between bg-surface-hover/30">
                            <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                تسجيل مندوب جديد
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateDriver} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">الاسم الثلاثي *</label>
                                <div className="relative">
                                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input required value={fullName} onChange={e => setFullName(e.target.value)} type="text" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:border-primary" placeholder="اسم المندوب كاملاً" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">رقم الهاتف *</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:border-primary" placeholder="رقم لتواصل العملاء معه" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">الرقم القومي</label>
                                <div className="relative">
                                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={nationalId} onChange={e => setNationalId(e.target.value)} type="text" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:border-primary" placeholder="الرقم القومي (اختياري)" />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-surface-hover">
                                <p className="text-xs text-primary font-bold mb-3">بيانات تسجيل الدخول للمندوب</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500">البريد الإلكتروني *</label>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:border-primary" placeholder="driver@fielsekka.com" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500">كلمة المرور *</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input required value={password} onChange={e => setPassword(e.target.value)} type="text" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 pl-3 pr-10 text-sm font-mono focus:outline-none focus:border-primary" placeholder="كلمة مرور مؤقتة للمندوب" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-surface-hover text-foreground font-bold py-3 rounded-xl hover:bg-surface-hover/80 transition-colors">
                                    إلغاء
                                </button>
                                <button disabled={isSubmitting} type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإنشاء...</> : 'إنشاء المندوب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Driver Modal */}
            {editingDriver && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-hover w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-surface-hover flex items-center justify-between bg-surface-hover/30">
                            <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-blue-500" />
                                تعديل بيانات المندوب
                            </h2>
                            <button onClick={() => setEditingDriver(null)} className="text-gray-500 hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">الاسم الكامل</label>
                                <input value={editFullName} onChange={e => setEditFullName(e.target.value)} type="text" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500">رقم الهاتف</label>
                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" dir="ltr" />
                            </div>
                            <div className="pt-2 border-t border-surface-hover space-y-4">
                                <p className="text-xs text-primary font-bold">تعديل بيانات الدخول (اختياري)</p>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500">البريد الإلكتروني</label>
                                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" dir="ltr" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500">كلمة المرور الجديدة <span className="text-gray-400">(اتركها فارغة إن لم تريد تغييرها)</span></label>
                                    <input value={editPassword} onChange={e => setEditPassword(e.target.value)} type="text" className="w-full bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary" placeholder="كلمة مرور جديدة..." />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingDriver(null)} className="flex-1 bg-surface-hover text-foreground font-bold py-3 rounded-xl">
                                    إلغاء
                                </button>
                                <button disabled={isSavingEdit} type="submit" className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSavingEdit ? <><Loader2 className="w-4 h-4 animate-spin" />حفظ...</> : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {driverToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-hover w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <div>
                                <h2 className="font-black text-lg text-foreground">تأكيد الحذف</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    هل أنت متأكد من حذف المندوب <span className="font-bold text-foreground">"{driverToDelete.full_name}"</span>؟<br/>
                                    <span className="text-red-500 font-bold">لا يمكن التراجع عن هذا الإجراء.</span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDriverToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 bg-surface-hover text-foreground font-bold py-3 rounded-xl hover:bg-surface-hover/80 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={confirmDeleteDriver}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحذف...</> : <><Trash2 className="w-4 h-4" />احذف نهائياً</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
