import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🚀 [LOGIN DEBUG] Sending request to /auth/login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ [LOGIN DEBUG] Response received:', response.status, response.data);

      const { data } = response;
      login(data.token, data.role, data.userId, data.name, data.profilePhoto, data.premiumMember);

      if (data.role === 'admin') navigate('/admin/dashboard');
      else if (data.role === 'owner') navigate('/owner/dashboard');
      else navigate('/customer/home');
    } catch (err: any) {
      console.error('❌ [LOGIN DEBUG] Error caught:', err);
      if (err.code === 'ERR_NETWORK') {
        const isDev = import.meta.env.DEV;
        setError(isDev
          ? 'Network error. Check if backend is running on port 5000.'
          : 'Network error. Unable to connect to server. Please try again later.');
      } else if (err.response) {
        console.error('💩 [LOGIN DEBUG] Error response:', err.response.status, err.response.data);
        if (err.response.status === 401) {
          setError('Invalid email or password');
        } else {
          const msg = err.response.data?.message || err.response.data?.error || 'Login failed';
          setError(`${msg} (Status: ${err.response.status})`);
        }
      } else {
        setError(`Error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <GlobalBackground />

      {/* Left Brand Strip */}
      <div className="hidden lg:flex w-80 bg-gradient-to-b from-primary to-primary-dark flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('/tomato-logo.png')] bg-center bg-no-repeat opacity-10 bg-[length:200px]"></div>
        <div className="relative z-10 text-center">
          <img src="/tomato-logo.png" alt="Tomato" className="w-24 h-24 mx-auto mb-6 drop-shadow-2xl" />
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">tomato</h1>
          <p className="text-white/80 font-medium text-lg leading-relaxed">
            Delicious food,<br />delivered fresh.
          </p>
          <div className="mt-12 flex flex-col gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
            <span>🍕 Fast Delivery</span>
            <span>⭐ Top Restaurants</span>
            <span>💳 Secure Payments</span>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
          <div className="glass-card p-10 rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden">

            {/* Mobile Logo - visible on small screens */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img src="/tomato-logo.png" alt="Tomato" className="w-16 h-16 mb-3" />
              <h2 className="text-3xl font-black text-primary tracking-tighter">tomato</h2>
            </div>

            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Welcome Back</h1>
              <p className="text-gray-500 font-medium">Login to explore deliciousness</p>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3 animate-shake">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full px-5 py-4 bg-white/70 border-2 border-primary/20 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-5 py-4 bg-white/70 border-2 border-primary/20 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 pr-12 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 font-medium mb-4">Don't have an account?</p>
              <div className="flex gap-3">
                <Link to="/register/customer" className="flex-1 py-3 bg-white border-2 border-primary/20 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-sm text-center">
                  Customer
                </Link>
                <Link to="/register/owner" className="flex-1 py-3 bg-white border-2 border-primary/20 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-sm text-center">
                  Owner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
