import { useState } from 'react';
import { trackingAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { TruckIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import logo from '../assets/logo.png';

const PublicTracking = () => {
  const [resi, setResi] = useState('');
  const [tracking, setTracking] = useState(null);
  const [externalTracking, setExternalTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resi.trim()) {
      toast.error('Mohon masukkan nomor resi');
      return;
    }

    setLoading(true);
    setExternalTracking(null);
    
    try {
      const response = await trackingAPI.getTrackingByResi(resi);
      const trackingData = response.data.data;
      setTracking(trackingData);

      // Fetch external tracking if expedition info exists
      if (trackingData.transaction?.expedition_resi && trackingData.transaction?.expedition?.api_url) {
        try {
          const expeditionApiUrl = trackingData.transaction.expedition.api_url;
          const expeditionResi = trackingData.transaction.expedition_resi;
          const externalUrl = `${expeditionApiUrl}/${expeditionResi}`;
          
          const externalResponse = await axios.get(externalUrl);
          setExternalTracking(externalResponse.data);
        } catch (externalError) {
          console.error('Error fetching external tracking:', externalError);
          // Don't show error to user, just don't display external tracking
        }
      }
    } catch {
      setTracking(null);
      setExternalTracking(null);
      toast.error('Resi tidak ditemukan');
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'dikirim':
        return <TruckIcon className="h-5 w-5" />;
      case 'sukses':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="BerkahExpress Logo" className="h-24 w-auto" />
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Lacak Paket Anda
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="resi" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Resi
                </label>
                <input
                  type="text"
                  id="resi"
                  value={resi}
                  onChange={(e) => setResi(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Masukkan nomor resi..."
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Mencari...' : 'Lacak Paket'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tracking Results */}
        {tracking && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Package Info */}
            <div className="bg-primary-50 p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informasi Paket
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Nomor Resi:</dt>
                      <dd className="text-sm font-medium text-gray-900">{tracking.transaction?.resi}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Tujuan:</dt>
                      <dd className="text-sm font-medium text-gray-900">{tracking.transaction?.destination}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Berat:</dt>
                      <dd className="text-sm font-medium text-gray-900">{tracking.transaction?.weight} kg</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Status:</dt>
                      <dd className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tracking.transaction?.status)}`}>
                        {getStatusIcon(tracking.transaction?.status)}
                        <span>{tracking.transaction?.status}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pengirim
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Nama:</dt>
                      <dd className="text-sm font-medium text-gray-900">{tracking.transaction?.user?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Telepon:</dt>
                      <dd className="text-sm font-medium text-gray-900">{tracking.transaction?.user?.phone}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="p-6">
              {/* Show External Tracking if available */}
              {externalTracking?.data?.tracking ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Status Perjalanan
                    </h3>
                    {tracking.transaction?.expedition_resi && (
                      <span className="text-sm text-gray-600">
                        Resi Ekspedisi: <span className="font-mono font-semibold text-blue-600">{tracking.transaction.expedition_resi}</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flow-root">
                    {externalTracking.data.tracking.map((trackingGroup, groupIdx) => (
                      <div key={groupIdx} className="mb-6">
                        {trackingGroup.resi_sub_internal && (
                          <div className="mb-3 p-2 bg-gray-50 rounded">
                            <span className="text-xs text-gray-600">Sub Resi: </span>
                            <span className="text-xs font-mono font-semibold text-gray-900">{trackingGroup.resi_sub_internal}</span>
                          </div>
                        )}
                        <ul className="-mb-8">
                          {trackingGroup.checkpoint?.map((checkpoint, checkpointIdx) => (
                            <li key={checkpointIdx}>
                              <div className="relative pb-8">
                                {checkpointIdx !== trackingGroup.checkpoint.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    checkpointIdx === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                  } ring-8 ring-white`}>
                                    {checkpointIdx === 0 ? <CheckCircleIcon className="h-5 w-5" /> : <TruckIcon className="h-5 w-5" />}
                                  </div>
                                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                      <p className="text-sm text-gray-900 font-medium">
                                        {checkpoint.status}
                                      </p>
                                      {checkpoint.location && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          📍 {checkpoint.location}
                                        </p>
                                      )}
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                      <time dateTime={checkpoint.time}>
                                        {new Date(checkpoint.time).toLocaleDateString('id-ID', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </time>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Show Internal Tracking as fallback
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Status Perjalanan
                  </h3>
                  
                  {tracking.updates && tracking.updates.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {tracking.updates.map((update, updateIdx) => (
                          <li key={updateIdx}>
                            <div className="relative pb-8">
                              {updateIdx !== tracking.updates.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(update.status)} ring-8 ring-white`}>
                                  {getStatusIcon(update.status)}
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-900 font-medium">
                                      {update.description}
                                    </p>
                                    <p className={`mt-1 text-sm ${getStatusColor(update.status)} inline-flex items-center space-x-1 px-2 py-1 rounded-full font-medium`}>
                                      <span>Status: {update.status}</span>
                                    </p>
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                    <time dateTime={update.created_at}>
                                      {new Date(update.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-sm text-gray-500">
                        {tracking.transaction?.expedition_resi 
                          ? 'Paket sedang dalam proses di ekspedisi'
                          : 'Belum ada update tracking untuk paket ini'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        {/* <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Butuh bantuan? Hubungi customer service kami di{' '}
            <a href="tel:+628123456789" className="text-primary-600 hover:text-primary-500 font-medium">
              +62 812-3456-789
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default PublicTracking;