import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, Send, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const CustomerContact = () => {
  const navigate = useNavigate();
  const { name } = useAuth();
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    
    setImages([...images, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please write a message');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('senderName', name || 'Customer');
      images.forEach(img => formData.append('images', img));

      await api.post('/customer/contact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Message sent successfully! Admin will review it soon.');
      setMessage('');
      setImages([]);
      setPreviews([]);
      navigate('/customer/home');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/customer/home')} className="text-gray-600 hover:text-primary transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Contact Admin</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary/20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a message</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-800 font-bold mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your feedback, complaint, or suggestion..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition resize-none"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-800 font-bold mb-2">Attach Images (Optional, Max 5)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={images.length >= 5}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload images</p>
                  <p className="text-sm text-gray-500 mt-1">{images.length}/5 images selected</p>
                </label>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerContact;
