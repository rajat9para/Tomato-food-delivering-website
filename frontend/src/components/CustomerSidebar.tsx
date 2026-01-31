import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect } from 'react';
import api from '../utils/api';
import { Home, Star, Search, ShoppingCart, ShoppingBag, LogOut, User, ChevronRight, Zap } from 'lucide-react';
import { getImageUrl } from '../utils/formatters';

const CustomerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, name, profilePhoto, premiumMember, updateProfile } = useAuth();
  const { cart } = useCart();
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
    { path: '/customer/home', label: 'Discovery', icon: Home, badge: null },
    { path: '/customer/best-restaurants', label: 'Top Rated', icon: Star, badge: null },
    { path: '/customer/best-dishes', label: 'Best Deals', icon: Search, badge: null },
    { path: '/customer/cart', label: 'My Cart', icon: ShoppingCart, badge: cartItemCount },
    { path: '/customer/orders', label: 'Order History', icon: ShoppingBag, badge: null },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-80 glass border-r border-white/40 shadow-[20px_0_60px_rgba(0,0,0,0.05)] z-[100] flex flex-col font-display bg-[#FDFBF7]">
      {/* Premium Logo Section */}
      <div className="p-10">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => navigate('/customer/home')}
        >
          <div className="w-12 h-12 bg-primary rounded-[1.2rem] flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500 shadow-primary/20">
            <img src="/tomato-logo.png" alt="T" className="w-8 h-8 object-contain drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter leading-none">tomato</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-1">Premium Edition</span>
          </div>
        </div>
      </div>

      {/* Profile Card - Masterpiece Style */}
      <div className="px-6 mb-10">
        <div
          onClick={() => navigate('/customer/profile')}
          className="relative glass-card p-6 rounded-[2.5rem] border-white/60 shadow-xl cursor-pointer group overflow-hidden hover:shadow-primary/10 transition-all duration-500"
        >
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-16 h-16 rounded-[1.5rem] p-1 ${premiumMember ? 'bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30' : 'bg-gray-100'} transition-transform group-hover:scale-105 duration-500`}>
              <div className="w-full h-full rounded-[1.3rem] bg-white overflow-hidden shadow-inner flex items-center justify-center">
                {profilePhoto ? (
                  <img src={getImageUrl(profilePhoto)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-gray-300" size={32} />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Welcome back</p>
              <h3 className="font-black text-gray-800 truncate text-xl tracking-tight pr-4">{name || 'Guest'}</h3>
              {premiumMember && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Premium Member</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full group px-8 py-5 rounded-[1.8rem] flex items-center gap-5 transition-all duration-500 relative overflow-hidden ${isActive
                ? 'bg-[var(--primary)] text-white shadow-2xl shadow-primary/30'
                : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
              )}
              <Icon size={24} className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
              <span className="font-black text-lg tracking-tight">{item.label}</span>

              {item.badge !== null && item.badge > 0 && (
                <div className="ml-auto w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg animate-bounce">
                  {item.badge}
                </div>
              )}

              {isActive && (
                <ChevronRight size={18} className="ml-auto opacity-40" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout - Premium Floating Style */}
      <div className="p-8">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full relative group/logout h-16 bg-white border-2 border-gray-100 rounded-3xl flex items-center justify-center gap-4 transition-all duration-500 hover:bg-red-500 hover:border-red-500 group overflow-hidden"
        >
          <LogOut size={22} className="text-gray-400 group-hover/logout:text-white group-hover/logout:rotate-12 transition-all duration-500 relative z-10" />
          <span className="font-black text-gray-500 group-hover/logout:text-white transition-all duration-500 relative z-10">Sign Out</span>
          <div className="absolute inset-0 bg-red-500 translate-y-full group-hover/logout:translate-y-0 transition-transform duration-500"></div>
        </button>
      </div>
    </div>
  );
};

export default CustomerSidebar;
