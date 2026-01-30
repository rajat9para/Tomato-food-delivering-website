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
  const [showEmail, setShowEmail] = useState(false);
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
      login(data.token, data.role, data.userId, data.name);

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
    <div className="min-h-screen flex items-center justify-center">
      <GlobalBackground />

      {/* Left Side Red Tags */}
      <div className="fixed left-0 top-0 h-full w-24 bg-gradient-to-r from-red-600 to-red-500 flex flex-col items-center justify-center gap-8 z-0 shadow-2xl">
        <div className="text-white text-center transform -rotate-90 whitespace-nowrap">
          <div className="text-4xl font-black tracking-wider">TOMATO</div>
          <div className="text-xs font-bold mt-2 tracking-widest">FOOD ORDER</div>
        </div>
        <div className="w-16 h-1 bg-white/30 rounded-full"></div>
        <div className="text-white text-center transform -rotate-90 whitespace-nowrap">
          <div className="text-2xl font-bold">FAST</div>
          <div className="text-xs font-semibold">DELIVERY</div>
        </div>
      </div>

      <div className="relative z-10 bg-white p-10 rounded-2xl shadow-2xl w-[450px] border border-gray-100 ml-24">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">TOMATO</h1>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Welcome Back</h2>
        <p className="text-gray-600 text-center mb-8">Login to your account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-800 font-bold mb-2">Email Address</label>
            <div className="relative">
              <input
                type={showEmail ? 'text' : 'email'}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-900 placeholder:text-gray-400 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showEmail ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-900 placeholder:text-gray-400 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="text-gray-600 mb-4">Don't have an account?</p>
          <div className="flex gap-3">
            <Link to="/register/customer" className="flex-1 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition text-center">
              Customer
            </Link>
            <Link to="/register/owner" className="flex-1 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition text-center">
              Owner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
