'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Calendar,
  Package,
  FileText,
  Settings,
  ChevronRight,
  Mail,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  Activity,
  Send
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, color: 'text-purple-400' },
  { name: 'Orders', href: '/admin/orders', icon: Package, color: 'text-yellow-400' },
  { name: 'Leads', href: '/admin/leads', icon: Mail, color: 'text-blue-400' },
  { name: 'Email Marketing', href: '/admin/email-marketing', icon: Send, color: 'text-indigo-400' },
  { name: 'Users', href: '/admin/users', icon: Users, color: 'text-green-400' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, color: 'text-orange-400' },
  { name: 'Games', href: '/admin/games', icon: Calendar, color: 'text-pink-400' },
  { name: 'Stadiums', href: '/admin/stadiums', icon: Building2, color: 'text-indigo-400' },
  { name: 'Inventory', href: '/admin/inventory', icon: Package, color: 'text-cyan-400' },
  { name: 'Health Monitor', href: '/admin/health', icon: Activity, color: 'text-red-400' },
  { name: 'Audit Log', href: '/admin/audit', icon: FileText, color: 'text-gray-400' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'text-gray-400' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800/80 backdrop-blur-md border border-gray-700 text-gray-300 hover:text-white transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40 flex flex-col
          bg-gray-900/95 backdrop-blur-xl border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'w-72' : 'w-0 lg:w-72'}
          ${!isDesktopSidebarOpen && 'lg:w-20'}
          overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="px-6 py-5 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className={`${!isDesktopSidebarOpen && 'lg:hidden'}`}>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-sm text-gray-400 mt-1">SeatJumper Control</p>
              </div>
              <div className={`${isDesktopSidebarOpen && 'lg:hidden'} hidden lg:block`}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
              </div>
              <button
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="hidden lg:block p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${!isDesktopSidebarOpen ? 'rotate-90' : '-rotate-90'}`}
                />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                              (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                      : 'hover:bg-gray-800/50 hover:border-gray-700/50 border border-transparent'
                    }
                  `}
                  title={!isDesktopSidebarOpen ? item.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? item.color : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`
                      font-medium transition-colors
                      ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                      ${!isDesktopSidebarOpen && 'lg:hidden'}
                    `}>
                      {item.name}
                    </span>
                  </div>
                  {isActive && isDesktopSidebarOpen && (
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-3 py-4 border-t border-gray-800/50">
            <div className={`
              flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/30
              ${!isDesktopSidebarOpen && 'lg:justify-center'}
            `}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">AD</span>
              </div>
              <div className={`flex-1 ${!isDesktopSidebarOpen && 'lg:hidden'}`}>
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">admin@seatjumper.com</p>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className={`text-sm ${!isDesktopSidebarOpen && 'lg:hidden'}`}>Back to Site</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar for Mobile */}
        <div className="lg:hidden h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 flex items-center">
          <div className="ml-12 flex-1">
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(n => n.href === pathname || (n.href !== '/admin' && pathname.startsWith(n.href)))?.name || 'Admin'}
            </h1>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-900/50">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}