import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';
import CustomerLayout from './components/Layout/CustomerLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PublicTracking from './pages/PublicTracking';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PriceManagement from './pages/admin/PriceManagement';
import ExpeditionManagement from './pages/admin/ExpeditionManagement';
import TopupManagement from './pages/admin/TopupManagement';
import BankAccountManagement from './pages/admin/BankAccountManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import TrackingManagement from './pages/admin/TrackingManagement';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Topup from './pages/customer/Topup';
import Transactions from './pages/customer/Transactions';
import EditProfile from './pages/customer/EditProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            {/* Register feature hidden */}
            <Route path="/tracking" element={<PublicTracking />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="prices" element={<PriceManagement />} />
                      <Route path="expeditions" element={<ExpeditionManagement />} />
                      <Route path="topups" element={<TopupManagement />} />
                      <Route path="accounts" element={<BankAccountManagement />} />
                      <Route path="transactions" element={<TransactionManagement />} />
                      <Route path="tracking" element={<TrackingManagement />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />

            {/* Customer Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerDashboard />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            {/* More customer routes */}
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <Transactions />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/topup" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <Topup />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <EditProfile />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;