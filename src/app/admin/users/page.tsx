"use client"

import React, { useEffect, useState } from 'react';
import { deleteAllRegularUsers, fetchAdminUsers, deleteUser } from '@/services/adminService';
import { Users, Search, Trash2, Mail, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type User = {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    created_at: string;
};

export default function AdminUsersPage() {
    const { profile } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCleaning, setIsCleaning] = useState(false);

    const load = async () => {
        setIsLoading(true);
        const data = await fetchAdminUsers();
        setUsers(data as User[]);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success('تم حذف المستخدم وكل بياناته المرتبطة');
        } catch (error: any) {
            toast.error(error.message || 'فشل حذف المستخدم');
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = confirm('سيتم حذف كل المستخدمين العاديين مع الطلبات والمفضلة والإشعارات والبيانات المرتبطة بهم، ثم إعادة مزامنة قسم الأكثر مبيعًا. هل أنت متأكد؟');
        if (!confirmed) return;

        setIsCleaning(true);
        try {
            const result = await deleteAllRegularUsers();
            toast.success(`تم حذف ${result.deletedUsers} مستخدم و ${result.deletedOrders} طلب، وتمت مزامنة الأكثر مبيعًا`);
            await load();
        } catch (error: any) {
            toast.error(error.message || 'فشل تنظيف قاعدة البيانات');
        } finally {
            setIsCleaning(false);
        }
    };

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">المستخدمون</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{users.length} مستخدم مسجّل</p>
                </div>
                {['super_admin', 'admin'].includes(profile?.role || '') && (
                    <button
                        onClick={handleDeleteAll}
                        disabled={isCleaning}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                    >
                        {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                        حذف كل مستخدمي التجربة
                    </button>
                )}
            </div>

            {['super_admin', 'admin'].includes(profile?.role || '') && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-500">
                    هذا الزر مخصص لمرحلة التجربة فقط. سيحذف العملاء العاديين وكل الطلبات والبيانات المرتبطة بهم، ثم يعيد حساب `الأكثر مبيعًا` من الطلبات المتبقية.
                </div>
            )}

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث بالاسم أو الإيميل..."
                    className="w-full bg-surface border border-surface-hover rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
            </div>

            {/* Table */}
            <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-surface-hover">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">المستخدم</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 hidden sm:table-cell">الإيميل</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 hidden md:table-cell">رقم الهاتف</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 hidden lg:table-cell">تاريخ التسجيل</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">حذف</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-hover">
                            {isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-10 bg-surface-hover rounded-lg animate-pulse" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-500 py-12">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        لا يوجد مستخدمون مطابقون
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-bold text-foreground text-sm">{user.full_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                                            {user.phone || '—'}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
