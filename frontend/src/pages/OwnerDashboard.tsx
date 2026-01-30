import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Camera, X } from 'lucide-react';
import GlobalBackground from '../components/GlobalBackground';
import ImageCarousel from '../components/ImageCarousel';
import { getImageUrl } from '../utils/formatters';

const OwnerDashboard = () => {
  const { logout, name } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [revenueMonth, setRevenueMonth] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [timePeriod, setTimePeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingFood, setEditingFood] = useState<any>(null);
  const [newFood, setNewFood] = useState({ name: '', description: '', price: '', category: 'Main Course', discount: '0' });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [editDetails, setEditDetails] = useState({
    name: '',
    address: '',
    phone: '',
    openingTime: '',
    closingTime: '',
    description: ''
  });




  useEffect(() => {
    loadData();
    checkNewOrders();
    loadMessages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Optimized Polling: Only if visible, every 30s
      if (document.visibilityState === 'visible') {
        loadData(true, true);
        checkNewOrders();
      }
    }, 30000); // Increased from 3s to 30s
    return () => clearInterval(interval);
  }, [activeTab, timePeriod]);

  useEffect(() => {
    loadData(true);
  }, [activeTab, timePeriod]);

  const toggleKitchenStatus = async () => {
    try {
      const res = await api.patch('/owner/restaurant/toggle-status');
      setRestaurant((prev: any) => prev ? { ...prev, activeStatus: res.data.activeStatus } : null);
    } catch (error) {
      console.error('Error toggling kitchen status:', error);
    }
  };

  const checkNewOrders = async () => {
    try {
      const { data: ord } = await api.get('/owner/orders');
      const pendingOrders = ord.filter((o: any) => o.orderStatus === 'pending');
      setNewOrdersCount(pendingOrders.length);
    } catch (error) {
      console.error('Error checking orders:', error);
    }
  };

  const loadData = async (skipEditDetails = false, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const { data } = await api.get('/owner/restaurant');
      setRestaurant(data);

      if (data && !skipEditDetails) {
        setEditDetails({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '22:00',
          description: data.description || ''
        });
      }

      if (activeTab === 'menu') {
        const items = await api.get('/owner/food');
        setFoodItems(items.data);
      } else if (activeTab === 'orders') {
        const ord = await api.get('/owner/orders');
        setOrders(ord.data);
        setNewOrdersCount(0);
      } else if (activeTab === 'revenue') {
        const rev = await api.get('/owner/revenue', {
          params: { period: timePeriod }
        });

        setRevenue(rev.data.revenue);
        setTodayRevenue(rev.data.todayRevenue);
        setWeeklyRevenue(rev.data.weeklyRevenue);
        setMonthlyRevenue(rev.data.monthlyRevenue);
        setYearlyRevenue(rev.data.yearlyRevenue);
        setRevenueMonth(rev.data.periodLabel);
        setTotalOrders(rev.data.totalOrders);
        setTodayOrders(rev.data.todayOrders);
        setWeeklyOrders(rev.data.weeklyOrders);
        setMonthlyOrders(rev.data.monthlyOrders);
        setAvgOrderValue(rev.data.avgOrderValue);
        setMonthlyData(rev.data.chartData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const createRestaurant = async () => {
    try {
      if (!restaurantName.trim()) {
        alert('Please enter restaurant name');
        return;
      }

      let imageUrl = '';
      if (restaurantImage) {
        imageUrl = await convertToBase64(restaurantImage);
      }

      await api.post('/owner/restaurant', { name: restaurantName, imageUrl });
      setRestaurantName('');
      setRestaurantImage(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating restaurant');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 4);
      setSelectedImages(fileArray);
    }
  };

  const handleRestaurantImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestaurantImage(file);
    }
  };

  const openEditForm = (item: any) => {
    setEditingFood(item);
    setNewFood({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category || 'Main Course',
      discount: (item.discount || 0).toString()
    });
    setSelectedImages([]);
    setShowAddFood(true);
  };

  const cancelEdit = () => {
    setEditingFood(null);
    setShowAddFood(false);
    setNewFood({ name: '', description: '', price: '', category: 'Main Course', discount: '0' });
    setSelectedImages([]);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const addFood = async () => {
    try {
      if (!newFood.name || !newFood.description || !newFood.price) {
        alert('Please fill all required fields');
        return;
      }

      if (selectedImages.length === 0 && !editingFood) {
        alert('Please select at least one image');
        return;
      }

      const discount = parseFloat(newFood.discount) || 0;
      if (discount < 0 || discount > 100) {
        alert('Discount must be between 0 and 100');
        return;
      }

      let imageArray: string[] = [];
      if (selectedImages.length > 0) {
        imageArray = await Promise.all(selectedImages.map(file => convertToBase64(file)));
      } else if (editingFood) {
        imageArray = editingFood.images || [];
      }

      const foodData = {
        name: newFood.name,
        description: newFood.description,
        price: parseFloat(newFood.price),
        category: newFood.category,
        discount: discount,
        images: imageArray
      };

      if (editingFood) {
        await api.patch(`/owner/food/${editingFood._id}`, foodData);
      } else {
        await api.post('/owner/food', foodData);
      }

      cancelEdit();
      loadData(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving food item');
    }
  };

  const toggleAvailability = async (id: string, availability: boolean) => {
    try {
      await api.patch(`/owner/food/${id}`, { availability: !availability });
      loadData(true);
    } catch (error) {
      console.error('Error updating food:', error);
    }
  };

  const deleteFood = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/owner/food/${id}`);
      loadData(true);
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt('Type "YES" to permanently delete your account and all data:');
    if (confirmation === 'YES') {
      try {
        await api.delete('/owner/account');
        alert('Account deleted successfully');
        logout();
        navigate('/login');
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error deleting account');
      }
    } else if (confirmation !== null) {
      alert('Account deletion cancelled. You must type "YES" exactly.');
    }
  };

  const updateRestaurantImage = async (file: File) => {
    try {
      const imageUrl = await convertToBase64(file);
      await api.patch('/owner/restaurant/image', { imageUrl });
      loadData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating restaurant image');
    }
  };

  const updateRestaurantDetails = async () => {
    try {
      console.log('Sending update with editDetails:', editDetails);
      const response = await api.patch('/owner/restaurant/details', editDetails);
      console.log('Received response:', response.data);
      console.log('Response name:', response.data.name);

      setRestaurant(response.data);

      console.log('Restaurant state updated');
      alert('Restaurant details updated successfully');
    } catch (error: any) {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Error updating restaurant details');
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/owner/orders/${id}`, { orderStatus: status });
      loadData(true);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData } = await api.get('/owner/messages');
      const { data: unreadData } = await api.get('/owner/messages/unread-count');
      setMessages(messagesData);
      setUnreadMessagesCount(unreadData.unreadCount);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await api.patch(`/owner/messages/${messageId}/read`);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      setUnreadMessagesCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <GlobalBackground />
      <nav className="bg-white shadow-lg border-b-2 border-primary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-8">
            <div className="flex items-center gap-2 md:gap-3">
              <img src="/tomato-logo.png" alt="TOMATO" className="w-8 h-8 md:w-10 md:w-10 object-contain" />
              <h1 className="text-xl md:text-3xl font-bold text-primary italic">TOMATO</h1>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {restaurant?.imageUrl ? (
                <img src={getImageUrl(restaurant.imageUrl)} alt={restaurant.name} className="w-10 h-10 object-cover rounded-full border-2 border-primary" />
              ) : restaurant ? (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-primary">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              ) : null}
              <span className="text-gray-700 text-lg">Welcome, <span className="font-bold text-gray-900">{name}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Kitchen Status Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Kitchen Status</span>
                <span className={`text-[10px] font-bold ${restaurant?.activeStatus ? 'text-green-600' : 'text-red-500'} uppercase`}>
                  {restaurant?.activeStatus ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={toggleKitchenStatus}
                className={`w-12 h-6 rounded-full transition-all duration-500 relative shadow-inner ${restaurant?.activeStatus ? 'bg-green-500 shadow-green-200' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${restaurant?.activeStatus ? 'left-7 ring-2 ring-green-100' : 'left-1'}`}></div>
              </button>
            </div>

            {newOrdersCount > 0 && (
              <div className="relative">
                <span className="text-2xl md:text-3xl cursor-pointer" title={`${newOrdersCount} new orders`}>🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold">
                  {newOrdersCount}
                </span>
              </div>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-primary hover:bg-primary-dark text-white px-4 md:px-8 py-2 md:py-3 rounded-lg font-bold text-sm md:text-lg transition shadow-md whitespace-nowrap">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 bg-white border-r-2 border-primary/20 min-h-screen p-6 shadow-lg sticky top-24 h-[calc(100vh-6rem)]">
          <div className="space-y-3">
            {[{ name: 'menu', emoji: '🍽️' }, { name: 'orders', emoji: '📦' }, { name: 'revenue', emoji: '📊' }, { name: 'messages', emoji: '💬' }, { name: 'settings', emoji: '⚙️' }].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full p-4 text-left rounded-xl font-bold text-lg transition-all relative flex items-center gap-4 group overflow-hidden ${activeTab === tab.name
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200 translate-x-1'
                  : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                  }`}
              >
                {/* Active Indicator Line */}
                {activeTab === tab.name && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}

                <span className={`text-2xl transition-transform group-hover:scale-110 ${activeTab === tab.name ? 'scale-110' : ''}`}>{tab.emoji}</span>
                <span className="tracking-wide">{tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}</span>

                {tab.name === 'orders' && newOrdersCount > 0 && (
                  <span className="ml-auto bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm loading-pulse">
                    {newOrdersCount}
                  </span>
                )}
                {tab.name === 'messages' && unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-blue-50 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary/20 z-50 px-2 py-2 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          {[{ name: 'menu', emoji: '🍽️', label: 'Menu' }, { name: 'orders', emoji: '📦', label: 'Orders' }, { name: 'revenue', emoji: '📊', label: 'Rev' }, { name: 'messages', emoji: '💬', label: 'Msg' }, { name: 'settings', emoji: '⚙️', label: 'Set' }].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all relative ${activeTab === tab.name
                ? 'text-primary transform scale-110'
                : 'text-gray-500'
                }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[10px] font-bold mt-1 uppercase">{tab.label}</span>
              {tab.name === 'orders' && newOrdersCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold animate-pulse">
                  {newOrdersCount}
                </span>
              )}
              {tab.name === 'messages' && unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
              {activeTab === tab.name && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {activeTab === 'menu' && (
            <div className="animate-slide-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Menu Management</h2>
                {restaurant ? (
                  restaurant.approvalStatus === 'approved' ? (
                    <button
                      onClick={() => {
                        setEditingFood(null);
                        setNewFood({ name: '', description: '', price: '', category: 'Main Course', discount: '0' });
                        setSelectedImages([]);
                        setShowAddFood(true);
                      }}
                      className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                    >
                      <span>➕</span> Add Food Item
                    </button>
                  ) : (
                    <div className="w-full bg-yellow-100 border-2 border-yellow-500 text-yellow-800 px-4 py-3 rounded-xl font-bold text-sm md:text-base">
                      Restaurant Status: {restaurant.approvalStatus.toUpperCase()} - Waiting for admin approval
                    </div>
                  )
                ) : (
                  <div className="w-full bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-xl font-bold text-sm md:text-base">
                    Please create a restaurant first in Settings
                  </div>
                )}
              </div>

              {showAddFood && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in border border-white/30">
                    {/* Header - Compact & Elegant */}
                    <div className="bg-gradient-to-r from-[#E23744] to-[#d62b38] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                      <div>
                        <h3 className="text-lg font-bold">{editingFood ? 'Edit Dish' : 'Add New Dish'}</h3>
                        <p className="text-white/70 text-xs">Fill in the details below</p>
                      </div>
                      <button
                        onClick={cancelEdit}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Form - Horizontal 2-column layout */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                          {/* Dish Name */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Dish Name</label>
                            <input
                              type="text"
                              placeholder="Enter name"
                              value={newFood.name}
                              onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                            <select
                              value={newFood.category}
                              onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm appearance-none cursor-pointer"
                            >
                              <option>Main Course</option>
                              <option>Appetizer</option>
                              <option>Dessert</option>
                              <option>Beverage</option>
                            </select>
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={newFood.price}
                              onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>

                          {/* Discount */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Discount (%)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={newFood.discount}
                              onChange={(e) => setNewFood({ ...newFood, discount: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          {/* Description */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <textarea
                              placeholder="Brief description"
                              value={newFood.description}
                              onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm h-20 resize-none"
                            />
                          </div>

                          {/* Photos Upload */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Photos</label>
                            <label className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group gap-2">
                              <Camera className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
                              <span className="text-gray-500 text-xs group-hover:text-primary transition-colors">Upload images</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                            {selectedImages.length > 0 && (
                              <div className="mt-2 flex gap-1.5 flex-wrap">
                                {selectedImages.map((file, idx) => (
                                  <div key={idx} className="w-10 h-10 rounded-md overflow-hidden border border-gray-200">
                                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buttons Row */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={addFood}
                          className="flex-1 bg-gradient-to-r from-[#E23744] to-[#d62b38] text-white py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                        >
                          {editingFood ? 'Save Changes' : 'Add Dish'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">

                {foodItems.map((item: any) => (
                  <div key={item._id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 shadow-xl transform hover:-translate-y-2">
                    {item.images && item.images.length > 0 ? (
                      <div className="h-64 overflow-hidden relative">
                        <ImageCarousel images={item.images} alt={item.name} />
                        {item.discount > 0 && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white px-4 py-2 rounded-lg text-lg font-bold z-20 shadow-lg">
                            {item.discount}% OFF
                          </div>
                        )}
                        {item.images.length > 1 && (
                          <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-bold z-20">
                            +{item.images.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-lg font-semibold">No Image</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.name}</h3>
                      <p className="text-gray-700 text-base mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          {item.discount > 0 ? (
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-bold text-primary">₹{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
                              <span className="text-lg text-gray-400 line-through">₹{item.price}</span>
                            </div>
                          ) : (
                            <span className="text-3xl font-bold text-primary">₹{item.price}</span>
                          )}
                        </div>
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          title={item.availability ? 'Available' : 'Not Available'}
                        >
                          <input
                            type="checkbox"
                            checked={item.availability}
                            onChange={() => toggleAvailability(item._id, item.availability)}
                            className="sr-only peer"
                          />
                          <div className={`w-12 h-6 rounded-full transition-all duration-300 ${item.availability ? 'bg-green-500' : 'bg-gray-600'} peer-checked:bg-green-500`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${item.availability ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditForm(item)}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-lg transition shadow-lg transform hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFood(item._id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-lg transition shadow-lg transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-slide-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Order Management</h2>
              <div className="space-y-4 md:space-y-6">
                {orders.map((order: any) => (
                  <div key={order._id} className="bg-white border-2 border-gray-200 rounded-2xl p-4 md:p-6 shadow-xl transform transition hover:scale-[1.01]">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Order #{order._id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${order.orderStatus === 'completed' ? 'bg-green-100 text-green-700' :
                            order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.orderStatus === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium text-sm">👤 {order.customerId?.name}</p>
                        <p className="text-gray-500 text-xs">📞 {order.customerId?.phone}</p>
                      </div>
                      <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0">
                        <p className="text-2xl font-black text-primary">₹{order.totalAmount}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            <span className="font-bold text-primary mr-1">{item.quantity}x</span>
                            {item.foodId?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-2">

                      {order.orderStatus === 'pending' && (
                        <button onClick={() => updateOrderStatus(order._id, 'preparing')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition shadow-sm">
                          Start Preparing
                        </button>
                      )}
                      {order.orderStatus === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order._id, 'ready')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition shadow-sm">
                          Mark Ready
                        </button>
                      )}
                      {order.orderStatus === 'ready' && (
                        <button onClick={() => updateOrderStatus(order._id, 'completed')} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition shadow-sm">
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="animate-slide-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Revenue Analytics</h2>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
                  <span className="ml-4 text-gray-600">Loading analytics...</span>
                </div>
              )}

              {/* Time Period Selector */}
              <div className="flex justify-center gap-3 mb-8">
                {(['today', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-6 py-3 rounded-xl font-bold text-base transition-all shadow-md ${timePeriod === period
                      ? 'bg-primary text-white shadow-xl transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-primary/10 hover:text-primary border-2 border-gray-200'
                      }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              {/* Statistics Cards */}
              {/* Statistics Cards - Royal Theme */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
                      <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{timePeriod} Sales</p>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">
                      ₹{timePeriod === 'today' ? todayRevenue.toLocaleString() :
                        timePeriod === 'weekly' ? weeklyRevenue.toLocaleString() :
                          timePeriod === 'monthly' ? monthlyRevenue.toLocaleString() :
                            timePeriod === 'yearly' ? yearlyRevenue.toLocaleString() : revenue.toLocaleString()}
                    </p>
                    <p className="text-red-500 text-[10px] mt-1 font-bold">
                      {timePeriod === 'today' ? todayOrders :
                        timePeriod === 'weekly' ? weeklyOrders :
                          timePeriod === 'monthly' ? monthlyOrders :
                            timePeriod === 'yearly' ? totalOrders : totalOrders} orders
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                      <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total Revenue</p>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">₹{revenue.toLocaleString()}</p>
                    <p className="text-gray-400 text-[10px] mt-1 font-bold">Lifetime Earnings</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
                      <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total Orders</p>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">{totalOrders.toLocaleString()}</p>
                    <p className="text-gray-400 text-[10px] mt-1 font-bold">Completed Orders</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-shadow group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">🎯</span>
                      <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Avg Order Value</p>
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">₹{avgOrderValue.toLocaleString()}</p>
                    <p className="text-gray-400 text-[10px] mt-1 font-bold">Per Order</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Revenue Graph */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 font-display">
                  Revenue Trend - {revenueMonth || timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                </h3>
                {monthlyData && monthlyData.length > 0 ? (
                  <div className="relative h-80 pl-16">
                    <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 60 + 10}
                          x2="800"
                          y2={i * 60 + 10}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Line graph */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        points={monthlyData
                          .map((item, index) => {
                            const maxRevenue = Math.max(...monthlyData.map(d => d.value || d.revenue || 0));
                            const x = (index / (monthlyData.length - 1)) * 800;
                            const y = 270 - ((item.value || item.revenue || 0) / maxRevenue) * 240;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />

                      {/* Data points */}
                      {monthlyData.map((item, index) => {
                        const maxRevenue = Math.max(...monthlyData.map(d => d.value || d.revenue || 0));
                        const x = (index / (monthlyData.length - 1)) * 800;
                        const y = 270 - ((item.value || item.revenue || 0) / maxRevenue) * 240;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#3b82f6"
                          />
                        );
                      })}
                    </svg>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-4">
                      {monthlyData.map((item, index) => (
                        <span key={index} className="text-xs text-gray-600 font-medium">
                          {item.label || item.month || index + 1}
                        </span>
                      ))}
                    </div>

                    {/* Y-axis label */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 font-medium py-2">
                      {[0, 1, 2, 3, 4].map((i) => {
                        const maxRevenue = Math.max(...monthlyData.map(d => d.value || d.revenue || 0));
                        const value = Math.round((maxRevenue * (4 - i)) / 4);
                        return <span key={i}>₹{value.toLocaleString()}</span>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <p>No revenue data available for this period</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slide-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Settings</h2>

              {/* Restaurant Profile Section */}
              {!restaurant ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Your Restaurant</h3>
                  <input
                    type="text"
                    placeholder="Restaurant Name *"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-800 placeholder:text-gray-400 mb-4"
                  />
                  <div className="mb-4">
                    <label className="block font-semibold text-gray-800 mb-3">Upload Restaurant Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRestaurantImageSelect}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition text-gray-800"
                    />
                    {restaurantImage && (
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(restaurantImage)}
                          alt="Restaurant Logo Preview"
                          className="w-32 h-32 object-cover rounded-full border-4 border-primary shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                  <button onClick={createRestaurant} className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold transition shadow-md">
                    Create Restaurant
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Profile</h3>
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative group">
                      {restaurant.imageUrl ? (
                        <img src={restaurant.imageUrl} alt={restaurant.name} className="w-32 h-32 object-cover rounded-full border-4 border-primary shadow-lg" />
                      ) : (
                        <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                          {restaurant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <span className="text-white font-bold text-sm">Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateRestaurantImage(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Restaurant Name</label>
                      <input
                        type="text"
                        value={editDetails.name}
                        onChange={(e) => setEditDetails({ ...editDetails, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-800 font-bold text-xl"
                        placeholder="Restaurant Name"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editDetails.description}
                        onChange={(e) => setEditDetails({ ...editDetails, description: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={editDetails.address}
                        onChange={(e) => setEditDetails({ ...editDetails, address: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={editDetails.phone}
                        onChange={(e) => setEditDetails({ ...editDetails, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Opening Time</label>
                        <input
                          type="time"
                          value={editDetails.openingTime}
                          onChange={(e) => setEditDetails({ ...editDetails, openingTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Closing Time</label>
                        <input
                          type="time"
                          value={editDetails.closingTime}
                          onChange={(e) => setEditDetails({ ...editDetails, closingTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={updateRestaurantDetails}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold transition shadow-md mb-4"
                  >
                    Save Changes
                  </button>

                  <div className="space-y-4 pt-4 border-t-2 border-gray-200">
                    <p className="text-lg text-gray-700">
                      Status: <span className={`font-bold ${restaurant.approvalStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {restaurant.approvalStatus.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-lg text-gray-700">Active: <span className={restaurant.activeStatus ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{restaurant.activeStatus ? 'Yes' : 'No'}</span></p>
                    {restaurant.approvalStatus === 'pending' && (
                      <p className="text-yellow-600 font-semibold">Waiting for admin approval...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Account Deletion Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h3>
                <button
                  onClick={deleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition shadow-md"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="animate-slide-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Admin Messages</h2>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center shadow-xl">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">No Messages Yet</h3>
                    <p className="text-gray-500">Admin messages will appear here when sent to you.</p>
                  </div>
                ) : (
                  messages.map((message: any) => (
                    <div
                      key={message._id}
                      className={`bg-white border-2 rounded-2xl p-6 shadow-xl transform transition hover:scale-[1.01] ${!message.isRead ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">👑</span>
                            <h3 className="text-lg font-bold text-gray-900">Admin Message</h3>
                            {!message.isRead && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">NEW</span>
                            )}
                          </div>
                          {message.subject && (
                            <h4 className="text-md font-semibold text-primary mb-2">{message.subject}</h4>
                          )}
                          <p className="text-gray-700 leading-relaxed">{message.message}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{new Date(message.createdAt).toLocaleDateString()}</p>
                          <p>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Attachments:</p>
                          <div className="flex gap-2 flex-wrap">
                            {message.attachments.map((attachment: string, index: number) => (
                              <a
                                key={index}
                                href={`http://localhost:5000${attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-dark transition"
                              >
                                📎 File {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {!message.isRead && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => markMessageAsRead(message._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition shadow-md"
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div >
    </div >
  );
};

export default OwnerDashboard;
