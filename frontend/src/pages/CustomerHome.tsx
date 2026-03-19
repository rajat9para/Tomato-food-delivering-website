import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import DishCarousel from '../components/DishCarousel';
import SkeletonCard from '../components/SkeletonCard';
import { ShoppingCart } from 'lucide-react';

const CustomerHome = () => {
  const { logout, name } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingOrderId] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([]);

  useEffect(() => {
    loadRestaurants();
    loadFeaturedDishes();
  }, []); // Only run once on mount

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/customer/orders');
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const submitRating = async () => {
    try {
      const formData = new FormData();
      formData.append('orderId', ratingOrderId);
      formData.append('rating', ratingValue.toString());
      formData.append('review', reviewText);

      await api.post('/customer/orders/rate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Thank you for your rating!');
      setShowRating(false);
      setReviewText('');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error submitting rating');
    }
  };

  useEffect(() => {
    const searchItems = () => {
      if (searchQuery.trim().length > 0) {
        const restaurantMatches = restaurants.filter((r: any) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const suggestions = [...restaurantMatches.slice(0, 5)];
        if (restaurantMatches.length === 0) {
          suggestions.push({ type: 'dish', name: searchQuery });
        }
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(searchItems, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, restaurants]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customer/restaurants');
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedDishes = async () => {
    try {
      const { data } = await api.get('/customer/featured-dishes');
      setFeaturedDishes(data.slice(0, 4));
    } catch (error) {
      console.error('Error loading featured dishes:', error);
    }
  };

  const loadMenu = async (restaurantId: string) => {
    try {
      const { data } = await api.get(`/customer/restaurants/${restaurantId}/menu`);
      setMenu(data);
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const selectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setCart([]);
    loadMenu(restaurant._id);
  };

  const addToCart = (item: any) => {
    if (!item.availability) {
      alert('This item is currently unavailable');
      return;
    }
    const existing = cart.find(c => c.foodId === item._id);
    if (existing) {
      setCart(cart.map(c => c.foodId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        foodId: item._id,
        name: item.name,
        price: item.price,
        discount: item.discount || 0,
        quantity: 1,
        images: item.images
      }]);
    }
  };

  const updateQuantity = (foodId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.foodId === foodId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const checkout = async (paymentMethod: string) => {
    try {
      setCheckoutLoading(true);
      const items = cart.map(c => ({ foodId: c.foodId, quantity: c.quantity, price: c.price }));
      const baseAmount = cart.reduce((sum, c) => {
        const discountedPrice = c.price * (1 - c.discount / 100);
        return sum + discountedPrice * c.quantity;
      }, 0);

      await api.post('/customer/orders', {
        restaurantId: selectedRestaurant._id,
        items,
        totalAmount: baseAmount,
        paymentMethod
      });

      alert('Order placed successfully!');
      setCart([]);
      setSelectedRestaurant(null);
      setShowCheckout(false);
      setActiveTab('browse');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error placing order');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, c) => {
      const discountedPrice = c.price * (1 - c.discount / 100);
      return sum + discountedPrice * c.quantity;
    }, 0);
  };

  return (
    <div className="min-h-screen">
      <GlobalBackground />

      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain" />
              <h1 className="text-3xl font-display font-bold text-primary italic">TOMATO</h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => { setActiveTab('browse'); setSelectedRestaurant(null); }}
                className={`font-semibold transition-all duration-300 ${activeTab === 'browse' ? 'text-primary border-b-2 border-primary pb-1 shadow-neon' : 'text-gray-600 hover:text-primary hover:shadow-pink-500/20'}`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`font-semibold transition-all duration-300 ${activeTab === 'orders' ? 'text-primary border-b-2 border-primary pb-1 shadow-neon' : 'text-gray-600 hover:text-primary hover:shadow-pink-500/20'}`}
              >
                My Orders
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none transition-all duration-300 input-premium"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-pink-100 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                {searchSuggestions.map((item: any) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (item.type === 'dish') {
                        navigate('/customer/best-restaurants', { state: { dishName: item.name } });
                      } else {
                        selectRestaurant(item);
                      }
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="px-5 py-4 hover:bg-pink-50 cursor-pointer transition-all duration-300 border-b border-pink-50 last:border-0 flex items-center gap-4"
                  >
                    {item.type === 'dish' ? (
                      <>
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          🍽️
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">Search for dish: "{item.name}"</div>
                          <div className="text-sm text-gray-500">Find restaurants serving this dish</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-full border-2 border-primary shadow-lg" />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.cuisineType?.join(', ') || 'Multi-Cuisine'}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <span className="text-gray-700 font-medium">Welcome, <span className="font-bold text-gray-900">{name}</span></span>
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-pink-500/20 hover:-translate-y-1">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <>
          {activeTab === 'browse' && !selectedRestaurant && (
            <div className="flex gap-8">
              {/* Left Sidebar - Featured Dishes */}
              <div className="w-36 flex-shrink-0 space-y-6 h-fit sticky top-28">
                {featuredDishes.map((dish: any) => (
                  <div key={dish._id} className="relative h-36 cursor-pointer group overflow-hidden rounded-r-3xl shadow-xl transition-all duration-500 hover:w-48 bg-gradient-to-r from-pink-600 to-pink-500 border-2 border-pink-400/50">
                    {dish.images && dish.images.length > 0 ? (
                      <img src={dish.images[0]} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <span className="font-bold text-sm text-center px-3 line-clamp-2">{dish.name}</span>
                      <span className="text-xs mt-1 font-semibold">₹{dish.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Content - Restaurants */}
              <div className="flex-1">
                <div className="mb-8">
                  <h2 className="text-5xl font-display font-bold text-gray-900 mb-3">Restaurants near you</h2>
                  <p className="text-gray-600 text-lg">Discover the best dining experiences in your area</p>
                </div>
                {loading ? (
                  <div className="space-y-8">
                    {[1, 2].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[calc(100vh-220px)] overflow-y-auto pr-4">
                    {restaurants.map((r: any) => (
                      <div
                        key={r._id}
                        className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-pink-100 w-full card-hover"
                        onClick={() => selectRestaurant(r)}
                      >
                        <div className="h-96 relative overflow-hidden">
                          {r.coverImage ? (
                            <img
                              src={r.coverImage}
                              alt={r.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                              <span className="text-8xl font-display font-bold text-primary">{r.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2 border border-green-400/30">
                            <span className="text-sm">★</span>
                            <span>{r.rating?.toFixed(1) || '3.0'}</span>
                          </div>
                        </div>
                        <div className="p-8">
                          <h3 className="text-3xl font-display font-bold text-gray-900 mb-3">{r.name}</h3>
                          <p className="text-gray-600 text-base mb-6">{r.cuisineType?.join(', ') || 'Multi-Cuisine'}</p>
                          <div className="flex items-center justify-between pt-6 border-t-2 border-pink-100">
                            <span className="text-gray-500 text-sm font-medium">{r.totalReviews || 0} reviews</span>
                            <span className="text-primary font-bold text-lg tracking-wide">View Menu →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'browse' && selectedRestaurant && (
            <div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="mb-8 text-gray-700 hover:text-primary font-bold flex items-center gap-3 transition-all duration-300 text-lg group"
              >
                <span className="w-10 h-10 bg-pink-100 text-primary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">←</span>
                Back to Restaurants
              </button>

              <div className="bg-white rounded-2xl shadow-2xl p-12 mb-8 border-2 border-pink-100">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-8 mb-8">
                      {selectedRestaurant.imageUrl ? (
                        <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-28 h-28 object-cover rounded-full border-4 border-primary shadow-xl" />
                      ) : (
                        <div className="w-28 h-28 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-primary">
                          {selectedRestaurant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h1 className="text-6xl font-display font-bold text-gray-900">{selectedRestaurant.name}</h1>
                        <p className="text-gray-600 text-xl mt-4 max-w-2xl">{selectedRestaurant.description || 'Delicious food awaits you'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                      <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-lg">Address:</span>
                          <p className="text-lg text-gray-600 mt-1">{selectedRestaurant.address || 'Location not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-lg">Phone:</span>
                          <p className="text-lg text-gray-600 mt-1">{selectedRestaurant.phone || 'Contact not available'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-lg">Owner:</span>
                          <p className="text-lg text-gray-600 mt-1">{selectedRestaurant.ownerId?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-lg">Hours:</span>
                          <p className="text-lg text-gray-600 mt-1">{selectedRestaurant.openingTime} - {selectedRestaurant.closingTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right bg-gradient-to-br from-green-500 to-green-600 text-white px-10 py-8 rounded-2xl shadow-xl border border-green-400/30">
                    <div className="text-6xl font-display font-bold mb-2">{selectedRestaurant.rating?.toFixed(1) || '3.0'}</div>
                    <div className="text-lg opacity-90 font-semibold">{selectedRestaurant.totalReviews || 0} reviews</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                  <div className="mb-8">
                    <h3 className="text-5xl font-display font-bold text-gray-900 mb-3">Menu</h3>
                    <p className="text-gray-600 text-lg">Explore our delicious offerings</p>
                  </div>
                  <div className="space-y-8">
                    {menu.map((item: any) => (
                      <div key={item._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-pink-100 card-hover">
                        <div className="flex flex-col lg:flex-row">
                          <div className="w-full lg:w-80 h-80 flex-shrink-0">
                            <DishCarousel images={item.images || []} alt={item.name} />
                          </div>
                          <div className="flex-1 p-8 flex flex-col justify-between">
                            <div>
                              <h4 className="text-3xl font-display font-bold text-gray-900 mb-4">{item.name}</h4>
                              <p className="text-gray-700 text-base mb-6 line-clamp-3 leading-relaxed">{item.description}</p>
                              {item.category && (
                                <span className="inline-block bg-gradient-to-r from-pink-100 to-purple-100 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4 border border-pink-200">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t-2 border-pink-100">
                              <div>
                                {item.discount > 0 ? (
                                  <div className="flex items-center gap-4">
                                    <span className="text-4xl font-bold text-primary">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                                    <span className="text-lg text-gray-400 line-through">₹{item.price}</span>
                                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">SAVE {item.discount}%</span>
                                  </div>
                                ) : (
                                  <span className="text-4xl font-bold text-gray-900">₹{item.price}</span>
                                )}
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!item.availability}
                                className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg transform active:scale-95 ${
                                  item.availability
                                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-neon hover:-translate-y-1'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:shadow-none'
                                }`}
                              >
                                {item.availability ? (
                                  <>
                                    <ShoppingCart size={20} className="inline mr-2" />
                                    <span>ADD TO CART</span>
                                  </>
                                ) : (
                                  'SOLD OUT'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="bg-white rounded-2xl shadow-2xl p-8 sticky top-28 border-2 border-pink-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                        <ShoppingCart size={24} />
                      </div>
                      <h3 className="text-3xl font-display font-bold text-gray-900">Your Cart</h3>
                    </div>
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🛒</div>
                        <p className="text-gray-500 text-lg font-medium">Your cart is empty</p>
                        <p className="text-gray-400 text-sm mt-2">Add some delicious items to get started</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2">
                          {cart.map((item: any) => (
                            <div key={item.foodId} className="border-b-2 border-pink-100 pb-6 last:border-0">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 text-xl mb-2">{item.name}</p>
                                  {item.discount > 0 && (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">SAVE {item.discount}%</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-primary text-2xl">
                                    ₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 bg-pink-50 rounded-xl p-3 border border-pink-100">
                                  <button
                                    onClick={() => updateQuantity(item.foodId, -1)}
                                    className="w-10 h-10 bg-white hover:bg-primary hover:text-white rounded-full flex items-center justify-center font-bold text-gray-800 transition-all duration-300 shadow-sm hover:shadow-lg"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-gray-900 text-xl w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.foodId, 1)}
                                    className="w-10 h-10 bg-white hover:bg-primary hover:text-white rounded-full flex items-center justify-center font-bold text-gray-800 transition-all duration-300 shadow-sm hover:shadow-lg"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Unit: ₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t-2 border-pink-100 pt-8">
                          <div className="flex justify-between items-center mb-8">
                            <span className="text-2xl font-bold text-gray-900">Total:</span>
                            <span className="text-4xl font-bold text-primary">₹{calculateTotal().toFixed(0)}</span>
                          </div>
                          <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-1 transform hover:scale-105 active:scale-100"
                          >
                            Proceed to Checkout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="mb-8">
                <h2 className="text-5xl font-display font-bold text-gray-900 mb-3">Active Orders</h2>
                <p className="text-gray-600 text-lg">Track your current orders</p>
              </div>
              <div className="space-y-6">
                {orders.filter((order: any) => order.orderStatus !== 'completed').map((order: any) => (
                  <div key={order._id} className="bg-white rounded-2xl shadow-xl p-8 border-2 border-pink-100 card-hover">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
                      <div>
                        <p className="text-3xl font-display font-bold text-gray-900 mb-3">Order #{order._id.slice(-6)}</p>
                        <p className="text-gray-700 text-lg">{order.restaurantId?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-display font-bold text-primary mb-3">₹{order.totalAmount}</p>
                        <span className={`inline-block px-6 py-3 rounded-xl text-base font-bold ${
                          order.orderStatus === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                            : order.orderStatus === 'preparing' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : order.orderStatus === 'ready' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="border-t-2 border-pink-100 pt-6">
                      <h4 className="font-display font-bold text-gray-900 text-xl mb-4">Items:</h4>
                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-100">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                                {item.foodId?.name.charAt(0) || 'F'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{item.foodId?.name}</p>
                                <p className="text-gray-600 text-sm">× {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">₹{item.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-gray-600 text-base">
                      <span>Ordered: {new Date(order.createdAt).toLocaleString()}</span>
                      <span className="bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-semibold border border-pink-200">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.filter((order: any) => order.orderStatus !== 'completed').length === 0 && (
                  <div className="text-center py-16 bg-pink-50 rounded-2xl border-2 border-pink-100">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-xl font-medium">No active orders</p>
                    <p className="text-gray-400 text-base mt-2">Start browsing restaurants to place your first order</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="mt-6 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:-translate-y-1"
                    >
                      Browse Restaurants
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full border-2 border-pink-100 animate-scale-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-4xl font-display font-bold text-gray-900">Checkout</h3>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-8 border border-pink-100">
              {(() => {
                const baseAmount = calculateTotal();
                const gstAmount = Math.round(baseAmount * 0.01);
                const platformFeeAmount = Math.round(baseAmount * 0.01);
                const finalTotal = baseAmount + gstAmount + platformFeeAmount;
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-pink-200">
                      <span className="text-gray-700 font-semibold text-lg">Subtotal:</span>
                      <span className="font-bold text-2xl">₹{baseAmount.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-pink-200">
                      <span className="text-gray-700 font-semibold text-lg">GST (1%):</span>
                      <span className="font-bold text-2xl">₹{gstAmount}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-pink-200">
                      <span className="text-gray-700 font-semibold text-lg">Platform Fee (1%):</span>
                      <span className="font-bold text-2xl">₹{platformFeeAmount}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-t-2 border-pink-200">
                      <span className="text-gray-900 font-bold text-xl">Total Amount:</span>
                      <span className="font-bold text-3xl text-primary">₹{finalTotal}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <h4 className="text-2xl font-display font-bold text-gray-900 mb-6">Payment Method</h4>
            <div className="space-y-4">
              <button
                onClick={() => checkout('UPI')}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-green-500/30 hover:-translate-y-1 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  '💳 Pay with UPI'
                )}
              </button>
              <button
                onClick={() => checkout('Card')}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-blue-500/30 hover:-translate-y-1 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  '💳 Pay with Card'
                )}
              </button>
              <button
                onClick={() => checkout('COD')}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-1 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  '💵 Cash on Delivery'
                )}
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-5 rounded-xl font-bold text-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full border-2 border-pink-100 animate-scale-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-4xl font-display font-bold text-gray-900">Rate Your Experience</h3>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`text-6xl transition-all duration-300 transform hover:scale-110 ${
                    star <= ratingValue ? 'text-green-400 drop-shadow-lg' : 'text-gray-300 hover:text-green-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center text-3xl font-display font-bold text-gray-800 mb-6">{ratingValue} out of 5</p>
            <div className="mb-8">
              <label className="block text-gray-800 font-bold mb-4 text-lg">Share Your Experience</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us about your experience with this order..."
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none h-32 resize-none transition-all duration-300 input-premium"
              />
            </div>
            <div className="space-y-4">
              <button
                onClick={submitRating}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-1 transform hover:scale-105 active:scale-100"
              >
                Submit Rating
              </button>
              <button
                onClick={() => { setShowRating(false); setReviewText(''); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-5 rounded-xl font-bold text-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerHome;
