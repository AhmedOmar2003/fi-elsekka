"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, ChevronLeft, Loader2, Trash2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import {
    AppNotification,
    deleteAllNotifications,
    deleteNotification,
    emitNotificationsSync,
    fetchUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/notificationsService"
import { toast } from "sonner"

const PREVIEW_LIMIT = 4

function formatNotifTime(createdAt: string) {
    const date = new Date(createdAt)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return "الآن"
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`

    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `منذ ${diffHours} ساعة`

    return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
}

export default function NotificationsPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const [notifications, setNotifications] = React.useState<AppNotification[]>([])
    const [loadingNotifications, setLoadingNotifications] = React.useState(true)
    const [showAll, setShowAll] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [isDeletingAll, setIsDeletingAll] = React.useState(false)

    const unreadCount = notifications.filter((notification) => !notification.is_read).length
    const latestNotifications = notifications.slice(0, PREVIEW_LIMIT)
    const olderNotifications = notifications.slice(PREVIEW_LIMIT)

    const loadNotifications = React.useCallback(async () => {
        if (!user) return
        setLoadingNotifications(true)
        const data = await fetchUserNotifications(user.id, 50)
        setNotifications(data)
        setLoadingNotifications(false)
    }, [user])

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login?redirect=/notifications")
        }
    }, [isLoading, router, user])

    React.useEffect(() => {
        if (!user) return
        void loadNotifications()
    }, [loadNotifications, user])

    const openNotification = async (notification: AppNotification) => {
        if (!user) return

        if (!notification.is_read) {
            const previous = notifications
            setNotifications((prev) =>
                prev.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)
            )
            emitNotificationsSync({ type: "mark-read", userId: user.id, notificationId: notification.id })
            const ok = await markNotificationAsRead(notification.id, user.id)
            if (!ok) {
                setNotifications(previous)
                emitNotificationsSync({ type: "upsert", userId: user.id, notification })
            }
        }

        router.push(notification.link || "/account")
    }

    const handleMarkAllRead = async () => {
        if (!user || unreadCount === 0) return
        const previous = notifications
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
        emitNotificationsSync({ type: "mark-all-read", userId: user.id })
        const ok = await markAllNotificationsAsRead(user.id)
        if (!ok) {
            setNotifications(previous)
            previous.forEach((notification) => {
                emitNotificationsSync({ type: "upsert", userId: user.id, notification })
            })
            toast.error("تعذر تعليم الإشعارات كمقروءة")
        }
    }

    const handleDeleteOne = async (notificationId: string) => {
        if (!user) return

        setDeletingId(notificationId)
        const previous = notifications
        setNotifications((prev) => prev.filter((item) => item.id !== notificationId))
        emitNotificationsSync({ type: "delete-one", userId: user.id, notificationId })

        const ok = await deleteNotification(notificationId, user.id)
        if (!ok) {
            setNotifications(previous)
            const deletedNotification = previous.find((item) => item.id === notificationId)
            if (deletedNotification) {
                emitNotificationsSync({ type: "upsert", userId: user.id, notification: deletedNotification })
            }
            toast.error("تعذر حذف الإشعار")
        }

        setDeletingId(null)
    }

    const handleDeleteAll = async () => {
        if (!user || notifications.length === 0) return

        setIsDeletingAll(true)
        const previous = notifications
        setNotifications([])
        emitNotificationsSync({ type: "delete-all", userId: user.id })

        const ok = await deleteAllNotifications(user.id)
        if (!ok) {
            setNotifications(previous)
            previous.forEach((notification) => {
                emitNotificationsSync({ type: "upsert", userId: user.id, notification })
            })
            toast.error("تعذر حذف كل الإشعارات")
        } else {
            setShowAll(false)
        }

        setIsDeletingAll(false)
    }

    const renderNotificationCard = (notification: AppNotification) => (
        <div
            key={notification.id}
            className={`rounded-3xl border p-4 transition-all ${notification.is_read ? "bg-surface border-surface-hover" : "bg-primary/5 border-primary/20"}`}
        >
                    <div className="flex items-start justify-between gap-3">
                        <button onClick={() => void openNotification(notification)} className="min-w-0 flex-1 text-start">
                            <div className="flex items-center gap-2">
                                {!notification.is_read && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                <p className="truncate text-sm font-black text-foreground">{notification.title}</p>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-gray-500">
                        {notification.message}
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-[11px] text-gray-400">{formatNotifTime(notification.created_at)}</span>
                            </div>
                        </button>

                <button
                    onClick={() => void handleDeleteOne(notification.id)}
                    disabled={deletingId === notification.id}
                    className="rounded-2xl bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/15 transition-colors disabled:opacity-50"
                    title="حذف الإشعار"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    )

    return (
        <>
            <Header />
            <main className="min-h-[80vh] bg-background pb-24 md:pb-12">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-surface-hover bg-surface p-6 shadow-premium">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                                    <Bell className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-foreground">الإشعارات</h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        نعرض لك أحدث 4 إشعارات أولاً، ويمكنك فتح السجل الكامل عند الحاجة.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {unreadCount > 0 && (
                                    <Button onClick={() => void handleMarkAllRead()} className="rounded-2xl gap-2">
                                        <CheckCheck className="h-4 w-4" />
                                        تعليم الكل كمقروء
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => void handleDeleteAll()}
                                    disabled={isDeletingAll || notifications.length === 0}
                                    className="rounded-2xl gap-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {isDeletingAll ? "جاري الحذف..." : "حذف كل الإشعارات"}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                غير المقروءة: {unreadCount}
                            </span>
                            <span className="rounded-full bg-surface-hover px-3 py-1 text-gray-500">
                                إجمالي الإشعارات: {notifications.length}
                            </span>
                        </div>
                    </div>

                    {loadingNotifications ? (
                        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-bold text-gray-500">جاري تحميل الإشعارات...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-[2rem] border border-surface-hover bg-surface p-10 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
                                <Bell className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-lg font-black text-foreground">لا توجد إشعارات حتى الآن</p>
                            <p className="mt-2 text-sm text-gray-500">عندما يصلك تحديث جديد بخصوص طلباتك أو حسابك سيظهر هنا.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-foreground">أحدث الإشعارات</h2>
                                        <p className="mt-1 text-xs text-gray-500">أول {PREVIEW_LIMIT} إشعارات فقط للعرض السريع</p>
                                    </div>
                                    {notifications.length > PREVIEW_LIMIT && (
                                        <button
                                            onClick={() => setShowAll((prev) => !prev)}
                                            className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/15 transition-colors"
                                        >
                                            {showAll ? "إخفاء السجل الكامل" : "عرض كل الإشعارات"}
                                            <ChevronLeft className={`h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {latestNotifications.map(renderNotificationCard)}
                                </div>
                            </section>

                            {showAll && olderNotifications.length > 0 && (
                                <section className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-black text-foreground">كل الإشعارات السابقة</h2>
                                        <p className="mt-1 text-xs text-gray-500">هنا تجد كل الإشعارات القديمة مع إمكانية حذفها</p>
                                    </div>
                                    <div className="grid gap-4">
                                        {olderNotifications.map(renderNotificationCard)}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    <div className="mt-8">
                        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                            العودة إلى الحساب
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
