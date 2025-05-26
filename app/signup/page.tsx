"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2 for spinner
import { motion } from 'framer-motion'; // Added for animations

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;

    if (!email || !password || !firstName) {
      setError("All fields are required.");
      return;
    }

    const { error: signUpError } = await signUp(email, password, firstName);

    if (signUpError) {
      console.error('Error signing up:', signUpError);
      setError(signUpError.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="card max-w-md w-full"
        initial={{ opacity: 0, y: -20 }} // Animation: initial state
        animate={{ opacity: 1, y: 0 }}     // Animation: animate to
        transition={{ duration: 0.5, ease: "easeOut" }} // Animation: transition properties
      >
        <div className="card-content">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-8">
            Create your account
          </h2>
          
          {error && (
            <motion.div 
              className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-md mb-6 flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" /> {/* Added flex-shrink-0 */}
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="input w-full"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input w-full"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input w-full"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center" // Added flex for spinner
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-DEFAULT hover:text-primary-dark">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
