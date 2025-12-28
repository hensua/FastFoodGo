'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface ThemeColors {
    logoColor: string;
    primary: string;
    background: string;
    accent: string;
}

interface BrandingConfig {
    appName: string;
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    },
    logoSvg: string;
}

interface ApplyThemePayload {
    theme: ThemeColors;
    branding: BrandingConfig;
}

export async function applyTheme(payload: ApplyThemePayload) {
    const { theme, branding } = payload;
    const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    const brandingConfigPath = path.join(process.cwd(), 'src', 'lib', 'branding-config.json');

    try {
        // --- 1. Update Theme (CSS) ---
        let cssContent = await fs.readFile(cssPath, 'utf-8');
        const replaceVariable = (content: string, variable: string, value: string) => {
            const regex = new RegExp(`(--${variable}:\\s*)[^;]+;`);
            const hslValue = value; 
            if (regex.test(content)) {
                return content.replace(regex, `$1${hslValue};`);
            }
            return content;
        };
        cssContent = replaceVariable(cssContent, 'primary', theme.primary);
        cssContent = replaceVariable(cssContent, 'background', theme.background);
        cssContent = replaceVariable(cssContent, 'accent', theme.accent);
        await fs.writeFile(cssPath, cssContent, 'utf-8');

        // --- 2. Update Branding Config (JSON) ---
        const currentBrandingConfig = JSON.parse(await fs.readFile(brandingConfigPath, 'utf-8'));
        
        // Prepare the new branding data
        const newBrandingConfig = {
            ...currentBrandingConfig,
            ...branding, // This includes appName, social, and logoSvg
        };

        // Update the theme part of the config separately
        newBrandingConfig.theme = {
            primary: hslStringToHex(theme.primary),
            background: hslStringToHex(theme.background),
            accent: hslStringToHex(theme.accent),
            logoColor: theme.logoColor,
        };
        
        await fs.writeFile(brandingConfigPath, JSON.stringify(newBrandingConfig, null, 2), 'utf-8');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to apply settings:', error);
        throw new Error('Could not write to configuration files.');
    }
}

// Helper to convert HSL string to HEX for storing in JSON
function hslStringToHex(hslStr: string): string {
    const [h, s, l] = hslStr.match(/\\d+(\\.\\d+)?/g)!.map(Number);
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lDecimal - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    const toHex = (c: number) => {
        const hex = Math.round((c + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}