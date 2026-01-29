import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, Send, MessageSquare } from 'lucide-react';
import api from '../utils/api';

const CustomerContactPage = () => {
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-4">
          <MessageSquare className="text-primary" size={48} />
          Contact Us
        </h1>
        <p className="text-xl text-gray-600">Send us your feedback, complaints, or suggestions</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-primary/20">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="block text-gray-800 font-bold mb-4 text-xl">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your feedback, complaint, or suggestion..."
                rows={10}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-primary focus:outline-none transition resize-none text-lg"
                required
              />
            </div>

            <div className="mb-8">
              <label className="block text-gray-800 font-bold mb-4 text-xl">Attach Images (Optional, Max 5)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary transition">
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
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Click to upload images</p>
                  <p className="text-sm text-gray-500 mt-2">{images.length}/5 images selected</p>
                </label>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mt-6">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded-2xl shadow-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100 shadow-lg"
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
              className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-2xl font-bold text-xl transition shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 transform hover:scale-105"
            >
              <Send className="w-6 h-6" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerContactPage;
