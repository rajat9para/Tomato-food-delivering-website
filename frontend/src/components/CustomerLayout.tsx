import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import GlobalBackground from './GlobalBackground';
import api from '../utils/api';
import RatingBanner from './RatingBanner';
import { Star, X } from 'lucide-react';

const CustomerLayout = () => {
  const location = useLocation();
  const [reminderOrder, setReminderOrder] = useState<any>(null);
  const [showRatingReminder, setShowRatingReminder] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleCloseModal = () => {
    setShowRatingModal(false);
  };

  const handleDismissReminder = () => {
    setShowRatingReminder(false);
    if (reminderOrder) {
      localStorage.setItem(`dismissed_rating_${reminderOrder._id}`, 'true');
    }
  };

  const excludedRoutes = ['/customer/cart', '/customer/orders', '/customer/profile'];
  const shouldShowNotification = !excludedRoutes.includes(location.pathname);

  useEffect(() => {
    checkUnratedOrders();
  }, [location.pathname]);

  const checkUnratedOrders = async () => {
    try {
      const { data } = await api.get('/customer/orders');
      if (Array.isArray(data)) {
        const unrated = data.find((order: any) => {
          const isCompleted = order.orderStatus === 'completed';
          const isUnrated = !order.rating || order.rating === 0;
          const isDismissed = localStorage.getItem(`dismissed_rating_${order._id}`);
          return isCompleted && isUnrated && !isDismissed;
        });

        if (unrated) {
          setReminderOrder(unrated);
          setShowRatingReminder(true);
        } else {
          setShowRatingReminder(false);
        }
      }
    } catch (error) {
      console.error('Error fetching orders for notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-display selection:bg-primary/10">
      <CustomerSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-80 min-h-screen transition-all duration-500">
        <GlobalBackground />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-10 py-10">
          {/* Masterpiece Notification Banner */}
          {shouldShowNotification && showRatingReminder && reminderOrder && !showRatingModal && (
            <div className="mb-12 animate-slide-in-down group">
              <div className="relative glass-card p-2 rounded-[2.5rem] border-white/60 shadow-2xl overflow-hidden hover:shadow-primary/20 transition-all duration-700">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-400/10 via-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/30 group-hover:rotate-12 transition-all duration-500">
                      <Star size={32} className="text-white fill-white shadow-lg" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-950 tracking-tighter leading-none mb-1">
                        How was the taste?
                      </h3>
                      <p className="text-gray-500 font-bold text-sm">
                        Sharing your thoughts on <span className="text-primary">{reminderOrder.restaurantId?.name}</span> helps others!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="px-10 py-4 bg-gray-950 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-primary transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                    >
                      Rate My Order
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Star size={18} fill="currentColor" />
                      </div>
                    </button>
                    <button
                      onClick={handleDismissReminder}
                      className="w-14 h-14 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:text-red-500 hover:border-red-100 transition-all shadow-lg"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rating Modal Integration */}
          {showRatingModal && reminderOrder && (
            <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
              <div className="w-full max-w-2xl transform scale-in animate-scale-in">
                <RatingBanner
                  order={reminderOrder}
                  onClose={handleCloseModal}
                  onSuccess={() => {
                    setShowRatingModal(false);
                    handleDismissReminder();
                  }}
                />
              </div>
            </div>
          )}

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
