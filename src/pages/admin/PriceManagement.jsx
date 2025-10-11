import { useState, useEffect } from 'react';
import { priceAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
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
    is_identity: false,
    use_tiered_pricing: false,
    tiers: []
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
    
    // Validate tiers if using tiered pricing
    if (formData.use_tiered_pricing) {
      if (formData.tiers.length === 0) {
        toast.error('Minimal harus ada 1 tier untuk tiered pricing');
        return;
      }
      
      // Validate each tier
      for (let i = 0; i < formData.tiers.length; i++) {
        const tier = formData.tiers[i];
        if (!tier.min_weight || !tier.price_per_kg || !tier.price_per_volume || 
            !tier.price_per_kg_mitra || !tier.price_per_volume_mitra) {
          toast.error(`Tier ${i + 1}: Semua field harus diisi`);
          return;
        }
      }
    }
    
    try {
      if (editingPrice) {
        await priceAPI.updatePrice(editingPrice.id, formData);
        toast.success('Harga berhasil diupdate');
      } else {
        await priceAPI.createPrice(formData);
        toast.success('Harga berhasil ditambahkan');
      }
      
      closeModal();
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
      price_per_kg: price.price_per_kg || '',
      price_per_volume: price.price_per_volume || '',
      price_per_kg_mitra: price.price_per_kg_mitra || '',
      price_per_volume_mitra: price.price_per_volume_mitra || '',
      is_identity: price.is_identity || false,
      use_tiered_pricing: price.use_tiered_pricing || false,
      tiers: price.tiers || []
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

  const closeModal = () => {
    setShowModal(false);
    setEditingPrice(null);
    setFormData({ 
      country: '', 
      category: 'NORMAL',
      price_per_kg: '', 
      price_per_volume: '',
      price_per_kg_mitra: '',
      price_per_volume_mitra: '',
      is_identity: false,
      use_tiered_pricing: false,
      tiers: []
    });
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMinWeight = lastTier ? (lastTier.max_weight ? parseFloat(lastTier.max_weight) + 0.01 : 0) : 0;
    
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        {
          min_weight: newMinWeight,
          max_weight: null,
          price_per_kg: '',
          price_per_volume: '',
          price_per_kg_mitra: '',
          price_per_volume_mitra: ''
        }
      ]
    });
  };

  const removeTier = (index) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index)
    });
  };

  const updateTier = (index, field, value) => {
    const updatedTiers = [...formData.tiers];
    updatedTiers[index][field] = value;
    setFormData({
      ...formData,
      tiers: updatedTiers
    });
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
        <p className="mt-2 text-gray-600">Kelola harga pengiriman berdasarkan negara tujuan dengan opsi tiered pricing</p>
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
                  Tipe Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detail Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identity
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      price.use_tiered_pricing ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {price.use_tiered_pricing ? 'Tiered' : 'Flat'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {price.use_tiered_pricing ? (
                      <div className="text-xs space-y-1">
                        {price.tiers && price.tiers.length > 0 ? (
                          price.tiers.map((tier, idx) => (
                            <div key={idx} className="text-gray-700">
                              <span className="font-medium">
                                {tier.min_weight} - {tier.max_weight ? tier.max_weight : '∞'} Kg:
                              </span>
                              {' '}Rp {Number(tier.price_per_kg).toLocaleString('id-ID')}/Kg
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500">Belum ada tier</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs space-y-1">
                        <div className="text-gray-700">
                          <span className="font-medium">Customer:</span> Rp {Number(price.price_per_kg).toLocaleString('id-ID')}/Kg
                        </div>
                        <div className="text-gray-700">
                          <span className="font-medium">Mitra:</span> Rp {Number(price.price_per_kg_mitra).toLocaleString('id-ID')}/Kg
                        </div>
                      </div>
                    )}
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white my-6 mb-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPrice ? 'Edit Harga' : 'Tambah Harga'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
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
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.use_tiered_pricing}
                    onChange={(e) => setFormData({...formData, use_tiered_pricing: e.target.checked, tiers: e.target.checked ? formData.tiers : []})}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gunakan Tiered Pricing (Harga Bertingkat)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Aktifkan untuk membuat harga berbeda berdasarkan range berat (contoh: 1-5 Kg lebih murah dari 0.5 Kg)
                </p>
              </div>

              {!formData.use_tiered_pricing ? (
                // Flat Pricing Form
                <>
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
                        <label className="block text-sm font-medium text-gray-700">Harga per Volume Weight /5000 (Rp/kg)</label>
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
                        <label className="block text-sm font-medium text-gray-700">Harga per Volume Weight /5000 (Rp/kg)</label>
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
                </>
              ) : (
                // Tiered Pricing Form
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Tier Harga</h4>
                    <button
                      type="button"
                      onClick={addTier}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Tambah Tier
                    </button>
                  </div>
                  
                  {formData.tiers.length === 0 ? (
                    <div className="bg-gray-50 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">Belum ada tier. Klik &ldquo;Tambah Tier&rdquo; untuk memulai.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.tiers.map((tier, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-4 relative">
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={() => removeTier(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Tier {index + 1}</h5>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Min Berat (Kg)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                value={tier.min_weight}
                                onChange={(e) => updateTier(index, 'min_weight', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Max Berat (Kg) 
                                <span className="text-gray-500 font-normal"> - kosongkan untuk unlimited</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                value={tier.max_weight || ''}
                                onChange={(e) => updateTier(index, 'max_weight', e.target.value || null)}
                                placeholder="∞"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Harga Customer</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Per KG (Rp)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  value={tier.price_per_kg}
                                  onChange={(e) => updateTier(index, 'price_per_kg', e.target.value)}
                                  placeholder="210000"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Per Vol /5000 (Rp/kg)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  value={tier.price_per_volume}
                                  onChange={(e) => updateTier(index, 'price_per_volume', e.target.value)}
                                  placeholder="50000"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Harga Mitra</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Per KG (Rp)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  value={tier.price_per_kg_mitra}
                                  onChange={(e) => updateTier(index, 'price_per_kg_mitra', e.target.value)}
                                  placeholder="180000"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Per Vol /5000 (Rp/kg)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  value={tier.price_per_volume_mitra}
                                  onChange={(e) => updateTier(index, 'price_per_volume_mitra', e.target.value)}
                                  placeholder="40000"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded-md mt-4">
                    <p className="text-xs text-blue-600">
                      <strong>Contoh Tiered Pricing:</strong><br/>
                      • 0 - 1 Kg: Rp 210.000/Kg<br/>
                      • 2 - 5 Kg: Rp 160.000/Kg<br/>
                      • 6 - 10 Kg: Rp 150.000/Kg<br/>
                      • 11+ Kg: Rp 140.000/Kg (max_weight kosong)
                    </p>
                  </div>
                </div>
              )}

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
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
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
