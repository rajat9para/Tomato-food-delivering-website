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
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-white/95 backdrop-blur-xl border-r border-pink-100 shadow-lg z-40 transition-all duration-300">
      {/* Logo Section */}
      <div className="p-8 pb-4 flex items-center justify-center">
        <div className="flex items-center gap-3 relative group cursor-pointer" onClick={() => navigate('/customer/home')}>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain relative z-10 drop-shadow-lg" />
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight relative z-10 group-hover:text-primary transition-colors">
            TOMATO
          </h1>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-4 py-6">
        <div
          className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-pink-50 transition-all duration-300"
          onClick={() => navigate('/customer/profile')}
        >
          <div className="relative">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${premiumMember ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-primary shadow-neon'}`}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg">
                  {name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {premiumMember && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-600 text-[10px] text-white font-bold px-1.5 rounded-full shadow-lg border border-white/20">
                PRO
              </div>
            )}
          </div>

          <div className="overflow-hidden">
            <p className="text-xs text-gray-500 font-medium">Welcome,</p>
            <p className="text-gray-800 font-semibold truncate text-sm">{name}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-neon'
                  : 'text-gray-600 hover:text-primary hover:bg-pink-50'
                }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-30"></div>
              )}
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary'} transition-colors`} />
              <span className="font-medium tracking-wide">{item.label}</span>

              {/* Notification Badge */}
              {item.badge !== null && item.badge > 0 && (
                <span className="absolute right-4 bg-gradient-to-r from-primary to-primary-dark text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
