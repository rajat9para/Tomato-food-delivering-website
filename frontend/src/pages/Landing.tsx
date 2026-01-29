import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, Shield, Search, Star, Clock, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import api from '../utils/api';

const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const searchItems = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const restaurantsRes = await api.get('/public/restaurants');
          const filteredRestaurants = restaurantsRes.data.filter((restaurant: any) =>
            restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const dishesRes = await api.get('/public/dishes');
          const filteredDishes = dishesRes.data.filter((dish: any) =>
            dish.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSuggestions([
            ...filteredRestaurants.slice(0, 3).map((r: any) => ({ ...r, type: 'restaurant' })),
            ...filteredDishes.slice(0, 3).map((d: any) => ({ ...d, type: 'dish' }))
          ]);
          setShowSuggestions(true);
        } catch (error) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const debounce = setTimeout(searchItems, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain shadow-sm" />
            <span className="text-3xl font-bold text-primary tracking-tighter italic">TOMATO</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-50/50 -z-10 rounded-l-[100px] hidden lg:block"></div>
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Premium Food<br />
              <span className="text-primary">Delivered Fast.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-lg">
              Experience the best dining in your city with TOMATO's elite collection of verified restaurants.
            </p>

            <div className="relative max-w-md mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {suggestions.map((item) => (
                    <div key={item._id} onClick={() => navigate('/login')} className="px-5 py-3 hover:bg-red-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-primary text-xs">🍽️</div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => navigate('/register/customer')} className="btn-primary">Order Now</button>
              <button onClick={() => navigate('/register/owner')} className="btn-secondary">Partner with Us</button>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="absolute -inset-4 bg-red-100 blur-3xl opacity-30 rounded-full"></div>
            <img src="/foodimages/f1.jpg" alt="Delicious Food" className="relative w-full h-[500px] object-cover rounded-[3rem] shadow-2xl border-8 border-white" />
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Start Your Journey</h2>
            <p className="text-gray-500">Select how you want to use TOMATO</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ShoppingCart, title: 'Customer', desc: 'Order from elite restaurants', path: '/register/customer' },
              { icon: Store, title: 'Restaurant', desc: 'Grow your business with us', path: '/register/owner' },
              { icon: Shield, title: 'Admin', desc: 'Securely manage the platform', path: '/login' }
            ].map((role) => (
              <div key={role.title} onClick={() => navigate(role.path)} className="glass-card p-10 cursor-pointer group">
                <div className="w-16 h-16 bg-red-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <role.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{role.title}</h3>
                <p className="text-gray-500 mb-6">{role.desc}</p>
                <div className="text-primary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  Launch →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
          {[
            { icon: Star, title: 'Elite Quality', text: 'Hand-picked restaurants only' },
            { icon: Clock, title: 'Fastest Delivery', text: 'Under 30 minutes guaranteed' },
            { icon: CheckCircle, title: 'Total Security', text: 'Pay with complete peace of mind' }
          ].map((item) => (
            <div key={item.title}>
              <div className="w-16 h-16 bg-gray-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <item.icon size={28} />
              </div>
              <h4 className="text-xl font-bold mb-2">{item.title}</h4>
              <p className="text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
