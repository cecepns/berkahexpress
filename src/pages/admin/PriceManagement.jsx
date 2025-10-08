import React, { useState, useEffect } from 'react';
import { priceAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const PriceManagement = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [formData, setFormData] = useState({
    country: '',
    category: 'NORMAL',
    price_per_kg: '',
    price_per_volume: '',
    price_per_kg_mitra: '',
    price_per_volume_mitra: '',
    is_identity: false
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await priceAPI.getAllPrices();
      setPrices(response.data.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrice) {
        await priceAPI.updatePrice(editingPrice.id, formData);
        toast.success('Harga berhasil diupdate');
      } else {
        await priceAPI.createPrice(formData);
        toast.success('Harga berhasil ditambahkan');
      }
      
      setShowModal(false);
      setEditingPrice(null);
      setFormData({ country: '', price_per_kg: '', price_per_volume: '' });
      fetchPrices();
    } catch (error) {
      console.error('Error saving price:', error);
    }
  };

  const handleEdit = (price) => {
    setEditingPrice(price);
    setFormData({
      country: price.country,
      category: price.category || 'NORMAL',
      price_per_kg: price.price_per_kg,
      price_per_volume: price.price_per_volume,
      price_per_kg_mitra: price.price_per_kg_mitra,
      price_per_volume_mitra: price.price_per_volume_mitra,
      is_identity: price.is_identity || false
    });
    setShowModal(true);
  };

  const handleDelete = async (priceId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus harga ini?')) {
      try {
        await priceAPI.deletePrice(priceId);
        toast.success('Harga berhasil dihapus');
        fetchPrices();
      } catch (error) {
        console.error('Error deleting price:', error);
      }
    }
  };

  const filteredPrices = prices.filter(price =>
    price.country.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Harga</h1>
        <p className="mt-2 text-gray-600">Kelola harga pengiriman berdasarkan negara tujuan</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari negara..."
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
          Tambah Harga
        </button>
      </div>

      {/* Prices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negara
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Mitra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identity Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{price.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      price.category === 'SENSITIF' ? 'bg-yellow-100 text-yellow-800' :
                      price.category === 'BATERAI' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {price.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      KG: Rp {price.price_per_kg ? Number(price.price_per_kg).toLocaleString('id-ID') : '0'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vol: Rp {price.price_per_volume ? Number(price.price_per_volume).toLocaleString('id-ID') : '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      KG: Rp {price.price_per_kg_mitra ? Number(price.price_per_kg_mitra).toLocaleString('id-ID') : '0'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vol: Rp {price.price_per_volume_mitra ? Number(price.price_per_volume_mitra).toLocaleString('id-ID') : '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {price.is_identity ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Ya
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(price)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(price.id)}
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

        {filteredPrices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Tidak ada negara yang ditemukan' : 'Belum ada data harga'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Price Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white my-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingPrice ? 'Edit Harga' : 'Tambah Harga'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Negara</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    placeholder="Contoh: Malaysia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="SENSITIF">Sensitif (Makanan, Parfum, dll)</option>
                    <option value="BATERAI">Baterai / Elektronik</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Harga Customer Biasa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Harga per KG (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={formData.price_per_kg}
                      onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Harga per Volume m³ (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={formData.price_per_volume}
                      onChange={(e) => setFormData({...formData, price_per_volume: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Harga Mitra</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Harga per KG (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={formData.price_per_kg_mitra}
                      onChange={(e) => setFormData({...formData, price_per_kg_mitra: e.target.value})}
                      placeholder="20000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Harga per Volume m³ (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={formData.price_per_volume_mitra}
                      onChange={(e) => setFormData({...formData, price_per_volume_mitra: e.target.value})}
                      placeholder="4000"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.is_identity}
                    onChange={(e) => setFormData({...formData, is_identity: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Memerlukan dokumen identitas penerima
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Jika dicentang, customer harus mengupload dokumen identitas penerima saat membuat transaksi.
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-600">
                  <strong>Info:</strong> Sistem akan menggunakan harga yang lebih tinggi antara perhitungan berat dan volume untuk menentukan biaya pengiriman.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPrice(null);
                    setFormData({ 
                      country: '', 
                      category: 'NORMAL',
                      price_per_kg: '', 
                      price_per_volume: '',
                      price_per_kg_mitra: '',
                      price_per_volume_mitra: '',
                      is_identity: false
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
                  {editingPrice ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceManagement;