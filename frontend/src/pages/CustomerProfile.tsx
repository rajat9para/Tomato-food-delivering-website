import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Camera, Save, X, MapPin, Phone, Wallet, Clock, Shield, CheckCircle, AlertCircle, Crown, Zap, Star } from 'lucide-react';

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

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phone', formData.phone);
      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }

      const response = await api.put('/customer/profile', formDataToSend);

      if (response.data.user?.profilePhoto) {
        setPreviewPhoto(response.data.user.profilePhoto);
        updateAuthProfile(response.data.user.profilePhoto, response.data.user.premiumMember);
      }

      setProfilePhoto(null);
      showNotification('success', 'Profile updated successfully!');

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6 md:p-12 animate-fade-in relative">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-down ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold">{notification.message}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center relative">
          <h1 className="text-5xl font-display font-extrabold text-gray-900 mb-3 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Quick Stats & Photo */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100 text-center animate-scale-in">
              <div className="relative inline-block mb-8 group">
                {/* Premium Badge */}
                {formData.premiumMember && !isPremiumExpired && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl z-10 flex items-center gap-2 animate-pulse">
                    <Crown size={16} />
                    Premium Member
                  </div>
                )}

                <div className={`w-44 h-44 rounded-full border-4 shadow-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 mx-auto relative group-hover:scale-105 transition-transform duration-500 ${formData.premiumMember && !isPremiumExpired
                  ? 'border-yellow-400 shadow-yellow-500/50'
                  : 'border-primary shadow-neon'
                  }`}>
                  {previewPhoto ? (
                    <img
                      src={previewPhoto.startsWith('data:') ? previewPhoto : `${previewPhoto}?t=${Date.now()}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image load error:', previewPhoto);
                        e.currentTarget.src = '/api/placeholder/200/200';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white">
                      <User size={72} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-3 right-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white p-4 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 border border-pink-300/50">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">{formData.name || 'User Name'}</h2>
              <p className="text-gray-600 mb-8">{formData.email}</p>

              <div className="grid grid-cols-2 gap-6 text-left">
                <div
                  className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-200 cursor-pointer hover:bg-pink-100 transition-all duration-300 group"
                  onClick={() => setShowWalletModal(true)}
                >
                  <div className="flex items-center gap-3 text-primary mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <Wallet size={20} />
                    </div>
                    <span className="font-bold text-lg">Wallet Balance</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-gray-900 mb-2">₹{formData.walletBalance?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-500 font-medium group-hover:text-primary transition-colors">Click to recharge</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <Clock size={20} />
                    </div>
                    <span className="font-bold text-lg">Member Since</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-gray-900">
                    {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 font-medium mt-2">Active member</p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${formData.premiumMember && !isPremiumExpired
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              : 'bg-gradient-to-br from-primary to-primary-dark'
              }`}>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  {formData.premiumMember && !isPremiumExpired ? (
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                      <Crown size={32} className="text-yellow-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                      <Shield size={32} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-3xl font-display font-bold">Member Status</h3>
                    <p className="text-white/90 text-lg mt-2">
                      {formData.premiumMember && !isPremiumExpired ? 'Premium Member' : 'Standard Member'}
                    </p>
                  </div>
                </div>
                {formData.premiumMember && !isPremiumExpired ? (
                  <>
                    <p className="text-white/95 mb-6 text-lg leading-relaxed">
                      ⭐ You are a Premium Member! Enjoy exclusive benefits and free deliveries.
                    </p>
                    <div className="bg-white/20 rounded-2xl p-4 border border-white/30">
                      <p className="text-sm text-white/90 font-medium">Expires:</p>
                      <p className="text-xl font-display font-bold">
                        {formData.premiumExpiry ? new Date(formData.premiumExpiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white/95 mb-6 text-lg leading-relaxed">You are a verified standard member. Upgrade to Premium for free deliveries and exclusive benefits!</p>
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg flex items-center gap-3 transform hover:scale-105 active:scale-95"
                    >
                      <Zap size={24} />
                      <span>Upgrade to Premium</span>
                    </button>
                  </>
                )}
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-pink-100 animate-slide-in-up">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-pink-100">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white shadow-lg">
                  <User size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-gray-900">Personal Details</h3>
                  <p className="text-gray-600 text-base mt-1">Update your profile information</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-3 text-lg tracking-wide">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-lg input-premium"
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-3 text-lg tracking-wide">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-lg input-premium"
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-3 text-lg tracking-wide flex items-center gap-3">
                      <Phone size={24} className="text-primary" />
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-lg input-premium"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-gray-700 font-bold mb-3 text-lg tracking-wide flex items-center gap-3">
                      <MapPin size={24} className="text-primary" />
                      Delivery Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your address"
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-lg input-premium"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                  >
                    {saving ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="font-bold">Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={24} />
                        <span className="font-bold text-xl">Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/customer/home')}
                    className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 py-5 rounded-xl font-bold text-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-4 transform hover:-translate-y-2"
                  >
                    <X size={24} />
                    <span className="font-bold text-xl">Cancel</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 border border-pink-200 flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <AlertCircle size={32} />
              </div>
              <div className="flex-1">
                <h4 className="font-display font-bold text-2xl text-gray-900 mb-3">Privacy & Security</h4>
                <p className="text-gray-600 text-base leading-relaxed">
                  Your profile details are only visible to restaurant owners when you place an order. 
                  We value your privacy and never share your personal information with third parties. 
                  All data is encrypted and stored securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Recharge Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full animate-scale-in border-2 border-pink-100">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-xl">
                  <Wallet size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-gray-900">Recharge Wallet</h3>
                  <p className="text-gray-600 text-base mt-1">Add funds to your wallet</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:rotate-90"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Quick Select</label>
                <div className="grid grid-cols-2 gap-4">
                  {[10, 20, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setRechargeAmount(amount.toString())}
                      className={`py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        rechargeAmount === amount.toString()
                          ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-pink-500/30 transform scale-105'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none bg-gray-50/50 font-bold text-2xl transition-colors input-premium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  {['UPI', 'Card'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${
                        paymentMethod === method
                          ? 'border-primary bg-gradient-to-r from-pink-50 to-purple-50 text-primary'
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
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
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-6 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold">Processing...</span>
                  </div>
                ) : (
                  <span className="font-bold">Recharge ₹{parseFloat(rechargeAmount || '0').toFixed(2)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Purchase Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white p-4 rounded-4xl shadow-2xl max-w-lg w-full animate-scale-in border-4 border-yellow-400/50">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-[2.5rem] p-10 text-white text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:rotate-90"
              >
                <X size={28} />
              </button>
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Crown size={48} fill="white" />
              </div>
              <h3 className="text-4xl font-display font-black mb-4">Join Tomato Gold</h3>
              <p className="text-white/95 text-lg font-semibold leading-relaxed">Unlock exclusive benefits and save more on every order!</p>
            </div>

            <div className="p-10 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Zap size={32} />
                  </div>
                  <div>
                    <p className="font-display font-black text-2xl text-gray-900">Free Delivery</p>
                    <p className="text-yellow-700 text-base font-bold mt-2">On all orders above ₹199</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Star size={32} />
                  </div>
                  <div>
                    <p className="font-display font-black text-2xl text-gray-900">VIP Access</p>
                    <p className="text-purple-700 text-base font-bold mt-2">Early access to mega deals</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-black text-2xl text-gray-900">Exclusive Discounts</p>
                    <p className="text-green-700 text-base font-bold mt-2">Special offers for premium members</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <button
                  onClick={() => handlePremiumPurchase('monthly')}
                  disabled={processing}
                  className="w-full group bg-white border-3 border-gray-100 hover:border-primary p-8 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-lg hover:shadow-2xl hover:-translate-y-3 transform hover:scale-105 active:scale-100"
                >
                  <div className="text-left">
                    <span className="block font-display font-black text-2xl text-gray-900">Monthly Plan</span>
                    <span className="text-base text-gray-600 font-semibold mt-2 block">Standard Gold Access</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-display font-black text-4xl text-primary">₹79</span>
                    <span className="text-base text-gray-500 font-semibold">per month</span>
                  </div>
                </button>

                <button
                  onClick={() => handlePremiumPurchase('yearly')}
                  disabled={processing}
                  className="w-full group bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-3 border-yellow-400/50 hover:border-yellow-400 p-8 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-lg hover:shadow-2xl hover:-translate-y-3 transform hover:scale-105 active:scale-100 relative overflow-hidden"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border border-yellow-300/50 animate-pulse">
                    Save 25%
                  </div>
                  <div className="text-left">
                    <span className="block font-display font-black text-2xl text-gray-900">Yearly Plan</span>
                    <span className="text-base text-gray-600 font-semibold mt-2 block">Best Value - Save 25%</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-display font-black text-4xl text-yellow-600">₹699</span>
                    <span className="text-base text-gray-500 font-semibold">per year</span>
                  </div>
                </button>
              </div>

              {processing && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-14 h-14 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                  <p className="font-display font-bold text-yellow-600 text-xl animate-pulse">Processing Gold Activation...</p>
                  <p className="text-gray-600 text-sm">Please wait while we upgrade your account</p>
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
