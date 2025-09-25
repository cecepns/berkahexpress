import { useState, useEffect } from 'react';
import { transactionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  EyeIcon,
  MagnifyingGlassIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getAllTransactions();
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (transactionId, status) => {
    try {
      await transactionAPI.updateTransactionStatus(transactionId, status);
      toast.success('Status transaksi berhasil diupdate');
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'dikirim':
        return 'text-blue-600 bg-blue-100';
      case 'sukses':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.resi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
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
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Transaksi</h1>
        <p className="mt-2 text-gray-600">Kelola semua transaksi pengiriman</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari resi, user, atau tujuan..."
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
            <option value="dikirim">Dikirim</option>
            <option value="sukses">Sukses</option>
          </select>
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
                  Berat/Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
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
              {filteredTransactions.map((transaction) => (
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
                    <div className="text-sm text-gray-900">
                      {transaction.weight} kg
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.volume ? Number(transaction.volume).toFixed(4) : '0.0000'} m³
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Rp {transaction.total_price ? Number(transaction.total_price).toLocaleString('id-ID') : '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(transaction)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada transaksi yang ditemukan' : 'Belum ada transaksi'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Detail Transaksi
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resi</label>
                  <p className="mt-1 text-sm font-mono text-gray-900">{selectedTransaction.resi}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pengirim</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaction.user_name}</p>
                <p className="text-sm text-gray-500">{selectedTransaction.user_email}</p>
                <p className="text-sm text-gray-500">{selectedTransaction.user_phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tujuan</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.destination}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Berat</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.weight} kg</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Dimensi (P x L x T)</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.length} x {selectedTransaction.width} x {selectedTransaction.height} cm
                </p>
                <p className="text-sm text-gray-500">Volume: {selectedTransaction.volume ? Number(selectedTransaction.volume).toFixed(4) : '0.0000'} m³</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga per KG</label>
                  <p className="mt-1 text-sm text-gray-900">
                    Rp {selectedTransaction.price_per_kg ? Number(selectedTransaction.price_per_kg).toLocaleString('id-ID') : '0'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga per Volume</label>
                  <p className="mt-1 text-sm text-gray-900">
                    Rp {selectedTransaction.price_per_volume ? Number(selectedTransaction.price_per_volume).toLocaleString('id-ID') : '0'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Biaya</label>
                <p className="mt-1 text-lg font-semibold text-primary-600">
                  Rp {selectedTransaction.total_price ? Number(selectedTransaction.total_price).toLocaleString('id-ID') : '0'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Transaksi</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedTransaction.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              {selectedTransaction.status !== 'sukses' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <div className="flex space-x-2">
                    {selectedTransaction.status === 'pending' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedTransaction.id, 'dikirim');
                          setShowModal(false);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        Tandai Dikirim
                      </button>
                    )}
                    {selectedTransaction.status === 'dikirim' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedTransaction.id, 'sukses');
                          setShowModal(false);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                      >
                        Tandai Sukses
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTransaction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;