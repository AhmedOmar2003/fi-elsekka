"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { fetchUserOrders, updateOrderStatus, updateUserProfile, Order } from "@/services/ordersService"
import { fetchUserDeliveryAddresses, saveDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress, setDefaultDeliveryAddress, DeliveryInfo } from "@/services/deliveryService"
import { signOut, updateAuthEmail, updateAuthPassword } from "@/services/authService"
import {
    User, Package, Settings, LogOut, Camera,
    MapPin, AlertCircle, CheckCircle, Clock, Truck, XCircle, ShoppingBag, Plus, Trash2, Star
} from "lucide-react"

type Tab = "orders" | "settings" | "addresses"

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "قيد المراجعة", color: "text-yellow-500 bg-yellow-500/10", icon: <Clock className="w-4 h-4" /> },
    processing: { label: "جاري التجهيز", color: "text-blue-500 bg-blue-500/10", icon: <Package className="w-4 h-4" /> },
    shipped: { label: "في الطريق", color: "text-primary bg-primary/10", icon: <Truck className="w-4 h-4" /> },
    delivered: { label: "تم التوصيل", color: "text-emerald-500 bg-emerald-500/10", icon: <CheckCircle className="w-4 h-4" /> },
    cancelled: { label: "ملغي", color: "text-rose-500 bg-rose-500/10", icon: <XCircle className="w-4 h-4" /> },
}

