import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import api from '../utils/api';
import RatingBanner from './RatingBanner';
import { Star } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import ChatbotWidget from './ChatbotWidget';

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

  // Routes where the notification should NOT appear
  const excludedRoutes = ['/customer/cart', '/customer/orders', '/customer/profile'];
  const shouldShowNotification = !excludedRoutes.includes(location.pathname);

  useEffect(() => {
    checkUnratedOrders();
  }, []);

  useEffect(() => {
    if (reminderOrder) {
      const isDismissed = localStorage.getItem(`dismissed_rating_${reminderOrder._id}`);
      if (isDismissed) {
        setShowRatingReminder(false);
      }
    }
  }, [reminderOrder]);

  const checkUnratedOrders = async () => {
    try {
      const { data } = await api.get('/customer/orders');
      if (Array.isArray(data)) {
        const unrated = data.find((order: any) => {
          const isCompleted = order.orderStatus === 'completed' || order.orderStatus === 'delivered';
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
    <div className="min-h-screen flex bg-dark-bg text-white font-sans selection:bg-primary/30">
      <CustomerSidebar />
      <div className="flex-1 ml-[280px] transition-all duration-300">
        <div className="relative z-10 px-8 pt-6 min-h-screen">

          {/* Rating Reminder Banner */}
          {shouldShowNotification && showRatingReminder && reminderOrder && !showRatingModal && (
            <div className="mb-6 relative group animate-slide-in-down">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <GlassCard className="p-4 flex items-center justify-between border-amber-500/30">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-lg text-white animate-pulse">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white tracking-wide">
                      How was your order?
                    </h3>
                    <p className="text-white/60 text-sm font-medium">
                      {reminderOrder.restaurantId?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 relative z-10">
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="bg-white text-amber-600 px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Rate Now</span>
                    <Star size={16} fill="currentColor" />
                  </button>
                  <button
                    onClick={handleDismissReminder}
                    className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl transition backdrop-blur-md"
                  >
                    ✕
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal && reminderOrder && (
            <RatingBanner
              order={reminderOrder}
              onClose={handleCloseModal}
              onSuccess={() => {
                setShowRatingModal(false);
                handleDismissReminder();
              }}
            />
          )}

          <div className="fade-enter-active">
            <Outlet />
          </div>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default CustomerLayout;
