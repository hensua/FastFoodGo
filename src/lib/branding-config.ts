import data from './branding-config.json';
import { hexToHslString } from './utils';

// This is the shape of the config file
interface BrandingConfigFile {
    appName: string;
    logoSvg: string;
    theme: {
        primary: string; // Stored as HEX
        background: string; // Stored as HEX
        accent: string; // Stored as HEX
        logoColor: string; // Stored as HEX
    };
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

// This is the shape we use in the application, converting colors to HSL where needed
export interface BrandingConfig {
    appName: string;
    theme: {
        primary: string; // Converted to HSL for CSS
        background: string; // Converted to HSL for CSS
        accent: string; // Converted to HSL for CSS
        logoColor: string; // Kept as HEX for inline style
    };
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

// Read the raw JSON data
const rawConfig: BrandingConfigFile = data;

// Create and export the processed defaultBranding object
export const defaultBranding: BrandingConfig = {
    ...rawConfig,
    theme: {
        primary: hexToHslString(rawConfig.theme.primary),
        background: hexToHslString(rawConfig.theme.background),
        accent: hexToHslString(rawConfig.theme.accent),
        logoColor: rawConfig.theme.logoColor,
    }
};

// Export the raw SVG content from the config
export const defaultLogo = rawConfig.logoSvg;
