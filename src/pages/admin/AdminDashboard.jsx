import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CurrencyDollarIcon,
  ShoppingCartIcon,
  TruckIcon 
} from '@heroicons/react/24/outline';
import { userAPI, transactionAPI, topupAPI } from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    pendingTopups: 0,
    activeShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, transactionsRes, topupsRes] = await Promise.all([
        userAPI.getAllUsers(),
        transactionAPI.getAllTransactions(),
        topupAPI.getAllTopups(),
      ]);

      const users = usersRes.data.data.filter(user => user.role === 'customer');
      const transactions = transactionsRes.data.data;
      const topups = topupsRes.data.data.filter(topup => topup.status === 'pending');
      const activeShipments = transactions.filter(t => t.status === 'dikirim');

      setStats({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        pendingTopups: topups.length,
        activeShipments: activeShipments.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Pelanggan',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Transaksi',
      value: stats.totalTransactions,
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Topup Pending',
      value: stats.pendingTopups,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Pengiriman Aktif',
      value: stats.activeShipments,
      icon: TruckIcon,
      color: 'bg-purple-500',
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="mt-2 text-gray-600">
          Selamat datang di panel administrasi BerkahExpress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola User</h3>
            <p className="text-sm text-gray-600">Manajemen pengguna sistem</p>
          </a>

          <a
            href="/admin/topups"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">Konfirmasi Topup</h3>
            <p className="text-sm text-gray-600">Proses permintaan topup</p>
          </a>

          <a
            href="/admin/transactions"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <ShoppingCartIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">Kelola Transaksi</h3>
            <p className="text-sm text-gray-600">Monitor semua transaksi</p>
          </a>

          <a
            href="/admin/tracking"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <TruckIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">Update Tracking</h3>
            <p className="text-sm text-gray-600">Perbarui status pengiriman</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;