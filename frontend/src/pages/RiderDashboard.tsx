import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import {
  Bike, Package, MapPin, Clock, CheckCircle, Navigation,
  Phone, LogOut, Star, Zap,
  AlertCircle, RefreshCw, TrendingUp, DollarSign, Map
} from 'lucide-react';

interface Order {
  _id: string;
  restaurantId: { _id: string; name: string; address?: string; phone?: string; imageUrl?: string };
  customerId: { _id: string; name: string; phone?: string; address?: string };
  items: { foodId: { name: string }; quantity: number; price: number }[];
  totalAmount: number;
  deliveryFeeAmount?: number;
  orderStatus: string;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
    locationConfidence?: number;
  };
  riderAssignedAt?: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface RiderStats {
  totalDeliveries: number;
  todayDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
}

export default function RiderDashboard() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'queue' | 'active' | 'history'>('queue');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Order[]>([]);
  const [stats, setStats] = useState<RiderStats>({ totalDeliveries: 0, todayDeliveries: 0, totalEarnings: 0, todayEarnings: 0 });
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchData = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [ordersRes, activeRes, historyRes, statsRes, profileRes] = await Promise.all([
        api.get('/rider/available-orders'),
        api.get('/rider/active-delivery'),
        api.get('/rider/my-deliveries'),
        api.get('/rider/stats'),
        api.get('/rider/profile')
      ]);
      setAvailableOrders(ordersRes.data);
      setActiveDelivery(activeRes.data);
      setDeliveryHistory(historyRes.data);
      setStats(statsRes.data);
      setIsAvailable(profileRes.data.isAvailable ?? true);

      if (activeRes.data) setTab('active');
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      await api.post(`/rider/accept-order/${orderId}`);
      showNotification('success', 'Order accepted! Head to the restaurant.');
      await fetchData(true);
      setTab('active');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      setActionLoading(true);
      await api.post(`/rider/start-delivery/${orderId}`);
      showNotification('success', 'Delivery started! Head to the customer.');
      await fetchData(true);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to start delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      setActionLoading(true);
      await api.post(`/rider/complete-delivery/${orderId}`);
      showNotification('success', 'Delivery completed! ₹30 earned! 🎉');
      await fetchData(true);
      setTab('queue');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to complete delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      await api.put('/rider/profile', { isAvailable: !isAvailable });
      setIsAvailable(!isAvailable);
      showNotification('success', !isAvailable ? 'You are now online!' : 'You are now offline');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getMapUrl = (order: Order) => {
    const lat = order.deliveryAddress?.lat;
    const lng = order.deliveryAddress?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const offset = 0.01;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - offset},${lat - offset},${lng + offset},${lat + offset}&layer=mapnik&marker=${lat},${lng}`;
    }

    return `https://www.openstreetmap.org/export/embed.html?bbox=72.5,18.5,73.5,19.5&layer=mapnik`;
  };

  const getNavigationUrl = (order: Order) => {
    const lat = order.deliveryAddress?.lat;
    const lng = order.deliveryAddress?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress?.address || '')}`;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <GlobalBackground />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <GlobalBackground />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 animate-slide-in-up ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header — Tomato Red/White */}
      <nav className="bg-white shadow-lg border-b-2 border-primary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <img src="/tomato-logo.png" alt="TOMATO" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <h1 className="text-xl md:text-2xl font-bold text-primary italic">TOMATO</h1>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-700 rounded-full flex items-center justify-center text-white border-2 border-primary">
                <Bike size={20} />
              </div>
              <span className="text-gray-700 text-base">Welcome, <span className="font-bold text-gray-900">{name || 'Rider'}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Availability Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                <span className={`text-[10px] font-bold ${isAvailable ? 'text-green-600' : 'text-red-500'} uppercase`}>
                  {isAvailable ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={toggleAvailability}
                className={`w-12 h-6 rounded-full transition-all duration-500 relative shadow-inner ${isAvailable ? 'bg-green-500 shadow-green-200' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${isAvailable ? 'left-7 ring-2 ring-green-100' : 'left-1'}`}></div>
              </button>
            </div>
            <button onClick={handleLogout} className="bg-primary hover:bg-red-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-bold text-sm transition shadow-md flex items-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
        {/* Stats Cards — White with Red Accents */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: <Package size={22} />, label: 'Today Deliveries', value: stats.todayDeliveries, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: <DollarSign size={22} />, label: 'Today Earnings', value: `₹${stats.todayEarnings}`, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: <TrendingUp size={22} />, label: 'Total Deliveries', value: stats.totalDeliveries, color: 'text-primary', bg: 'bg-red-50' },
            { icon: <Zap size={22} />, label: 'Total Earnings', value: `₹${stats.totalEarnings}`, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ₹30 per delivery info banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">₹30</div>
          <div>
            <p className="text-green-800 font-bold text-sm">Earn ₹30 per delivery!</p>
            <p className="text-green-600 text-xs">Complete deliveries and earnings are credited to your wallet instantly.</p>
          </div>
        </div>

        {/* Tabs — Clean Tomato Style */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-md border border-gray-100">
          {[
            { key: 'queue' as const, label: 'Waiting Queue', count: availableOrders.length, icon: <Clock size={16} /> },
            { key: 'active' as const, label: 'Active Delivery', count: activeDelivery ? 1 : 0, icon: <Navigation size={16} /> },
            { key: 'history' as const, label: 'History', count: deliveryHistory.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length, icon: <Star size={16} /> }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                tab === t.key
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200'
                  : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {t.icon} {t.label}
              {t.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  tab === t.key ? 'bg-white/25' : 'bg-gray-100'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <div className="flex justify-end mb-4">
          <button onClick={() => fetchData(true)} className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-gray-600 text-xs font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        {/* QUEUE TAB */}
        {tab === 'queue' && (
          <div>
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-16 text-center">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No orders in queue</h3>
                <p className="text-gray-500 text-sm">
                  {isAvailable ? 'Waiting for restaurants to prepare orders...' : 'Go online to see available orders'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5 hover:shadow-xl transition-all hover:-translate-y-0.5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          🍽️ {order.restaurantId?.name || 'Restaurant'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Order #{order._id.slice(-6).toUpperCase()} • {formatTime(order.createdAt)}
                        </p>
                        {order.restaurantId?.address && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} /> {order.restaurantId.address}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                        Ready for Pickup
                      </span>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.foodId?.name || 'Item'}</span>
                          <span className="text-gray-500">₹{item.price}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                        <span className="font-bold text-sm">Total</span>
                        <span className="font-bold text-sm text-primary">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 mb-4 text-sm">
                      <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800">{order.deliveryAddress.name}</p>
                        <p className="text-gray-500 text-xs">{order.deliveryAddress.formattedAddress || order.deliveryAddress.address}</p>
                      </div>
                    </div>

                    {/* Delivery Fee Banner */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 text-center">
                      <span className="text-green-700 text-xs font-bold">💰 You'll earn ₹{order.deliveryFeeAmount || 30} for this delivery</span>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      disabled={actionLoading || !isAvailable}
                      className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isAvailable
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-200 hover:-translate-y-0.5'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      style={{ opacity: actionLoading ? 0.7 : 1 }}
                    >
                      <Package size={18} /> Accept Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE DELIVERY TAB */}
        {tab === 'active' && (
          <div>
            {!activeDelivery ? (
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-16 text-center">
                <Navigation size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No active delivery</h3>
                <p className="text-gray-500 text-sm">Accept an order from the queue to start delivering</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className={`rounded-2xl overflow-hidden shadow-lg ${
                  activeDelivery.orderStatus === 'out_for_delivery'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600'
                }`}>
                  <div className="p-5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      {activeDelivery.orderStatus === 'out_for_delivery' ? <Navigation size={24} /> : <Package size={24} />}
                      <div>
                        <h3 className="text-lg font-bold">
                          {activeDelivery.orderStatus === 'out_for_delivery' ? '🚀 On the Way to Customer' : '📦 Pickup from Restaurant'}
                        </h3>
                        <p className="text-sm opacity-80">Order #{activeDelivery._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">₹{activeDelivery.totalAmount}</p>
                      <p className="text-xs opacity-80">Earn ₹{activeDelivery.deliveryFeeAmount || 30}</p>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5">
                  {/* Restaurant Pickup */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activeDelivery.orderStatus === 'ready' ? 'bg-amber-500' : 'bg-green-500'
                      } text-white`}>
                        {activeDelivery.orderStatus === 'ready' ? <Package size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">PICKUP</p>
                      <h4 className="text-base font-bold text-gray-900 mb-1">🍽️ {activeDelivery.restaurantId?.name}</h4>
                      {activeDelivery.restaurantId?.address && (
                        <p className="text-sm text-gray-500 mb-2">{activeDelivery.restaurantId.address}</p>
                      )}
                      {activeDelivery.restaurantId?.phone && (
                        <a href={`tel:${activeDelivery.restaurantId.phone}`} className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
                          <Phone size={14} /> {activeDelivery.restaurantId.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Customer Delivery */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activeDelivery.orderStatus === 'out_for_delivery' ? 'bg-blue-500' : 'bg-gray-200'
                      } text-white`}>
                        <MapPin size={18} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">DELIVERY</p>
                      <h4 className="text-base font-bold text-gray-900 mb-1">📍 {activeDelivery.deliveryAddress.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">{activeDelivery.deliveryAddress.formattedAddress || activeDelivery.deliveryAddress.address}</p>
                      <a
                        href={getNavigationUrl(activeDelivery)}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <Navigation size={13} /> Open navigation
                      </a>
                      <a href={`tel:${activeDelivery.deliveryAddress.phone}`} className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
                        <Phone size={14} /> {activeDelivery.deliveryAddress.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Delivery Map */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <Map size={18} className="text-primary" />
                    <h4 className="font-bold text-gray-800 text-sm">Delivery Map</h4>
                  </div>
                  <div className="h-64 bg-gray-100 relative">
                    <iframe
                      title="Delivery Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={getMapUrl(activeDelivery)}
                      style={{ border: 0 }}
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">ORDER ITEMS</p>
                  {activeDelivery.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.foodId?.name || 'Item'}</span>
                      <span className="text-gray-500">₹{item.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary text-lg">₹{activeDelivery.totalAmount}</span>
                  </div>
                </div>

                {/* Action Buttons — Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {activeDelivery.orderStatus === 'ready' && (
                    <>
                      <button
                        onClick={() => handleStartDelivery(activeDelivery._id)}
                        disabled={actionLoading}
                        className="col-span-2 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5 transition-all"
                        style={{ opacity: actionLoading ? 0.7 : 1 }}
                      >
                        🚀 Start Riding
                      </button>
                    </>
                  )}
                  {activeDelivery.orderStatus === 'out_for_delivery' && (
                    <button
                      onClick={() => handleCompleteDelivery(activeDelivery._id)}
                      disabled={actionLoading}
                      className="col-span-2 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-green-200 hover:-translate-y-0.5 transition-all"
                      style={{ opacity: actionLoading ? 0.7 : 1 }}
                    >
                      ✅ Complete Ride — Earn ₹{activeDelivery.deliveryFeeAmount || 30}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            {deliveryHistory.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-16 text-center">
                <Star size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No delivery history yet</h3>
                <p className="text-gray-500 text-sm">Complete your first delivery to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryHistory.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).map(order => (
                  <div key={order._id} className="bg-white rounded-xl border-2 border-gray-100 shadow-md p-4 flex justify-between items-center hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">
                          {order.restaurantId?.name} → {order.deliveryAddress.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(order.deliveredAt || order.createdAt)} • #{order._id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-600 text-base">+₹{order.deliveryFeeAmount || 30}</p>
                      <span className="text-xs font-bold text-green-500">Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
