'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [searchData, setSearchData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupLocation: 'Nice',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to vehicles page with search params
    const params = new URLSearchParams(searchData);
    window.location.href = `/vehicles?${params.toString()}`;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
            Louez votre voiture idéale
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Plateforme moderne et sécurisée pour vos besoins de location automobile
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto text-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-left">
                  Lieu de retrait
                </label>
                <select
                  value={searchData.pickupLocation}
                  onChange={(e) =>
                    setSearchData({ ...searchData, pickupLocation: e.target.value })
                  }
                  className="w-full"
                >
                  <option>Nice</option>
                  <option>Paris</option>
                  <option>Lyon</option>
                  <option>Marseille</option>
                </select>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-left">
                  Date de retrait
                </label>
                <input
                  type="date"
                  required
                  value={searchData.pickupDate}
                  onChange={(e) =>
                    setSearchData({ ...searchData, pickupDate: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-left">
                  Date de retour
                </label>
                <input
                  type="date"
                  required
                  value={searchData.returnDate}
                  onChange={(e) =>
                    setSearchData({ ...searchData, returnDate: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full btn-primary"
                >
                  Rechercher
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            Pourquoi choisir NewTaltour?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: 'Sécurisé',
                description: 'Plateforme entièrement sécurisée avec les dernières technologies',
              },
              {
                icon: '⚡',
                title: 'Rapide',
                description: 'Réservation en 30 secondes avec confirmation instantanée',
              },
              {
                icon: '💰',
                title: 'Abordable',
                description: 'Les meilleurs prix du marché avec transparence complète',
              },
              {
                icon: '🚗',
                title: 'Large Flotte',
                description: 'Centaines de véhicules disponibles dans toute la France',
              },
              {
                icon: '👥',
                title: 'Support 24/7',
                description: 'Équipe de support disponible 24 heures sur 24',
              },
              {
                icon: '✅',
                title: 'Assurance Complète',
                description: 'Couverture complète incluant toutes les garanties',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à commencer?</h2>
          <p className="text-lg mb-8 opacity-90">
            Rejoignez des milliers de clients satisfaits
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/vehicles" className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:shadow-lg transition">
              Voir les véhicules
            </Link>
            <Link href="/register" className="px-8 py-3 border-2 border-white rounded-lg hover:bg-white/10 transition">
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10,000+', label: 'Clients satisfaits' },
              { number: '500+', label: 'Véhicules disponibles' },
              { number: '50+', label: 'Villes couvertes' },
              { number: '99.8%', label: 'Taux de satisfaction' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
