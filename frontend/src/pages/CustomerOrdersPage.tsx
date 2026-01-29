import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, ShoppingBag, MapPin, Star, X } from 'lucide-react';

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);


  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFocus = () => loadOrders();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customer/orders');

      let validOrders = [];
      if (Array.isArray(data)) {
        validOrders = data.filter(order => order && typeof order === 'object' && order._id);
      }

      if (validOrders.length === 0) {
        setOrders([]);
        return;
      }

      const sortedOrders = validOrders.sort((a: any, b: any) => {
        try {
          // Priority: Pending > Delivered/Completed (Needs Rating) > Delivered/Completed (Rated) > Cancelled
          const statusPriority: { [key: string]: number } = {
            'pending': 4,
            'preparing': 3,
            'out_for_delivery': 3,
            'completed': 2,
            'delivered': 2,
            'cancelled': 1
          };

          const statusA = statusPriority[a?.orderStatus] || 0;
          const statusB = statusPriority[b?.orderStatus] || 0;

          if (statusA !== statusB) return statusB - statusA;

          const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        } catch (err) {
          return 0;
        }
      });

      setOrders(sortedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-gray-100 rounded mb-4"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm">
          <img
            src="https://b.zmtcdn.com/web_assets/b40b97e677bc7b2cae45838019e74b7e1581829612.png"
            alt="No orders"
            className="w-64 opacity-80 mb-6"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <ShoppingBag size={48} className="text-gray-300 mb-2" />
          <h3 className="text-xl font-bold text-gray-800">No Orders Yet</h3>
          <p className="text-gray-500 mb-6">Go ahead, order some yummy food!</p>
          <button
            onClick={() => navigate('/customer/home')}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold transition shadow-md"
          >
            Order Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="p-6">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                      {order.restaurantId?.imageUrl ? (
                        <img src={order.restaurantId.imageUrl} alt={order.restaurantId?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{order.restaurantId?.name || 'Restaurant'}</h3>
                      <p className="text-gray-500 text-sm">{order.restaurantId?.address || 'Location unavailable'}</p>
                      <p className="text-xs text-gray-400 mt-1">ORDER #{order._id.slice(-6).toUpperCase()} | {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.orderStatus === 'delivered' || order.orderStatus === 'completed' ? 'bg-gray-100 text-gray-600' :
                      order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                      {order.orderStatus === 'completed' ? 'Delivered' : order.orderStatus}
                      {order.orderStatus === 'completed' && <CheckCircle size={12} />}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-100 pt-4 pb-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-1 text-sm text-gray-700">
                      <span>{item.quantity} × {item.foodId?.name}</span>
                      {/* We don't verify price per item in history usually, just total */}
                    </div>
                  ))}
                </div>

                {/* Footer / Actions */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Total Paid: </span>
                    <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                  </div>

                  <div className="flex gap-3">
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            try {
                              await api.post('/customer/orders/cancel', { orderId: order._id });
                              alert('Order cancelled successfully');
                              loadOrders();
                            } catch (error: any) {
                              alert(error.response?.data?.message || 'Error cancelling order');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition shadow-sm"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}
                      className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-100 transition border border-gray-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}


      {/* Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
              <button onClick={() => setShowOrderDetails(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Items List */}
              <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Items</h4>
                {selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-semibold text-gray-800">{item.foodId?.name}</span>
                      <div className="text-xs text-gray-500">x{item.quantity}</div>
                    </div>
                    <div className="font-medium text-gray-800">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-2"><span>Item Total</span><span>₹{selectedOrder.baseAmount}</span></div>
                <div className="flex justify-between text-sm mb-2"><span>Taxes & Charges</span><span>₹{(selectedOrder.gstAmount || 0) + (selectedOrder.platformFeeAmount || 0)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">Delivered To</h4>
                <div className="flex gap-3">
                  <MapPin className="text-primary mt-1" size={18} />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{selectedOrder.deliveryAddress?.name}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{selectedOrder.deliveryAddress?.address}</p>
                    <p className="text-gray-500 text-xs mt-1">{selectedOrder.deliveryAddress?.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for Store icon since it was used but maybe not imported in original file fully
function Store(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
  )
}

export default CustomerOrdersPage;
