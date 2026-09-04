import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LedgerGuard — Automated Revenue Recovery & Chargeback Defense',
  description:
    'AI-powered financial risk intelligence and revenue protection platform for enterprise risk teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#000000] text-white overflow-x-hidden`}
      >
        <AuthProvider><NotificationProvider>{children}</NotificationProvider></AuthProvider>
      </body>
    </html>
  );
}
