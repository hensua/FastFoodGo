
import Link from 'next/link';
import { Twitter, Instagram, Facebook } from 'lucide-react';
import type { BrandingConfig, SocialLink } from '@/lib/branding-config';

const socialIcons: { [key: string]: React.ElementType } = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
};

export default function Footer({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const { appName, social, theme, logoSvg } = brandingConfig;

  return (
    <footer className="bg-card border-t mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center gap-2">
            <div 
              className="h-7 w-7"
              style={{ color: theme.logoColor }}
              dangerouslySetInnerHTML={{ __html: logoSvg }}
            />
            <span className="text-xl font-bold font-headline text-foreground">
              {appName}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">
              Términos de Servicio
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Política de Privacidad
            </Link>
          </div>
          <div className="flex items-center gap-4">
             {social.map((link) => {
                const Icon = socialIcons[link.name];
                if (!Icon || !link.url) return null;
                return (
                    <Link key={link.name} href={link.url} aria-label={link.name} className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                        <Icon size={20} />
                    </Link>
                );
             })}
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
          <p>&copy; {new Date().getFullYear()} {appName}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

    