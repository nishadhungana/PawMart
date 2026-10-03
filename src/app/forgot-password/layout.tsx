import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Reset Your Account Access',
  description: 'Request a secure password reset link for your PawMart Nepal account.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
