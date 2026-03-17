"use client"

import * as React from "react"
import { Bell, Check, CheckCheck, CheckCircle2, ChevronLeft, Trash2, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
    AppNotification,
    deleteAllNotifications,
    deleteNotification,
    fetchUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/notificationsService"
import { useRouter } from "next/navigation"
import { cn } from "./button"
import { supabase } from "@/lib/supabase"
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

    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })
}

function isDeliveryNotification(notification: AppNotification) {
    return notification.link === "/account" || notification.title.includes("توصيل") || notification.title.includes("طلبك")
}

function NotificationPreviewCard({
    notification,
    onOpen,
}: {
    notification: AppNotification
    onOpen: (notification: AppNotification) => void
}) {
    return (
        <button
            onClick={() => onOpen(notification)}
            className={cn(
                "flex w-full flex-col text-start p-4 border-b border-surface-hover/50 hover:bg-surface-hover transition-colors",
                !notification.is_read ? "bg-primary/5" : ""
            )}
        >
            <div className="mb-1.5 flex w-full items-start justify-between gap-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground min-w-0">
                    {!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />}
                    <span className={cn("truncate", !notification.is_read ? "text-primary dark:text-foreground" : "")}>
                        {notification.title}
                    </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                    {formatNotifTime(notification.created_at)}
                </span>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed pe-4 line-clamp-2">
                {notification.message}
            </p>
        </button>
    )
}

