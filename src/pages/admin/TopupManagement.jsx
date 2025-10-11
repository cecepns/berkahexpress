import React, { useState, useEffect } from 'react';
import { topupAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  CheckIcon, 
  XMarkIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const TopupManagement = () => {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchTopups();
  }, []);

  const fetchTopups = async () => {
    try {
      const response = await topupAPI.getAllTopups();
      setTopups(response.data.data);
    } catch (error) {
      console.error('Error fetching topups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (topupId, status) => {
    try {
      await topupAPI.updateTopupStatus(topupId, status, adminNotes);
      toast.success(`Topup berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      setShowModal(false);
      setSelectedTopup(null);
      setAdminNotes('');
      fetchTopups();
    } catch (error) {
      console.error('Error updating topup status:', error);
    }
  };

  const openModal = (topup) => {
    setSelectedTopup(topup);
    setAdminNotes(topup.admin_notes || '');
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTopups = topups.filter(topup => {
    const matchesSearch = topup.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topup.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || topup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Topup</h1>
        <p className="mt-2 text-gray-600">Kelola permintaan topup saldo pelanggan</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Topups Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Tujuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTopups.map((topup) => (
                <tr key={topup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{topup.user_name}</div>
                      <div className="text-sm text-gray-500">{topup.user_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{topup.bank_name}</div>
                      <div className="text-sm text-gray-500">{topup.account_number}</div>
                      <div className="text-sm text-gray-500">{topup.account_holder}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Rp{Number(topup.amount || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(topup.status)}`}>
                      {topup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(topup.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(topup)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {topup.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(topup.id, 'approved')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Setujui"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(topup.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Tolak"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTopups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada topup yang ditemukan' : 'Belum ada permintaan topup'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedTopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Detail Topup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTopup.user_name}</p>
                <p className="text-sm text-gray-500">{selectedTopup.user_email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Tujuan</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTopup.bank_name}</p>
                <p className="text-sm text-gray-500">{selectedTopup.account_number} - {selectedTopup.account_holder}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  Rp{Number(selectedTopup.amount || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTopup.status)}`}>
                  {selectedTopup.status}
                </span>
              </div>

              {selectedTopup.proof_image && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Transfer</label>
                  <img 
                    src={`https://api-inventory.isavralabel.com/berkahexpress/uploads/${selectedTopup.proof_image}`}
                    alt="Bukti Transfer"
                    className="w-full h-48 object-cover rounded-md border"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan Admin</label>
                <textarea
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTopup(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Tutup
              </button>
              {selectedTopup.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedTopup.id, 'rejected')}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedTopup.id, 'approved')}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                  >
                    Setujui
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopupManagement;