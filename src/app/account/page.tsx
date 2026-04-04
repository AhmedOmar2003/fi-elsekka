"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ui/product-card"
import { useAuth } from "@/contexts/AuthContext"
import { useFavorites } from "@/contexts/FavoritesContext"
import { updateUserProfile } from "@/services/ordersService"
import { fetchUserFavorites } from "@/services/favoritesService"
import { Product } from "@/services/productsService"
import { signOut, uploadAvatar } from "@/services/authService"
import {
    User, Package, Settings, LogOut, Camera, Loader2,
    MapPin, Clock, XCircle, ShoppingBag, Trash2, Heart
} from "lucide-react"
import { toast } from "sonner"
import { toProductCardProps } from "@/lib/product-presentation"

type Tab = "search_requests" | "favorites" | "addresses" | "settings"

const LogoutModal = dynamic(
  () => import("@/components/ui/logout-modal").then((mod) => mod.LogoutModal),
  { ssr: false }
)

const SearchRequestsPanel = dynamic(
  () => import("./search-requests-panel").then((mod) => mod.SearchRequestsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    ),
  }
)

const AddressesPanel = dynamic(
  () => import("./addresses-panel").then((mod) => mod.AddressesPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    ),
  }
)

const SettingsPanel = dynamic(
  () => import("./settings-panel").then((mod) => mod.SettingsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    ),
  }
)