export function NotificationBell() {
    const { user } = useAuth()
    const router = useRouter()

    const [notifications, setNotifications] = React.useState<AppNotification[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isFullViewOpen, setIsFullViewOpen] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [isDeletingAll, setIsDeletingAll] = React.useState(false)

    const popoverRef = React.useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.is_read).length
    const previewNotifications = notifications.slice(0, PREVIEW_LIMIT)
    const hasMoreThanPreview = notifications.length > PREVIEW_LIMIT

    const loadNotifications = React.useCallback(async () => {
        if (!user) return
        try {
            const data = await fetchUserNotifications(user.id, 50)
            setNotifications(data)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    React.useEffect(() => {
        loadNotifications()
    }, [loadNotifications])

    React.useEffect(() => {
        if (!user) return

        const channelId = `notifications-${user.id}-${Math.random().toString(36).substring(7)}`

        const channel = supabase
            .channel(channelId)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                },
                (payload) => {
                    const newNotification = payload.new as AppNotification

                    setNotifications(prev => [newNotification, ...prev])

                    try {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
                        audio.volume = 0.5
                        audio.play().catch(() => {})
                    } catch {
                        // Ignore audio errors
                    }

                    toast.custom((toastId) => (
                        <div className="w-[min(92vw,420px)] rounded-3xl border border-primary/20 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        {isDeliveryNotification(newNotification) ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <Bell className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-foreground">
                                            {newNotification.title}
                                        </p>
                                        <p className="mt-1 text-xs leading-6 text-gray-500">
                                            {newNotification.message}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            {newNotification.link && (
                                                <button
                                                    onClick={() => {
                                                        toast.dismiss(toastId)
                                                        router.push(newNotification.link!)
                                                    }}
                                                    className="rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                                                >
                                                    افتح التفاصيل
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toast.dismiss(toastId)}
                                                className="rounded-2xl bg-surface-hover px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:text-foreground"
                                            >
                                                لاحقًا
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), {
                        duration: 7000,
                        position: "top-center",
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, user])

    const handleToggle = () => {
        const nextState = !isOpen
        setIsOpen(nextState)
        if (nextState) {
            loadNotifications()
        }
    }

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const handleNotificationOpen = async (notification: AppNotification) => {
        setIsOpen(false)
        setIsFullViewOpen(false)

        if (!notification.is_read) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n))
            if (user) {
                await markNotificationAsRead(notification.id, user.id)
            }
        }

        if (notification.link) {
            router.push(notification.link)
        }
    }

    const handleMarkAllRead = async (e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (!user || unreadCount === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await markAllNotificationsAsRead(user.id)
    }

    const handleDeleteOne = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) return

        setDeletingId(notificationId)
        const previous = notifications
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const ok = await deleteNotification(notificationId, user.id)
        if (!ok) {
            setNotifications(previous)
            toast.error("تعذر حذف الإشعار")
        }
        setDeletingId(null)
    }

    const handleDeleteAll = async () => {
        if (!user || notifications.length === 0) return

        setIsDeletingAll(true)
        const previous = notifications
        setNotifications([])
        const ok = await deleteAllNotifications(user.id)
        if (!ok) {
            setNotifications(previous)
            toast.error("تعذر حذف كل الإشعارات")
        } else {
            setIsFullViewOpen(false)
        }
        setIsDeletingAll(false)
    }

    if (!user) return null

    return (
        <>
            <div className="relative" ref={popoverRef}>
                <button
                    onClick={handleToggle}
                    className="relative text-gray-500 hover:text-foreground bg-surface-hover/50 hover:bg-surface-hover w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
                    aria-label="الإشعارات"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute top-full lg:-end-2 -end-24 mt-2 w-80 sm:w-96 bg-surface border border-surface-hover rounded-2xl shadow-premium z-50 flex flex-col overflow-hidden max-h-[80vh] animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-surface-hover bg-surface-lighter/50">
                            <div>
                                <h3 className="font-heading font-black text-foreground">الإشعارات</h3>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    نعرض أحدث {PREVIEW_LIMIT} إشعارات فقط هنا
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    تحديد الكل كمقروء
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-3">
                                        <Bell className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">لا توجد إشعارات جديدة</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {previewNotifications.map((notification) => (
                                        <NotificationPreviewCard
                                            key={notification.id}
                                            notification={notification}
                                            onOpen={handleNotificationOpen}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="border-t border-surface-hover bg-background/70 p-3">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setIsFullViewOpen(true)
                                    }}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/15 transition-colors"
                                >
                                    عرض كل الإشعارات
                                    {hasMoreThanPreview && (
                                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px]">
                                            +{notifications.length - PREVIEW_LIMIT}
                                        </span>
                                    )}
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isFullViewOpen && (
                <div className="fixed inset-0 z-[120] bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-surface-hover bg-surface shadow-2xl">
                        <div className="flex items-center justify-between border-b border-surface-hover p-5">
                            <div>
                                <h3 className="text-lg font-black text-foreground">كل الإشعارات</h3>
                                <p className="mt-1 text-xs text-gray-500">يمكنك مراجعة كل الإشعارات أو حذف ما لا تحتاجه</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => void handleMarkAllRead()}
                                        className="rounded-2xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        تعليم الكل كمقروء
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsFullViewOpen(false)}
                                    className="rounded-2xl bg-surface-hover p-2 text-gray-500 hover:text-foreground transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
                                        <Bell className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">لا توجد إشعارات محفوظة</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "border-b border-surface-hover/50 px-5 py-4 transition-colors",
                                            !notification.is_read ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <button
                                                onClick={() => handleNotificationOpen(notification)}
                                                className="min-w-0 flex-1 text-start"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                                                    <p className="truncate text-sm font-black text-foreground">{notification.title}</p>
                                                </div>
                                                <p className="mt-2 text-xs leading-6 text-gray-500">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-2 text-[11px] text-gray-400">
                                                    {formatNotifTime(notification.created_at)}
                                                </p>
                                            </button>

                                            <button
                                                onClick={(e) => void handleDeleteOne(notification.id, e)}
                                                disabled={deletingId === notification.id}
                                                className="rounded-2xl bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/15 transition-colors disabled:opacity-50"
                                                title="حذف الإشعار"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="flex items-center justify-between gap-3 border-t border-surface-hover p-4 bg-background/60">
                                <p className="text-xs text-gray-500">
                                    إجمالي الإشعارات: {notifications.length}
                                </p>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeletingAll}
                                    className="rounded-2xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                                >
                                    {isDeletingAll ? "جاري الحذف..." : "حذف كل الإشعارات"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
