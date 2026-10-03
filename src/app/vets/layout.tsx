import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veterinary Clinics & Doctors in Nepal | Book Appointments',
  description:
    'Find and book verified veterinary doctors and clinics across Kathmandu, Lalitpur, and Pokhara. Clinic appointments, vaccinations, and home visit veterinary consultations.',
  openGraph: {
    title: 'Veterinary Clinics & Doctors in Nepal | PawMart Nepal',
    description:
      'Book verified vet clinic appointments and home consultations across Nepal with top licensed veterinarians.',
    images: ['/hero.jpeg'],
  },
};

export default function VetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
