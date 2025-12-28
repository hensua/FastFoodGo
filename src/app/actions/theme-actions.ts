'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface ThemeColors {
    primary: string;
    background: string;
    accent: string;
}

export async function applyTheme(colors: ThemeColors) {

    const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');

    try {
        let cssContent = await fs.readFile(cssPath, 'utf-8');

        // Regex to find and replace HSL values for specific CSS variables
        const replaceVariable = (content: string, variable: string, value: string) => {
            const regex = new RegExp(`(--${variable}:\\s*)[^;]+;`);
            if (regex.test(content)) {
                return content.replace(regex, `$1${value};`);
            }
            return content;
        };

        cssContent = replaceVariable(cssContent, 'primary', colors.primary);
        cssContent = replaceVariable(cssContent, 'background', colors.background);
        cssContent = replaceVariable(cssContent, 'accent', colors.accent);
        
        await fs.writeFile(cssPath, cssContent, 'utf-8');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to apply theme:', error);
        throw new Error('Could not write to CSS file.');
    }
}
