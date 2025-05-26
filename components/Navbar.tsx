"use client";
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Corrected import
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Optionally show a toast notification for the error
    } else {
      router.push('/login'); // Redirect to login after successful sign out
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-rose-600">
              <Heart className="w-8 h-8" />
              <span className="text-xl font-semibold">Senior Help Online</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <p>Loading...</p> // Or a spinner component
            ) : user ? (
              <>
                <span className="text-gray-700">Hi, {user.email}</span> {/* Or user.user_metadata.first_name if available */}
                <button onClick={handleSignOut} className="btn-primary">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
