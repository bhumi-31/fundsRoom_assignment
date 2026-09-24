'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StatusPill } from '@/components/ui/status-pill';
import { RoleBadge } from '@/components/ui/role-badge';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

const MoltenMetal = dynamic(() => import('@/components/3d/MoltenMetal'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [health, setHealth] = useState<'ONLINE' | 'DEGRADED'>('ONLINE');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    const cachedUser = localStorage.getItem('foundry_user');
    if (!cachedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(cachedUser));

    // Poll backend health endpoint & low stock telemetry
    const checkHealth = async () => {
      try {
        const [healthRes, balRes]: [any, any] = await Promise.all([
          fetchApi('/health'),
          fetchApi('/inventory/balances').catch(() => []),
        ]);

        const isOnline = healthRes?.status === 'ONLINE' || healthRes?.database === 'ONLINE';
        setHealth(isOnline ? 'ONLINE' : 'DEGRADED');

        if (Array.isArray(balRes)) {
          const lowStock = balRes.filter((b: any) => (b.physicalQty - b.reservedQty) <= 20).length;
          setLowStockCount(lowStock);
        }
      } catch (err) {
        setHealth('DEGRADED');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('foundry_jwt');
    localStorage.removeItem('foundry_user');
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'OVERVIEW' },
    { href: '/dashboard/inventory', label: 'INVENTORY' },
    { href: '/dashboard/work-orders', label: 'WORK ORDERS' },
    { href: '/dashboard/transfers', label: 'TRANSFERS' },
    { href: '/dashboard/orders', label: 'CUSTOMER ORDERS' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-[#F5F1E8]">
      {/* Subtle Molten Metal WebGL Background Layer (Non-interfering, pointer-events-none) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 overflow-hidden">
        <MoltenMetal
          speed={0.2}
          scale={3.5}
          glow={1.2}
          opacity={0.3}
          lightMode={true}
          color1="#FFB800"
          color2="#A9D9F2"
          color3="#0A0A0A"
          backgroundColor="#F5F1E8"
        />
      </div>

      {/* Neobrutalist Header Bar */}
      <header className="border-b-3 border-[#0A0A0A] bg-[#F5F1E8]/90 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 border-3 border-[#0A0A0A] bg-[#FFB800] flex items-center justify-center font-black text-xl shadow-neo-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
              F
            </div>
            <div>
              <h1 className="font-black text-lg uppercase tracking-tight leading-none text-[#0A0A0A]">
                FOUNDRY // FORGE-OS
              </h1>
              <span className="text-[10px] font-mono font-bold tracking-widest text-gray-600 uppercase">
                MINI OPERATIONS ERP
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 ml-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`px-3 py-1.5 border-3 border-[#0A0A0A] font-mono text-xs font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white shadow-neo-sm'
                        : 'bg-white text-[#0A0A0A] hover:bg-[#FFB800]/20'
                    }`}
                  >
                    {link.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Header Status Controls */}
        <div className="flex items-center gap-3">
          {/* Functional Real Backend Health Pill */}
          <StatusPill
            label={health === 'ONLINE' ? 'SYSTEM ONLINE' : 'SYSTEM DEGRADED'}
            status={health === 'ONLINE' ? 'online' : 'alert'}
          />

          {/* Low Stock Warning Pill */}
          {lowStockCount > 0 && (
            <StatusPill
              label={`${lowStockCount} LOW STOCK`}
              status="warning"
            />
          )}

          {/* Logged in User Role Badge */}
          {user && <RoleBadge role={user.role} />}

          <Button variant="danger" size="sm" onClick={handleLogout}>
            LOGOUT
          </Button>
        </div>
      </header>

      {/* Main Screen Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto relative z-10">{children}</main>
    </div>
  );
}
