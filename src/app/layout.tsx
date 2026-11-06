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

const siteUrl = process.env.NEXTAUTH_URL || 'https://pawmart-nishas-projects-1ac804f9.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PawMart Nepal | Pet Supplies & Veterinary Care in Nepal',
    template: '%s | PawMart Nepal',
  },
  description:
    'Buy authentic pet supplies, food and toys in Nepal. Book verified vet clinic visits or home consultations in Kathmandu, Pokhara and nationwide.',
  keywords: [
    'pet shop Nepal',
    'dog food Kathmandu',
    'cat supplies Pokhara',
    'online pet store Nepal',
    'veterinary clinic booking',
    'pet grooming supplies',
    'animal hospital consultation',
    'PawMart Nepal',
  ],
  authors: [{ name: 'PawMart Nepal' }],
  creator: 'PawMart Nepal',
  publisher: 'PawMart Nepal',
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-US': siteUrl,
      'ne-NP': siteUrl,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
      'Buy authentic pet food, accessories & book verified veterinary clinic appointments across Nepal.',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'PawMart Nepal',
      description: "Nepal's Premier Pet Marketplace and Veterinary Care Platform",
      inLanguage: ['en-US', 'ne-NP'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/marketplace?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'PawMart Nepal',
      url: siteUrl,
      logo: `${siteUrl}/hero.jpeg`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+977-9801234567',
        contactType: 'customer service',
        areaServed: 'NP',
        availableLanguage: ['English', 'Nepali'],
      },
    },
    {
      '@type': 'Store',
      '@id': `${siteUrl}/#store`,
      name: 'PawMart Nepal Pet Store',
      url: siteUrl,
      priceRange: 'NPR',
      currenciesAccepted: 'NPR',
      paymentAccepted: 'Cash on Delivery, eSewa, Khalti',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kathmandu',
        addressRegion: 'Bagmati',
        addressCountry: 'NP',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
