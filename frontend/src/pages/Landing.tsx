import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, Shield, Star, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import FloatingActionButton from '../components/FloatingActionButton';

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stackIndex, setStackIndex] = useState(0);

  // Auto-rotate stacked images every 5 seconds
  useEffect(() => {
    const stackTimer = setInterval(() => {
      setStackIndex((prev) => (prev + 1));
    }, 5000);
    return () => clearInterval(stackTimer);
  }, []);

  const foodImages = [
    '/foodimages/f1.jpg',
    '/foodimages/f2.jpg',
    '/foodimages/f3.jpg',
    '/foodimages/f4.jpg',
    '/foodimages/f5.jpg',
    '/foodimages/f6.jpg',
    '/foodimages/f7.jpg',
    '/foodimages/f8.jpg',
    '/foodimages/f9.jpg',
    '/foodimages/f10.jpg',
    '/foodimages/f11.jpg',
    '/foodimages/f12.jpg',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % foodImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const searchItems = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          // Search restaurants
          const restaurantsRes = await api.get('/public/restaurants');
          const filteredRestaurants = restaurantsRes.data.filter((restaurant: any) =>
            restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          // Search dishes
          const dishesRes = await api.get('/public/dishes');
          const filteredDishes = dishesRes.data.filter((dish: any) =>
            dish.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          const suggestionsList = [
            ...filteredRestaurants.slice(0, 3).map((r: any) => ({ ...r, type: 'restaurant' })),
            ...filteredDishes.slice(0, 3).map((d: any) => ({ ...d, type: 'dish' }))
          ];

          setSuggestions(suggestionsList);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Search error:', error);
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
    <div className="min-h-screen bg-[var(--background)] font-sans selection:bg-primary/10 selection:text-primary">
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
        <div className="max-w-7xl mx-auto glass rounded-[2rem] px-8 py-3 flex justify-between items-center gap-6 shadow-2xl border-white/40">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <img src="/tomato-logo.png" alt="T" className="w-7 h-7 object-contain drop-shadow-md" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">tomato</span>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search for restaurants, cuisines or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-14 pr-6 py-3.5 bg-white/50 backdrop-blur-md border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 font-medium"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 glass-card rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-scale-in border-white/60">
                {suggestions.map((item: any) => (
                  <div
                    key={item._id}
                    onClick={() => navigate('/login')}
                    className="px-6 py-4 hover:bg-primary/5 cursor-pointer transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                      {item.type === 'restaurant' ? (
                        item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold text-lg">{item.name.charAt(0)}</div>
                      ) : (
                        item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-orange-500 text-white flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-sm text-gray-500 font-medium capitalize">{item.type} • {item.cuisineType?.join(', ') || (item.price ? `₹${item.price}` : 'Food')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-red-200 hover:-translate-y-1 transition-all duration-300 active:scale-95 shadow-lg whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {foodImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1500 ${index === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                } transition-all duration-[2000ms] ease-out`}
            >
              <img
                src={image}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-bold mb-8 animate-slide-in-down">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>Over 10,000+ happy foodies served</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-white mb-8 leading-[0.9] tracking-tighter animate-fade-in drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            Craving?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-primary-dark uppercase">Tomato.</span>
          </h1>
          <p className="text-xl md:text-3xl text-white/90 mb-12 font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Delicious food from your favorite restaurants,<br className="hidden md:block" />
            delivered straight to your doorstep in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-in-up">
            <button
              onClick={() => navigate('/register/customer')}
              className="group px-12 py-5 bg-primary text-white rounded-[2rem] font-black text-xl hover:bg-white hover:text-primary transition-all duration-300 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-2 flex items-center gap-3"
            >
              Order Now
              <div className="w-10 h-10 bg-white/20 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </button>
            <button
              onClick={() => navigate('/register/owner')}
              className="px-12 py-5 bg-white/10 backdrop-blur-md text-white rounded-[2rem] font-bold text-xl hover:bg-white hover:text-gray-900 transition-all duration-300 border-2 border-white/30 shadow-2xl transform hover:-translate-y-2 flex items-center gap-3"
            >
              Partner With Us
              <Store className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
          </div>
          <span className="text-white text-[10px] uppercase font-black tracking-[0.2em]">Scroll Down</span>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <GlobalBackground />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 text-center md:text-left">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tighter leading-none">
                Start your journey<br /><span className="text-primary italic">In Seconds.</span>
              </h2>
              <p className="text-xl text-gray-500 font-medium">
                Choose your role and unlock the world of taste with Tomato.
              </p>
            </div>
            <div className="hidden lg:block">
              <img src="/tomato-logo.png" alt="" className="w-32 h-32 opacity-10 rotate-12" />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {[
              {
                title: 'Customer',
                description: 'Satisfy your cravings with the best local cuisines.',
                icon: ShoppingCart,
                color: 'from-red-500 to-red-600',
                features: ['Instant Delivery', 'Live Tracking', 'Expert Support'],
                path: '/register/customer'
              },
              {
                title: 'Restaurant',
                description: 'Digitize your menu and reach thousands of customers.',
                icon: Store,
                color: 'from-orange-500 to-orange-600',
                features: ['Sales Analytics', 'Menu Control', 'Payout Tools'],
                path: '/register/owner'
              },
              {
                title: 'Admin',
                description: 'The mission control for the ultimate food platform.',
                icon: Shield,
                color: 'from-blue-600 to-blue-700',
                features: ['Full Oversight', 'Security Tools', 'Reports Panel'],
                path: '/login'
              }
            ].map((role, index) => (
              <div
                key={index}
                className="group relative glass-card p-10 rounded-[3rem] border-white/60 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-4 shadow-xl"
                onClick={() => navigate(role.path)}
              >
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-10 shadow-xl group-hover:rotate-6 transition-all duration-500`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tighter">
                  {role.title}
                </h3>
                <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">
                  {role.description}
                </p>
                <div className="space-y-4 mb-12">
                  {role.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-700 font-bold">
                      <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
                      <span className="text-sm opacity-80">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg group-hover:bg-primary-dark transform transition-all duration-300 shadow-xl flex items-center justify-center gap-2">
                  Launch {role.title} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <h2 className="text-6xl font-black text-gray-900 tracking-tighter">
                Real Time.<br /><span className="text-primary italic">Real Taste.</span>
              </h2>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                Our network of thousands of restaurants and expert delivery partners ensure you never have to wait for your favorites.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 rounded-[2rem] bg-white border-2 border-primary/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl font-black text-primary mb-1">30m</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Avg Delivery</div>
                </div>
                <div className="p-8 rounded-[2rem] bg-white border-2 border-primary/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl font-black text-primary mb-1">24/7</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Support</div>
                </div>
              </div>
            </div>
            <div className="flex-1 relative h-[600px] flex items-center justify-center">
              {/* Stacked Images */}
              <div className="absolute w-[80%] h-[70%] rounded-[3rem] overflow-hidden shadow-2xl transform -rotate-12 translate-x-12 opacity-60 scale-90 border-4 border-white">
                <img src={foodImages[5]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute w-[80%] h-[70%] rounded-[3rem] overflow-hidden shadow-2xl transform rotate-12 -translate-x-12 opacity-80 scale-95 border-4 border-white">
                <img src={foodImages[8]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative w-[85%] h-[75%] rounded-[3rem] overflow-hidden shadow-3xl transform hover:rotate-2 hover:scale-105 transition-all duration-500 border-8 border-white group z-10">
                <img src={foodImages[2]} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Float Badge */}
              <div className="absolute bottom-10 -left-6 glass-card p-6 rounded-[2rem] shadow-2xl animate-float border-white z-20 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:rotate-180 transition-transform duration-700">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-gray-900 leading-tight">Reliable</div>
                    <div className="text-xs font-bold text-gray-400 uppercase">Quality Assured</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 mb-24">
        <div className="max-w-7xl mx-auto rounded-[4rem] bg-black relative overflow-hidden shadow-3xl p-16 md:p-32 text-center group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative z-10 space-y-12">
            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
              The Finest Plate.<br /><span className="text-primary italic">Delivered.</span>
            </h2>
            <p className="text-2xl text-gray-400 font-medium max-w-3xl mx-auto">
              Join millions of users who trust Tomato for their daily meals and restaurant management.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <button
                onClick={() => navigate('/register/customer')}
                className="px-16 py-6 bg-white text-black rounded-full font-black text-2xl hover:bg-primary hover:text-white transition-all duration-300 shadow-2xl hover:shadow-primary/40 transform hover:-translate-y-2 active:scale-95"
              >
                Start Ordering
              </button>
              <button
                onClick={() => navigate('/register/owner')}
                className="px-16 py-6 bg-gray-950 text-white rounded-full font-black text-2xl hover:bg-white hover:text-gray-950 transition-all duration-300 border-2 border-gray-950 transform hover:-translate-y-2 active:scale-95"
              >
                Become Partner
              </button>
            </div>
          </div>
        </div>
      </section>

      <FloatingActionButton />
      <Footer />
    </div>
  );
};

export default Landing;
