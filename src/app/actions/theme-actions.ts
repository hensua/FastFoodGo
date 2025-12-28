'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface ThemeColors {
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
    }
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

        // --- 2. Update Branding (JSON) ---
        const currentBrandingConfig = JSON.parse(await fs.readFile(brandingConfigPath, 'utf-8'));
        const newBrandingConfig = {
            ...currentBrandingConfig,
            ...branding,
        };
        await fs.writeFile(brandingConfigPath, JSON.stringify(newBrandingConfig, null, 2), 'utf-8');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to apply settings:', error);
        throw new Error('Could not write to configuration files.');
    }
}
