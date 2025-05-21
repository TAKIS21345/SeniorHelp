import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-rose-600">
              <Heart className="w-8 h-8" />
              <span className="text-xl font-semibold">Senior Help Online</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <button onClick={signOut} className="btn-primary">
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}