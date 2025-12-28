
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const brandingConfig = await getBrandingConfig();
  return <AdminDashboardClient brandingConfig={brandingConfig} />;
}
