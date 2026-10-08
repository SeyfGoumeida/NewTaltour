'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      const data = await adminAPI.dashboard();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Tableau de Bord Admin</h1>
          <p className="text-gray-600 mt-2">Bienvenue dans le panel d'administration NewTaltour</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="text-4xl text-blue-500">👥</div>
            </div>
          </div>

          {/* Total Vehicles */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Véhicules</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalVehicles || 0}
                </p>
              </div>
              <div className="text-4xl text-green-500">🚗</div>
            </div>
          </div>

          {/* Total Reservations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Réservations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalReservations || 0}
                </p>
              </div>
              <div className="text-4xl text-purple-500">📅</div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Chiffre d'Affaires</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(stats?.totalRevenue || 0).toFixed(2)}€
                </p>
              </div>
              <div className="text-4xl text-yellow-500">💰</div>
            </div>
          </div>
        </div>

        {/* Active Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pending Reservations */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Réservations en Attente
            </h3>
            <p className="text-4xl font-bold text-orange-600">
              {stats?.pendingReservations || 0}
            </p>
            <p className="text-orange-700 text-sm mt-2">À confirmer</p>
          </div>

          {/* Active Reservations */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Réservations Actives
            </h3>
            <p className="text-4xl font-bold text-green-600">
              {stats?.activeReservations || 0}
            </p>
            <p className="text-green-700 text-sm mt-2">En cours</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/reservations"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gérer les Réservations
            </h3>
            <p className="text-gray-600">Voir et gérer toutes les réservations</p>
            <div className="mt-4 text-blue-600 font-semibold">→</div>
          </a>

          <a
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gérer les Clients
            </h3>
            <p className="text-gray-600">Consulter les profils clients</p>
            <div className="mt-4 text-blue-600 font-semibold">→</div>
          </a>

          <a
            href="/admin/vehicles"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gérer la Flotte
            </h3>
            <p className="text-gray-600">Gestion des véhicules disponibles</p>
            <div className="mt-4 text-blue-600 font-semibold">→</div>
          </a>
        </div>
      </div>
    </div>
  );
}
