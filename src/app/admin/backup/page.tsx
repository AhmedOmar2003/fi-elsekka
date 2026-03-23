'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { BACKUP_SCOPES, BACKUP_SCOPE_ORDER, BACKUP_TABLE_LABELS, type BackupScope } from '@/lib/admin-backup';
import { Database, Download, FileJson2, FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react';

type DownloadKey = `${BackupScope}:json` | `${BackupScope}:excel`;

async function downloadBackup(scope: BackupScope, format: 'json' | 'excel') {
  const response = await fetch(`/api/admin/backup/export?scope=${scope}&format=${format}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'تعذر تنزيل النسخة الاحتياطية دلوقتي');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const fileName = match?.[1] || `fi-elsekka-backup-${scope}.${format === 'excel' ? 'xls' : 'json'}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function AdminBackupPage() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<DownloadKey | null>(null);

  React.useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace('/admin/login');
      return;
    }

    if (!hasPermission(profile, 'manage_settings')) {
      router.replace('/admin');
    }
  }, [isAuthLoading, profile, router, user]);

  const scopeEntries = useMemo(
    () => BACKUP_SCOPE_ORDER.map((scope) => [scope, BACKUP_SCOPES[scope]] as const),
    []
  );

  const handleDownload = async (scope: BackupScope, format: 'json' | 'excel') => {
    const key = `${scope}:${format}` as DownloadKey;
    setLoadingKey(key);
    try {
      await downloadBackup(scope, format);
      toast.success(
        format === 'excel' ? 'نزلنا نسخة Excel جاهزة ✅' : 'نزلنا نسخة JSON كاملة ✅',
        {
          description:
            format === 'excel'
              ? 'تقدر تفتحها في Excel وتراجع كل الجداول بسهولة.'
              : 'دي النسخة الأشمل للطوارئ أو لو حبيت تنقل البيانات في أي مكان تاني.',
        }
      );
    } catch (error: any) {
      toast.error('حصلت مشكلة وإحنا بنجهز النسخة', {
        description: error?.message || 'جرب تاني بعد شوية',
      });
    } finally {
      setLoadingKey(null);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-surface-hover bg-surface p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-black text-primary">
              <Database className="w-4 h-4" />
              Backup Center
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">النسخ الاحتياطي</h1>
              <p className="mt-2 text-sm md:text-base text-gray-400 leading-relaxed max-w-3xl">
                من هنا تقدر تنزل نسخة كاملة من الداتا لو حبيت تحتفظ بيها، تراجعها في Excel، أو تنقلها لأي مكان تاني وقت الطوارئ.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 max-w-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">
                النسخة دي مخصصة للإدارة فقط، وبتشمل بيانات حساسة. حمّلها على جهاز آمن واحتفظ بيها بعيد عن أي مشاركة عامة.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {scopeEntries.map(([scope, config]) => (
          <div key={scope} className="rounded-[2rem] border border-surface-hover bg-surface p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-white mb-2">{config.label}</h2>
                <p className="text-sm text-gray-400 leading-relaxed">{config.description}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary shrink-0">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-surface-hover bg-background/40 p-4 mb-5">
              <p className="text-xs font-black text-gray-400 mb-3">الجداول اللي هتنزل</p>
              <div className="flex flex-wrap gap-2">
                {config.tables.map((tableName) => (
                  <span
                    key={tableName}
                    className="rounded-full border border-surface-hover bg-surface px-3 py-1.5 text-xs font-bold text-gray-300"
                  >
                    {BACKUP_TABLE_LABELS[tableName] || tableName}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDownload(scope, 'excel')}
                disabled={loadingKey !== null}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingKey === `${scope}:excel` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                نسخة Excel
              </button>

              <button
                type="button"
                onClick={() => handleDownload(scope, 'json')}
                disabled={loadingKey !== null}
                className="flex items-center justify-center gap-2 rounded-2xl border border-surface-hover bg-surface px-4 py-3 font-black text-white transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingKey === `${scope}:json` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileJson2 className="w-4 h-4" />
                )}
                نسخة JSON
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-surface-hover bg-surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-white">أفضل استخدام للنسخة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl border border-surface-hover bg-background/40 p-4 text-gray-300 leading-relaxed">
            <p className="font-black text-white mb-2">نسخة Excel</p>
            افتحها بسرعة في Excel وراجع أي جدول أو ابعته للمحاسب أو لفريق المتابعة بسهولة.
          </div>
          <div className="rounded-2xl border border-surface-hover bg-background/40 p-4 text-gray-300 leading-relaxed">
            <p className="font-black text-white mb-2">نسخة JSON</p>
            دي الأفضل للطوارئ أو لو هتنقل الداتا لمكان تاني وتحتاج نسخة كاملة منظمة لكل الجداول.
          </div>
          <div className="rounded-2xl border border-surface-hover bg-background/40 p-4 text-gray-300 leading-relaxed">
            <p className="font-black text-white mb-2">نصيحة أمان</p>
            خزن النسخة على جهاز موثوق أو مساحة آمنة، وما تبعتهاش لأي حد مش محتاج يشوف البيانات دي.
          </div>
        </div>
      </section>
    </div>
  );
}
