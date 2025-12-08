"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, LucideIcon } from 'lucide-react';
import { useWeb3 } from '@/lib/contexts/Web3Context';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

const routeLabels: Record<string, string> = {
  '/': 'Inicio',
  '/dashboard': 'Dashboard',
  '/profile': 'Perfil',
  '/admin/users': 'Gestión de Roles',
  '/admin/netbooks': 'Gestión de Netbooks',
  '/transfers': 'Transferencias',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { isConnected, isAdmin } = useWeb3();

  if (!isConnected) return null;

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/', icon: Home },
    ...pathSegments.map((segment, index): BreadcrumbItem | null => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = routeLabels[href] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Check admin permissions for admin routes
      if (href.startsWith('/admin') && !isAdmin) {
        return null;
      }

      return { label, href };
    }).filter((crumb): crumb is BreadcrumbItem => crumb !== null)
  ];

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {crumb.icon && <crumb.icon className="w-4 h-4" />}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}