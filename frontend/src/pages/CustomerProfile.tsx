import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Camera, Save, X, MapPin, Phone, Wallet, Clock, Shield, CheckCircle, AlertCircle, Crown, Zap, Star } from 'lucide-react';
import { getImageUrl } from '../utils/formatters';

interface UserData {
  name: string;
  email: string;
  address: string;
  phone: string;
  profilePhoto?: string;
  createdAt?: string;
  walletBalance?: number;
  premiumMember?: boolean;
  premiumExpiry?: Date;
}

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { updateProfile: updateAuthProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    address: '',
    phone: '',
    walletBalance: 0,
    premiumMember: false
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customer/profile');
      setFormData({
        name: data.name || '',
        email: data.email || '',
        address: data.address || '',
        phone: data.phone || '',
        createdAt: data.createdAt,
        walletBalance: data.walletBalance || 0,
        premiumMember: data.premiumMember || false,
        premiumExpiry: data.premiumExpiry
      });
      if (data.profilePhoto) {
        setPreviewPhoto(data.profilePhoto);
        updateAuthProfile(data.profilePhoto, data.premiumMember);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('error', 'Image size must be less than 2MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Validation
      if (!formData.name.trim() || !formData.email.trim()) {
        showNotification('error', 'Name and Email are required');
        setSaving(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phone', formData.phone);
      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }

      // FIX: Use the configured 'api' instance instead of raw axios
      const response = await api.put('/customer/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // FIX: Ensure photo preview persists - only update if new photo returned
      if (response.data.user?.profilePhoto) {
        const newPhotoUrl = response.data.user.profilePhoto;
        setPreviewPhoto(newPhotoUrl);
        updateAuthProfile(newPhotoUrl, response.data.user.premiumMember);
      }
      // Keep existing preview if no new photo was uploaded and none returned

      setProfilePhoto(null); // Clear staged file, but keep preview
      showNotification('success', 'Profile updated successfully!');

      // Reload profile to ensure sync
      loadProfile();

    } catch (error: any) {
      console.error('Frontend error:', error);
      const msg = error.response?.data?.message || 'Error updating profile';
      showNotification('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleWalletRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }
    if (amount > 10000) {
      showNotification('error', 'Maximum recharge amount is $10,000');
      return;
    }

    try {
      setProcessing(true);
      const { data } = await api.post('/customer/wallet/recharge', {
        amount,
        paymentMethod
      });

      setFormData(prev => ({ ...prev, walletBalance: data.walletBalance }));
      showNotification('success', `Wallet recharged successfully! Transaction ID: ${data.transactionId}`);
      setShowWalletModal(false);
      setRechargeAmount('');
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Recharge failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePremiumPurchase = async (plan: 'monthly' | 'yearly') => {
    try {
      setProcessing(true);
      const { data } = await api.post('/customer/premium/purchase', {
        paymentMethod,
        plan
      });

      setFormData(prev => ({
        ...prev,
        premiumMember: true,
        premiumExpiry: data.premiumExpiry
      }));
      updateAuthProfile(undefined, true);
      showNotification('success', `Premium activated! Transaction ID: ${data.transactionId}`);
      setShowPremiumModal(false);
      loadProfile(); // Reload to get updated data
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  const isPremiumExpired = formData.premiumMember && formData.premiumExpiry && new Date(formData.premiumExpiry) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 animate-fade-in relative">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-down ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold">{notification.message}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center relative">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 font-display">
            My Profile
          </h1>
          <p className="text-gray-500 text-lg">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Quick Stats & Photo */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 text-center animate-scale-in">
              <div className="relative inline-block mb-6 group">
                {/* Premium Badge */}
                {formData.premiumMember && !isPremiumExpired && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 flex items-center gap-1">
                    <Crown size={12} />
                    Premium
                  </div>
                )}

                <div className={`w-40 h-40 rounded-full border-4 shadow-2xl overflow-hidden bg-gray-100 mx-auto relative group-hover:scale-105 transition-transform duration-300 ${formData.premiumMember && !isPremiumExpired
                  ? 'border-yellow-400 shadow-yellow-500/50'
                  : 'border-white'
                  }`}>
                  {previewPhoto ? (
                    <img
                      src={getImageUrl(previewPhoto)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-white">
                      <User size={64} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-2 right-2 bg-primary hover:bg-primary-dark text-white p-3 rounded-full cursor-pointer shadow-lg transition-all hover:scale-110 active:scale-95">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-bold text-gray-800">{formData.name || 'User Name'}</h2>
              <p className="text-gray-500 mb-6">{formData.email}</p>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div
                  className="bg-orange-50 p-4 rounded-2xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition"
                  onClick={() => setShowWalletModal(true)}
                >
                  <div className="flex items-center gap-2 text-orange-600 mb-1">
                    <Wallet size={18} />
                    <span className="font-bold text-sm">Wallet</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">₹{formData.walletBalance?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-orange-600 mt-1">Click to recharge</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Clock size={18} />
                    <span className="font-bold text-sm">Joined</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all ${formData.premiumMember && !isPremiumExpired
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              : 'bg-gradient-to-br from-primary to-primary-dark'
              }`}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  {formData.premiumMember && !isPremiumExpired ? (
                    <Crown className="bg-white/20 p-2 rounded-lg box-content" size={24} />
                  ) : (
                    <Shield className="bg-white/20 p-2 rounded-lg box-content" size={24} />
                  )}
                  <h3 className="font-bold text-xl">Member Status</h3>
                </div>
                {formData.premiumMember && !isPremiumExpired ? (
                  <>
                    <p className="text-white/90 mb-4">
                      ⭐ You are a Premium Member! Enjoy exclusive benefits and free deliveries.
                    </p>
                    <p className="text-sm text-white/80">
                      Expires: {formData.premiumExpiry ? new Date(formData.premiumExpiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white/90 mb-4">You are a verified standard member. Upgrade to Premium for free deliveries!</p>
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="bg-white text-primary px-4 py-2 rounded-xl font-bold hover:bg-gray-100 transition shadow-md flex items-center gap-2"
                    >
                      <Zap size={16} />
                      Upgrade Now
                    </button>
                  </>
                )}
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-slide-in-up">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <User className="text-primary" size={24} />
                <h3 className="text-2xl font-bold text-gray-900">Personal Details</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-2 ml-1 text-sm duration-200 group-focus-within:text-primary">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-2 ml-1 text-sm duration-200 group-focus-within:text-primary">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-2 ml-1 text-sm flex items-center gap-2 duration-200 group-focus-within:text-primary">
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-2 ml-1 text-sm flex items-center gap-2 duration-200 group-focus-within:text-primary">
                      <MapPin size={16} />
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/customer/home')}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-bold text-lg transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3"
                  >
                    <X size={20} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Profile Visibility</h4>
                <p className="text-blue-700 text-sm">Your profile details are only visible to restaurant owners when you place an order. We value your privacy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Recharge Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md w-full animate-scale-in border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <Wallet className="text-orange-600" size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Recharge Wallet</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:rotate-90 transition-transform"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Quick Select</label>
                <div className="grid grid-cols-4 gap-3">
                  {[10, 20, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setRechargeAmount(amount.toString())}
                      className={`py-3 rounded-xl font-bold transition-all ${rechargeAmount === amount.toString()
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Custom Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-100 rounded-2xl focus:border-orange-500 focus:outline-none bg-gray-50/50 font-bold text-lg transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {['UPI', 'Card'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl font-bold transition-all border-2 ${paymentMethod === method
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleWalletRecharge}
                disabled={processing}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-orange-200 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {processing ? 'Processing...' : `Recharge ₹${parseFloat(rechargeAmount || '0').toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Purchase Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-2 rounded-[3.5rem] shadow-[0_0_100px_rgba(255,215,0,0.2)] max-w-lg w-full animate-scale-in border-4 border-yellow-400">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-[3rem] p-10 text-white text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-6 right-6 hover:rotate-90 transition-transform"
              >
                <X size={28} />
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown size={40} fill="white" />
              </div>
              <h3 className="text-3xl font-black mb-3">Join Tomato Gold</h3>
              <p className="text-white/90 font-bold">Unlock exclusive benefits and save more!</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                  <div className="p-2 bg-yellow-400 rounded-lg text-white">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">Free Delivery</p>
                    <p className="text-xs text-yellow-700 font-bold">On all orders above ₹199</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                  <div className="p-2 bg-yellow-400 rounded-lg text-white">
                    <Star size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">VIP Access</p>
                    <p className="text-xs text-yellow-700 font-bold">Early access to mega deals</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handlePremiumPurchase('monthly')}
                  disabled={processing}
                  className="w-full group bg-white border-3 border-gray-100 hover:border-yellow-400 p-6 rounded-[2rem] transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="text-left">
                    <span className="block font-black text-gray-800 text-xl">Monthly Plan</span>
                    <span className="text-sm text-gray-500 font-bold">Standard Gold Access</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-yellow-600 text-2xl">₹79</span>
                    <span className="text-xs text-gray-400 font-bold">per month</span>
                  </div>
                </button>

                <button
                  onClick={() => handlePremiumPurchase('yearly')}
                  disabled={processing}
                  className="w-full group bg-gradient-to-br from-yellow-400/5 to-yellow-600/5 border-3 border-yellow-400/30 hover:border-yellow-400 p-6 rounded-[2rem] transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 relative"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">Best Value</div>
                  <div className="text-left">
                    <span className="block font-black text-gray-800 text-xl">Yearly Plan</span>
                    <span className="text-sm text-gray-500 font-bold">Save 25% with Annual Billing</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-yellow-600 text-2xl">₹699</span>
                    <span className="text-xs text-gray-400 font-bold">per year</span>
                  </div>
                </button>
              </div>

              {processing && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin"></div>
                  <p className="font-bold text-yellow-600 animate-pulse">Processing Gold Activation...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
