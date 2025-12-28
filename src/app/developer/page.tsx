
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';
import DeveloperPageClient from './DeveloperPageClient';

// This is a pure Server Component. Its only job is to fetch server-side data.
export default async function DeveloperPage() {
    const brandingConfig = await getBrandingConfig();
    
    // It then renders a Client Component, passing the data as props.
    return <DeveloperPageClient brandingConfig={brandingConfig} />;
}
