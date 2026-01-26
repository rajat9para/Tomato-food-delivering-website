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
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Create Account
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Register as {type === 'customer' ? 'a Customer' : 'a Restaurant Owner'}
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm whitespace-pre-line">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-sm font-semibold">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-800 font-bold mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-800 font-bold mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
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
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="text-gray-600 mb-2">Already have an account?</p>
          <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition text-lg">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