export default function AccountPage() {
    const router = useRouter()
    const { user, profile, isLoading, refreshProfile } = useAuth()

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)

    const [activeTab, setActiveTab] = React.useState<Tab>("favorites")

    // Favorites state
    const { favoriteIds, toggleFavorite, clearAllFavorites } = useFavorites()
    const [favProducts, setFavProducts] = React.useState<Product[]>([])
    const [favLoading, setFavLoading] = React.useState(false)

    React.useEffect(() => {
        const requestedTab = new URLSearchParams(window.location.search).get('tab')
        if (requestedTab === 'orders') {
            router.replace('/orders')
            return
        }
        if (requestedTab === 'search_requests') {
            setActiveTab('search_requests')
        }
    }, [router])

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login?redirect=/account')
        }
    }, [user, isLoading, router])

    // Load favorite products when tab is opened
    React.useEffect(() => {
        if (user && activeTab === 'favorites') {
            setFavLoading(true)
            fetchUserFavorites(user.id)
                .then(data => {
                    setFavProducts(data)
                })
                .catch(() => {
                    setFavProducts([])
                    toast.error("مقدرناش نجيب المفضلة دلوقتي")
                })
                .finally(() => {
                    setFavLoading(false)
                })
        }
    }, [user, activeTab])

    React.useEffect(() => {
        if (activeTab !== 'favorites') return
        setFavProducts(prev => prev.filter(product => favoriteIds.has(product.id)))
    }, [activeTab, favoriteIds])

    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)
    const [isClearFavoritesModalOpen, setIsClearFavoritesModalOpen] = React.useState(false)

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true)
    }

    const confirmLogout = async () => {
        setIsLogoutModalOpen(false)
        await signOut()
        toast.success("تم تسجيل الخروج", {
            description: "هتوحشنا، مستنيينك ترجع قريب! 👋"
        })
        setTimeout(() => {
            router.push('/')
        }, 500)
    }

    const confirmClearFavorites = async () => {
        await clearAllFavorites()
        setFavProducts([])
        setIsClearFavoritesModalOpen(false)
        toast.success("تمام، فضّينا المفضلة")
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setIsUploadingAvatar(true)
        const toastId = toast.loading("جاري رفع الصورة...")

        try {
            const { publicUrl, error } = await uploadAvatar(user.id, file)
            
            if (error || !publicUrl) {
                console.error("Upload error:", error)
                toast.error("فشل رفع الصورة", { id: toastId })
                return
            }

            const { error: profileError } = await updateUserProfile(user.id, { profile_picture: publicUrl })
            if (profileError) {
                toast.error("حدث خطأ أثناء حفظ الصورة", { id: toastId })
                return
            }

            await refreshProfile()
            toast.success("تم تحديث صورة الحساب بنجاح", { id: toastId })
        } catch (err) {
            toast.error("حدث خطأ غير متوقع", { id: toastId })
        } finally {
            setIsUploadingAvatar(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
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

    if (!user) {
        return (
            <>
                <Header />
                <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh]">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="rounded-3xl border border-surface-hover bg-surface p-8 text-center shadow-premium">
                            <h1 className="text-2xl font-black text-foreground">سجل دخولك الأول</h1>
                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                صفحة الحساب محتاجة تسجيل دخول علشان نعرض بياناتك وطلباتك ومفضلتك بشكل صحيح.
                            </p>
                            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Button asChild className="rounded-xl px-8">
                                    <Link href="/login?redirect=/account">ادخل على حسابك</Link>
                                </Button>
                                <Button asChild variant="outline" className="rounded-xl px-8">
                                    <Link href="/">ارجع للرئيسية</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        )
    }

    const displayName = profile?.full_name || user.email || "أنت"
    const initials = displayName.slice(0, 2).toUpperCase()
    return (
        <>
            <Header />
            <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh]">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-10 bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 shadow-premium">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-primary/20 text-primary text-3xl font-black border-2 border-primary/30 flex items-center justify-center select-none overflow-hidden isolate relative">
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                )}
                                {profile?.profile_picture ? (
                                    <Image
                                        src={profile.profile_picture}
                                        alt={`صورة حساب ${displayName}`}
                                        fill
                                        priority
                                        sizes="80px"
                                        quality={60}
                                        className="w-full h-full object-cover rounded-2xl z-0"
                                    />
                                ) : initials}
                            </div>
                            <input 
                                type="file" 
                                hidden 
                                ref={fileInputRef} 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface border border-surface-hover rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
                                aria-label="تغيير صورة الحساب"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 text-center sm:text-start">
                            <h1 className="text-2xl font-black text-foreground">{displayName}</h1>
                            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-xl gap-2 text-rose-500 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 shrink-0"
                            onClick={handleLogoutClick}
                            aria-label="تسجيل الخروج من الحساب"
                        >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-surface border border-surface-hover p-1.5 rounded-2xl mb-6 w-fit flex-wrap">
                        <Link
                            href="/orders"
                            className="hidden md:flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-primary/10 hover:text-primary"
                        >
                            <ShoppingBag className="w-4 h-4" /> طلباتي
                        </Link>
                        <button type="button" onClick={() => setActiveTab("search_requests")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "search_requests" ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-foreground"}`} aria-label="فتح تبويب طلبات البحث">
                            <Clock className="w-4 h-4" /> حاجات بندور عليها
                        </button>
                        <button type="button" onClick={() => setActiveTab("favorites")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "favorites" ? "bg-secondary text-white shadow-lg" : "text-gray-500 hover:text-foreground"}`} aria-label="فتح تبويب المفضلة">
                            <Heart className="w-4 h-4" /> مفضلتي
                        </button>
                        <button type="button" onClick={() => setActiveTab("addresses")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "addresses" ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-foreground"}`} aria-label="فتح تبويب العناوين">
                            <MapPin className="w-4 h-4" /> عناويني
                        </button>
                        <button type="button" onClick={() => setActiveTab("settings")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "settings" ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-foreground"}`} aria-label="فتح تبويب الإعدادات">
                            <Settings className="w-4 h-4" /> الإعدادات
                        </button>
                    </div>

                    {activeTab === "search_requests" && (
                        <SearchRequestsPanel userId={user.id} />
                    )}

                    {/* Favorites Tab */}
                    {activeTab === "favorites" && (
                        <div>
                            {favLoading ? (
                                <div className="flex items-center justify-center min-h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
                                </div>
                            ) : favProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
                                        <Heart className="w-9 h-9 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">مفيش منتجات في مفضلتك لحد دلوقتي</h3>
                                    <p className="text-gray-500 mb-6">اضغط على القلب على أي منتج عشان تضيفه للمفضلة!</p>
                                    <Button asChild className="rounded-xl px-8">
                                        <Link href="/category/all">اكتشف المنتجات</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    {/* Header with count + clear all */}
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 text-sm">{favProducts.length} منتج في مفضلتك</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsClearFavoritesModalOpen(true)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                                            aria-label="مسح كل المنتجات من المفضلة"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            مسح الكل
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                                        {favProducts.map(product => {
                                            const productCard = toProductCardProps(product as any)

                                            return (
                                                <div key={product.id} className="relative group/fav">
                                                    <ProductCard
                                                        {...productCard}
                                                        imageUrl={product.image_url || (product.specifications as any)?.image_url || ''}
                                                    />
                                                    {/* Remove from favorites button */}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            await toggleFavorite(product.id)
                                                            setFavProducts(prev => prev.filter(p => p.id !== product.id))
                                                        }}
                                                        className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover/fav:opacity-100 transition-opacity active:scale-90"
                                                        title="إزالة من المفضلة"
                                                        aria-label={`إزالة ${product.name} من المفضلة`}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        إزالة
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === "addresses" && (
                        <AddressesPanel userId={user.id} />
                    )}

                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <SettingsPanel
                            userId={user.id}
                            currentEmail={user.email || ""}
                            initialFullName={profile?.full_name || ""}
                            initialPhone={(profile as any)?.phone || ""}
                        />
                    )}

                </div>
            </main>
            <Footer />

            <LogoutModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />

            {isClearFavoritesModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-background/70 backdrop-blur-md"
                        onClick={() => setIsClearFavoritesModalOpen(false)}
                    />

                    <div className="relative w-full max-w-sm rounded-[32px] border border-surface-border bg-surface-container-low p-7 shadow-[var(--shadow-material-3)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex h-18 w-18 items-center justify-center rounded-[24px] border border-rose-500/15 bg-rose-500/10 shadow-[var(--shadow-material-1)]">
                                <Heart className="h-8 w-8 text-rose-500" />
                            </div>

                            <h2 className="text-2xl font-black text-foreground leading-tight">
                                متأكد إنك عاوز تمسحهم كلهم؟
                            </h2>

                            <p className="text-sm leading-relaxed text-gray-500">
                                بصراحة حرام يروحوا كلهم مرة واحدة. سيب اللي عاجبك يمكن تحتاج ترجعلهم بعدين، ولو متأكد امسحهم عادي.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t material-divider pt-6">
                            <Button
                                type="button"
                                onClick={() => setIsClearFavoritesModalOpen(false)}
                                className="h-12 w-full rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-[var(--shadow-material-2)] hover:bg-emerald-400"
                            >
                                لا، سيبهم زي ما هم
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={confirmClearFavorites}
                                className="h-11 w-full rounded-2xl font-medium text-gray-500 hover:bg-rose-500/10 hover:text-rose-400"
                            >
                                أيوه، امسح الكل
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

