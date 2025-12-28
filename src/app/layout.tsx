import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { getBrandingConfig } from '@/lib/branding-config';
import { cn } from '@/lib/utils';

// Helper function to generate Google Font URL
const getFontUrl = (fontFamily: string) => {
  const fontName = fontFamily.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${fontName}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
};

// This function now runs on the server to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  const brandingConfig = await getBrandingConfig();
  return {
    title: brandingConfig.appName,
    description: `La forma más rápida de llegar a tu comida favorita.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandingConfig = await getBrandingConfig();
  const fontUrl = getFontUrl(brandingConfig.fontFamily);
  const fontClass = `font-${brandingConfig.fontFamily.toLowerCase().replace(/ /g, '-')}`;

  return (
    <html lang="es" suppressHydrationWarning>
       <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --primary: ${brandingConfig.theme.primary};
              --background: ${brandingConfig.theme.background};
              --accent: ${brandingConfig.theme.accent};
            }
          `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href={fontUrl}
          rel="stylesheet"
        />
      </head>
      <body className={cn("antialiased", fontClass)}>
        <FirebaseClientProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
