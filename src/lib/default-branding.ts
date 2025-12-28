// This file is safe to import on the client, as it only imports a JSON file.
import staticBrandingConfig from './branding-config.json';
import type { BrandingConfigFile } from './branding-config';

// This is the raw config from the JSON file, safe for client-side use.
export const rawBrandingConfig: BrandingConfigFile = staticBrandingConfig;

// Export the default logo and branding separately for client components
// to use without pulling in server-side code.
export const defaultLogo = rawBrandingConfig.logoSvg;

export const defaultBranding = {
    appName: rawBrandingConfig.appName,
    social: rawBrandingConfig.social,
    fontFamily: rawBrandingConfig.fontFamily,
    theme: {
        ...rawBrandingConfig.theme
    },
};
