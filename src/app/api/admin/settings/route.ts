import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';
import { APP_SETTINGS_ID, DEFAULT_APP_SETTINGS } from '@/services/appSettingsService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function PUT(request: Request) {
  const auth = await requireAdminApi(request, 'manage_settings');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const payload = {
      id: APP_SETTINGS_ID,
      site_name: String(body.siteName || DEFAULT_APP_SETTINGS.siteName).trim(),
      site_tagline: String(body.siteTagline || DEFAULT_APP_SETTINGS.siteTagline).trim(),
      support_phone: String(body.supportPhone || '').trim(),
      support_email: String(body.supportEmail || '').trim(),
      free_shipping_threshold: Number(body.freeShippingThreshold || 0),
      default_shipping_cost: Number(body.defaultShippingCost || DEFAULT_APP_SETTINGS.defaultShippingCost),
      notify_new_orders: Boolean(body.notifyNewOrders),
      notify_new_users: Boolean(body.notifyNewUsers),
      maintenance_mode: Boolean(body.maintenanceMode),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to save app settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        siteName: data.site_name,
        siteTagline: data.site_tagline,
        supportPhone: data.support_phone,
        supportEmail: data.support_email,
        freeShippingThreshold: String(data.free_shipping_threshold ?? DEFAULT_APP_SETTINGS.freeShippingThreshold),
        defaultShippingCost: String(data.default_shipping_cost ?? DEFAULT_APP_SETTINGS.defaultShippingCost),
        notifyNewOrders: data.notify_new_orders ?? DEFAULT_APP_SETTINGS.notifyNewOrders,
        notifyNewUsers: data.notify_new_users ?? DEFAULT_APP_SETTINGS.notifyNewUsers,
        maintenanceMode: data.maintenance_mode ?? DEFAULT_APP_SETTINGS.maintenanceMode,
      },
    });
  } catch (error: any) {
    console.error('Admin settings API failed:', error);
    return NextResponse.json({ error: error?.message || 'فشل حفظ الإعدادات' }, { status: 500 });
  }
}
