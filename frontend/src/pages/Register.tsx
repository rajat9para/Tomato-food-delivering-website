import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import GlobalBackground from '../components/GlobalBackground';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const { type } = useParams<{ type: 'customer' | 'owner' }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: type
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please ensure backend server is running.');
      } else if (err.response) {
        const apiError = err.response.data;
        if (apiError.errors) {
          const errorMessages = Object.values(apiError.errors).flat().join('\n');
          setError(errorMessages);
        } else {
          setError(apiError.message || 'Registration failed');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
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
            Join the food<br />revolution today.
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
            <div className="lg:hidden flex flex-col items-center mb-6">
              <img src="/tomato-logo.png" alt="Tomato" className="w-16 h-16 mb-3" />
              <h2 className="text-3xl font-black text-primary tracking-tighter">tomato</h2>
            </div>

            <div className="flex flex-col items-center mb-6">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Join Tomato</h1>
              <p className="text-gray-500 font-medium text-center">
                Register as {type === 'customer' ? 'a Customer' : 'a Restaurant Owner'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl mb-5 text-sm font-semibold animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-600 p-4 rounded-xl mb-5 text-sm font-semibold flex items-center gap-3">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-ping"></span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  className="w-full px-5 py-3.5 bg-white/70 border-2 border-primary/20 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full px-5 py-3.5 bg-white/70 border-2 border-primary/20 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-5 py-3.5 bg-white/70 border-2 border-primary/20 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 placeholder:text-gray-400 pr-12 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
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
                    Creating Account...
                  </>
                ) : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-primary/10 pt-5">
              <p className="text-gray-500 font-medium mb-2">Already have an account?</p>
              <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-all duration-300 text-lg hover:underline decoration-2 underline-offset-4">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
