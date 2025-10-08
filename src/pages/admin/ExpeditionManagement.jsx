import React, { useState, useEffect } from 'react';
import { expeditionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ExpeditionManagement = () => {
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpedition, setEditingExpedition] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    api_url: '',
    api_key: '',
    is_active: true
  });

  useEffect(() => {
    fetchExpeditions();
  }, []);

  const fetchExpeditions = async () => {
    try {
      const response = await expeditionAPI.getAllExpeditionsAdmin();
      setExpeditions(response.data.data);
    } catch (error) {
      console.error('Error fetching expeditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpedition) {
        await expeditionAPI.updateExpedition(editingExpedition.id, formData);
        toast.success('Ekspedisi berhasil diupdate');
      } else {
        await expeditionAPI.createExpedition(formData);
        toast.success('Ekspedisi berhasil ditambahkan');
      }
      
      setShowModal(false);
      setEditingExpedition(null);
      setFormData({ 
        name: '', 
        code: '', 
        api_url: '', 
        api_key: '', 
        is_active: true 
      });
      fetchExpeditions();
    } catch (error) {
      console.error('Error saving expedition:', error);
    }
  };

  const handleEdit = (expedition) => {
    setEditingExpedition(expedition);
    setFormData({
      name: expedition.name,
      code: expedition.code,
      api_url: expedition.api_url || '',
      api_key: expedition.api_key || '',
      is_active: expedition.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (expeditionId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ekspedisi ini?')) {
      try {
        await expeditionAPI.deleteExpedition(expeditionId);
        toast.success('Ekspedisi berhasil dihapus');
        fetchExpeditions();
      } catch (error) {
        console.error('Error deleting expedition:', error);
      }
    }
  };

  const filteredExpeditions = expeditions.filter(expedition =>
    expedition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expedition.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Ekspedisi</h1>
        <p className="mt-2 text-gray-600">Kelola ekspedisi yang digunakan untuk pengiriman</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ekspedisi..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Ekspedisi
        </button>
      </div>

      {/* Expeditions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpeditions.map((expedition) => (
                <tr key={expedition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expedition.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expedition.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {expedition.api_url || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expedition.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(expedition)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expedition.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Hapus"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpeditions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Tidak ada ekspedisi yang ditemukan' : 'Belum ada data ekspedisi'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Expedition Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingExpedition ? 'Edit Ekspedisi' : 'Tambah Ekspedisi'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Ekspedisi</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: JNE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kode Ekspedisi</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="Contoh: JNE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API URL (Opsional)</label>
                <input
                  type="url"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.api_url}
                  onChange={(e) => setFormData({...formData, api_url: e.target.value})}
                  placeholder="https://api.ekspedisi.com/track"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key (Opsional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  placeholder="API Key untuk tracking"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Aktif
                  </span>
                </label>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-600">
                  <strong>Info:</strong> API URL dan API Key digunakan untuk otomatis fetch status tracking dari ekspedisi (fitur akan datang).
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpedition(null);
                    setFormData({ 
                      name: '', 
                      code: '', 
                      api_url: '', 
                      api_key: '', 
                      is_active: true 
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  {editingExpedition ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpeditionManagement;

