'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.users();
      setUsers(data.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.nom.toLowerCase().includes(search.toLowerCase()) ||
      user.prenom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-600 mt-1">Total: {users.length}</p>
          </div>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Tableau de bord
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              Chargement des clients...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              Aucun client trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Ville
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {user.prenom} {user.nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.tel || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.ville || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/users/${user.id}`}
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
