'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vehicleAPI } from '@/lib/api';
import { Vehicle } from '@/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    carburant: '',
    places: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [filters]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleAPI.list(filters);
      setVehicles(data.data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Nos Véhicules</h1>
          <p className="text-xl text-gray-600">
            Découvrez notre large gamme de véhicules disponibles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-semibold mb-6">Filtrer</h2>

              {/* Fuel Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">
                  Carburant
                </label>
                <div className="space-y-2">
                  {['Essence', 'Diesel', 'Hybride', 'Électrique'].map(
                    (fuel) => (
                      <label key={fuel} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.carburant === fuel}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              carburant: e.target.checked ? fuel : '',
                            })
                          }
                          className="mr-2"
                        />
                        {fuel}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Seats */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">
                  Nombre de places
                </label>
                <select
                  value={filters.places}
                  onChange={(e) =>
                    setFilters({ ...filters, places: e.target.value })
                  }
                  className="w-full"
                >
                  <option value="">Tous</option>
                  <option value="2">2 places</option>
                  <option value="5">5 places</option>
                  <option value="7">7 places</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ carburant: '', places: '' })}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Vehicles Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Chargement des véhicules...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">
                  Aucun véhicule ne correspond à vos critères
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Image Placeholder */}
                    <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-48 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">🚗</div>
                        <p className="text-sm opacity-75">
                          {vehicle.marque} {vehicle.modele}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {vehicle.marque} {vehicle.modele}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Année</p>
                          <p className="font-semibold">{vehicle.annee}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Carburant</p>
                          <p className="font-semibold">{vehicle.carburant}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transmission</p>
                          <p className="font-semibold">{vehicle.transmission}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Places</p>
                          <p className="font-semibold">{vehicle.places}</p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="border-t pt-4 mb-4">
                        <p className="text-2xl font-bold text-blue-600">
                          {vehicle.prix_jour.toFixed(2)}€
                        </p>
                        <p className="text-gray-600 text-sm">par jour</p>
                      </div>

                      {/* Additional Costs */}
                      <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                        <p className="text-gray-600">
                          Caution: <span className="font-semibold">{vehicle.prix_caution.toFixed(2)}€</span>
                        </p>
                        <p className="text-gray-600">
                          Assurance: <span className="font-semibold">{vehicle.prix_assurance.toFixed(2)}€</span>/jour
                        </p>
                      </div>

                      <Link
                        href={`/booking/${vehicle.id}`}
                        className="w-full btn-primary block text-center"
                      >
                        Réserver
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
