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
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlobalBackground />

      <div className="relative z-10 w-full max-w-[440px] animate-scale-in">
        <div className="glass-card p-10 rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden">
          {/* Subtle logo in background */}
          <div className="absolute top-[-20px] right-[-20px] opacity-5 pointer-events-none">
            <img src="/tomato-logo.png" alt="" className="w-40 h-40 rotate-12" />
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-xl mb-4 transform hover:rotate-6 transition-transform duration-300">
              <img src="/tomato-logo.png" alt="T" className="w-12 h-12 brightness-0 invert" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2 text-center">Join Tomato</h1>
            <p className="text-gray-500 font-medium text-center">
              Register as {type === 'customer' ? 'a Customer' : 'a Restaurant Owner'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-600 p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-ping"></span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-gray-900 pr-12 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl shadow-red-200/50 hover:shadow-2xl hover:shadow-red-300/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : 'Register'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 font-medium mb-2">Already have an account?</p>
            <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-all duration-300 text-lg hover:underline decoration-2 underline-offset-4">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
