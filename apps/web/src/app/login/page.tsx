'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

const MoltenMetal = dynamic(() => import('@/components/3d/MoltenMetal'), {
  ssr: false,
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@foundry.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('foundry_jwt', res.accessToken);
      localStorage.setItem('foundry_user', JSON.stringify(res.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickRole: 'admin' | 'ops' | 'sales') => {
    setEmail(`${quickRole}@foundry.com`);
    setPassword('Password123!');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
      {/* Visual Moment 1: WebGL Molten Metal Full-Bleed Canvas */}
      <MoltenMetal
        color1="#FFB800"
        color2="#0A0A0A"
        color3="#F5F1E8"
        speed={0.3}
        brightness={1.2}
        mouseInteraction={false}
      />

      {/* Elevated Neobrutalist Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <BadgeCard
          title="FOUNDRY // OPERATIONAL AUTH PORTAL"
          variant="amber"
          className="shadow-neo"
        >
          <div className="mb-6 border-b-3 border-[#0A0A0A] pb-4">
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
              FORGE-OS CORE
            </h1>
            <p className="text-xs font-mono font-bold tracking-wider text-gray-800 uppercase mt-1">
              [SECURITY LEVEL 4 ACCESS REQUIRED]
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 border-3 border-[#0A0A0A] bg-[#FF4D4D] text-white font-mono text-xs font-bold uppercase shadow-neo-sm">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-black uppercase mb-1">
                SYSTEM IDENTIFIER (EMAIL)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-3 border-[#0A0A0A] font-mono text-sm bg-white focus:outline-none focus:bg-[#FFB800]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-black uppercase mb-1">
                SECURITY ACCESS PASS
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border-3 border-[#0A0A0A] font-mono text-sm bg-white focus:outline-none focus:bg-[#FFB800]/20"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER →'}
            </Button>
          </form>

          {/* Quick Preset Selector for Demo/Evaluator */}
          <div className="mt-6 pt-4 border-t-3 border-[#0A0A0A]">
            <p className="text-xs font-mono font-bold uppercase mb-2 text-center text-gray-800">
              ⚡ QUICK ROLE SELECTOR (DEMO):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="amber"
                size="sm"
                onClick={() => handleQuickLogin('admin')}
              >
                ADMIN
              </Button>
              <Button
                type="button"
                variant="sky"
                size="sm"
                onClick={() => handleQuickLogin('ops')}
              >
                OPS
              </Button>
              <Button
                type="button"
                variant="pink"
                size="sm"
                onClick={() => handleQuickLogin('sales')}
              >
                SALES
              </Button>
            </div>
          </div>
        </BadgeCard>
      </div>
    </main>
  );
}
