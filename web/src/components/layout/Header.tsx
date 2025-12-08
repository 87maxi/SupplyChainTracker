"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { ConnectButton } from './ConnectButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Home, LayoutDashboard, User, ArrowRightLeft, Users, Laptop, Bell } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home, requiresConnection: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresConnection: true },
  { href: '/profile', label: 'Perfil', icon: User, requiresConnection: true },
  { href: '/transfers', label: 'Transferencias', icon: ArrowRightLeft, requiresConnection: true, requiresAdmin: true },
  { href: '/admin/users', label: 'Gestión de Roles', icon: Users, requiresConnection: true, requiresAdmin: true },
  { href: '/admin/netbooks', label: 'Gestión de Netbooks', icon: Laptop, requiresConnection: true, requiresAdmin: true },
];

export function Header() {
  const { isConnected, isAdmin, address, web3Service } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Check for pending role requests
  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!isConnected || !address || !web3Service || isAdmin) return;

      try {
        const roles = [
          getRoleConstants().FABRICANTE_ROLE,
          getRoleConstants().AUDITOR_HW_ROLE,
          getRoleConstants().TECNICO_SW_ROLE,
          getRoleConstants().ESCUELA_ROLE
        ];

        const pendingCount = await Promise.all(
          roles.map(async (role) => {
            try {
              const status = await web3Service.getRoleStatus(role, address);
              return status.state === 0 ? 1 : 0; // Pending = 0
            } catch {
              return 0;
            }
          })
        );

        setPendingRequests(pendingCount.reduce((sum: number, count: number) => sum + count, 0));
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };

    checkPendingRequests();
  }, [isConnected, address, web3Service, isAdmin]);

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresConnection && !isConnected) return false;
    if (item.requiresAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SC</span>
          </div>
          <h1 className="text-xl font-bold hidden sm:block">SupplyChainTracker</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ConnectButton />

          {/* Notifications indicator for non-admin users */}
          {!isAdmin && pendingRequests > 0 && (
            <Link href="/profile" className="relative">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
                >
                  {pendingRequests}
                </Badge>
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">SC</span>
                  </div>
                  <span className="font-semibold">SupplyChainTracker</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};