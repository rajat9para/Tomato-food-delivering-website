import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Store } from 'lucide-react';

const CustomerCart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getTotal, getItemsByRestaurant, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const itemsByRestaurant = getItemsByRestaurant();

  const handleCheckoutClick = async () => {
    setCheckoutLoading(true);
    try {
      const profileResponse = await api.get('/customer/profile');
      const user = profileResponse.data;
      setUserInfo(user);

      if (!user.name || !user.phone || !user.address) {
        if (confirm('Please complete your profile (Name, Phone, Address) before placing an order. Go to Profile?')) {
          navigate('/customer/profile');
        }
        setShowCheckout(false);
        return;
      }
      setShowCheckout(true);
    } catch (error) {
      console.error("Error fetching profile", error);
      alert("Failed to verify profile. Please check your connection.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePlaceOrder = async (paymentMethod: string) => {
    if (!cart.length || !userInfo) return;

    setCheckoutLoading(true);
    try {
      // Process orders for each restaurant separately
      const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantId, items]) => {
        const restaurantTotal = items.reduce((sum, item) => {
          const price = item.price * (1 - item.discount / 100);
          return sum + price * item.quantity;
        }, 0);

        const payload = {
          restaurantId,
          items: items.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: restaurantTotal,
          paymentMethod,
          deliveryAddress: {
            name: userInfo.name,
            phone: userInfo.phone,
            address: userInfo.address
          }
        };

        return api.post('/customer/orders', payload);
      });

      await Promise.all(orderPromises);

      // Success
      clearCart();
      setShowCheckout(false);
      navigate('/customer/orders');

      // We could show a toast/notification here instead of alert, but alert ensures they see it.
      // Ideally use a custom modal or toast component.

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="w-64 h-64 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-8 animate-float">
          <img
            src="https://b.zmtcdn.com/data/webuikit/9f928a05a329b3659e01.png" // Zomato-like empty cart illustration placeholder
            alt="Empty Cart"
            className="w-48 opacity-50"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('bg-gradient-to-br from-pink-100 to-purple-100'); }}
          />
          {/* Fallback icon if image fails */}
          <ShoppingCart size={64} className="text-pink-300 absolute" />
        </div>
        <h3 className="text-4xl font-display font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Your cart is empty</h3>
        <p className="text-gray-600 text-lg mb-10 max-w-md text-center">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => navigate('/customer/home')}
          className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-2 transform hover:scale-105 active:scale-95"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/customer/home')}
          className="p-2 hover:bg-white rounded-full transition shadow-sm"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-3xl font-extrabold text-gray-900">Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(itemsByRestaurant).map(([restaurantId, items]) => (
            <div key={restaurantId} className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden card-hover">
              <div className="p-6 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl border border-pink-200 shadow-lg">
                  <Store size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-gray-900">{items[0]?.restaurantName || 'Restaurant'}</h3>
                  <p className="text-gray-600 text-base mt-1">Items from this restaurant</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {items.map((item: any) => (
                  <div key={item.foodId} className="flex gap-6 group">
                    <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100 relative shadow-lg">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 py-2">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-display font-bold text-xl text-gray-900 leading-tight">{item.name}</h4>
                        <div className="text-right">
                          <span className="block font-display font-bold text-2xl text-primary">
                            ₹{(item.price * (1 - item.discount / 100)).toFixed(0)}
                          </span>
                          {item.discount > 0 && (
                            <span className="text-sm text-gray-400 line-through">₹{item.price}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-200">
                          <button
                            onClick={() => updateQuantity(item.foodId, -1)}
                            className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                          >
                            <Minus size={20} strokeWidth={3} />
                          </button>
                          <span className="font-display font-bold text-xl text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.foodId, 1)}
                            className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                          >
                            <Plus size={20} strokeWidth={3} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.foodId)}
                          className="text-red-500 hover:text-red-700 transition-all duration-300 flex items-center gap-2 font-bold text-lg group"
                        >
                          <Trash2 size={20} className="group-hover:rotate-90 transition-transform" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Bill Details (Sticky) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-8 sticky top-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900">Order Summary</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-pink-100">
                <span className="text-gray-600 font-semibold text-lg">Item Total</span>
                <span className="font-display font-bold text-xl">₹{getTotal().toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-pink-100">
                <span className="text-gray-600 font-semibold text-lg">Delivery Fee</span>
                <span className="text-green-600 font-semibold text-lg">Free</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-pink-100">
                <span className="text-gray-600 font-semibold text-lg">Platform Fee</span>
                <span className="font-display font-bold text-xl">₹{Math.round(getTotal() * 0.01)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-pink-100">
                <span className="text-gray-600 font-semibold text-lg">GST & Charges</span>
                <span className="font-display font-bold text-xl">₹{Math.round(getTotal() * 0.05)}</span>
              </div>
            </div>

            <div className="border-t-2 border-pink-200 pt-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-xl font-display font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-display font-bold text-primary">₹{(getTotal() * 1.06).toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-8 border border-pink-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display font-bold text-lg text-gray-900">Delivering to:</h4>
                <button
                  onClick={() => navigate('/customer/profile')}
                  className="text-primary font-bold text-base hover:text-primary-dark transition-colors"
                >
                  Change Address
                </button>
              </div>
              <p className="text-gray-600 text-base">
                Home Address (Default)
              </p>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={checkoutLoading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-pink-500/30 hover:-translate-y-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-bold">Processing...</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-xl">Proceed to Checkout</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a2e]/90 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[360px] p-11 rounded-[24px] border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-1"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <h2 className="text-white text-[1.8rem] font-semibold text-center mb-[2.2rem] tracking-tight">
              Choose Payment Method
            </h2>

            <div className="flex flex-col gap-[1.2rem]">
              {/* Pay with UPI */}
              <button
                onClick={() => handlePlaceOrder('UPI')}
                className="group relative overflow-hidden p-[1.3rem] rounded-[16px] border-none text-[1.1rem] font-medium cursor-pointer transition-all duration-300 text-white shadow-[0_6px_18px_rgba(255,59,48,0.25)]"
                style={{
                  background: 'linear-gradient(135deg, #ff3b30, #d32f2f)',
                }}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-600 group-hover:left-[100%]"></div>
                {checkoutLoading ? 'Processing...' : 'Pay with UPI'}
              </button>

              {/* Credit / Debit Card */}
              <button
                onClick={() => handlePlaceOrder('Card')}
                className="group relative overflow-hidden p-[1.3rem] rounded-[16px] border border-white/20 text-[1.1rem] font-medium cursor-pointer transition-all duration-300 text-white hover:bg-white/15 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-600 group-hover:left-[100%]"></div>
                {checkoutLoading ? 'Processing...' : 'Credit / Debit Card'}
              </button>

              {/* Cash on Delivery */}
              <button
                onClick={() => handlePlaceOrder('COD')}
                className="group relative overflow-hidden p-[1.3rem] rounded-[16px] border border-white/20 text-[1.1rem] font-medium cursor-pointer transition-all duration-300 text-white hover:bg-white/15 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-600 group-hover:left-[100%]"></div>
                {checkoutLoading ? 'Processing...' : 'Cash on Delivery'}
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowCheckout(false)}
                className="p-[1.3rem] rounded-[16px] border-none text-[1.1rem] font-medium cursor-pointer transition-all duration-300 mt-[0.8rem] text-white/70 bg-white/5 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCart;
