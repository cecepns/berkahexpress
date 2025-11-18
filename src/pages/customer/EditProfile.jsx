import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const EditProfile = () => {
  const { user, refreshProfile, isMitra } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    ekspedisi_name: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        ekspedisi_name: user.ekspedisi_name || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(form);
      toast.success('Profile berhasil diupdate');
      // Refresh profile to get updated data
      await refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Nama *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            className="w-full border rounded px-3 py-2 bg-gray-100"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nomor Telepon *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alamat *</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
            required
          />
        </div>

        {isMitra && (
          <div>
            <label className="block text-sm font-medium mb-1">Nama Ekspedisi</label>
            <input
              type="text"
              name="ekspedisi_name"
              value={form.ekspedisi_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Masukkan nama ekspedisi Anda (opsional)"
            />
            <p className="text-xs text-gray-500 mt-1">Nama ekspedisi akan digunakan pada resi dan tracking</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;

