import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import { Search, LogOut, Mail, X } from 'lucide-react';

const AdminDashboard = () => {
  const { logout, name } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortBy, setUserSortBy] = useState<'all' | 'owner' | 'customer'>('all');
  const [mailModal, setMailModal] = useState<{ open: boolean; restaurantId: string; ownerEmail: string }>({ open: false, restaurantId: '', ownerEmail: '' });
  const [mailForm, setMailForm] = useState({ subject: '', message: '', files: [] as File[] });
  const [pendingCount, setPendingCount] = useState(0);
  const [revenueData, setRevenueData] = useState<any>({
    platformRevenue: 0,
    gstCollection: 0,
    totalSales: 0,
    todayPlatformRevenue: 0,
    weeklyPlatformRevenue: 0,
    monthlyPlatformRevenue: 0,
    todayGstCollection: 0,
    weeklyGstCollection: 0,
    monthlyGstCollection: 0,
    todayTotalSales: 0,
    weeklyTotalSales: 0,
    monthlyTotalSales: 0,
    chartData: []
  });
  const [revenuePeriod, setRevenuePeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadData();
    loadPendingCount();
    const interval = setInterval(() => {
      // Polling optimization: Only poll if tab is active and visible
      if (document.visibilityState === 'visible') {
        loadPendingCount();
        if (activeTab === 'dashboard') loadData();
      }
    }, 30000); // Increased to 30s to reduce load
    return () => clearInterval(interval);
  }, [activeTab, sortBy, searchQuery, userSearchQuery, userSortBy, revenuePeriod]);

  const loadPendingCount = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setPendingCount(data.pendingRestaurants || 0);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const { data: dashboardData } = await api.get('/admin/dashboard');
        const { data: revenueData } = await api.get(`/admin/platform-revenue?period=${revenuePeriod}`);
        setStats(dashboardData);
        setRevenueData(revenueData);
        await api.get(`/admin/restaurants/top?sortBy=${sortBy}`);
      } else if (activeTab === 'restaurants') {
        let url = '/admin/restaurants';
        if (searchQuery) url = `/admin/restaurants/search?query=${searchQuery}`;
        const { data } = await api.get(url);
        // Sort: pending first, then approved, then rejected
        const sorted = data.sort((a: any, b: any) => {
          const order = { pending: 0, approved: 1, rejected: 2 };
          return order[a.approvalStatus as keyof typeof order] - order[b.approvalStatus as keyof typeof order];
        });
        setRestaurants(sorted);
      } else if (activeTab === 'users') {
        let url = '/admin/users';
        const params = new URLSearchParams();
        if (userSearchQuery) params.append('search', userSearchQuery);
        if (userSortBy !== 'all') params.append('role', userSortBy);
        if (params.toString()) url += `?${params.toString()}`;
        const { data } = await api.get(url);
        setUsers(data);
      } else if (activeTab === 'orders') {
        const { data } = await api.get('/admin/orders');
        setOrders(data);
      } else if (activeTab === 'transactions') {
        const { data } = await api.get('/admin/transactions');
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const [processingId, setProcessingId] = useState<string | null>(null);

  const updateRestaurant = async (id: string, update: any) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.patch(`/admin/restaurants/${id}`, update);
      // Optimistic update or reload
      setRestaurants(prev => prev.map(r => r._id === id ? { ...r, ...update } : r));
      loadData(); // Background refresh
    } catch (error: any) {
      console.error('Error updating restaurant:', error);
      alert('Failed to update: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const removeRestaurant = async (id: string) => {
    if (!window.confirm('Remove this restaurant?')) return;
    if (processingId) return;

    setProcessingId(id);
    try {
      await api.delete(`/admin/restaurants/${id}`);
      setRestaurants(prev => prev.filter(r => r._id !== id));
      alert('Restaurant removed!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Failed'));
    } finally {
      setProcessingId(null);
    }
  };

  const sendMessage = async () => {
    if (!mailForm.subject.trim() || !mailForm.message.trim()) {
      alert('Enter subject and message');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('restaurantId', mailModal.restaurantId);
      formData.append('subject', mailForm.subject);
      formData.append('message', mailForm.message);
      mailForm.files.forEach(file => formData.append('files', file));
      await api.post(`/admin/restaurants/${mailModal.restaurantId}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Message sent to restaurant owner!');
      setMailModal({ open: false, restaurantId: '', ownerEmail: '' });
      setMailForm({ subject: '', message: '', files: [] });
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Failed'));
    }
  };

  const updateUser = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { status });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <GlobalBackground />

      <nav className="bg-white shadow-lg border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/tomato-logo.png" alt="TOMATO" className="w-10 h-10 object-contain" />
            <h1 className="text-3xl font-bold text-red-600 italic">TOMATO</h1>
            <span className="text-gray-700 ml-8">Welcome, <span className="font-bold">{name}</span></span>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="relative">
                <span className="text-3xl cursor-pointer" title={`${pendingCount} pending approvals`}>🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                  {pendingCount}
                </span>
              </div>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex relative z-10">
        <aside className="w-64 bg-white border-r-4 border-red-100 min-h-screen p-6 shadow-lg">
          <div className="space-y-3">
            {[{ name: 'dashboard', emoji: '📊' }, { name: 'restaurants', emoji: '🍽️' }, { name: 'users', emoji: '👥' }, { name: 'orders', emoji: '📦' }, { name: 'transactions', emoji: '💳' }].map((tab) => (
              <button key={tab.name} onClick={() => { setActiveTab(tab.name); setSearchQuery(''); setUserSearchQuery(''); }} className={`w-full p-4 text-left rounded-lg font-bold text-lg transition relative ${activeTab === tab.name ? 'bg-red-600 text-white shadow-lg' : 'text-gray-700 hover:bg-red-50'}`}>
                <span className="mr-2">{tab.emoji}</span>
                {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
                {tab.name === 'restaurants' && pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm animate-pulse shadow-lg">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div className="animate-slide-in-up pb-20">
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Dashboard Overview</h2>

              {/* Main KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">👥</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Total Users</h3>
                  </div>
                  <p className="text-4xl font-black">{stats.totalUsers || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🍽️</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Restaurants</h3>
                  </div>
                  <p className="text-4xl font-black">{stats.totalRestaurants || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">💰</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">{revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)} Revenue</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl">₹</span>
                    <p className="text-4xl font-black">
                      {revenuePeriod === 'monthly' ? revenueData.monthlyPlatformRevenue?.toLocaleString() || 0 :
                        revenuePeriod === 'yearly' ? revenueData.platformRevenue?.toLocaleString() || 0 :
                          revenueData.platformRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <p className="text-[10px] opacity-80 mt-1 font-bold">1% Fee per Order</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🧾</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">{revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)} GST</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl">₹</span>
                    <p className="text-4xl font-black">
                      {revenuePeriod === 'monthly' ? revenueData.monthlyGstCollection?.toLocaleString() || 0 :
                        revenuePeriod === 'yearly' ? revenueData.gstCollection?.toLocaleString() || 0 :
                          revenueData.gstCollection?.toLocaleString() || 0}
                    </p>
                  </div>
                  <p className="text-[10px] opacity-80 mt-1 font-bold">1% GST Total</p>
                </div>
              </div>

              {/* Revenue Graph & Sales Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2 bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">Revenue Trend</h3>
                      <p className="text-gray-500 text-sm font-bold mt-1">Platform Earnings ({revenueData.periodLabel})</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      {['monthly', 'yearly'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setRevenuePeriod(p as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${revenuePeriod === p ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {revenueData.chartData?.length > 0 ? (
                    <div className="h-64 relative pl-12 pr-4">
                      <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 1, 2, 3].map((i) => (
                          <line key={i} x1="0" y1={i * 80} x2="800" y2={i * 80} stroke="#f3f4f6" strokeWidth="2" />
                        ))}

                        {/* Line graph */}
                        <polyline
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={revenueData.chartData.map((item: any, index: number) => {
                            const max = Math.max(...revenueData.chartData.map((d: any) => d.value), 10);
                            const x = (index / (revenueData.chartData.length - 1)) * 800;
                            const y = 240 - (item.value / max) * 200;
                            return `${x},${y}`;
                          }).join(' ')}
                        />

                        {/* Data points */}
                        {revenueData.chartData.map((item: any, index: number) => {
                          const max = Math.max(...revenueData.chartData.map((d: any) => d.value), 10);
                          const x = (index / (revenueData.chartData.length - 1)) * 800;
                          const y = 240 - (item.value / max) * 200;
                          return (
                            <g key={index} className="group cursor-pointer">
                              <circle cx={x} cy={y} r="6" fill="#ef4444" className="transition-all duration-300 group-hover:r-8" />
                              <circle cx={x} cy={y} r="12" fill="#ef4444" fillOpacity="0.1" className="animate-pulse" />
                            </g>
                          );
                        })}
                      </svg>

                      {/* X Axis Labels */}
                      <div className="flex justify-between mt-6">
                        {revenueData.chartData.map((item: any, index: number) => (
                          <span key={index} className="text-[10px] font-black text-gray-400 uppercase">{item.label}</span>
                        ))}
                      </div>

                      {/* Y Axis Labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1">
                        {[1, 2, 3, 4].map((i) => {
                          const max = Math.max(...revenueData.chartData.map((d: any) => d.value), 10);
                          return <span key={i} className="text-[10px] font-bold text-gray-400">₹{Math.round((max * (4 - i)) / 3)}</span>
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                      No data available for this period
                    </div>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-2xl font-black text-gray-900 mb-6">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-green-600 uppercase">Today's Platform Fee</span>
                        <span className="text-sm font-black text-green-600">₹{revenueData.todayPlatformRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="text-[10px] text-green-500 font-bold">GST: ₹{revenueData.todayGstCollection?.toLocaleString() || 0}</div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-blue-600 uppercase">Weekly Platform Fee</span>
                        <span className="text-sm font-black text-blue-600">₹{revenueData.weeklyPlatformRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="text-[10px] text-blue-500 font-bold">GST: ₹{revenueData.weeklyGstCollection?.toLocaleString() || 0}</div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-purple-600 uppercase">Monthly Platform Fee</span>
                        <span className="text-sm font-black text-purple-600">₹{revenueData.monthlyPlatformRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="text-[10px] text-purple-500 font-bold">GST: ₹{revenueData.monthlyGstCollection?.toLocaleString() || 0}</div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-red-600 uppercase">All-Time Platform Fee</span>
                        <span className="text-sm font-black text-red-600">₹{revenueData.platformRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="text-[10px] text-red-500 font-bold">GST: ₹{revenueData.gstCollection?.toLocaleString() || 0}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <span className="block text-[10px] font-black text-orange-600 uppercase mb-1">Pending Restaurants</span>
                        <span className="text-2xl font-black text-orange-700">{stats.pendingRestaurants || 0}</span>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                        <span className="block text-[10px] font-black text-teal-600 uppercase mb-1">Orders Today</span>
                        <span className="text-2xl font-black text-teal-700">{stats.ordersToday || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900">Restaurants Management</h2>
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-red-200 rounded-lg" />
                </div>
              </div>
              <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">ID</th>
                      <th className="p-4 text-left">Owner Email</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Rating</th>
                      <th className="p-4 text-left">Approve/Reject</th>
                      <th className="p-4 text-left">Mail</th>
                      <th className="p-4 text-left">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.length > 0 ? restaurants.map((r: any) => (
                      <tr key={r._id} className="border-b border-red-100 hover:bg-red-50">
                        <td className="p-4 font-semibold">{r.name}</td>
                        <td className="p-4 text-sm">{r.restaurantId || 'N/A'}</td>
                        <td className="p-4 text-sm">
                          <a href={`mailto:${r.ownerId?.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Mail size={14} />
                            {r.ownerId?.email || 'N/A'}
                          </a>
                        </td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${r.approvalStatus === 'approved' ? 'bg-green-600' : r.approvalStatus === 'pending' ? 'bg-yellow-600' : 'bg-red-600'}`}>{r.approvalStatus}</span></td>
                        <td className="p-4 font-bold text-red-600">{r.rating?.toFixed(1) || 0}</td>
                        <td className="p-4">
                          {r.approvalStatus === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateRestaurant(r._id, { approvalStatus: 'approved' })}
                                disabled={processingId === r._id}
                                className={`text-white text-sm py-1 px-3 rounded transition-colors ${processingId === r._id ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                {processingId === r._id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => updateRestaurant(r._id, { approvalStatus: 'rejected' })}
                                disabled={processingId === r._id}
                                className={`text-white text-sm py-1 px-3 rounded transition-colors ${processingId === r._id ? 'bg-gray-400 cursor-wait' : 'bg-red-600 hover:bg-red-700'}`}
                              >
                                {processingId === r._id ? '...' : 'Reject'}
                              </button>
                            </div>
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </td>
                        <td className="p-4"><button onClick={() => setMailModal({ open: true, restaurantId: r._id, ownerEmail: r.ownerId?.email || '' })} className="bg-blue-600 text-white text-sm py-1 px-3 rounded flex items-center gap-1"><Mail size={14} /> Mail</button></td>
                        <td className="p-4">
                          <button
                            onClick={() => removeRestaurant(r._id)}
                            disabled={processingId === r._id}
                            className={`text-white text-sm py-1 px-3 rounded transition-colors ${processingId === r._id ? 'bg-gray-400 cursor-wait' : 'bg-red-700 hover:bg-red-800'}`}
                          >
                            {processingId === r._id ? '...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={8} className="p-8 text-center text-gray-500">No restaurants found</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900">Users Management</h2>
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setUserSortBy('all')} className={`px-4 py-2 rounded-lg font-semibold transition ${userSortBy === 'all' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>All</button>
                    <button onClick={() => setUserSortBy('owner')} className={`px-4 py-2 rounded-lg font-semibold transition ${userSortBy === 'owner' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Owners</button>
                    <button onClick={() => setUserSortBy('customer')} className={`px-4 py-2 rounded-lg font-semibold transition ${userSortBy === 'customer' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>Customers</button>
                  </div>
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-red-200 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Role</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((u: any) => (
                      <tr key={u._id} className="border-b border-red-100 hover:bg-red-50">
                        <td className="p-4 font-semibold">{u.name}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600">{u.role}</span></td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${u.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}>{u.status}</span></td>
                        <td className="p-4"><button onClick={() => updateUser(u._id, u.status === 'active' ? 'blocked' : 'active')} className={`text-sm py-1 px-3 rounded font-bold text-white ${u.status === 'active' ? 'bg-red-600' : 'bg-green-600'}`}>{u.status === 'active' ? 'Block' : 'Unblock'}</button></td>
                      </tr>
                    )) : (<tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Orders</h2>
              <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4 text-left">Customer</th>
                      <th className="p-4 text-left">Restaurant</th>
                      <th className="p-4 text-left">Amount</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? orders.map((o: any) => (
                      <tr key={o._id} className="border-b border-red-100 hover:bg-red-50">
                        <td className="p-4">{o.customerId?.name}</td>
                        <td className="p-4">{o.restaurantId?.name}</td>
                        <td className="p-4 font-bold text-red-600">₹{o.totalAmount}</td>
                        <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600">{o.orderStatus}</span></td>
                        <td className="p-4">{o.minutesElapsed} min</td>
                      </tr>
                    )) : (<tr><td colSpan={5} className="p-8 text-center text-gray-500">No orders found</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Transactions</h2>
              <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4 text-left">ID</th>
                      <th className="p-4 text-left">User</th>
                      <th className="p-4 text-left">Base</th>
                      <th className="p-4 text-left">Fee</th>
                      <th className="p-4 text-left">GST</th>
                      <th className="p-4 text-left">Total</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? transactions.map((t: any) => (
                      <tr key={t._id} className="border-b border-red-100 hover:bg-red-50">
                        <td className="p-4 text-sm">{t.transactionId?.slice(0, 12)}</td>
                        <td className="p-4">{t.userId?.name}</td>
                        <td className="p-4 text-sm">₹{t.amount - (t.gstAmount || 0) - (t.platformFeeAmount || 0)}</td>
                        <td className="p-4 text-sm text-green-600 font-bold">₹{t.platformFeeAmount || 0}</td>
                        <td className="p-4 text-sm text-blue-600">₹{t.gstAmount || 0}</td>
                        <td className="p-4 font-bold text-red-600">₹{t.amount}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${t.paymentStatus === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{t.paymentStatus}</span></td>
                        <td className="p-4 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    )) : (<tr><td colSpan={8} className="p-8 text-center text-gray-500">No transactions found</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {mailModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-2xl w-full animate-scale-in border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div>
                <h3 className="text-3xl font-black mb-1">Send Message</h3>
                <p className="text-red-100 font-bold opacity-90">Contacting {mailModal.ownerEmail}</p>
              </div>
              <button
                onClick={() => { setMailModal({ open: false, restaurantId: '', ownerEmail: '' }); setMailForm({ subject: '', message: '', files: [] }); }}
                className="hover:rotate-90 transition-transform bg-white/20 p-2 rounded-xl"
              >
                <X size={28} />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Subject</label>
                  <input
                    type="text"
                    value={mailForm.subject}
                    onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                    placeholder="What is this regarding?"
                    className="w-full px-6 py-4 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:outline-none bg-gray-50/50 font-medium text-lg transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Message</label>
                  <textarea
                    value={mailForm.message}
                    onChange={(e) => setMailForm({ ...mailForm, message: e.target.value })}
                    placeholder="Write your message here..."
                    className="w-full px-6 py-4 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:outline-none h-48 resize-none bg-gray-50/50 font-medium text-lg transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                    <img src="https://cdn-icons-png.flaticon.com/512/1055/1055644.png" className="w-4 h-4 opacity-50" alt="" />
                    Attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setMailForm({ ...mailForm, files: Array.from(e.target.files || []) })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-red-50 file:text-red-600 hover:file:bg-red-100 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={sendMessage}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-red-200 transform hover:-translate-y-1 active:scale-95"
                >
                  Send Message 🚀
                </button>
                <button
                  onClick={() => { setMailModal({ open: false, restaurantId: '', ownerEmail: '' }); setMailForm({ subject: '', message: '', files: [] }); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-5 rounded-2xl font-black text-xl transition-all border-2 border-gray-200 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Masterpiece Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-6 py-4 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[40px] overscroll-none">
        {[{ name: 'dashboard', emoji: '📊' }, { name: 'restaurants', emoji: '🍽️' }, { name: 'users', emoji: '👥' }, { name: 'orders', emoji: '📦' }, { name: 'transactions', emoji: '💳' }].map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-500 relative ${activeTab === tab.name ? 'text-red-600 transform -translate-y-4 scale-125' : 'text-gray-400'}`}
          >
            {activeTab === tab.name && (
              <div className="absolute -top-1 w-12 h-12 bg-red-600/10 rounded-full -z-10 animate-ping"></div>
            )}
            <span className="text-2xl">{tab.emoji}</span>
            {activeTab === tab.name && (
              <span className="text-[10px] font-black uppercase mt-1 tracking-widest">{tab.name.slice(0, 3)}</span>
            )}
            {tab.name === 'restaurants' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black animate-bounce shadow-md">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
