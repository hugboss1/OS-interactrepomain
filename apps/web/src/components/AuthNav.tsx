'use client';

import Link from 'next/link';
import { authStore } from '@/lib/auth-store';
import { useEffect, useState } from 'react';

export function AuthNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(authStore.isLoggedIn());
  }, []);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          OS Interact
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">
            Explore
          </Link>
          {loggedIn ? (
            <Link href="/profile" className="text-blue-600 font-semibold">
              My Account
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
