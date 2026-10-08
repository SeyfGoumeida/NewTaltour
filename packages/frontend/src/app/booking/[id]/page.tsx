'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { vehicleAPI, reservationAPI } from '@/lib/api';
import { Vehicle } from '@/types';

export default function BookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    dateDebut: searchParams.get('dateDebut') || '',
    dateFin: searchParams.get('dateFin') || '',
    lieuPickup: 'Nice',
    lieuReturn: 'Nice',
    assurance: 'basic',
  });
  const [summary, setSummary] = useState({
    days: 0,
    dailyPrice: 0,
    subtotal: 0,
    insurance: 0,
    total: 0,
  });

  useEffect(() => {
    loadVehicle();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [vehicle, bookingData]);

  const loadVehicle = async () => {
    try {
      const data = await vehicleAPI.get(parseInt(params.id));
      setVehicle(data.data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!vehicle || !bookingData.dateDebut || !bookingData.dateFin) {
      return;
    }

    const start = new Date(bookingData.dateDebut);
    const end = new Date(bookingData.dateFin);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = vehicle.prix_jour * days;
    const insurance = bookingData.assurance === 'gold' ? vehicle.prix_assurance * days : 0;

    setSummary({
      days,
      dailyPrice: vehicle.prix_jour,
      subtotal,
      insurance,
      total: subtotal + insurance + vehicle.prix_caution,
    });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await reservationAPI.create({
        vehicule_id: parseInt(params.id),
        date_debut: bookingData.dateDebut,
        date_fin: bookingData.dateFin,
        lieu_pickup: bookingData.lieuPickup,
        lieu_return: bookingData.lieuReturn,
        assurance: bookingData.assurance,
      });

      // Redirect to confirmation
      router.push(`/booking-confirmation/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement du véhicule...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Véhicule non trouvé</p>
          <Link href="/vehicles" className="btn-primary">
            Retour aux véhicules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/vehicles" className="text-blue-600 mb-8 block">
          ← Retour aux véhicules
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              {/* Image Placeholder */}
              <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-64 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">🚗</div>
                  <p className="text-2xl font-semibold">
                    {vehicle.marque} {vehicle.modele}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">
                  {vehicle.marque} {vehicle.modele}
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <p className="text-gray-600 text-sm">Année</p>
                    <p className="text-xl font-semibold">{vehicle.annee}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Carburant</p>
                    <p className="text-xl font-semibold">{vehicle.carburant}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Transmission</p>
                    <p className="text-xl font-semibold">{vehicle.transmission}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Places</p>
                    <p className="text-xl font-semibold">{vehicle.places}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Prix / jour</p>
                    <p className="text-xl font-semibold">{vehicle.prix_jour.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Caution</p>
                    <p className="text-xl font-semibold">{vehicle.prix_caution.toFixed(2)}€</p>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-6">Vos informations de réservation</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Date de retrait
                        </label>
                        <input
                          type="date"
                          required
                          value={bookingData.dateDebut}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              dateDebut: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Date de retour
                        </label>
                        <input
                          type="date"
                          required
                          value={bookingData.dateFin}
                          onChange={(e) =>
                            setBookingData({ ...bookingData, dateFin: e.target.value })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Lieu de retrait
                        </label>
                        <select
                          value={bookingData.lieuPickup}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              lieuPickup: e.target.value,
                            })
                          }
                          className="w-full"
                        >
                          <option>Nice</option>
                          <option>Paris</option>
                          <option>Lyon</option>
                          <option>Marseille</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Lieu de retour
                        </label>
                        <select
                          value={bookingData.lieuReturn}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              lieuReturn: e.target.value,
                            })
                          }
                          className="w-full"
                        >
                          <option>Nice</option>
                          <option>Paris</option>
                          <option>Lyon</option>
                          <option>Marseille</option>
                        </select>
                      </div>
                    </div>

                    {/* Insurance Options */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-4">Assurance</h3>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="assurance"
                            value="basic"
                            checked={bookingData.assurance === 'basic'}
                            onChange={(e) =>
                              setBookingData({
                                ...bookingData,
                                assurance: e.target.value,
                              })
                            }
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold">Assurance de base</p>
                            <p className="text-sm text-gray-600">
                              Couverture minimale incluse
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center p-4 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50">
                          <input
                            type="radio"
                            name="assurance"
                            value="gold"
                            checked={bookingData.assurance === 'gold'}
                            onChange={(e) =>
                              setBookingData({
                                ...bookingData,
                                assurance: e.target.value,
                              })
                            }
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold">Gold Assurance</p>
                            <p className="text-sm text-gray-600">
                              Couverture complète - {vehicle.prix_assurance.toFixed(2)}€/jour
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !bookingData.dateDebut || !bookingData.dateFin}
                      className="w-full btn-primary disabled:opacity-50 py-3"
                    >
                      {submitting ? 'Réservation en cours...' : 'Confirmer la réservation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-6">Récapitulatif</h2>

              <div className="space-y-4 border-b pb-4 mb-4">
                {summary.days > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {summary.days} jour(s) × {summary.dailyPrice.toFixed(2)}€
                      </span>
                      <span className="font-semibold">{summary.subtotal.toFixed(2)}€</span>
                    </div>
                    {summary.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assurance Gold</span>
                        <span className="font-semibold">{summary.insurance.toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Caution</span>
                      <span className="font-semibold">
                        {vehicle.prix_caution.toFixed(2)}€
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-bold text-blue-600">
                  {summary.total.toFixed(2)}€
                </span>
              </div>

              <button
                onClick={(e) => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(
                      new Event('submit', { cancelable: true, bubbles: true })
                    );
                  }
                }}
                className="w-full btn-primary py-3"
              >
                Réserver
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Conditions d'annulation gratuite avant 24h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
