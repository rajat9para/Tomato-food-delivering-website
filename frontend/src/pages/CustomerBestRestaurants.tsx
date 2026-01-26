import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SkeletonCard from '../components/SkeletonCard';
import { Star, TrendingUp, ArrowLeft } from 'lucide-react';

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
      // Filter restaurants that have the specific dish
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
    <div className="p-8">
      <div className="mb-8 text-center">
        {dishName && (
          <button
            onClick={() => navigate('/customer/home')}
            className="mb-4 text-gray-600 hover:text-primary flex items-center gap-2 transition"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
        )}
        <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-4">
          <TrendingUp className="text-primary" size={48} />
          {dishName ? `Restaurants with "${dishName}"` : 'Best Restaurants'}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {dishName
            ? `Find restaurants serving ${dishName} in your area`
            : 'Discover the highest-rated restaurants in your area'
          }
        </p>
        {dishName && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setSortBy('rating')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg ${sortBy === 'rating'
                  ? 'bg-primary text-white shadow-xl transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
            >
              Sort by Rating
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg ${sortBy === 'price'
                  ? 'bg-primary text-white shadow-xl transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
            >
              Sort by Price
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((r: any, index: number) => (
            <div
              key={r._id}
              className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-gray-100 relative"
              onClick={() => {
                // Navigate to home and select this restaurant
                navigate('/customer/home', { state: { selectedRestaurant: r } });
              }}
            >
              {/* Rank Badge - Only show for top 3 */}
              {index < 3 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
                    👑
                    <span>#{index + 1}</span>
                  </div>
                </div>
              )}

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
                  <span className="text-gray-500 text-sm">{r.totalReviews || 0} reviews</span>
                  <span className="text-primary font-bold text-lg">View Menu →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRestaurants.length === 0 && !loading && (
        <div className="text-center py-16">
          <Star size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">
            {dishName ? `No Restaurants Found for "${dishName}"` : 'No Restaurants Found'}
          </h3>
          <p className="text-gray-500">
            {dishName
              ? 'Try searching for a different dish or check back later.'
              : 'Check back later for the best-rated restaurants in your area.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerBestRestaurants;
