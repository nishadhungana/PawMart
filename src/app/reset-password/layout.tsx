import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | PawMart Nepal',
  description: 'Enter your new password to restore access to your PawMart Nepal account.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
