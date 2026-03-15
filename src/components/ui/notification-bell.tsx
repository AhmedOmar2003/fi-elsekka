"use client"

import * as React from "react"
import { Bell, Check, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AppNotification, fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notificationsService"
import { useRouter } from "next/navigation"
import { cn } from "./button"

export function NotificationBell() {
    const { user } = useAuth()
    const router = useRouter()
    
    const [notifications, setNotifications] = React.useState<AppNotification[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    
    const popoverRef = React.useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.is_read).length

    const loadNotifications = React.useCallback(async () => {
        if (!user) return
        try {
            const data = await fetchUserNotifications(user.id)
            setNotifications(data)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    // Load on mount and when bell is clicked
    React.useEffect(() => {
        loadNotifications()
    }, [loadNotifications])

    const handleToggle = () => {
        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)
        if (newIsOpen) {
            loadNotifications() // Refresh when opening
        }
    }

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const handleNotificationClick = async (notif: AppNotification) => {
        setIsOpen(false)
        
        // Mark as read optimistically
        if (!notif.is_read) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
            if (user) {
                await markNotificationAsRead(notif.id, user.id)
            }
        }

        // Navigate
        if (notif.link) {
            router.push(notif.link)
        }
    }

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user || unreadCount === 0) return
        
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await markAllNotificationsAsRead(user.id)
    }

    if (!user) return null

    return (
        <div className="relative" ref={popoverRef}>
             <button
                onClick={handleToggle}
                className="relative text-gray-500 hover:text-foreground bg-surface-hover/50 hover:bg-surface-hover w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
                aria-label="الإشعارات"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full lg:-end-2 -end-24 mt-2 w-80 sm:w-96 bg-surface border border-surface-hover rounded-2xl shadow-premium z-50 flex flex-col overflow-hidden max-h-[80vh] animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-surface-hover bg-surface-lighter/50">
                        <h3 className="font-heading font-black text-foreground">الإشعارات</h3>
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
                                {notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={cn(
                                            "flex flex-col text-start p-4 border-b border-surface-hover/50 hover:bg-surface-hover transition-colors",
                                            !notif.is_read ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2.5 mb-1.5 w-full">
                                            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                                {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />}
                                                <span className={!notif.is_read ? "text-primary dark:text-foreground" : ""}>
                                                    {notif.title}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                                                {new Date(notif.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed leading-snug pe-4">
                                            {notif.message}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