export default function AccountPage() {
    const router = useRouter()
    const { user, profile, isLoading } = useAuth()

    const [activeTab, setActiveTab] = React.useState<Tab>("orders")
    const [orders, setOrders] = React.useState<Order[]>([])
    const [ordersLoading, setOrdersLoading] = React.useState(true)

    // Addresses state
    const [addresses, setAddresses] = React.useState<DeliveryInfo[]>([])
    const [addrLoading, setAddrLoading] = React.useState(true)
    const [addrCity, setAddrCity] = React.useState("")
    const [addrArea, setAddrArea] = React.useState("")
    const [addrStreet, setAddrStreet] = React.useState("")
    const [addrPhone, setAddrPhone] = React.useState("")
    const [addrLabel, setAddrLabel] = React.useState("المنزل")
    const [showAddForm, setShowAddForm] = React.useState(false)
    const [savingAddr, setSavingAddr] = React.useState(false)

    // Settings form state
    const [fullName, setFullName] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [city, setCity] = React.useState("")
    const [area, setArea] = React.useState("")
    const [street, setStreet] = React.useState("")
    const [emailInput, setEmailInput] = React.useState("")
    const [passwordInput, setPasswordInput] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [saveMsg, setSaveMsg] = React.useState("")

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login?redirect=/account')
        }
    }, [user, isLoading, router])

    React.useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "")
            const p = profile as any
            if (p.phone) setPhone(p.phone)
            if (user?.email) setEmailInput(user.email)
        }
    }, [profile])

    React.useEffect(() => {
        if (user) {
            setOrdersLoading(true)
            fetchUserOrders(user.id).then(data => {
                setOrders(data)
                setOrdersLoading(false)
            })
            setAddrLoading(true)
            fetchUserDeliveryAddresses(user.id).then(data => {
                setAddresses(data)
                setAddrLoading(false)
            })
        }
    }, [user])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const handleCancelOrder = async (orderId: string) => {
        const { error } = await updateOrderStatus(orderId, 'cancelled')
        if (!error) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
        }
    }

    const handleSaveSettings = async () => {
        if (!user) return
        setIsSaving(true)
        setSaveMsg("")

        let hasError = false;
        let exactErrorStr = "";

        // 1. Update Profile (Name & Phone)
        const { error: profileError } = await updateUserProfile(user.id, { full_name: fullName, phone })
        if (profileError) {
            hasError = true;
            exactErrorStr += `Profile Error: ${profileError.message} | `;
            console.error("Profile Update Error: ", profileError);
        }

        // 2. Update Auth Email if changed
        if (emailInput && emailInput !== user.email) {
            const { error: emailError } = await updateAuthEmail(emailInput)
            if (emailError) {
                hasError = true;
                exactErrorStr += `Email Error: ${emailError.message} | `;
                console.error("Email Update Error: ", emailError);
            }
        }

        // 3. Update Auth Password if provided
        if (passwordInput) {
            const { error: passError } = await updateAuthPassword(passwordInput)
            if (passError) {
                hasError = true;
                exactErrorStr += `Password Error: ${passError.message} | `;
                console.error("Password Update Error: ", passError);
            }
            else setPasswordInput(""); // clear it on success
        }

        setIsSaving(false)
        setSaveMsg(hasError ? exactErrorStr : "تم الدفع بطلب تعديل بياناتك بنجاح ✓")
    }

    const handleAddAddress = async () => {
        if (!user || !addrCity || !addrStreet) return
        setSavingAddr(true)
        const { error } = await saveDeliveryAddress(user.id, {
            label: addrLabel, phone_number: addrPhone,
            city: addrCity, area: addrArea, address: addrStreet,
            is_default: addresses.length === 0, // first address is default
        })
        setSavingAddr(false)
        if (!error) {
            const updated = await fetchUserDeliveryAddresses(user.id)
            setAddresses(updated)
            setShowAddForm(false)
            setAddrCity(""); setAddrArea(""); setAddrStreet(""); setAddrPhone("")
        }
    }

    const handleDeleteAddress = async (id: string) => {
        await deleteDeliveryAddress(id)
        setAddresses(prev => prev.filter(a => a.id !== id))
    }

    const handleSetDefault = async (id: string) => {
        if (!user) return
        await setDefaultDeliveryAddress(id, user.id)
        const updated = await fetchUserDeliveryAddresses(user.id)
        setAddresses(updated)
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="flex-1 pb-24 md:pb-8 bg-background flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </main>
                <Footer />
            </>
        )
    }

    if (!user) return null

    const displayName = profile?.full_name || user.email || "المستخدم"
    const initials = displayName.slice(0, 2).toUpperCase()

    return (
        <>
            <Header />
            <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh]">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-10 bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 shadow-premium">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-3xl font-black border-2 border-primary/30 select-none">
                                {profile?.profile_picture ? (
                                    <img src={profile.profile_picture} className="w-full h-full object-cover rounded-2xl" alt="Profile" />
                                ) : initials}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface border border-surface-hover rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/40 transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 text-center sm:text-start">
                            <h1 className="text-2xl font-black text-foreground">{displayName}</h1>
                            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-xl gap-2 text-rose-500 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 shrink-0"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-surface border border-surface-hover p-1.5 rounded-2xl mb-6 w-fit flex-wrap">
                        <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "orders" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-foreground"}`}>
                            <Package className="w-4 h-4" /> طلباتي
                        </button>
                        <button onClick={() => setActiveTab("addresses")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "addresses" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-foreground"}`}>
                            <MapPin className="w-4 h-4" /> عناويني
                        </button>
                        <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "settings" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-foreground"}`}>
                            <Settings className="w-4 h-4" /> الإعدادات
                        </button>
                    </div>

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <div className="space-y-4">
                            {ordersLoading ? (
                                <div className="flex items-center justify-center min-h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
                                        <ShoppingBag className="w-9 h-9 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">مفيش طلبات لحد دلوقتي</h3>
                                    <p className="text-gray-400 mb-6">ابدأ التسوق وهيبان طلباتك هنا!</p>
                                    <Button asChild className="rounded-xl px-8">
                                        <Link href="/categories">اكتشف المنتجات</Link>
                                    </Button>
                                </div>
                            ) : orders.map(order => {
                                const status = statusConfig[order.status] || statusConfig.pending
                                const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                                return (
                                    <div key={order.id} className="bg-surface border border-surface-hover rounded-3xl p-5 md:p-6 transition-all hover:border-primary/30">
                                        {/* Order Header */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">رقم الطلب</p>
                                                <p className="font-mono text-sm text-gray-300 font-bold">{order.id.split('-')[0].toUpperCase()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-0.5">التاريخ</p>
                                                <p className="text-sm text-gray-300">{dateStr}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-0.5">الإجمالي</p>
                                                <p className="font-heading font-black text-primary">{order.total_amount} ج.م</p>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {order.order_items && order.order_items.length > 0 && (
                                            <div className="border-t border-surface-hover pt-4 mb-4 space-y-2">
                                                {order.order_items.map(item => (
                                                    <div key={item.id} className="flex justify-between text-sm text-gray-300">
                                                        <span>{(item as any).product?.name || "منتج"} <span className="text-gray-500">x{item.quantity}</span></span>
                                                        <span className="font-bold text-foreground">{(item.price_at_purchase * item.quantity).toFixed(0)} ج.م</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {order.status === 'pending' && (
                                            <div className="flex items-center gap-3 pt-4 border-t border-surface-hover">
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="text-sm text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    إلغاء الطلب
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === "addresses" && (
                        <div className="space-y-4">
                            {addrLoading ? (
                                <div className="flex items-center justify-center min-h-48"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>
                            ) : (
                                <>
                                    {addresses.map(addr => (
                                        <div key={addr.id} className={`bg-surface border rounded-3xl p-5 flex flex-col sm:flex-row gap-4 transition-all ${addr.is_default ? 'border-primary/50 shadow-primary/10 shadow-lg' : 'border-surface-hover'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{addr.label}</span>
                                                    {addr.is_default && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1"><Star className="w-3 h-3" /> افتراضي</span>}
                                                </div>
                                                <p className="font-bold text-foreground text-sm">{addr.address}</p>
                                                <p className="text-gray-400 text-sm">{addr.area && `${addr.area}، `}{addr.city}</p>
                                                {addr.phone_number && <p className="text-gray-500 text-xs mt-1" dir="ltr">{addr.phone_number}</p>}
                                            </div>
                                            <div className="flex sm:flex-col gap-2 shrink-0">
                                                {!addr.is_default && (
                                                    <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-primary font-bold hover:underline">تعيين افتراضي</button>
                                                )}
                                                <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" /> حذف</button>
                                            </div>
                                        </div>
                                    ))}

                                    {showAddForm ? (
                                        <div className="bg-surface border border-surface-hover rounded-3xl p-6 space-y-4">
                                            <h3 className="font-bold text-foreground">عنوان جديد</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input value={addrLabel} onChange={e => setAddrLabel(e.target.value)} placeholder="التسمية (المنزل، العمل...)" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
                                                <input value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="المدينة *" className="bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
                                                <input value={addrArea} onChange={e => setAddrArea(e.target.value)} placeholder="المنطقة" className="bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
                                                <input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} placeholder="عنوان الشارع *" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
                                                <input value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="رقم الموبايل" dir="ltr" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none text-right" />
                                            </div>
                                            <div className="flex gap-3">
                                                <Button onClick={handleAddAddress} className="rounded-xl px-6" disabled={savingAddr}>{savingAddr ? 'جاري الحفظ...' : 'حفظ العنوان'}</Button>
                                                <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowAddForm(false)}>إلغاء</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddForm(true)} className="w-full border-2 border-dashed border-surface-hover rounded-3xl p-6 text-gray-400 hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                                            <Plus className="w-5 h-5" /> إضافة عنوان جديد
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8">
                                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-surface-hover">
                                    <User className="w-5 h-5 text-primary" />
                                    المعلومات الشخصية
                                </h2>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>الاسم بالكامل</Label>
                                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="اسمك هنا" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>رقم الموبايل</Label>
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
                                </div>
                                <div className="space-y-2 md:col-span-2 border-t border-surface-hover pt-4 mt-2">
                                    <Label>البريد الإلكتروني (لتسجيل الدخول)</Label>
                                    <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} type="email" dir="ltr" className="text-right" />
                                    <p className="text-[11px] text-gray-400">إذا قمت بتغييره، سيتم إرسال رسالة تأكيد لمعظم الحسابات.</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>كلمة المرور الجديدة</Label>
                                    <Input value={passwordInput} onChange={e => setPasswordInput(e.target.value)} type="password" placeholder="اتركه فارغاً إذا لا تريد تغييره" dir="ltr" className="text-right" />
                                </div>
                            </div>

                            {saveMsg && (
                                <p className={`text-center text-sm font-bold ${saveMsg.includes("خطأ") ? "text-rose-500" : "text-emerald-500"}`}>{saveMsg}</p>
                            )}

                            <Button onClick={handleSaveSettings} className="rounded-xl px-10 h-12 font-bold shadow-primary/20 shadow-lg" disabled={isSaving}>
                                {isSaving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        جاري الحفظ...
                                    </div>
                                ) : "حفظ التعديلات"}
                            </Button>
                        </div>
                    )}

                </div>
            </main>
            <Footer />
        </>
    )
}
