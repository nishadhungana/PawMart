import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | PawMart Nepal',
  description: 'Sign in to your PawMart Nepal customer, seller, or veterinary clinic account.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
