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
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-64 h-64 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-float">
          <img
            src="https://b.zmtcdn.com/data/webuikit/9f928a05a329b3659e01.png" // Zomato-like empty cart illustration placeholder
            alt="Empty Cart"
            className="w-48 opacity-50"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('bg-gray-100'); }}
          />
          {/* Fallback icon if image fails */}
          <ShoppingCart size={64} className="text-gray-300 absolute" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => navigate('/customer/home')}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-bold text-lg transition-transform hover:scale-105 shadow-lg"
        >
          See Restaurants Near You
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
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(itemsByRestaurant).map(([restaurantId, items]) => (
            <div key={restaurantId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                  <Store size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{items[0]?.restaurantName || 'Restaurant'}</h3>
                  <p className="text-xs text-gray-500">Items from this restaurant</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {items.map((item: any) => (
                  <div key={item.foodId} className="flex gap-4 group">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-200">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 text-lg leading-tight">{item.name}</h4>
                        <div className="text-right">
                          <span className="block font-bold text-gray-900">
                            ₹{(item.price * (1 - item.discount / 100)).toFixed(0)}
                          </span>
                          {item.discount > 0 && (
                            <span className="text-xs text-gray-400 line-through">₹{item.price}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-red-50 rounded-lg p-1 border border-primary/10">
                          <button
                            onClick={() => updateQuantity(item.foodId, -1)}
                            className="w-7 h-7 bg-white text-primary rounded flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-bold text-gray-800 min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.foodId, 1)}
                            className="w-7 h-7 bg-white text-primary rounded flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.foodId)}
                          className="text-gray-400 hover:text-red-500 transition p-2"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Bill Details</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Item Total</span>
                <span>₹{getTotal().toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span>₹{Math.round(getTotal() * 0.01)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST and Restaurant Charges</span>
                <span>₹{Math.round(getTotal() * 0.05)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">To Pay</span>
                <span className="text-2xl font-bold text-primary">₹{(getTotal() * 1.06).toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800">Delivering to:</h4>
                <button
                  onClick={() => navigate('/customer/profile')}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Change
                </button>
              </div>
              {/* Placeholder for address view - simplified as we fetch it on checkout click */}
              <p className="text-sm text-gray-500 truncate">
                Home Address (Default)
              </p>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={checkoutLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
              ) : (
                <>
                  <span>Proceed to Pay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-scale-in border border-white/40">
            {/* Header */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Payment Method</h3>
            <p className="text-gray-500 text-sm text-center mb-8">Select how you'd like to pay</p>

            <div className="space-y-3">
              {/* UPI Button */}
              <button
                onClick={() => handlePlaceOrder('UPI')}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-[#E23744] to-[#d62b38] text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : 'Pay with UPI'}
              </button>

              {/* Card Button */}
              <button
                onClick={() => handlePlaceOrder('Card')}
                disabled={checkoutLoading}
                className="w-full bg-white border-2 border-[#E23744] text-[#E23744] py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {checkoutLoading ? 'Processing...' : 'Credit / Debit Card'}
              </button>

              {/* COD Button */}
              <button
                onClick={() => handlePlaceOrder('COD')}
                disabled={checkoutLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {checkoutLoading ? 'Processing...' : 'Cash on Delivery'}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm transition-all duration-200"
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
