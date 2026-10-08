'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.vehicles();
      setVehicles(data.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (vehicleId: number, currentStatus: boolean) => {
    try {
      // This would call the API to update availability
      // await adminAPI.updateVehicleAvailability(vehicleId, !currentStatus);
      // loadVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Flotte de Véhicules</h1>
            <p className="text-gray-600 mt-1">Total: {vehicles.length}</p>
          </div>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Tableau de bord
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            Chargement des véhicules...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            Aucun véhicule trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                {/* Image Placeholder */}
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-40 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl">🚗</div>
                    <p className="text-sm mt-2 opacity-75">
                      {vehicle.marque} {vehicle.modele}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {vehicle.marque} {vehicle.modelo}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>
                      <span className="font-semibold">Année:</span> {vehicle.annee}
                    </p>
                    <p>
                      <span className="font-semibold">Carburant:</span> {vehicle.carburant}
                    </p>
                    <p>
                      <span className="font-semibold">Transmission:</span>{' '}
                      {vehicle.transmission}
                    </p>
                    <p>
                      <span className="font-semibold">Places:</span> {vehicle.places}
                    </p>
                    <p>
                      <span className="font-semibold">Prix/jour:</span> {vehicle.prix_jour}€
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
                    <span className="text-sm font-semibold">Disponibilité:</span>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        vehicle.disponible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vehicle.disponible ? 'Disponible' : 'Indisponible'}
                    </div>
                  </div>

                  {/* Active Reservations */}
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm">
                      <span className="font-semibold">Réservations actives:</span>{' '}
                      {vehicle.active_reservations}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleToggleAvailability(vehicle.id, vehicle.disponible)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-semibold"
                    >
                      {vehicle.disponible ? 'Désactiver' : 'Activer'}
                    </button>
                    <Link
                      href={`/admin/vehicles/${vehicle.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold text-center"
                    >
                      Gérer
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
