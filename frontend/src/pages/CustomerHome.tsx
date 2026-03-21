import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import SkeletonCard from '../components/SkeletonCard';

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
  const [ratingOrderId, _setRatingOrderId] = useState('');
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
    <div className="min-h-screen bg-background text-gray-900 font-sans">
      <GlobalBackground />

      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-red-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/customer')}>
              <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform" />
              <h1 className="text-3xl font-black text-primary italic tracking-tight">TOMATO</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => { setActiveTab('browse'); setSelectedRestaurant(null); }}
                className={`font-bold text-lg transition-all relative px-2 ${activeTab === 'browse' ? 'text-primary' : 'text-gray-500 hover:text-red-500'}`}
              >
                Browse
                {activeTab === 'browse' && <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary rounded-full"></span>}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`font-bold text-lg transition-all relative px-2 ${activeTab === 'orders' ? 'text-primary' : 'text-gray-500 hover:text-red-500'}`}
              >
                Orders
                {activeTab === 'orders' && <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary rounded-full"></span>}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <input
              type="text"
              placeholder="Search for restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-full focus:border-primary focus:bg-white focus:outline-none transition-all shadow-inner text-gray-700 font-medium"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50 overflow-hidden">
                {searchSuggestions.map((item: any) => (
                  <div
                    key={item._id || item.name}
                    onClick={() => {
                      if (item.type === 'dish') {
                        navigate('/customer/best-restaurants', { state: { dishName: item.name } });
                      } else {
                        selectRestaurant(item);
                      }
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="px-6 py-4 hover:bg-red-50 cursor-pointer transition border-b border-gray-50 last:border-0 flex items-center gap-4 group">
                    {item.type === 'dish' ? (
                      <>
                        <div className="w-10 h-10 bg-red-100 text-primary rounded-full flex items-center justify-center text-lg shadow-sm">
                          🍽️
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">"{item.name}"</div>
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Search Dish</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-full border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold shadow-sm">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.cuisineType?.join(', ') || 'Restaurant'}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <span className="text-gray-600 hidden md:inline">Welcome, <span className="font-black text-gray-900">{name}</span></span>
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-white border-2 border-red-100 hover:border-red-500 text-red-600 hover:bg-red-50 px-5 py-2 rounded-xl font-bold transition shadow-sm hover:shadow-md text-sm md:text-base">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <>
          {activeTab === 'browse' && !selectedRestaurant && (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Sidebar - Featured Dishes (Desktop) */}
              <div className="hidden md:block w-40 flex-shrink-0 space-y-6 h-fit sticky top-28">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Trending</h3>
                {featuredDishes.map((dish: any) => (
                  <div key={dish._id} className="relative h-40 cursor-pointer group overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 border-2 border-white">
                    {dish.images && dish.images.length > 0 ? (
                      <img src={dish.images[0]} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <p className="font-bold text-xs leading-tight line-clamp-2">{dish.name}</p>
                      <p className="text-[10px] font-bold text-yellow-400 mt-1">₹{dish.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Featured Scroll */}
              <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x">
                {featuredDishes.map((dish: any) => (
                  <div key={dish._id} className="snap-center shrink-0 w-32 h-32 relative rounded-xl overflow-hidden shadow-md">
                    <img src={dish.images?.[0] || '/placeholder-food.jpg'} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white">
                      <p className="text-xs font-bold truncate">{dish.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Content - Restaurants */}
              <div className="flex-1">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">Hungry?</h2>
                    <p className="text-gray-500 font-bold mt-2">Order from the finest restaurants near you</p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-8">
                    {[1, 2].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {restaurants.map((r: any) => (
                      <div
                        key={r._id}
                        className="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-gray-100 hover:border-red-100"
                        onClick={() => selectRestaurant(r)}
                      >
                        <div className="h-64 relative overflow-hidden">
                          {r.coverImage ? (
                            <img
                              src={r.coverImage}
                              alt={r.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-6xl font-black text-gray-300 group-hover:text-primary transition-colors">{r.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-lg flex items-center gap-1 border border-white/30">
                            <span>⭐</span>
                            <span>{r.rating?.toFixed(1) || 'NEW'}</span>
                          </div>
                          {/* Image Gradient Overlay Text */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <h3 className="text-2xl font-black text-white mb-1 shadow-black drop-shadow-md">{r.name}</h3>
                            <p className="text-white/90 text-sm font-bold truncate">{r.cuisineType?.join(', ') || 'Multi-Cuisine'}</p>
                          </div>
                        </div>
                        <div className="p-6 flex justify-between items-center bg-white relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-primary">
                              <span className="text-xs font-bold">⏱️</span>
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">30-40 min</span>
                          </div>
                          <button className="text-primary font-black text-sm uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                            View Menu →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'browse' && selectedRestaurant && (
            <div className="animate-fade-in">
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="mb-8 bg-white px-6 py-3 rounded-full text-gray-700 hover:text-primary hover:shadow-lg font-bold flex items-center gap-2 transition border border-gray-100 w-fit"
              >
                ← Back
              </button>

              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 mb-12 border border-red-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-bl-[10rem] -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 relative z-10">
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-4">{selectedRestaurant.name}</h1>
                    <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">{selectedRestaurant.description || 'Experience the finest culinary delights crafted with passion.'}</p>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-gray-600 font-bold">
                      <span className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">📍 {selectedRestaurant.address || 'Unknown Location'}</span>
                      <span className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">📞 {selectedRestaurant.phone || 'No Contact'}</span>
                      <span className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">🕒 {selectedRestaurant.openingTime} - {selectedRestaurant.closingTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100">
                    <span className="text-6xl font-black text-primary">{selectedRestaurant.rating?.toFixed(1) || 'NEW'}</span>
                    <div className="flex gap-1 text-yellow-400 text-xl">
                      {'★★★★★'.slice(0, Math.round(selectedRestaurant.rating || 0))}
                      <span className="text-gray-200">{'★★★★★'.slice(Math.round(selectedRestaurant.rating || 0))}</span>
                    </div>
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">{selectedRestaurant.totalReviews || 0} REVIEWS</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black text-gray-900">Menu</h3>
                    <div className="flex gap-2">
                      {['All', 'Veg', 'Non-Veg'].map(filter => (
                        <button key={filter} className="px-4 py-2 rounded-full border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-black transition">
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {menu.map((item: any) => (
                      <div key={item._id} className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-red-100 flex gap-6 group">
                        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-2xl overflow-hidden relative">
                          {item.images && item.images.length > 0 ? (
                            <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl">🍲</div>
                          )}
                          {item.discount > 0 && <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">{item.discount}% OFF</span>}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</h4>
                              <span className="bg-gray-50 text-gray-500 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">{item.category}</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="flex justify-between items-end mt-4">
                            <div className="flex flex-col">
                              {item.discount > 0 && <span className="text-xs text-gray-400 line-through font-bold">₹{item.price}</span>}
                              <span className="text-2xl font-black text-gray-900">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                            </div>

                            <button
                              onClick={() => addToCart(item)}
                              disabled={!item.availability}
                              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 ${item.availability
                                ? 'bg-primary hover:bg-red-600 text-white hover:shadow-red-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              {item.availability ? 'Add +' : 'Sold Out'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white rounded-[2rem] shadow-xl p-8 sticky top-32 border border-red-50">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-gray-900">Your Order</h3>
                      <span className="bg-red-50 text-primary px-3 py-1 rounded-full text-xs font-bold">{cart.length} ITEMS</span>
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center opacity-50">
                        <span className="text-6xl mb-4 grayscale">🛒</span>
                        <p className="font-bold text-gray-400">Your cart is empty</p>
                        <p className="text-xs text-gray-300 mt-2">Add some delicious items!</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {cart.map((item: any) => (
                            <div key={item.foodId} className="flex justify-between items-center group">
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</p>
                                <p className="text-xs text-gray-400 font-bold">₹{((item.price * (1 - item.discount / 100))).toFixed(0)} x {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.foodId, -1)} className="w-6 h-6 flex items-center justify-center bg-white text-gray-600 hover:text-red-500 rounded shadow-sm font-bold transition">-</button>
                                <span className="font-bold text-sm min-w-[1rem] text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.foodId, 1)} className="w-6 h-6 flex items-center justify-center bg-white text-gray-600 hover:text-green-500 rounded shadow-sm font-bold transition">+</button>
                              </div>
                              <div className="w-16 text-right font-black text-gray-800">
                                ₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(0)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t-2 border-dashed border-gray-100 pt-6 space-y-3">
                          <div className="flex justify-between text-gray-500 text-sm font-bold">
                            <span>Subtotal</span>
                            <span>₹{calculateTotal().toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500 text-sm font-bold">
                            <span>Taxes & Fees</span>
                            <span>₹{(calculateTotal() * 0.05).toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-3">
                            <span>Total</span>
                            <span>₹{(calculateTotal() * 1.05).toFixed(0)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowCheckout(true)}
                          className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest mt-8 transition-all shadow-xl shadow-red-200 transform hover:-translate-y-1"
                        >
                          Checkout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <h2 className="text-4xl font-black text-gray-900 mb-8">Your Orders</h2>
              <div className="space-y-6">
                {orders.filter((order: any) => order.orderStatus !== 'completed').map((order: any) => (
                  <div key={order._id} className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <span className="text-9xl">🥡</span>
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Order #{order._id.slice(-6)}</span>
                          <span className="text-gray-400 text-sm font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{order.restaurantId?.name}</h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-primary">₹{order.totalAmount}</span>
                        <span className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border ${order.orderStatus === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          order.orderStatus === 'preparing' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            order.orderStatus === 'ready' ? 'bg-green-50 border-green-200 text-green-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'
                          }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 relative z-10">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center mb-2 last:mb-0 text-sm md:text-base font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.quantity}x</span>
                            {item.foodId?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
                    <p className="text-gray-400 font-bold text-xl">No active orders found.</p>
                    <button onClick={() => setActiveTab('browse')} className="mt-4 text-primary font-bold hover:underline">Start Ordering</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-white/20 relative">
            <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <span className="text-xl font-bold">✕</span>
            </button>

            <h3 className="text-3xl font-black text-gray-900 mb-2">Checkout</h3>
            <p className="text-gray-500 font-bold mb-8">Complete your delicious order</p>

            <div className="bg-orange-50 rounded-2xl p-8 mb-8 border border-orange-100">
              <div className="flex justify-between items-end">
                <span className="text-gray-600 font-bold">Total Payable</span>
                <span className="text-4xl font-black text-primary">₹{(calculateTotal() * 1.05).toFixed(0)}</span>
              </div>
            </div>

            <div className="space-y-4">
              {['UPI', 'Card', 'COD'].map((method) => (
                <button
                  key={method}
                  onClick={() => checkout(method)}
                  disabled={checkoutLoading}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary text-gray-900 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-between px-6 group disabled:opacity-50"
                >
                  <span>{method === 'COD' ? 'Cash on Delivery' : `Pay via ${method}`}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
          <button onClick={() => setShowRating(false)} className="absolute top-10 right-10 text-white font-bold text-xl">CLOSE</button>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Enjoyed your meal?</h3>
            <p className="text-gray-500 font-bold mb-8">Rate your experience</p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`text-5xl transition-transform hover:scale-110 ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you liked..."
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium mb-6 resize-none h-32"
            />

            <button
              onClick={submitRating}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-red-200"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
