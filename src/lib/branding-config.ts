import { promises as fs } from 'fs';
import path from 'path';
import { hexToHslString } from './utils';
import { rawBrandingConfig } from './default-branding';

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
    };
}


// Asynchronously read the config file. This function runs on the server.
// It will always read the latest version of the file, allowing for dynamic updates.
export async function getBrandingConfig(): Promise<BrandingConfig> {
    try {
        const configPath = path.join(process.cwd(), 'src', 'lib', 'branding-config.json');
        const fileContents = await fs.readFile(configPath, 'utf8');
        const rawConfig: BrandingConfigFile = JSON.parse(fileContents);
        
        // Process the raw config into the format the app uses
        return {
            ...rawConfig,
            theme: {
                primary: hexToHslString(rawConfig.theme.primary),
                background: hexToHslString(rawConfig.theme.background),
                accent: hexToHslString(rawConfig.theme.accent),
                logoColor: rawConfig.theme.logoColor,
            }
        };
    } catch (error) {
        console.error("Could not read branding-config.json, falling back to static import.", error);
        // Fallback to the build-time config if the file is unreadable
        return {
            ...rawBrandingConfig,
            theme: {
                primary: hexToHslString(rawBrandingConfig.theme.primary),
                background: hexToHslString(rawBrandingConfig.theme.background),
                accent: hexToHslString(rawBrandingConfig.theme.accent),
                logoColor: rawBrandingConfig.theme.logoColor,
            }
        };
    }
}
