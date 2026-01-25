import { useState, useEffect, useCallback } from 'react';
import { trackingAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const TrackingManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedResi, setSelectedResi] = useState('');
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [trackingData, setTrackingData] = useState({
    status: 'pending',
    description: ''
  });
  const [editingUpdate, setEditingUpdate] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await trackingAPI.getAdminTransactions(currentPage, itemsPerPage, searchTerm);
      setTransactions(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResi) {
      toast.error('Pilih resi terlebih dahulu');
      return;
    }

    try {
      if (editingUpdate) {
        // Update existing tracking update
        await trackingAPI.updateTrackingUpdate(editingUpdate.id, trackingData);
        toast.success('Update tracking berhasil diubah');
      } else {
        // Add new tracking update
        await trackingAPI.addTrackingUpdate(selectedResi, trackingData);
        toast.success('Update tracking berhasil ditambahkan');
      }
      
      setShowModal(false);
      setSelectedResi('');
      setTrackingData({ status: 'pending', description: '' });
      setEditingUpdate(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error handling tracking update:', error);
    }
  };

  const fetchTrackingHistory = async (resi) => {
    try {
      const response = await trackingAPI.getTrackingUpdates(resi);
      setTrackingHistory(response.data.data);
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      setTrackingHistory([]);
    }
  };

  const openModal = (resi) => {
    setSelectedResi(resi);
    setShowModal(true);
  };

  const openViewModal = async (resi) => {
    setSelectedResi(resi);
    await fetchTrackingHistory(resi);
    setShowViewModal(true);
  };

  const startEditing = (update) => {
    setEditingUpdate(update);
    setTrackingData({
      status: update.status,
      description: update.description
    });
    setShowModal(true);
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus update tracking ini?')) {
      return;
    }

    try {
      await trackingAPI.deleteTrackingUpdate(updateId);
      toast.success('Update tracking berhasil dihapus');
      await fetchTrackingHistory(selectedResi);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting tracking update:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'dikirim':
        return 'text-blue-600 bg-blue-100';
      case 'bea_cukai':
        return 'text-orange-600 bg-orange-100';
      case 'in_transit':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivery_progress':
        return 'text-cyan-600 bg-cyan-100';
      case 'delivery_completed':
        return 'text-green-600 bg-green-100';
      case 'delivery_failed':
        return 'text-red-600 bg-red-100';
      case 'sukses':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'dikirim':
        return <TruckIcon className="h-4 w-4" />;
      case 'bea_cukai':
        return <ClockIcon className="h-4 w-4" />;
      case 'in_transit':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivery_progress':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivery_completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'delivery_failed':
        return <XMarkIcon className="h-4 w-4" />;
      case 'sukses':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'canceled':
        return <XMarkIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Tracking</h1>
        <p className="mt-2 text-gray-600">Update status pengiriman dan tracking paket</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari resi, user, atau tujuan..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          Total: {totalItems} transaksi
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengirim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tujuan
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono">{transaction.resi}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.user_name}</div>
                      <div className="text-sm text-gray-500">{transaction.user_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.destination}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span>{transaction.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openViewModal(transaction.resi)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Lihat
                    </button>
                    <button
                      onClick={() => openModal(transaction.resi)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {searchTerm ? 'Tidak ada transaksi yang ditemukan' : 'Belum ada transaksi'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-medium">{totalItems}</span> data
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Halaman Pertama"
                >
                  <span className="sr-only">First</span>
                  <span className="text-xs">«</span>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Halaman Terakhir"
                >
                  <span className="sr-only">Last</span>
                  <span className="text-xs">»</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* View Tracking History Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Riwayat Tracking - {selectedResi}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedResi('');
                  setTrackingHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {trackingHistory.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {trackingHistory.map((update, index) => (
                    <div key={update.id} className="relative flex items-start space-x-4 pb-6">
                      {/* Timeline dot */}
                      <div className="relative flex-shrink-0">
                        <div className={`h-4 w-4 rounded-full border-2 ${
                          index === 0 
                            ? 'bg-primary-500 border-primary-500' 
                            : 'bg-white border-gray-300'
                        }`}></div>
                        {index === 0 && (
                          <div className="absolute inset-0 h-4 w-4 rounded-full bg-primary-500 animate-ping opacity-75"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(update.status)}`}>
                                  {getStatusIcon(update.status)}
                                  <span className="ml-1 capitalize">{update.status}</span>
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 leading-relaxed">{update.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(update.created_at).toLocaleString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => {
                                  setShowViewModal(false);
                                  startEditing(update);
                                }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                title="Edit update"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUpdate(update.id)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                                title="Hapus update"
                              >
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <TruckIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada riwayat tracking</h3>
                  <p className="text-sm text-gray-500">Tracking updates akan muncul di sini setelah ditambahkan</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedResi('');
                  setTrackingHistory([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Tracking Update Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUpdate ? 'Edit' : 'Tambah'} Update Tracking - {selectedResi}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={trackingData.status}
                  onChange={(e) => setTrackingData({...trackingData, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="dikirim">Dikirim</option>
                  <option value="bea_cukai">Paket sedang dalam proses Bea Cukai Negara Tujuan</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivery_progress">Delivery Progress</option>
                  <option value="delivery_completed">Delivery Completed</option>
                  <option value="delivery_failed">Delivery Failed</option>
                  <option value="sukses">Sukses</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  required
                  rows="4"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={trackingData.description}
                  onChange={(e) => setTrackingData({...trackingData, description: e.target.value})}
                  placeholder="Contoh: Paket telah tiba di gudang sortir Jakarta dan sedang dalam proses pengiriman ke negara tujuan"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-600">
                  <strong>Tips:</strong> Berikan deskripsi yang jelas dan informatif untuk membantu pelanggan memahami status paket mereka.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedResi('');
                    setTrackingData({ status: 'pending', description: '' });
                    setEditingUpdate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  {editingUpdate ? 'Update' : 'Tambah Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingManagement;