
import Link from 'next/link';
import { UtensilsCrossed, Twitter, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground">
              FastFoodGo
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
             <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
             </Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
             </Link>
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
             </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
          <p>&copy; {new Date().getFullYear()} FastFoodGo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
