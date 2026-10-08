'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: '',
    paymentStatus: '',
  });

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.reservations();
      setReservations(data.data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Réservations</h1>
            <p className="text-gray-600 mt-1">Total: {reservations.length}</p>
          </div>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Tableau de bord
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Statut de Réservation
              </label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="active">Active</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Statut de Paiement
              </label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Tous</option>
                <option value="paid">Payée</option>
                <option value="unpaid">Non payée</option>
                <option value="refunded">Remboursée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              Chargement des réservations...
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              Aucune réservation trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        #{res.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold">{res.nom} {res.prenom}</div>
                        <div className="text-gray-600 text-xs">{res.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {res.marque} {res.modelo}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-xs">
                          {new Date(res.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-600">
                          à {new Date(res.date_fin).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {res.montant_total.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(res.statut)}`}>
                          {res.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(res.payment_status)}`}>
                          {res.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/reservations/${res.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
