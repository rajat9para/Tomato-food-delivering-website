import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect } from 'react';
import api from '../utils/api';
import { Home, Star, Search, ShoppingCart, ShoppingBag, LogOut } from 'lucide-react';

const CustomerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, name, profilePhoto, premiumMember, updateProfile } = useAuth();
  const { cart } = useCart();

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data } = await api.get('/customer/profile');
      if (data.profilePhoto) {
        updateProfile(data.profilePhoto, data.premiumMember);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const cartItemCount = cart.length;

  const menuItems = [
    { path: '/customer/home', label: 'Home', icon: Home, badge: null },
    { path: '/customer/best-restaurants', label: 'Best Restaurants', icon: Star, badge: null },
    { path: '/customer/best-dishes', label: 'Great Deals', icon: Search, badge: null },
    { path: '/customer/cart', label: 'My Cart', icon: ShoppingCart, badge: cartItemCount },
    { path: '/customer/orders', label: 'My Orders', icon: ShoppingBag, badge: null },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-white to-gray-50 border-r-2 border-primary/20 shadow-2xl z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-primary/10 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-2 border-2 border-white shadow-lg">
            <img src="/tomato-logo.png" alt="TOMATO" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-bold italic text-white drop-shadow-lg">TOMATO</h1>
        </div>
        <p className="text-sm opacity-90 mt-2">Delicious food awaits</p>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-xl p-2 transition relative"
          onClick={() => navigate('/customer/profile')}
        >
          {/* Premium Badge */}
          {premiumMember && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg z-10">
              ⭐ Premium
            </div>
          )}

          {/* Profile Photo with Premium Border */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${premiumMember
            ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-[3px] shadow-lg shadow-yellow-500/50'
            : 'bg-gradient-to-br from-primary to-primary-dark'
            }`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg">
                  {name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Welcome back,</p>
            <p className="text-primary font-bold">{name}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 relative ${isActive
                ? 'bg-primary text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-primary/10 hover:text-primary hover:shadow-md'
                }`}
            >
              <Icon size={24} strokeWidth={2} />
              <span className="font-semibold text-lg">{item.label}</span>
              {/* Notification Badge for Cart */}
              {item.badge !== null && item.badge > 0 && (
                <span className="absolute -top-1 left-9 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-4 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <LogOut size={20} />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerSidebar;
