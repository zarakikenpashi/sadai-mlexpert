import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MLexpert — Comptabilité OHADA/SYSCOHADA',
  description: 'SaaS de comptabilité pour cabinets comptables.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
