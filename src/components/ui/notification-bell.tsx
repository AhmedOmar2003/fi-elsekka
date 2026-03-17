"use client"

import * as React from "react"
import { Bell, CheckCircle2, ChevronLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AppNotification, fetchUserNotifications } from "@/services/notificationsService"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

function isDeliveryNotification(notification: AppNotification) {
    return notification.link === "/account" || notification.title.includes("توصيل") || notification.title.includes("طلبك")
}

export function NotificationBell() {
    const { user } = useAuth()
    const router = useRouter()
    const [notifications, setNotifications] = React.useState<AppNotification[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const popoverRef = React.useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter((notification) => !notification.is_read).length
    const previewNotifications = notifications.slice(0, 4)

    const loadNotifications = React.useCallback(async () => {
        if (!user) return
        const data = await fetchUserNotifications(user.id, 50)
        setNotifications(data)
        setIsLoading(false)
    }, [user])

    React.useEffect(() => {
        void loadNotifications()
    }, [loadNotifications])

    React.useEffect(() => {
        if (!user) return

        const channelId = `notifications-${user.id}-${Math.random().toString(36).slice(2, 8)}`
        const channel = supabase
            .channel(channelId)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as AppNotification
                    setNotifications((prev) => [newNotification, ...prev])

                    try {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
                        audio.volume = 0.5
                        audio.play().catch(() => {})
                    } catch {
                        // Ignore audio playback issues
                    }

                    toast.custom((toastId) => (
                        <div className="w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-primary/20 bg-background/95 shadow-2xl backdrop-blur-xl">
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
                                            <button
                                                onClick={() => {
                                                    toast.dismiss(toastId)
                                                    router.push(newNotification.link || "/notifications")
                                                }}
                                                className="rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                                            >
                                                افتح الإشعار
                                            </button>
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

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const openNotification = (notification: AppNotification) => {
        setIsOpen(false)
        router.push(notification.link || "/notifications")
    }

    if (!user) return null

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
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
                <div className="absolute top-full lg:-end-2 -end-24 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-premium z-50">
                    <div className="border-b border-surface-hover bg-surface-lighter/50 px-4 py-3">
                        <h3 className="font-heading font-black text-foreground">الإشعارات</h3>
                        <p className="mt-1 text-[11px] text-gray-500">أحدث 4 إشعارات فقط</p>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                        ) : previewNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="mx-auto mb-3 h-6 w-6 text-gray-400" />
                                <p className="text-sm font-bold text-gray-500">لا توجد إشعارات جديدة</p>
                            </div>
                        ) : (
                            previewNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => openNotification(notification)}
                                    className={`block w-full border-b border-surface-hover/50 px-4 py-3 text-start transition-colors hover:bg-surface-hover ${!notification.is_read ? "bg-primary/5" : ""}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex items-center gap-2">
                                            {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                            <p className="truncate text-sm font-bold text-foreground">{notification.title}</p>
                                        </div>
                                        <span className="shrink-0 text-[10px] text-gray-400">
                                            {new Date(notification.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                    <p className="mt-1 pe-4 text-xs leading-6 text-gray-500 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="border-t border-surface-hover bg-background/70 p-3">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                router.push("/notifications")
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                        >
                            فتح كل الإشعارات
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
