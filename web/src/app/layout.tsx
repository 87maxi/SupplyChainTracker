import './globals.css';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Providers } from '@/components/layout/Providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SupplyChainTracker - Panel de Administración',
  description: 'Sistema de trazabilidad de netbooks educativas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Breadcrumbs />
              {children}
            </main>
            <footer className="border-t">
              <div className="container mx-auto px-4 py-6">
                <p className="text-center text-sm text-muted-foreground">
                  © {new Date().getFullYear()} SupplyChainTracker. Todos los derechos reservados.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}