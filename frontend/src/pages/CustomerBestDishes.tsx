import { useState, useEffect } from 'react';
import api from '../utils/api';
import DishCarousel from '../components/DishCarousel';
import SkeletonCard from '../components/SkeletonCard';
import { TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerGreatDeals = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'discount' | 'price' | 'rating'>('discount');

  useEffect(() => {
    loadGreatDeals();
  }, [sortBy]);

  const loadGreatDeals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/customer/great-deals?sort=${sortBy}`);
      setDishes(data);
    } catch (error) {
      console.error('Error loading great deals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 animate-fade-in font-display">
      <div className="mb-16">
        <div className="flex flex-col md:flex-row items-end justify-between gap-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                <Zap size={40} />
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-none">
                Flash Deals
              </h1>
            </div>
            <p className="text-2xl text-gray-500 font-medium leading-relaxed italic pr-10">
              Unlock world-class discounts on your favorite cuisines. Authentic taste, premium savings.
            </p>
          </div>

          <div className="flex glass p-2 rounded-3xl border-white/60 shadow-xl">
            <button
              onClick={() => setSortBy('discount')}
              className={`px-8 py-4 rounded-[1.2rem] font-black text-sm uppercase tracking-widest transition-all duration-500 ${sortBy === 'discount'
                ? 'bg-gray-950 text-white shadow-2xl'
                : 'text-gray-400 hover:text-primary'
                }`}
            >
              Max Saver
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-8 py-4 rounded-[1.2rem] font-black text-sm uppercase tracking-widest transition-all duration-500 ${sortBy === 'price'
                ? 'bg-gray-950 text-white shadow-2xl'
                : 'text-gray-400 hover:text-primary'
                }`}
            >
              Low Cost
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-8 py-4 rounded-[1.2rem] font-black text-sm uppercase tracking-widest transition-all duration-500 ${sortBy === 'rating'
                ? 'bg-gray-950 text-white shadow-2xl'
                : 'text-gray-400 hover:text-primary'
                }`}
            >
              Popular
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
          {dishes.map((dish: any) => (
            <div
              key={dish._id}
              className="group relative glass-card rounded-[3.5rem] overflow-hidden hover:shadow-[0_45px_90px_rgba(226,55,68,0.12)] transition-all duration-700 cursor-pointer transform hover:-translate-y-4 border-white/60"
              onClick={() => navigate('/customer/home', { state: { selectedRestaurant: dish.restaurantId } })}
            >
              {/* Modern Discount Badge */}
              {dish.discount > 0 && (
                <div className="absolute top-8 left-8 z-20">
                  <div className="bg-primary text-white px-6 py-2.5 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-2 transform rotate-[-8deg] group-hover:rotate-0 transition-transform">
                    <TrendingUp size={20} />
                    <span>{dish.discount}% OFF</span>
                  </div>
                </div>
              )}

              <div className="h-80 relative overflow-hidden">
                <DishCarousel images={dish.images || []} alt={dish.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-8 right-8">
                  <div className="glass px-5 py-2.5 rounded-2xl text-white font-black flex items-center gap-2 shadow-2xl border-white/20">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-lg">{dish.restaurantId?.rating?.toFixed(1) || '4.2'}</span>
                  </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10">
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-3 drop-shadow-2xl">{dish.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {dish.category || 'Specialty'}
                    </span>
                    <span className="text-white/60 font-bold text-sm">•</span>
                    <span className="text-white/80 font-bold text-sm">{dish.restaurantId?.name || 'Restaurant'}</span>
                  </div>
                </div>
              </div>

              <div className="p-10 pt-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pricing Strategy</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-gray-950 tracking-tighter">₹{(dish.price * (1 - dish.discount / 100)).toFixed(0)}</span>
                      <span className="text-lg text-gray-300 font-bold line-through">₹{dish.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</span>
                    <span className="font-black text-primary animate-pulse">Hot Deal</span>
                  </div>
                </div>
                <button className="w-full py-5 bg-gray-950 text-white rounded-[1.8rem] font-black text-lg group-hover:bg-primary transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 group/btn relative overflow-hidden">
                  <span className="relative z-10">Order This Plate</span>
                  <ChevronRight size={22} className="relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dishes.length === 0 && !loading && (
        <div className="text-center py-32 glass rounded-[5rem] border-white shadow-inner animate-fade-in mt-12">
          <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
            <Zap size={64} className="text-gray-200" />
          </div>
          <h3 className="text-4xl font-black text-gray-400 tracking-tighter mb-4">
            No Deals Found
          </h3>
          <p className="text-gray-300 font-bold uppercase tracking-[0.2em] text-xs">
            The flash deals have ended. Check back soon for more.
          </p>
          <button
            onClick={() => navigate('/customer/home')}
            className="mt-12 px-12 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
          >
            Explore Home
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerGreatDeals;
