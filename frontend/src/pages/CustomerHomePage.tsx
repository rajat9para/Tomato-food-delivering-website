import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import DishCarousel from '../components/DishCarousel';
import SkeletonCard from '../components/SkeletonCard';
import { Star, ShoppingCart, Search, MessageCircle } from 'lucide-react';

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addToCart, updateQuantity, clearCart, getTotal, getItemsByRestaurant } = useCart();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [dishResults, setDishResults] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating'>('rating');
  const [showDishSearch, setShowDishSearch] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Rating States for Vertical Banner





  useEffect(() => {
    loadRestaurants();
    loadFeaturedDishes();


    // Check if navigating from Best Restaurants with a selected restaurant
    if (location.state?.selectedRestaurant) {
      selectRestaurant(location.state.selectedRestaurant);
      // Clear the state to prevent re-selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    if (showReviews) {
      loadReviews(showReviews._id);
    }
  }, [showReviews]);

  const loadReviews = async (restaurantId: string) => {
    try {
      setReviewsLoading(true);
      const { data } = await api.get(`/customer/restaurants/${restaurantId}/reviews`);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };


  useEffect(() => {
    const searchItems = async () => {
      if (searchQuery.trim().length > 0) {
        // Search restaurants
        const filteredRestaurants = restaurants.filter((r: any) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Search dishes
        try {
          const { data: dishResults } = await api.get('/customer/search-dishes', {
            params: { q: searchQuery, sort: sortBy }
          });
          setDishResults(dishResults);
        } catch (error) {
          console.error('Error searching dishes:', error);
          setDishResults([]);
        }

        setSearchSuggestions(filteredRestaurants.slice(0, 5));
        setShowSuggestions(true);
        setShowDishSearch(true);
      } else {
        setSearchSuggestions([]);
        setDishResults([]);
        setShowSuggestions(false);
        setShowDishSearch(false);
      }
    };

    const debounce = setTimeout(searchItems, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, restaurants, sortBy]);

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
    loadMenu(restaurant._id);
  };

  /* State for profile check */
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleCheckoutClick = async () => {
    setCheckoutLoading(true);
    try {
      const profileResponse = await api.get('/customer/profile');
      const user = profileResponse.data;
      setUserInfo(user);

      if (!user.name || !user.phone || !user.address) {
        if (confirm('Please complete your profile (Name, Phone, Address) before placing an order. Go to Profile?')) {
          navigate('/customer/profile');
        }
        setShowCheckout(false);
        return;
      }
      setShowCheckout(true);
    } catch (error) {
      console.error("Error fetching profile", error);
      alert("Failed to verify profile. Please check your connection.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const checkout = async (paymentMethod: string) => {
    if (!userInfo) return;

    console.log('🚀 STARTING CHECKOUT PROCESS');
    console.log('💳 Payment method:', paymentMethod);

    try {
      setCheckoutLoading(true);

      // Get items grouped by restaurant
      const itemsByRestaurant = getItemsByRestaurant();

      if (Object.keys(itemsByRestaurant).length === 0) {
        alert('Your cart is empty');
        return;
      }

      // Create separate orders for each restaurant
      const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantId, restaurantItems]) => {
        // Calculate total with discounts applied
        const totalAmount = restaurantItems.reduce((sum, item) => {
          const discountedPrice = item.price * (1 - item.discount / 100);
          return sum + discountedPrice * item.quantity;
        }, 0);

        // Prepare order items
        const orderItems = restaurantItems.map(item => ({
          foodId: item.foodId,
          quantity: item.quantity,
          price: item.price
        }));

        const orderData = {
          restaurantId,
          items: orderItems,
          totalAmount: Math.round(totalAmount * 100) / 100,
          paymentMethod,
          deliveryAddress: {
            name: userInfo.name,
            phone: userInfo.phone,
            address: userInfo.address
          }
        };

        return api.post('/customer/orders', orderData);
      });

      await Promise.all(orderPromises);

      // Clear cart and state BEFORE navigation
      clearCart();
      setSelectedRestaurant(null);
      setShowCheckout(false);

      // Success message
      alert('Order placed successfully!');
      navigate('/customer/orders');

    } catch (error: any) {
      console.error('💥 CHECKOUT ERROR:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order.';
      alert(`Checkout failed: ${errorMessage}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!selectedRestaurant) {
    return (
      <div className="p-8">

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-primary focus:outline-none transition text-lg shadow-lg"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-50">
                {searchSuggestions.map((restaurant: any) => (
                  <div
                    key={restaurant._id}
                    onClick={() => {
                      selectRestaurant(restaurant);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-0 flex items-center gap-4">
                    {restaurant.imageUrl ? (
                      <img src={restaurant.imageUrl} alt={restaurant.name} className="w-14 h-14 object-cover rounded-full border-2 border-primary" />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{restaurant.name}</div>
                      <div className="text-sm text-gray-600">{restaurant.cuisineType?.join(', ') || 'Multi-Cuisine'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dish Search Results */}
        {showDishSearch && dishResults.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900">Dish Search Results</h2>
              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'rating')}
                  className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dishResults.map((dish: any) => (
                <div
                  key={dish._id}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-gray-100"
                  onClick={() => selectRestaurant(dish.restaurantId)}
                >
                  <div className="h-48 relative overflow-hidden">
                    {dish.images && dish.images.length > 0 ? (
                      <img
                        src={dish.images[0]}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{dish.name}</h3>
                    <p className="text-gray-600 text-base mb-3">{dish.restaurantId?.name}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="text-yellow-500" size={16} />
                      <span className="font-bold text-gray-800">{dish.restaurantId?.rating?.toFixed(1) || '3.0'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-2xl font-bold text-primary">₹{dish.price}</span>
                      <span className="text-primary font-bold text-lg">View Restaurant →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Featured Dishes */}
        {!showDishSearch && (
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Featured Dishes</h2>
            <div className="flex justify-center gap-6 flex-wrap">
              {featuredDishes.map((dish: any) => (
                <div
                  key={dish._id}
                  className="cursor-pointer group transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/customer/best-restaurants', { state: { dishName: dish.name } })}
                >
                  <div className="h-40 w-32 overflow-hidden rounded-2xl shadow-xl bg-white border-2 border-gray-200">
                    {dish.images && dish.images.length > 0 ? (
                      <img src={dish.images[0]} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="font-bold text-gray-900 text-sm">{dish.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restaurants */}
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Restaurants near you</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((r: any) => (
              <div
                key={r._id}
                className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-gray-100"
                onClick={() => selectRestaurant(r)}
              >
                <div className="h-64 relative overflow-hidden">
                  {r.coverImage ? (
                    <img
                      src={r.coverImage}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary">{r.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg flex items-center gap-1">
                    <Star size={16} />
                    <span>{r.rating?.toFixed(1) || '3.0'}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{r.name}</h3>
                  <p className="text-gray-600 text-base mb-4">{r.cuisineType?.join(', ') || 'Multi-Cuisine'}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReviews(r);
                      }}
                      className="text-gray-500 hover:text-primary text-sm flex items-center gap-1 transition"
                    >
                      <MessageCircle size={14} />
                      {r.totalReviews || 0} reviews
                    </button>
                    <span className="text-primary font-bold text-lg">View Menu →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Golden Vertical Style Rating Banner */}


      <button
        onClick={() => setSelectedRestaurant(null)}
        className="mb-8 text-gray-700 hover:text-primary font-bold flex items-center gap-2 transition text-lg"
      >
        ← Back to Restaurants
      </button>

      <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 border-2 border-primary/20">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-6">
              {selectedRestaurant.imageUrl ? (
                <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-28 h-28 object-cover rounded-full border-4 border-primary shadow-lg" />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg border-4 border-primary">
                  {selectedRestaurant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-6xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
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
          <div className="text-right bg-gradient-to-br from-green-500 to-green-600 text-white px-10 py-8 rounded-2xl shadow-xl">
            <div className="text-6xl font-bold mb-2">{selectedRestaurant.rating?.toFixed(1) || '3.0'}</div>
            <button
              onClick={() => setShowReviews(selectedRestaurant)}
              className="text-base opacity-90 hover:opacity-100 font-semibold underline transition"
            >
              {selectedRestaurant.totalReviews || 0} reviews
            </button>
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
                  <div className="w-full md:w-80 h-72 flex-shrink-0">
                    <DishCarousel images={item.images || []} alt={item.name} />
                  </div>
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <h4 className="text-3xl font-bold text-gray-900 mb-3">{item.name}</h4>
                      <p className="text-gray-700 text-lg mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                      {item.category && (
                        <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold mb-3">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <div>
                        {item.discount > 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold text-primary">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                            <span className="text-lg text-gray-400 line-through">₹{item.price}</span>
                            <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">{item.discount}% OFF</span>
                          </div>
                        ) : (
                          <span className="text-4xl font-bold text-gray-900">₹{item.price}</span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(item, selectedRestaurant)}
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 sticky top-8 border-2 border-primary/20">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h3>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {Object.entries(getItemsByRestaurant()).map(([restaurantId, restaurantItems]) => (
                    <div key={restaurantId} className="border-2 border-gray-100 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-primary text-lg mb-3 border-b border-gray-200 pb-2">
                        {restaurantItems[0]?.restaurantName || 'Restaurant'}
                      </h4>
                      <div className="space-y-3">
                        {restaurantItems.map((item: any) => (
                          <div key={item.foodId} className="border-b border-gray-100 pb-3 last:border-0">
                            <p className="font-bold text-gray-900 mb-2">{item.name}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateQuantity(item.foodId, -1)}
                                  className="w-9 h-9 bg-gray-200 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center font-bold text-gray-800 transition shadow-md"
                                >
                                  -
                                </button>
                                <span className="font-bold text-gray-900">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.foodId, 1)}
                                  className="w-9 h-9 bg-gray-200 hover:bg-primary hover:text-white rounded-lg flex items-center justify-center font-bold text-gray-800 transition shadow-md"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-primary">
                                ₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-primary/30 pt-6 mb-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-4xl font-bold text-primary">₹{getTotal().toFixed(0)}</span>
                  </div>
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full bg-[#60b246] hover:bg-[#4ea832] text-white py-4 rounded-xl font-bold text-xl transition shadow-xl transform hover:scale-[1.02] active:scale-95"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-scale-in border border-white/40">
            {/* Header */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Payment Method</h3>
            <p className="text-gray-500 text-sm text-center mb-8">Select how you'd like to pay</p>

            <div className="space-y-3">
              {/* UPI Button */}
              <button
                onClick={() => checkout('UPI')}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-[#E23744] to-[#d62b38] text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : 'Pay with UPI'}
              </button>

              {/* Card Button */}
              <button
                onClick={() => checkout('Card')}
                disabled={checkoutLoading}
                className="w-full bg-white border-2 border-[#E23744] text-[#E23744] py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Credit / Debit Card'}
              </button>

              {/* COD Button */}
              <button
                onClick={() => checkout('COD')}
                disabled={checkoutLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Cash on Delivery'}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Reviews Modal */}
      {showReviews && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-primary/20 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-4xl font-bold text-gray-900">Reviews for {showReviews.name}</h3>
              <button
                onClick={() => setShowReviews(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {reviewsLoading ? (
                <div className="flex flex-col items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  <p className="mt-4 text-gray-500 font-bold">Loading authentic reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, i) => (
                    <div key={review._id || i} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0">
                          {review.customerPhoto ? (
                            <img src={review.customerPhoto} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                              {review.customerName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800">{review.customerName}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex text-green-500 my-1">
                            {[...Array(5)].map((_, idx) => (
                              <Star key={idx} size={14} fill={idx < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 leading-relaxed mb-4">{review.review || 'No written review provided.'}</p>

                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {review.images.map((img: string, idx: number) => (
                            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-100">
                              <img src={img} className="w-full h-full object-cover" alt="" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle size={64} className="mx-auto text-gray-200 mb-4" />
                  <h4 className="text-xl font-bold text-gray-400">No reviews yet</h4>
                  <p className="text-gray-300">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHomePage;
