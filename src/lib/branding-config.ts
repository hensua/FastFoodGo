import data from './branding-config.json';
import { hexToHslString } from './utils';

// This is the shape of the config file
interface BrandingConfigFile {
    appName: string;
    theme: {
        primary: string; // Stored as HEX
        background: string; // Stored as HEX
        accent: string; // Stored as HEX
    };
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

// This is the shape we use in the application, converting colors to HSL
export interface BrandingConfig {
    appName: string;
    theme: {
        primary: string; // Converted to HSL
        background: string; // Converted to HSL
        accent: string; // Converted to HSL
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
    }
};
