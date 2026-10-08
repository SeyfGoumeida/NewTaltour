'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">🚗 NewTaltour</h3>
            <p className="text-gray-400 text-sm">
              La plateforme moderne de location de voitures.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white">Accueil</Link></li>
              <li><Link href="/vehicles" className="text-gray-400 hover:text-white">Véhicules</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white">À Propos</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/mentions-legales" className="text-gray-400 hover:text-white">Mentions Légales</Link></li>
              <li><Link href="/legal/privacy" className="text-gray-400 hover:text-white">Confidentialité</Link></li>
              <li><Link href="/legal/terms" className="text-gray-400 hover:text-white">Conditions d'Utilisation</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@newtaltour.com</li>
              <li>Phone: +33 (0)4 92 XX XX XX</li>
              <li>7 Avenue Joseph Giordan</li>
              <li>06200 Nice, France</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; 2026 NewTaltour. Tous droits réservés.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
            <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
