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
  const [ratingOrderId, setRatingOrderId] = useState('');
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

      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain" />
              <h1 className="text-3xl font-bold text-primary italic">TOMATO</h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => { setActiveTab('browse'); setSelectedRestaurant(null); }}
                className={`font-semibold transition ${activeTab === 'browse' ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary'}`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`font-semibold transition ${activeTab === 'orders' ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary'}`}
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
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
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
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-0 flex items-center gap-3">
                    {item.type === 'dish' ? (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          🍽️
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Search for dish: "{item.name}"</div>
                          <div className="text-sm text-gray-600">Find restaurants serving this dish</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-full border-2 border-primary" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.cuisineType?.join(', ') || 'Multi-Cuisine'}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <span className="text-gray-700">Welcome, <span className="font-semibold text-gray-900">{name}</span></span>
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <>
          {activeTab === 'browse' && !selectedRestaurant && (
            <div className="flex gap-8">
              {/* Left Sidebar - Featured Dishes */}
              <div className="w-32 flex-shrink-0 space-y-6 h-fit sticky top-28">
                {featuredDishes.map((dish: any) => (
                  <div key={dish._id} className="relative h-32 cursor-pointer group overflow-hidden rounded-r-3xl shadow-2xl transition-all duration-300 hover:w-40 bg-gradient-to-r from-red-600 to-red-500">
                    {dish.images && dish.images.length > 0 ? (
                      <img src={dish.images[0]} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <span className="font-bold text-sm text-center px-2 line-clamp-2">{dish.name}</span>
                      <span className="text-xs mt-1 font-semibold">₹{dish.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Content - Restaurants */}
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-gray-800 mb-8">Restaurants near you</h2>
                {loading ? (
                  <div className="space-y-8">
                    {[1, 2].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
                    {restaurants.map((r: any) => (
                      <div
                        key={r._id}
                        className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-gray-100 w-full"
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
                            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                              <span className="text-8xl font-bold text-primary">{r.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg flex items-center gap-1">
                            <span>★</span>
                            <span>{r.rating?.toFixed(1) || '3.0'}</span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{r.name}</h3>
                          <p className="text-gray-600 text-base mb-4">{r.cuisineType?.join(', ') || 'Multi-Cuisine'}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-gray-500 text-sm">{r.totalReviews || 0} reviews</span>
                            <span className="text-primary font-bold">View Menu →</span>
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
                className="mb-6 text-gray-700 hover:text-primary font-semibold flex items-center gap-2 transition"
              >
                ← Back to Restaurants
              </button>

              <div className="bg-white rounded-2xl shadow-2xl p-10 mb-8 border-2 border-primary/20">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      {selectedRestaurant.imageUrl ? (
                        <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-24 h-24 object-cover rounded-full border-4 border-primary shadow-lg" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-primary">
                          {selectedRestaurant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h1 className="text-5xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
                        <p className="text-gray-700 text-xl mt-2">{selectedRestaurant.description || 'Delicious food awaits you'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">Address:</span>
                        <span className="text-lg">{selectedRestaurant.address || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">Phone:</span>
                        <span className="text-lg">{selectedRestaurant.phone || 'Contact not available'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">Owner:</span>
                        <span className="text-lg">{selectedRestaurant.ownerId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-lg">Hours:</span>
                        <span className="text-lg">{selectedRestaurant.openingTime} - {selectedRestaurant.closingTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right bg-gradient-to-br from-green-500 to-green-600 text-white px-8 py-6 rounded-2xl shadow-xl">
                    <div className="text-5xl font-bold mb-2">{selectedRestaurant.rating?.toFixed(1) || '3.0'}</div>
                    <div className="text-base opacity-90 font-semibold">{selectedRestaurant.totalReviews || 0} reviews</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-4xl font-bold text-gray-900 mb-6">Menu</h3>
                  <div className="space-y-6">
                    {menu.map((item: any) => (
                      <div key={item._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-100">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-64 h-64 flex-shrink-0">
                            <DishCarousel images={item.images || []} alt={item.name} />
                          </div>
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                              <h4 className="text-2xl font-bold text-gray-900 mb-3">{item.name}</h4>
                              <p className="text-gray-700 text-base mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                              {item.category && (
                                <span className="inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold mb-3">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                              <div>
                                {item.discount > 0 ? (
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold text-primary">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                                    <span className="text-lg text-gray-400 line-through">₹{item.price}</span>
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">{item.discount}% OFF</span>
                                  </div>
                                ) : (
                                  <span className="text-3xl font-bold text-gray-900">₹{item.price}</span>
                                )}
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!item.availability}
                                className={`w-28 py-2 rounded-xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 ${item.availability
                                  ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg transform active:scale-95'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  }`}
                              >
                                {item.availability ? (
                                  <>
                                    <ShoppingCart size={14} />
                                    <span>ADD</span>
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
                  <div className="bg-white rounded-2xl shadow-2xl p-8 sticky top-28 border-2 border-primary/20">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h3>
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                          {cart.map((item: any) => (
                            <div key={item.foodId} className="border-b-2 border-gray-200 pb-4">
                              <p className="font-bold text-gray-900 text-lg mb-2">{item.name}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => updateQuantity(item.foodId, -1)}
                                    className="w-9 h-9 bg-gray-200 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center font-bold text-gray-800 transition shadow-md"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-gray-900 text-lg">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.foodId, 1)}
                                    className="w-9 h-9 bg-gray-200 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center font-bold text-gray-800 transition shadow-md"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="font-bold text-primary text-xl">
                                  ₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t-2 border-primary/30 pt-6 mb-4">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-xl font-bold text-gray-900">Total:</span>
                            <span className="text-3xl font-bold text-primary">₹{calculateTotal().toFixed(0)}</span>
                          </div>
                          <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105"
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
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Active Orders</h2>
              <div className="space-y-4">
                {orders.filter((order: any) => order.orderStatus !== 'completed').map((order: any) => (
                  <div key={order._id} className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 mb-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">Order #{order._id.slice(-6)}</p>
                        <p className="text-gray-700 text-lg">{order.restaurantId?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary mb-2">₹{order.totalAmount}</p>
                        <span className={`inline-block px-4 py-2 rounded-xl text-base font-bold ${order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.orderStatus === 'ready' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4">
                      <h4 className="font-bold text-gray-900 text-lg mb-3">Items:</h4>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-gray-700 text-base mb-1">• {item.foodId?.name} × {item.quantity}</p>
                      ))}
                    </div>
                    <p className="text-gray-600 text-base mt-4">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {orders.filter((order: any) => order.orderStatus !== 'completed').length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-xl">No active orders</p>
                  </div>
                )}
              </div>
            </div>
          )}


        </>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-primary/20">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Payment Summary</h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              {(() => {
                const baseAmount = calculateTotal();
                const gstAmount = Math.round(baseAmount * 0.01);
                const platformFeeAmount = Math.round(baseAmount * 0.01);
                const finalTotal = baseAmount + gstAmount + platformFeeAmount;
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Base Amount:</span>
                      <span className="font-bold">₹{baseAmount.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">GST (1%):</span>
                      <span className="font-bold">₹{gstAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Platform Fee (1%):</span>
                      <span className="font-bold">₹{platformFeeAmount}</span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-900">Total Amount:</span>
                      <span className="font-bold text-primary">₹{finalTotal}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-6">Choose Payment Method</h4>
            <div className="space-y-4">
              <button
                onClick={() => checkout('UPI')}
                disabled={checkoutLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Pay with UPI'}
              </button>
              <button
                onClick={() => checkout('Card')}
                disabled={checkoutLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Pay with Card'}
              </button>
              <button
                onClick={() => checkout('COD')}
                disabled={checkoutLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Cash on Delivery'}
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-5 rounded-xl font-bold text-lg transition border-2 border-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-primary/20">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Rate Your Experience</h3>
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`text-6xl transition ${star <= ratingValue ? 'text-green-400' : 'text-gray-300'
                    } hover:text-green-400`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center text-2xl font-bold text-gray-800 mb-6">{ratingValue} out of 5</p>
            <div className="mb-6">
              <label className="block text-gray-800 font-bold mb-2">Write a Review (Optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none h-32 resize-none"
              />
            </div>
            <div className="space-y-4">
              <button
                onClick={submitRating}
                className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105"
              >
                Submit Rating
              </button>
              <button
                onClick={() => { setShowRating(false); setReviewText(''); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-5 rounded-xl font-bold text-lg transition border-2 border-gray-300"
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
