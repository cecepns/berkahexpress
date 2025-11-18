import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Topup = () => {
  const { isCustomer, isMitra } = useAuth();
  // Hide topup feature for customer and mitra
  if (isCustomer || isMitra) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Fitur Topup Tidak Tersedia</h1>
          <p className="text-gray-600">Fitur topup saldo saat ini tidak tersedia untuk akun Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Akses Ditolak</h1>
        <p className="text-gray-600">Halaman ini tidak dapat diakses.</p>
      </div>
    </div>
  );
};

export default Topup;


