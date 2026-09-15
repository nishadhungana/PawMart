import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PawMart Nepal — Pet Supplies Marketplace & Vet Booking Platform',
  description: 'Nepal’s premier multi-vendor pet marketplace and veterinary appointment platform. Buy pet supplies, book vet clinic appointments, and request home visits across Nepal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
