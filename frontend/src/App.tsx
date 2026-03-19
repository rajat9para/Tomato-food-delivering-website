import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './components/CustomerLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import RiderDashboard from './pages/RiderDashboard';
import CustomerHomePage from './pages/CustomerHomePage';
import CustomerBestRestaurants from './pages/CustomerBestRestaurants';
import CustomerGreatDeals from './pages/CustomerGreatDeals';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerProfile from './pages/CustomerProfile';
import CustomerCart from './pages/CustomerCart';
import { Toaster } from 'react-hot-toast';

import IntroScreen from './components/IntroScreen';
import { useState } from 'react';

function AppContent() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      <IntroScreen onComplete={() => setIntroComplete(true)} />
      <div className={`transition-opacity duration-1000 ${introComplete ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/:type" element={<Register />} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/owner/dashboard" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/rider/dashboard" element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderDashboard />
            </ProtectedRoute>
          } />

          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route path="home" element={<CustomerHomePage />} />
            <Route path="best-restaurants" element={<CustomerBestRestaurants />} />
            <Route path="best-dishes" element={<CustomerGreatDeals />} />
            <Route path="cart" element={<CustomerCart />} />
            <Route path="orders" element={<CustomerOrdersPage />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route index element={<Navigate to="home" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #EC4899, #DB2777)',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
