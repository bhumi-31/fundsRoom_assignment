import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'FOUNDRY // FORGE-OS — Mini Operations ERP',
  description: 'Production Operations & Inventory Management Core',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-[#FFB800] selection:text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
