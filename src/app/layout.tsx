import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MetaPixel from '@/components/analytics/MetaPixel';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXTAUTH_URL || 'https://pawmart-ai2scl8of-nishas-projects-1ac804f9.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PawMart Nepal | Pet Supplies & Veterinary Care in Nepal',
    template: '%s | PawMart Nepal',
  },
  description:
    'Shop authentic pet food, toys, accessories & book verified veterinary clinic visits or home consultations across Kathmandu, Lalitpur, Pokhara and all Nepal.',
  keywords: [
    'pet shop Nepal',
    'pet products Nepal',
    'pet supplies Nepal',
    'dog food Nepal',
    'cat food Nepal',
    'pet accessories Nepal',
    'veterinary services Nepal',
    'online pet store Nepal',
    'pet supplies Kathmandu',
    'PawMart Nepal',
  ],
  authors: [{ name: 'PawMart Nepal' }],
  creator: 'PawMart Nepal',
  publisher: 'PawMart Nepal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'PawMart Nepal',
    title: 'PawMart Nepal | Pet Supplies Marketplace & Vet Booking Platform',
    description:
      'Nepal’s premier multi-vendor pet marketplace and veterinary appointment platform. Buy pet supplies, book vet clinic appointments, and request home visits across Nepal.',
    images: [
      {
        url: '/hero.jpeg',
        width: 1200,
        height: 630,
        alt: 'PawMart Nepal Happy Dogs and Cats',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawMart Nepal | Pet Supplies & Veterinary Care in Nepal',
    description:
      'Shop authentic pet food, toys, accessories & book verified veterinary clinic appointments across Nepal.',
    images: ['/hero.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MetaPixel />
        <GoogleAnalytics />
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
