import { supabase } from '@/lib/supabase';

export type AppSettings = {
  siteName: string;
  siteTagline: string;
  supportPhone: string;
  supportEmail: string;
  freeShippingThreshold: string;
  defaultShippingCost: string;
  notifyNewOrders: boolean;
  notifyNewUsers: boolean;
  maintenanceMode: boolean;
};

export const APP_SETTINGS_ID = 'global';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  siteName: 'في السكة',
  siteTagline: 'بالسكة الصح',
  supportPhone: '',
  supportEmail: '',
  freeShippingThreshold: '0',
  defaultShippingCost: '20',
  notifyNewOrders: true,
  notifyNewUsers: true,
  maintenanceMode: false,
};

function normalizeSettings(data: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...(data || {}),
    defaultShippingCost: String(data?.defaultShippingCost ?? DEFAULT_APP_SETTINGS.defaultShippingCost),
    freeShippingThreshold: String(data?.freeShippingThreshold ?? DEFAULT_APP_SETTINGS.freeShippingThreshold),
  };
}

export async function fetchPublicAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select(`
      site_name,
      site_tagline,
      support_phone,
      support_email,
      free_shipping_threshold,
      default_shipping_cost,
      notify_new_orders,
      notify_new_users,
      maintenance_mode
    `)
    .eq('id', APP_SETTINGS_ID)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_APP_SETTINGS;
  }

  return normalizeSettings({
    siteName: data.site_name,
    siteTagline: data.site_tagline,
    supportPhone: data.support_phone,
    supportEmail: data.support_email,
    freeShippingThreshold: String(data.free_shipping_threshold ?? DEFAULT_APP_SETTINGS.freeShippingThreshold),
    defaultShippingCost: String(data.default_shipping_cost ?? DEFAULT_APP_SETTINGS.defaultShippingCost),
    notifyNewOrders: data.notify_new_orders ?? DEFAULT_APP_SETTINGS.notifyNewOrders,
    notifyNewUsers: data.notify_new_users ?? DEFAULT_APP_SETTINGS.notifyNewUsers,
    maintenanceMode: data.maintenance_mode ?? DEFAULT_APP_SETTINGS.maintenanceMode,
  });
}

export async function saveAdminAppSettings(settings: AppSettings) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('الجلسة غير متاحة حالياً');
  }

  const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(settings),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'فشل حفظ الإعدادات');
  }

  return normalizeSettings(payload?.settings);
}
