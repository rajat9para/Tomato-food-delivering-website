import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SkeletonCard from '../components/SkeletonCard';
import { Star, TrendingUp, ChevronRight, Crown } from 'lucide-react';
import { getImageUrl } from '../utils/formatters';

const CustomerBestRestaurants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');

  const dishName = location.state?.dishName;

  useEffect(() => {
    loadBestRestaurants();
  }, []);

  useEffect(() => {
    if (dishName && restaurants.length > 0) {
      filterRestaurantsByDish();
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [restaurants, dishName, sortBy]);

  const loadBestRestaurants = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customer/best-restaurants');
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading best restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurantsByDish = async () => {
    try {
      const filtered = [];
      for (const restaurant of restaurants) {
        try {
          const { data: menu } = await api.get(`/customer/restaurants/${restaurant._id}/menu`);
          const hasDish = menu.some((item: any) =>
            item.name.toLowerCase().includes(dishName.toLowerCase())
          );
          if (hasDish) {
            filtered.push(restaurant);
          }
        } catch (error) {
          console.error(`Error loading menu for ${restaurant.name}:`, error);
        }
      }
      setFilteredRestaurants(filtered);
    } catch (error) {
      console.error('Error filtering restaurants:', error);
      setFilteredRestaurants(restaurants);
    }
  };

  return (
    <div className="pb-20 animate-fade-in font-display">
      <div className="mb-16">
        <button
          onClick={() => navigate('/customer/home')}
          className="mb-10 group px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-500 hover:text-primary hover:border-primary/20 transition-all duration-300 font-black flex items-center gap-3 shadow-sm"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Home
        </button>

        <div className="flex flex-col md:flex-row items-end justify-between gap-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                <TrendingUp size={40} />
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-none">
                {dishName ? dishName : 'Best Eats'}
              </h1>
            </div>
            <p className="text-2xl text-gray-500 font-medium leading-relaxed italic pr-10">
              {dishName
                ? `Discover the finest kitchens serving authentic ${dishName} near you.`
                : 'We curated the highest-rated dining experiences for your refined taste.'
              }
            </p>
          </div>

          <div className="flex glass p-2 rounded-3xl border-white/60 shadow-xl">
            <button
              onClick={() => setSortBy('rating')}
              className={`px-8 py-4 rounded-[1.2rem] font-black text-sm uppercase tracking-widest transition-all duration-500 ${sortBy === 'rating'
                ? 'bg-gray-950 text-white shadow-2xl'
                : 'text-gray-400 hover:text-primary'
                }`}
            >
              Top Rating
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-8 py-4 rounded-[1.2rem] font-black text-sm uppercase tracking-widest transition-all duration-500 ${sortBy === 'price'
                ? 'bg-gray-950 text-white shadow-2xl'
                : 'text-gray-400 hover:text-primary'
                }`}
            >
              Budget First
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredRestaurants.map((r: any, index: number) => (
            <div
              key={r._id}
              className="group relative glass-card rounded-[3.5rem] overflow-hidden hover:shadow-[0_45px_90px_rgba(0,0,0,0.12)] transition-all duration-700 cursor-pointer transform hover:-translate-y-4 border-white/60"
              onClick={() => navigate('/customer/home', { state: { selectedRestaurant: r } })}
            >
              {/* Premium Rank Badge */}
              {index < 3 && (
                <div className="absolute top-8 left-8 z-20">
                  <div className="bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-2 border border-white">
                    {index === 0 && <Crown size={22} className="text-yellow-500 fill-yellow-500" />}
                    {index === 1 && <Crown size={22} className="text-gray-400 fill-gray-400" />}
                    {index === 2 && <Crown size={22} className="text-orange-400 fill-orange-400" />}
                    <span className="text-gray-950 tracking-tighter">#{index + 1}</span>
                  </div>
                </div>
              )}

              <div className="h-80 relative overflow-hidden">
                {r.coverImage ? (
                  <img src={getImageUrl(r.coverImage)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/5 to-orange-50 flex items-center justify-center">
                    <img src="/tomato-logo.png" alt="" className="w-32 h-32 opacity-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-8 right-8">
                  <div className="glass px-5 py-2.5 rounded-2xl text-white font-black flex items-center gap-2 shadow-2xl border-white/20">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-lg">{r.rating?.toFixed(1) || '4.0'}</span>
                  </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10">
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-3 drop-shadow-2xl">{r.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {r.cuisineType?.[0] || 'Gourmet'}
                    </span>
                    <span className="text-white/60 font-bold text-sm">•</span>
                    <span className="text-white/80 font-bold text-sm">{r.totalReviews || 0} Reviews</span>
                  </div>
                </div>
              </div>
              <div className="p-10 pt-8">
                <div className="flex items-center justify-between mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pricing</span>
                    <span className="font-black text-gray-950">₹300 for two</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Availability</span>
                    <span className="font-black text-green-500">Live Now</span>
                  </div>
                </div>
                <button className="w-full py-5 bg-gray-950 text-white rounded-[1.8rem] font-black text-lg group-hover:bg-primary transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 group/btn relative overflow-hidden">
                  <span className="relative z-10">Experience Menu</span>
                  <ChevronRight size={22} className="relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRestaurants.length === 0 && !loading && (
        <div className="text-center py-32 glass rounded-[5rem] border-white shadow-inner animate-fade-in mt-12">
          <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
            <Star size={64} className="text-gray-200" />
          </div>
          <h3 className="text-4xl font-black text-gray-400 tracking-tighter mb-4">
            End of the road
          </h3>
          <p className="text-gray-300 font-bold uppercase tracking-[0.2em] text-xs">
            No restaurants matching your refined criteria were found.
          </p>
          <button
            onClick={() => navigate('/customer/home')}
            className="mt-12 px-12 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerBestRestaurants;
