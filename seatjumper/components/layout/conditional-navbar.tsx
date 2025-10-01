'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on the coming soon landing page
  if (pathname === '/') {
    return null;
  }

  return <Navbar />;
}