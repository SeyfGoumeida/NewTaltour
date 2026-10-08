'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userAPI, reservationAPI, authAPI } from '@/lib/api';
import { User, Reservation } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'reservations'>('reservations');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      const [userData, reservationsData] = await Promise.all([
        authAPI.me(),
        reservationAPI.list(),
      ]);

      setUser(userData.data);
      setReservations(reservationsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenue, {user?.prenom} {user?.nom}!
            </h1>
            <p className="text-gray-600 mt-2">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'reservations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Mes Réservations
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Mon Profil
          </button>
        </div>

        {/* Content */}
        {activeTab === 'reservations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Mes Réservations</h2>
              <Link href="/vehicles" className="btn-primary">
                Nouvelle réservation
              </Link>
            </div>

            {reservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">
                  Vous n'avez pas encore de réservation
                </p>
                <Link href="/vehicles" className="btn-primary">
                  Découvrir nos véhicules
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-24 flex items-center px-6">
                      <div className="text-white">
                        <div className="text-2xl font-bold">
                          {res.vehicle?.marque} {res.vehicle?.modele}
                        </div>
                        <p className="text-blue-100">{res.vehicle?.annee}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-600 text-sm">Date de départ</p>
                          <p className="font-semibold">
                            {new Date(res.date_debut).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Date de retour</p>
                          <p className="font-semibold">
                            {new Date(res.date_fin).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Montant</p>
                          <p className="font-semibold">{res.montant_total.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Statut</p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              res.statut === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : res.statut === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {res.statut}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/reservations/${res.id}`}
                          className="flex-1 text-center py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          Détails
                        </Link>
                        {res.statut !== 'cancelled' && (
                          <button className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Mon Profil</h2>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={user?.prenom}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={user?.nom}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={user?.tel || ''}
                    placeholder="+33..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={user?.adresse || ''}
                    placeholder="Rue..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={user?.ville || ''}
                    placeholder="Ville"
                    className="w-full"
                  />
                </div>
              </div>

              <button className="mt-8 btn-primary">
                Mettre à jour le profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
