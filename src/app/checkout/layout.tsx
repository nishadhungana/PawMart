import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout | eSewa, Khalti & COD',
  description:
    'Complete your pet supplies order securely with eSewa, Khalti, Credit Card or Cash on Delivery. Protected with SSL/TLS and cryptographic transaction security.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
