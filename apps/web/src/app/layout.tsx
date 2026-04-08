import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AuthNav } from '@/components/AuthNav';
import { ChatWidget } from '@/components/chat/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OS Interact — Crowdfunding',
  description: 'Fund the future. Back innovative projects on OS Interact.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthNav />
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
