import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import GlobalBackground from './GlobalBackground';
import api from '../utils/api';
import RatingBanner from './RatingBanner';
import { Star } from 'lucide-react';

const CustomerLayout = () => {
  const location = useLocation();
  const [reminderOrder, setReminderOrder] = useState<any>(null);
  const [showRatingReminder, setShowRatingReminder] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Close the modal handler
  const handleCloseModal = () => {
    setShowRatingModal(false);
    // If they close the modal without submitting, we keep the reminder banner? 
    // Or maybe we dismiss it? Let's keep it but close modal.
  };

  const handleDismissReminder = () => {
    setShowRatingReminder(false);
    if (reminderOrder) {
      localStorage.setItem(`dismissed_rating_${reminderOrder._id}`, 'true');
    }
  };

  // Routes where the notification should NOT appear
  const excludedRoutes = ['/customer/cart', '/customer/orders'];
  const shouldShowNotification = !excludedRoutes.includes(location.pathname);

  useEffect(() => {
    checkUnratedOrders();
  }, []);

  useEffect(() => {
    // Check if we should show the rating reminder based on localStorage
    if (reminderOrder) {
      const isDismissed = localStorage.getItem(`dismissed_rating_${reminderOrder._id}`);
      if (isDismissed) {
        setShowRatingReminder(false);
      }
    }
  }, [reminderOrder]);

  // Re-check when location changes (optional, or just rely on initial load and dismissal)
  // If user rates in "My Orders", we want this to update. 
  // Maybe adding a simple poller or just checking on mount is enough for now.
  // Let's check on mount.

  const checkUnratedOrders = async () => {
    try {
      const { data } = await api.get('/customer/orders');
      if (Array.isArray(data)) {
        // Find first completed order with no rating that hasn't been dismissed
        const unrated = data.find((order: any) => {
          const isCompleted = order.orderStatus === 'completed';
          const isUnrated = !order.rating || order.rating === 0;
          const isDismissed = localStorage.getItem(`dismissed_rating_${order._id}`);

          return isCompleted && isUnrated && !isDismissed;
        });

        if (unrated) {
          setReminderOrder(unrated);
          setShowRatingReminder(true);
        }
      }
    } catch (error) {
      console.error('Error fetching orders for notification:', error);
    }
  };



  return (
    <div className="min-h-screen flex">
      <CustomerSidebar />
      <div className="flex-1 ml-80">
        <GlobalBackground />

        <div className="relative z-10 px-8 pt-6">
          {/* Golden Notification Banner */}
          {shouldShowNotification && showRatingReminder && reminderOrder && !showRatingModal && (
            <div className="mb-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 rounded-2xl p-4 shadow-xl animate-fade-in-down flex items-center justify-between relative overflow-hidden border border-yellow-300">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/90 p-3 rounded-full shadow-lg text-yellow-600 animate-pulse">
                  <Star size={24} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide" style={{ fontFamily: 'Lato, sans-serif' }}>
                    How was your order?
                  </h3>
                  <p className="text-white/90 text-sm font-bold">
                    {reminderOrder.restaurantId?.name}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="bg-white text-yellow-600 px-6 py-2 rounded-xl font-bold shadow-md hover:bg-gray-50 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Rate Now</span>
                  <Star size={16} fill="currentColor" />
                </button>
                <button
                  onClick={handleDismissReminder}
                  className="bg-black/20 hover:bg-black/30 text-white p-2 rounded-xl transition backdrop-blur-md"
                >
                  ✕
                </button>
              </div>
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
                alert('Thank you for your rating! 🌟');
              }}
            />
          )}

          <Outlet />
        </div>
      </div>


    </div>
  );
};


export default CustomerLayout;
