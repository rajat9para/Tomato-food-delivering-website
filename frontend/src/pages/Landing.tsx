import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, Shield, Star, Clock, CheckCircle, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import api from '../utils/api';

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

          const suggestions = [
            ...filteredRestaurants.slice(0, 3).map((r: any) => ({ ...r, type: 'restaurant' })),
            ...filteredDishes.slice(0, 3).map((d: any) => ({ ...d, type: 'dish' }))
          ];

          setSuggestions(suggestions);
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
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/tomato-logo.png" alt="TOMATO" className="w-12 h-12 object-contain" />
              <span className="text-3xl font-display font-bold text-primary italic">TOMATO</span>
            </div>

            <div className="flex-1 max-w-2xl relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-red-200 rounded-xl focus:border-primary focus:outline-none transition text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-red-100 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                  {suggestions.map((item: any) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                        if (item.type === 'restaurant') {
                          navigate('/login'); // Require login to view restaurant
                        } else {
                          navigate('/login'); // Require login to search dishes
                        }
                      }}
                      className="px-4 py-3 hover:bg-red-50 cursor-pointer transition flex items-center gap-3"
                    >
                      {item.type === 'restaurant' ? (
                        <>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-full border-2 border-primary" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">Restaurant • {item.cuisineType?.join(', ') || 'Multi-Cuisine'}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          {item.images && item.images.length > 0 ? (
                            <img src={item.images[0]} alt={item.name} className="w-10 h-10 object-cover rounded-full border-2 border-primary" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              🍽️
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">Dish • ₹{item.price}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {foodImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <img
                src={image}
                alt="Delicious Food"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 h-full flex items-start justify-center pt-32">
          <div className="text-center px-6 max-w-5xl mx-auto">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-display font-bold text-white mb-6 leading-tight drop-shadow-2xl animate-fade-in">
              Order Food<br />
              <span className="text-red-500">Online</span>
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl text-white mb-12 font-medium drop-shadow-lg">
              Discover the best food & drinks in your city
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => navigate('/register/customer')}
                className="px-16 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-2xl italic"
              >
                Order Now
              </button>
              <button
                onClick={() => navigate('/register/owner')}
                className="px-16 py-5 bg-white text-red-600 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white italic"
              >
                Partner With Us
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-display font-bold text-gray-900 mb-6">
              Get Started
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your role and start your journey with TOMATO
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                title: 'Customer',
                description: 'Order food from your favorite restaurants',
                icon: ShoppingCart,
                color: 'bg-red-500',
                features: ['Browse Restaurants', 'Track Orders', 'Easy Payments'],
                path: '/register/customer'
              },
              {
                title: 'Restaurant Owner',
                description: 'Grow your business with our platform',
                icon: Store,
                color: 'bg-orange-500',
                features: ['Manage Menu', 'Track Orders', 'View Analytics'],
                path: '/register/owner'
              },
              {
                title: 'Admin',
                description: 'Manage the entire platform',
                icon: Shield,
                color: 'bg-blue-500',
                features: ['Approve Restaurants', 'Monitor Activity', 'View Reports'],
                path: '/login'
              }
            ].map((role, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-10 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-200 shadow-lg"
                onClick={() => navigate(role.path)}
              >
                <div className={`w-20 h-20 rounded-2xl ${role.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {role.title}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {role.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-white hover:text-red-500 transition shadow-md">
                  Get Started →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-display font-bold text-gray-900 mb-6">
              Why TOMATO?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              { icon: Star, title: 'Verified Restaurants', desc: 'All restaurants are verified by our team' },
              { icon: Clock, title: 'Fast Delivery', desc: 'Get your food delivered in 30 minutes' },
              { icon: CheckCircle, title: 'Quality Food', desc: 'Fresh ingredients and hygienic preparation' }
            ].map((feature, index) => (
              <div key={index} className="text-center p-10 bg-gray-50 rounded-2xl hover:shadow-xl transition transform hover:-translate-y-2 duration-300">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <feature.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-display font-bold mb-8">
            Ready to Order?
          </h2>
          <p className="text-2xl mb-12 max-w-2xl mx-auto opacity-90">
            Join thousands of happy customers
          </p>
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => navigate('/register/customer')}
              className="px-12 py-5 bg-white text-primary rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:-translate-y-1 duration-300"
            >
              Start Ordering
            </button>
            <button
              onClick={() => navigate('/register/owner')}
              className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-primary transition transform hover:-translate-y-1 duration-300"
            >
              Become a Partner
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
