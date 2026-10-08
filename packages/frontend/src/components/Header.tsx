'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚗 NewTaltour
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/vehicles" className="text-gray-700 hover:text-blue-600 transition">
            Véhicules
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600 transition">
            À Propos
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">
            Contact
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
              Connexion
            </Link>
            <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
              Inscription
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-50 border-t">
          <div className="px-4 py-4 flex flex-col gap-4">
            <Link href="/vehicles" className="text-gray-700 hover:text-blue-600">
              Véhicules
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600">
              À Propos
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600">
              Contact
            </Link>
            <Link href="/login" className="text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-center">
              Connexion
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-center">
              Inscription
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
