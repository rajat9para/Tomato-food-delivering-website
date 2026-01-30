import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import DishCarousel from '../components/DishCarousel';
import SkeletonCard from '../components/SkeletonCard';
import { Star, ShoppingCart, Search, MessageCircle, X, ChevronRight, Shield } from 'lucide-react';
import { getImageUrl } from '../utils/formatters';

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

  useEffect(() => {
    loadRestaurants();
    loadFeaturedDishes();

    if (location.state?.selectedRestaurant) {
      selectRestaurant(location.state.selectedRestaurant);
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
        const filteredRestaurants = restaurants.filter((r: any) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
    } finally {
      setCheckoutLoading(false);
    }
  };

  const checkout = async (paymentMethod: string) => {
    if (!userInfo) return;
    try {
      setCheckoutLoading(true);
      const itemsByRestaurant = getItemsByRestaurant();
      if (Object.keys(itemsByRestaurant).length === 0) {
        alert('Your cart is empty');
        return;
      }

      const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantId, restaurantItems]) => {
        const totalAmount = restaurantItems.reduce((sum, item) => {
          const discountedPrice = item.price * (1 - item.discount / 100);
          return sum + discountedPrice * item.quantity;
        }, 0);

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
      clearCart();
      setSelectedRestaurant(null);
      setShowCheckout(false);
      navigate('/customer/orders');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to place order.';
      alert(`Checkout failed: ${errorMessage}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!selectedRestaurant) {
    return (
      <div className="pb-20 animate-fade-in font-display">
        {/* Search Bar - Modern Floating Style */}
        <div className="mb-12 sticky top-4 z-[90]">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <div className="relative glass rounded-[2.5rem] px-8 py-4 shadow-2xl border-white/60 group-focus-within:border-primary/30 transition-all duration-300">
              <input
                type="text"
                placeholder="Craving something specific? Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-transparent border-none focus:outline-none text-xl font-medium text-gray-900 placeholder:text-gray-400"
              />
              <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-primary drop-shadow-md" size={28} />
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 glass-card rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] max-h-80 overflow-y-auto z-[100] border-white/80 animate-scale-in">
                {searchSuggestions.map((restaurant: any) => (
                  <div
                    key={restaurant._id}
                    onClick={() => selectRestaurant(restaurant)}
                    className="px-8 py-5 hover:bg-primary/5 cursor-pointer transition-all flex items-center gap-5 border-b border-gray-100/50 last:border-0 group"
                  >
                    <div className="w-14 h-14 overflow-hidden rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                      {restaurant.imageUrl ? (
                        <img src={restaurant.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary text-white flex items-center justify-center text-xl font-black">{restaurant.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{restaurant.name}</div>
                      <div className="text-sm text-gray-500 font-medium">{restaurant.cuisineType?.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dish Search Results */}
        {showDishSearch && dishResults.length > 0 && (
          <div className="mb-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Dish Results</h2>
                <p className="text-gray-500 font-medium mt-1">Found the best matches for your craving</p>
              </div>
              <div className="glass px-6 py-2 rounded-2xl flex items-center gap-3">
                <span className="text-sm font-bold text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'rating')}
                  className="bg-transparent border-none focus:outline-none font-black text-primary text-sm cursor-pointer"
                >
                  <option value="rating">Best Rated</option>
                  <option value="price">Lowest Price</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dishResults.map((dish: any) => (
                <div
                  key={dish._id}
                  className="group glass-card rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-3 border-white/60 relative"
                  onClick={() => selectRestaurant(dish.restaurantId)}
                >
                  <div className="h-56 relative overflow-hidden">
                    {dish.images?.[0] ? (
                      <img src={dish.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-5xl font-black text-primary opacity-20">{dish.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-black uppercase tracking-widest border border-white/20">
                        {dish.restaurantId?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{dish.name}</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-lg text-sm font-black">
                        <Star size={14} fill="currentColor" />
                        <span>{dish.restaurantId?.rating?.toFixed(1) || '4.0'}</span>
                      </div>
                      <span className="text-gray-400 font-bold text-sm">•</span>
                      <span className="text-gray-500 font-bold text-sm">30-35 mins</span>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100/50">
                      <span className="text-3xl font-black text-gray-900">₹{dish.price}</span>
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Circles - Inspiration from Zomato/Swiggy */}
        {!showDishSearch && (
          <div className="mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-10 tracking-tighter">In the limelight</h2>
            <div className="flex items-center gap-10 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
              {featuredDishes.map((dish: any) => (
                <div
                  key={dish._id}
                  className="flex-shrink-0 cursor-pointer group"
                  onClick={() => navigate('/customer/best-restaurants', { state: { dishName: dish.name } })}
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full p-1 bg-gradient-to-tr from-primary to-orange-400 group-hover:rotate-12 transition-all duration-500 shadow-xl group-hover:shadow-primary/30">
                    <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white">
                      {dish.images?.[0] ? (
                        <img src={getImageUrl(dish.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-black">{dish.name.charAt(0)}</div>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-center font-black text-gray-800 tracking-tight group-hover:text-primary transition-colors">{dish.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Restaurants Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Best Restaurants</h2>
            <p className="text-gray-500 font-medium mt-2">Curated selection of premium eats around you</p>
          </div>
          <button
            onClick={() => navigate('/customer/best-restaurants')}
            className="px-6 py-3 bg-white border-2 border-gray-100 text-primary font-black rounded-2xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm flex items-center gap-2"
          >
            View All <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {restaurants.map((r: any) => (
              <div
                key={r._id}
                className="group relative glass-card rounded-[3rem] overflow-hidden hover:shadow-[0_40px_80px_rgba(226,55,68,0.12)] transition-all duration-700 cursor-pointer transform hover:-translate-y-4 border-white/60"
                onClick={() => selectRestaurant(r)}
              >
                <div className="h-72 relative overflow-hidden">
                  {r.coverImage ? (
                    <img src={getImageUrl(r.coverImage)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-orange-50 flex items-center justify-center">
                      <img src="/tomato-logo.png" alt="" className="w-24 h-24 opacity-10 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  <div className="absolute top-6 right-6">
                    <div className="glass px-4 py-2 rounded-2xl text-white font-black flex items-center gap-2 shadow-2xl border-white/20">
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                      <span>{r.rating?.toFixed(1) || '4.2'}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 drop-shadow-lg">{r.name}</h3>
                    <p className="text-white/80 font-bold text-sm line-clamp-1">{r.cuisineType?.join(', ') || 'Global, Modern'}</p>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Timing</span>
                      <span className="text-sm font-black text-gray-900">{r.openingTime} - {r.closingTime}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Rating</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-lg text-sm font-black">
                        <MessageCircle size={14} fill="currentColor" />
                        <span>{r.totalReviews || 0}</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-gray-950 text-white rounded-[1.5rem] font-black text-lg group-hover:bg-primary transition-all duration-300 shadow-2xl flex items-center justify-center gap-3">
                    Explore Menu <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Selected Restaurant View
  return (
    <div className="pb-20 animate-fade-in font-display">
      <button
        onClick={() => setSelectedRestaurant(null)}
        className="mb-10 group px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-500 hover:text-primary hover:border-primary/20 transition-all duration-300 font-black flex items-center gap-3 shadow-sm"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Discovery
      </button>

      {/* Restaurant Hero Section */}
      <div className="relative glass-card rounded-[4rem] p-12 mb-16 border-white/80 shadow-3xl overflow-hidden group">
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-primary font-black opacity-[0.03] rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-40 h-40 relative rounded-[2.5rem] p-1 bg-gradient-to-br from-primary to-orange-400 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
              <div className="w-full h-full rounded-[2.2rem] bg-white border-4 border-white overflow-hidden shadow-inner">
                {selectedRestaurant.imageUrl ? (
                  <img src={selectedRestaurant.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-5xl font-black text-white">{selectedRestaurant.name.charAt(0)}</div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-none mb-4">{selectedRestaurant.name}</h1>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                <span className="px-5 py-2 glass-dark rounded-full text-white text-sm font-black shadow-lg">
                  {selectedRestaurant.cuisineType?.join(', ') || 'Gourmet'}
                </span>
                <span className="px-5 py-2 glass rounded-full text-primary text-sm font-black border-primary/20 shadow-lg">
                  {selectedRestaurant.openingTime} - {selectedRestaurant.closingTime}
                </span>
                <div className="px-5 py-2 bg-green-500 rounded-full text-white text-sm font-black shadow-lg flex items-center gap-2">
                  <Star size={16} fill="currentColor" />
                  <span>{selectedRestaurant.rating?.toFixed(1) || '4.5'}</span>
                </div>
              </div>
              <p className="max-w-xl text-xl text-gray-500 font-medium leading-relaxed italic">
                "{selectedRestaurant.description || 'Elevating your taste experience with authentic global flavors, prepared with passion and delivered fresh.'}"
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-6">
            <div className="text-right">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Based on</div>
              <div className="text-5xl font-black text-gray-900 leading-none">{selectedRestaurant.totalReviews || 12}</div>
              <div className="text-sm font-black text-primary mt-1 underline cursor-pointer" onClick={() => setShowReviews(selectedRestaurant)}>Verified Reviews</div>
            </div>
            <button className="px-8 py-4 bg-gray-950 text-white rounded-2xl font-black shadow-2xl hover:bg-primary transition-all duration-300 active:scale-95">
              Contact Kitchen
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">Chef's Menu</h3>
            <div className="flex gap-3">
              <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-primary shadow-lg border-primary/10 transition-all hover:bg-primary hover:text-white"><Search size={20} /></button>
            </div>
          </div>
          <div className="space-y-10">
            {menu.map((item: any) => (
              <div key={item._id} className="group glass-card rounded-[3rem] overflow-hidden hover:shadow-2xl transition-all duration-500 border-white/60">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-80 h-72 flex-shrink-0 relative overflow-hidden">
                    <DishCarousel images={item.images || []} alt={item.name} />
                    <div className="absolute top-6 left-6">
                      {item.discount > 0 && (
                        <div className="bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg animate-pulse">
                          {item.discount}% SAVING
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 p-10 flex flex-col justify-between relative">
                    <div className="absolute top-10 right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <img src="/tomato-logo.png" alt="" className="w-24 h-24 rotate-12" />
                    </div>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-3xl font-black text-gray-950 mb-1 tracking-tight group-hover:text-primary transition-colors">{item.name}</h4>
                          <span className="text-xs font-black uppercase text-primary/60 tracking-widest">{item.category || 'Specialty'}</span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-lg font-medium leading-relaxed line-clamp-2 pr-10">{item.description}</p>
                    </div>

                    <div className="flex items-end justify-between mt-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Culinarian Price</span>
                        {item.discount > 0 ? (
                          <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-gray-950 tracking-tighter">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                            <span className="text-lg text-gray-300 font-bold line-through">₹{item.price}</span>
                          </div>
                        ) : (
                          <span className="text-4xl font-black text-gray-950 tracking-tighter">₹{item.price}</span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(item, selectedRestaurant)}
                        disabled={!item.availability}
                        className={`group/btn relative px-10 py-4 rounded-2xl font-black transition-all duration-300 overflow-hidden shadow-xl ${item.availability
                          ? 'bg-primary text-white hover:shadow-primary/30 hover:-translate-y-1 active:scale-95'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <div className="relative z-10 flex items-center gap-3">
                          <ShoppingCart size={20} className="group-hover/btn:rotate-12 transition-transform" />
                          <span>{item.availability ? 'Add to Plate' : 'Out of Stock'}</span>
                        </div>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Cart Sidebar */}
        <div className="relative">
          <div className="sticky top-28 glass-card rounded-[3.5rem] p-10 border-white/60 shadow-3xl group overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                Cart
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {cart.length}
                </div>
              </h3>
              {cart.length > 0 && <button onClick={clearCart} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">Clear</button>}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShoppingCart size={40} className="text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold text-lg">Your gourmet palette is empty. Start adding delicious items.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                  {Object.entries(getItemsByRestaurant()).map(([restaurantId, restaurantItems]) => (
                    <div key={restaurantId} className="group/res">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                        <h4 className="font-black text-gray-950 uppercase tracking-tighter text-sm">
                          {restaurantItems[0]?.restaurantName || 'Restaurant'}
                        </h4>
                      </div>
                      <div className="space-y-5">
                        {restaurantItems.map((item: any) => (
                          <div key={item.foodId} className="relative group/item">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-black text-gray-800 tracking-tight group-hover/item:text-primary transition-colors">{item.name}</p>
                              <span className="font-black text-gray-900">₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-gray-50 rounded-xl p-1 shadow-inner group-hover/item:bg-white border border-transparent group-hover/item:border-gray-100 transition-all">
                                <button
                                  onClick={() => updateQuantity(item.foodId, -1)}
                                  className="w-8 h-8 flex items-center justify-center font-black text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.foodId, 1)}
                                  className="w-8 h-8 flex items-center justify-center font-black text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">₹{item.price}/ea</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t-2 border-gray-100/50 space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-xs">Total Bill</span>
                    <span className="text-5xl font-black text-primary tracking-tighter shadow-primary/10">₹{getTotal().toFixed(0)}</span>
                  </div>
                  <button
                    onClick={handleCheckoutClick}
                    disabled={checkoutLoading}
                    className="w-full relative group/checkout py-6 bg-gradient-to-r from-gray-900 to-black text-white rounded-[2rem] font-black text-xl transition-all duration-300 shadow-3xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      {checkoutLoading ? 'Preparing...' : 'Place My Order'}
                      <ChevronRight size={24} className="group-hover/checkout:translate-x-2 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover/checkout:opacity-100 transition-opacity"></div>
                  </button>
                  <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">Safe and Secure Checkout Powered by Tomato</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Glass Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-2xl flex items-center justify-center z-[200] p-6 animate-fade-in shadow-2xl">
          <div className="glass-card p-12 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] max-w-md w-full animate-scale-in border-white/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-400 to-primary"></div>

            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-10 right-10 w-10 h-10 glass rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:rotate-90 transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
                <ShoppingCart size={40} className="text-primary" />
              </div>
              <h3 className="text-4xl font-black text-gray-950 tracking-tighter mb-2">Checkout</h3>
              <p className="text-gray-500 font-medium">Almost there! Select your payment method.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => checkout('UPI')}
                disabled={checkoutLoading}
                className="w-full group relative py-5 bg-primary text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-xl shadow-red-200 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="relative z-10">Pay with Instant UPI</div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>

              <button
                onClick={() => checkout('Card')}
                disabled={checkoutLoading}
                className="w-full py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-lg transition-all duration-300 hover:border-primary hover:text-primary shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
              >
                Credit / Debit Card
              </button>

              <button
                onClick={() => checkout('COD')}
                disabled={checkoutLoading}
                className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black text-lg transition-all duration-300 hover:bg-gray-800 shadow-xl hover:-translate-y-1 active:scale-95"
              >
                Cash on Delivery
              </button>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-6 py-2 rounded-full">
                <Shield size={14} />
                <span>End-to-end Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masterpiece Reviews Modal */}
      {showReviews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-fade-in">
          <div className="glass-card p-0 rounded-[4rem] shadow-3xl max-w-3xl w-full border-white/60 max-h-[85vh] overflow-hidden flex flex-col scale-in animate-scale-in">
            <div className="p-12 pb-8 border-b border-gray-100/50 flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-black text-gray-950 tracking-tighter">Guest Reviews</h3>
                <p className="text-gray-500 font-medium mt-1">Authentic stories from fellow foodies</p>
              </div>
              <button
                onClick={() => setShowReviews(null)}
                className="w-14 h-14 glass rounded-3xl flex items-center justify-center text-gray-400 hover:text-primary hover:rotate-90 transition-all border-white shadow-xl"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 pt-8 no-scrollbar">
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-xl mb-6"></div>
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm animate-pulse">Reliving memories...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="grid gap-12">
                  {reviews.map((review, i) => (
                    <div key={review._id || i} className="group relative">
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-[1.5rem] glass p-1 shadow-xl group-hover:rotate-3 transition-all duration-500">
                          <div className="w-full h-full rounded-[1.3rem] overflow-hidden bg-white">
                            {review.customerPhoto ? (
                              <img src={review.customerPhoto} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-black text-2xl">
                                {review.customerName?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-black text-gray-900 text-xl tracking-tight leading-none">{review.customerName}</h4>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 block">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400/10 text-yellow-600 rounded-2xl text-sm font-black shadow-inner">
                              <Star size={16} fill="currentColor" />
                              <span>{review.rating}.0</span>
                            </div>
                          </div>

                          <p className="text-gray-600 font-medium leading-relaxed italic text-lg pr-4 mt-6">"{review.review || 'No written words, just pure taste satisfaction.'}"</p>

                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-4 mt-8 overflow-x-auto pb-2 no-scrollbar">
                              {review.images.map((img: string, idx: number) => (
                                <div key={idx} className="relative w-32 h-32 rounded-[2rem] overflow-hidden shadow-2xl transition-transform hover:scale-110 duration-500 border-4 border-white cursor-zoom-in">
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-6 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 glass rounded-[4rem] border-white shadow-inner">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
                    <MessageCircle size={48} className="text-gray-200" />
                  </div>
                  <h4 className="text-3xl font-black text-gray-300 tracking-tighter mb-2">No reviews yet</h4>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Be the legend who writes the first one</p>
                </div>
              )}
            </div>

            <div className="p-12 bg-gray-50/50 backdrop-blur-sm border-t border-gray-100">
              <button className="w-full py-6 bg-gray-950 text-white rounded-[2rem] font-black text-xl hover:bg-primary transition-all duration-300 shadow-2xl">
                Write Your Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHomePage;
