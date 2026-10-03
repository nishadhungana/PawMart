import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Saved Pet Products',
  description: 'View and manage your saved favorite pet foods, toys, and grooming items on PawMart Nepal.',
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
