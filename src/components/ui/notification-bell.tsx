"use client"

import * as React from "react"
import { Bell, CheckCircle2 } from "lucide-react"
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

    const unreadCount = notifications.filter((notification) => !notification.is_read).length

    const loadNotifications = React.useCallback(async () => {
        if (!user) return
        const data = await fetchUserNotifications(user.id, 50)
        setNotifications(data)
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

    if (!user) return null

    return (
        <button
            onClick={() => router.push("/notifications")}
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
    )
}
