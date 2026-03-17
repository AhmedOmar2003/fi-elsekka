import { AdminProfile } from './admin-guard';

export type Permission =
  | 'view_orders'
  | 'update_order_status'
  | 'assign_driver'
  | 'view_drivers'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_offers'
  | 'manage_discounts'
  | 'manage_users'
  | 'manage_admins'
  | 'manage_settings'
  | 'view_reports';

type RolePermShape = { role?: string | null; permissions?: string[] | null };

const FULL_ADMIN_PERMISSIONS = [
  'manage_admins',
  'manage_users',
  'manage_products',
  'manage_categories',
  'manage_offers',
  'manage_discounts',
  'manage_settings',
  'view_reports',
] as const;

export function hasPermission(profile: RolePermShape | null | undefined, perm: Permission) {
  if (!profile) return false;
  if (profile.role === 'super_admin' || profile.role === 'admin') return true;
  return Array.isArray(profile.permissions ?? []) && (profile.permissions as string[]).includes(perm);
}

export function hasFullAdminAccess(profile: RolePermShape | null | undefined) {
  if (!profile) return false;
  if (profile.role === 'super_admin' || profile.role === 'admin') return true;
  return Array.isArray(profile.permissions ?? []) && FULL_ADMIN_PERMISSIONS.some((perm) => (profile.permissions as string[]).includes(perm));
}

export function requiredPermissionForPath(pathname: string): Permission | null {
  if (pathname.startsWith('/admin/staff')) return 'manage_admins';
  if (pathname.startsWith('/admin/users')) return 'manage_users';
  if (pathname.startsWith('/admin/products')) return 'manage_products';
  if (pathname.startsWith('/admin/categories')) return 'manage_categories';
  if (pathname.startsWith('/admin/promotions')) return 'manage_offers';
  if (pathname.startsWith('/admin/discounts')) return 'manage_discounts';
  if (pathname.startsWith('/admin/settings')) return 'manage_settings';
  if (pathname.startsWith('/admin/reviews')) return 'view_reports';
  if (pathname.startsWith('/admin/orders')) return 'view_orders';
  if (pathname.startsWith('/admin/drivers')) return 'view_drivers';
  return null;
}
