import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TomatoIntro from './components/TomatoIntro';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './components/CustomerLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CustomerHomePage from './pages/CustomerHomePage';
import CustomerBestRestaurants from './pages/CustomerBestRestaurants';
import CustomerGreatDeals from './pages/CustomerGreatDeals';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerProfile from './pages/CustomerProfile';
import CustomerCart from './pages/CustomerCart';


function AppContent() {
  // Removed problematic refresh counter that was causing login failures
  // The incrementRefresh logic was logging users out on page refreshes

  return (
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
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthProvider>
      <CartProvider>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <TomatoIntro key="intro" onComplete={() => setIsLoading(false)} />
          ) : (
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          )}
        </AnimatePresence>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
