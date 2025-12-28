
// This file is now intended to run on the client, so we can't use 'fs' or 'path'.
// We will fetch the config instead of reading it from the filesystem.

import { hexToHslString } from './utils';
import { rawBrandingConfig as defaultRawConfig } from './default-branding';

// This is the shape of the config file as it's stored on disk
export interface BrandingConfigFile {
    appName: string;
    logoSvg: string;
    fontFamily: string;
    theme: {
        primary: string;       // Stored as HEX
        background: string;    // Stored as HEX
        accent: string;        // Stored as HEX
        logoColor: string;     // Stored as HEX
        bannerAccent: string;  // Stored as HEX
    };
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

// This is the shape we use in the application, converting colors to HSL where needed
export interface BrandingConfig extends BrandingConfigFile {
    theme: {
        primary: string;       // Converted to HSL for CSS
        background: string;    // Converted to HSL for CSS
        accent: string;        // Converted to HSL for CSS
        logoColor: string;     // Kept as HEX for inline style
        bannerAccent: string;  // Converted to HSL for CSS
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
            logoColor: rawConfig.theme.logoColor,
            bannerAccent: hexToHslString(rawConfig.theme.bannerAccent || rawConfig.theme.accent), // Fallback to accent
        }
    };
}

// This function now fetches the config from a public path.
// It's designed to be called from client components.
export async function getBrandingConfig(): Promise<BrandingConfig> {
    try {
        // Fetch the config from the public directory at runtime.
        // The cache-busting `?_=${new Date().getTime()}` ensures we always get the latest version.
        const response = await fetch(`/branding-config.json?_=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch branding config');
        }
        const rawConfig: BrandingConfigFile = await response.json();
        return processBrandingConfig(rawConfig);
    } catch (error) {
        console.error("Could not fetch branding-config.json, falling back to static import.", error);
        // Fallback to the build-time config if the fetch fails
        return processBrandingConfig(defaultRawConfig);
    }
}
