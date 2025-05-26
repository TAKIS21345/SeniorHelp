// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/contexts/AuthContext'; // Adjust path if needed

export const metadata: Metadata = {
  title: 'Senior Help Online - Next.js',
  description: 'Caring support for seniors, now on Next.js!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
