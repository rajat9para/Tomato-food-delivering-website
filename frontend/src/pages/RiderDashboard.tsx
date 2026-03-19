import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Bike, Package, MapPin, Clock, CheckCircle, Navigation,
  Phone, LogOut, Star, Zap,
  AlertCircle, RefreshCw, TrendingUp, DollarSign
} from 'lucide-react';

interface Order {
  _id: string;
  restaurantId: { _id: string; name: string; address?: string; phone?: string; imageUrl?: string };
  customerId: { _id: string; name: string; phone?: string; address?: string };
  items: { foodId: { name: string }; quantity: number; price: number }[];
  totalAmount: number;
  orderStatus: string;
  deliveryAddress: { name: string; phone: string; address: string };
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

const statusColors: Record<string, string> = {
  ready: '#F59E0B',
  out_for_delivery: '#3B82F6',
  delivered: '#10B981',
  completed: '#8B5CF6',
  cancelled: '#EF4444'
};

const statusLabels: Record<string, string> = {
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

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
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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

      // Auto-switch to active tab if there's an active delivery
      if (activeRes.data) setTab('active');
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      await api.post(`/rider/accept-order/${orderId}`);
      showNotification('success', 'Order accepted! Head to the restaurant.');
      await fetchData();
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
      await fetchData();
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
      showNotification('success', 'Delivery completed! Great job! 🎉');
      await fetchData();
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(236,72,153,0.3)', borderTop: '4px solid #EC4899', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 100,
          padding: '12px 20px', borderRadius: '12px',
          background: notification.type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: '#fff', fontWeight: 600, fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'rgba(15,15,35,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bike size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Hey, {name || 'Rider'} 👋</h1>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Rider Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Availability Toggle */}
            <button
              onClick={toggleAvailability}
              style={{
                padding: '8px 20px', borderRadius: '24px', border: 'none',
                background: isAvailable ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isAvailable ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: isAvailable ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
              }} />
              {isAvailable ? 'Online' : 'Offline'}
            </button>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '8px 16px', color: 'rgba(255,255,255,0.7)',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { icon: <Package size={20} />, label: 'Today Deliveries', value: stats.todayDeliveries, color: '#3B82F6' },
            { icon: <DollarSign size={20} />, label: 'Today Earnings', value: `₹${stats.todayEarnings.toFixed(0)}`, color: '#10B981' },
            { icon: <TrendingUp size={20} />, label: 'Total Deliveries', value: stats.totalDeliveries, color: '#8B5CF6' },
            { icon: <Zap size={20} />, label: 'Total Earnings', value: `₹${stats.totalEarnings.toFixed(0)}`, color: '#F59E0B' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)', padding: '20px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${stat.color}20`, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px' }}>
          {[
            { key: 'queue' as const, label: 'Waiting Queue', count: availableOrders.length, icon: <Clock size={16} /> },
            { key: 'active' as const, label: 'Active Delivery', count: activeDelivery ? 1 : 0, icon: <Navigation size={16} /> },
            { key: 'history' as const, label: 'History', count: deliveryHistory.length, icon: <Star size={16} /> }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px', border: 'none',
                background: tab === t.key ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'transparent',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s'
              }}
            >
              {t.icon} {t.label}
              {t.count > 0 && (
                <span style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px'
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={fetchData} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.6)',
            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* QUEUE TAB */}
        {tab === 'queue' && (
          <div>
            {availableOrders.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <Clock size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No orders in queue</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                  {isAvailable ? 'Waiting for restaurants to prepare orders...' : 'Go online to see available orders'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableOrders.map(order => (
                  <div key={order._id} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
                    transition: 'border-color 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                          🍽️ {order.restaurantId?.name || 'Restaurant'}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          Order #{order._id.slice(-6).toUpperCase()} • {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        background: '#F59E0B20', color: '#F59E0B'
                      }}>
                        Ready for Pickup
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.quantity}x {item.foodId?.name || 'Item'}</span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>₹{item.price}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>Total</span>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#10B981' }}>₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
                      <MapPin size={16} color="#EC4899" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: '2px' }}>{order.deliveryAddress.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>{order.deliveryAddress.address}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      disabled={actionLoading || !isAvailable}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: isAvailable ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '15px', fontWeight: 800, cursor: isAvailable ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.3s', opacity: actionLoading ? 0.7 : 1
                      }}
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
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <Navigation size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No active delivery</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Accept an order from the queue to start delivering</p>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden'
              }}>
                {/* Status Banner */}
                <div style={{
                  background: activeDelivery.orderStatus === 'out_for_delivery'
                    ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                    : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {activeDelivery.orderStatus === 'out_for_delivery' ? <Navigation size={24} /> : <Package size={24} />}
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                        {activeDelivery.orderStatus === 'out_for_delivery' ? 'On the way to customer' : 'Pickup from restaurant'}
                      </h3>
                      <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
                        Order #{activeDelivery._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Route Steps */}
                  <div style={{ marginBottom: '24px' }}>
                    {/* Restaurant */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: activeDelivery.orderStatus === 'ready' ? '#F59E0B' : '#10B981',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {activeDelivery.orderStatus === 'ready' ? <Package size={16} /> : <CheckCircle size={16} />}
                        </div>
                        <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>PICKUP</p>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                          🍽️ {activeDelivery.restaurantId?.name}
                        </h4>
                        {activeDelivery.restaurantId?.address && (
                          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{activeDelivery.restaurantId.address}</p>
                        )}
                        {activeDelivery.restaurantId?.phone && (
                          <a href={`tel:${activeDelivery.restaurantId.phone}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            color: '#3B82F6', fontSize: '13px', textDecoration: 'none', marginTop: '8px'
                          }}>
                            <Phone size={14} /> {activeDelivery.restaurantId.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Customer */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: activeDelivery.orderStatus === 'out_for_delivery' ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <MapPin size={16} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>DELIVERY</p>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                          📍 {activeDelivery.deliveryAddress.name}
                        </h4>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{activeDelivery.deliveryAddress.address}</p>
                        <a href={`tel:${activeDelivery.deliveryAddress.phone}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          color: '#3B82F6', fontSize: '13px', textDecoration: 'none', marginTop: '8px'
                        }}>
                          <Phone size={14} /> {activeDelivery.deliveryAddress.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 700 }}>ORDER ITEMS</p>
                    {activeDelivery.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.quantity}x {item.foodId?.name || 'Item'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>₹{item.price}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800 }}>Total</span>
                      <span style={{ fontWeight: 800, color: '#10B981', fontSize: '16px' }}>₹{activeDelivery.totalAmount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {activeDelivery.orderStatus === 'ready' && (
                      <button
                        onClick={() => handleStartDelivery(activeDelivery._id)}
                        disabled={actionLoading}
                        style={{
                          flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                          color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
                          opacity: actionLoading ? 0.7 : 1, transition: 'all 0.3s'
                        }}
                      >
                        🚀 Start Journey
                      </button>
                    )}
                    {activeDelivery.orderStatus === 'out_for_delivery' && (
                      <button
                        onClick={() => handleCompleteDelivery(activeDelivery._id)}
                        disabled={actionLoading}
                        style={{
                          flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
                          opacity: actionLoading ? 0.7 : 1, transition: 'all 0.3s'
                        }}
                      >
                        ✅ Complete Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            {deliveryHistory.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <Star size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No delivery history yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Complete your first delivery to see it here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deliveryHistory.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).map(order => (
                  <div key={order._id} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.06)', padding: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: (statusColors[order.orderStatus] || '#8B5CF6') + '20',
                        color: statusColors[order.orderStatus] || '#8B5CF6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                          {order.restaurantId?.name} → {order.deliveryAddress.name}
                        </p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          {formatDate(order.deliveredAt || order.createdAt)} • #{order._id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, color: '#10B981', fontSize: '15px' }}>₹{order.totalAmount}</p>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: statusColors[order.orderStatus] || '#8B5CF6'
                      }}>
                        {statusLabels[order.orderStatus] || order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        * { box-sizing: border-box; margin: 0; }
      `}</style>
    </div>
  );
}
