'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogIn, LogOut, Shield, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.isAdmin;

  // Don't show navbar on auth pages or homepage
  if (pathname.startsWith('/auth') || pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-400">SeatJumper</span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/events"
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Events
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-white hover:text-yellow-400 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="text-gray-400">Loading...</div>
            ) : session ? (
              // Logged in state
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                  {isAdmin && (
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              // Logged out state
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-white hover:text-yellow-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}