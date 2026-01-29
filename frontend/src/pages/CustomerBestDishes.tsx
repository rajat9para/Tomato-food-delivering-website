import { useState, useEffect } from 'react';
import api from '../utils/api';
import DishCarousel from '../components/DishCarousel';
import SkeletonCard from '../components/SkeletonCard';
import { TrendingUp, Star } from 'lucide-react';

const CustomerGreatDeals = () => {
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
    <div className="p-8">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-4">
          <TrendingUp className="text-primary" size={48} />
          Great Deals
        </h1>
        <p className="text-xl text-gray-600">Discover amazing discounts on delicious food</p>

        {/* Sort Options */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setSortBy('discount')}
            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${sortBy === 'discount'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
              }`}
          >
            Highest Discount
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${sortBy === 'price'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
              }`}
          >
            Lowest Price
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${sortBy === 'rating'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
              }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish: any) => (
            <div
              key={dish._id}
              className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-gray-100 relative"
            >
              {/* Discount Badge */}
              {dish.discount > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                    <TrendingUp size={14} />
                    {dish.discount}% OFF
                  </div>
                </div>
              )}

              {/* Rating Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-green-500 text-white px-3 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {dish.restaurantId?.rating?.toFixed(1) || '3.0'}
                </div>
              </div>

              <div className="h-64 relative overflow-hidden">
                <DishCarousel images={dish.images || []} alt={dish.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  ₹{(dish.price * (1 - dish.discount / 100)).toFixed(0)}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{dish.name}</h3>
                <p className="text-gray-600 text-base mb-2">{dish.restaurantId?.name || 'Restaurant'}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dish.description}</p>
                {dish.category && (
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold mb-3">
                    {dish.category}
                  </span>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Great Deal!</span>
                  <span className="text-primary font-bold text-lg">Order Now →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dishes.length === 0 && !loading && (
        <div className="text-center py-16">
          <TrendingUp size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Great Deals Found</h3>
          <p className="text-gray-500">Check back later for amazing discounts!</p>
        </div>
      )}
    </div>
  );
};

export default CustomerGreatDeals;
