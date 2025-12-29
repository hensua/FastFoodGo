
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { SocialLink } from '@/lib/branding-config';

interface ThemeColors {
    logoColor: string;
    primary: string;
    background: string;
    accent: string;
    bannerAccent: string;
}

interface BrandingConfig {
    appName: string;
    social: SocialLink[];
    logoSvg: string;
    fontFamily: string;
}

interface ApplyThemePayload {
    theme: ThemeColors;
    branding: BrandingConfig;
}

export async function applyTheme(payload: ApplyThemePayload) {
    const { theme, branding } = payload;
    const brandingConfigPath = path.join(process.cwd(), 'src', 'lib', 'branding-config.json');

    try {
        const currentBrandingConfig = JSON.parse(await fs.readFile(brandingConfigPath, 'utf-8'));
        
        // Prepare the new branding data, storing theme colors as HEX
        const newBrandingConfig = {
            ...currentBrandingConfig,
            appName: branding.appName,
            social: branding.social,
            logoSvg: branding.logoSvg,
            fontFamily: branding.fontFamily,
            theme: {
                primary: theme.primary,       // Store as HEX
                background: theme.background, // Store as HEX
                accent: theme.accent,         // Store as HEX
                logoColor: theme.logoColor,   // Store as HEX
                bannerAccent: theme.bannerAccent, // Store as HEX
            }
        };
        
        await fs.writeFile(brandingConfigPath, JSON.stringify(newBrandingConfig, null, 2), 'utf-8');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to apply settings:', error);
        throw new Error('Could not write to configuration files.');
    }
}

