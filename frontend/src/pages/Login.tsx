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
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlobalBackground />

      <div className="relative z-10 w-full max-w-[440px] animate-scale-in">
        <div className="glass-card p-10 rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden">
          {/* Subtle logo in background */}
          <div className="absolute top-[-20px] right-[-20px] opacity-5 pointer-events-none">
            <img src="/tomato-logo.png" alt="" className="w-40 h-40 rotate-12" />
          </div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-xl mb-4 transform hover:rotate-6 transition-transform duration-300">
              <img src="/tomato-logo.png" alt="T" className="w-12 h-12 brightness-0 invert" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Welcome Back</h1>
            <p className="text-gray-500 font-medium">Login to explore deliciousness</p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl mb-8 text-sm font-semibold flex items-center gap-3 animate-shake">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type={showEmail ? 'text' : 'email'}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 pr-12 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200"
                >
                  {showEmail ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 pr-12 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : 'Login'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-medium mb-6">Don't have an account?</p>
            <div className="flex gap-4">
              <Link to="/register/customer" className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:border-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 text-center">
                Customer
              </Link>
              <Link to="/register/owner" className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:border-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 text-center">
                Owner
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-gray-200"></span>
              <span>Tomato Food Delivery</span>
              <span className="w-8 h-[1px] bg-gray-200"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
