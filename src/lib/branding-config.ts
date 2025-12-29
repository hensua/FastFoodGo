// This file is now intended to run on the client, so we can't use 'fs' or 'path'.
// We will fetch the config instead of reading it from the filesystem.

import { hexToHslString } from './utils';
import { rawBrandingConfig as defaultRawConfig } from './default-branding';

export interface SocialLink {
    name: 'twitter' | 'instagram' | 'facebook' | string;
    url: string;
}

// This is the shape of the config file as it's stored on disk
export interface BrandingConfigFile {
    appName: string;
    logoSvg: string;
    fontFamily: string;
    theme: {
        primary: string;
        background: string;
        accent: string;
        card: string;
        logoColor: string;
        bannerAccent: string;
    };
    social: SocialLink[];
}

// This is the shape we use in the application, converting colors to HSL where needed
export interface BrandingConfig extends BrandingConfigFile {
    theme: {
        primary: string;
        background: string;
        accent: string;
        card: string;
        logoColor: string;
        bannerAccent: string;
    };
}

// Helper function to process the raw config
function processBrandingConfig(rawConfig: BrandingConfigFile): BrandingConfig {
    return {
        ...rawConfig,
        theme: {
            primary: hexToHslString(rawConfig.theme.primary),
            background: hexToHslString(rawConfig.theme.background),
            accent: hexToHslString(rawConfig.theme.accent),
            card: hexToHslString(rawConfig.theme.card),
            logoColor: rawConfig.theme.logoColor,
            bannerAccent: rawConfig.theme.bannerAccent || '#FFFFFF',
        }
    };
}

// This function now fetches the config from a public path.
// It's designed to be called from client components.
export async function getBrandingConfig(): Promise<BrandingConfig> {
    try {
        const response = await fetch(`/branding-config.json?_=${new Date().getTime()}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch branding config');
        }
        const rawConfig: BrandingConfigFile = await response.json();
        return processBrandingConfig(rawConfig);
    } catch (error) {
        console.error("Could not fetch branding-config.json, falling back to static import.", error);
        return processBrandingConfig(defaultRawConfig);
    }
}
