import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account | Join PawMart Nepal',
  description: 'Create a free PawMart Nepal account to order pet supplies, save wishlists, and book veterinary appointments.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
