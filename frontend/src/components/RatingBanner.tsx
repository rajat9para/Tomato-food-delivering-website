import { useState } from 'react';
import { Star, X, Camera, Send } from 'lucide-react';
import api from '../utils/api';

interface RatingBannerProps {
    order: any;
    onClose: () => void;
    onSuccess: () => void;
}

const RatingBanner = ({ order, onClose, onSuccess }: RatingBannerProps) => {
    const [ratingValue, setRatingValue] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [ratingImages, setRatingImages] = useState<File[]>([]);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [hoverRating, setHoverRating] = useState(0);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + ratingImages.length > 5) {
                alert('You can only upload up to 5 photos');
                return;
            }

            const newImages = [...ratingImages, ...files];
            setRatingImages(newImages);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...ratingImages];
        newImages.splice(index, 1);
        setRatingImages(newImages);

        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleSubmit = async () => {
        if (!order) return;
        setSubmittingRating(true);
        try {
            const formData = new FormData();
            formData.append('orderId', order._id);
            formData.append('rating', ratingValue.toString());
            formData.append('review', reviewText);
            ratingImages.forEach(img => formData.append('images', img));

            await api.post('/customer/orders/rate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onSuccess();
        } catch (error: any) {
            console.error('Rating submission failed:', error);
            alert(error.response?.data?.message || 'Error submitting rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    if (!order) return null;

    return (
        <div className="relative glass-card p-10 rounded-[3.5rem] shadow-3xl border-white/60 overflow-hidden font-display">
            {/* Background Orbs */}
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                    <h3 className="text-4xl font-black text-gray-950 tracking-tighter leading-none mb-1">How was it?</h3>
                    <p className="text-gray-500 font-bold text-sm">Rating your order from <span className="text-primary">{order.restaurantId?.name}</span></p>
                </div>
                <button
                    onClick={onClose}
                    className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:rotate-90 transition-all border-white shadow-xl"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="space-y-8 relative z-10">
                {/* Masterpiece Star Interaction */}
                <div className="flex flex-col items-center gap-4 py-8 glass rounded-[2.5rem] border-white/40 shadow-inner">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRatingValue(star)}
                                className="relative transition-all duration-300 transform hover:scale-125 hover:-translate-y-2 focus:outline-none group"
                            >
                                <Star
                                    size={56}
                                    className={`transition-all duration-300 ${star <= (hoverRating || ratingValue)
                                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                                        : 'text-gray-200'
                                        }`}
                                    strokeWidth={2}
                                />
                                {star <= (hoverRating || ratingValue) && (
                                    <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
                        {ratingValue === 5 ? 'Masterpiece' : ratingValue === 4 ? 'Excellent' : ratingValue === 3 ? 'Good' : ratingValue === 2 ? 'Fair' : 'Poor'}
                    </span>
                </div>

                {/* Review Message */}
                <div className="relative">
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write a little story about your meal..."
                        className="w-full p-8 bg-white/50 backdrop-blur-md border-2 border-transparent border-white/60 rounded-[2rem] focus:border-primary/20 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-400 min-h-[150px] shadow-inner text-lg"
                    />
                </div>

                {/* Image Gallery & Upload */}
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl group cursor-zoom-in">
                                <img src={preview} alt="preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {imagePreviews.length < 5 && (
                            <label className="w-24 h-24 flex flex-col items-center justify-center glass border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-white/50 transition-all group">
                                <Camera size={28} className="text-gray-300 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black text-gray-400 mt-2 uppercase">Add Photos</span>
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <button
                    onClick={handleSubmit}
                    disabled={submittingRating}
                    className="w-full group relative h-20 bg-gray-950 text-white rounded-[2rem] font-black text-xl transition-all duration-500 shadow-3xl hover:shadow-primary/30 hover:bg-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="relative z-10 flex items-center justify-center gap-4">
                        {submittingRating ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Share My Feedback</span>
                                <Send size={24} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            </>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Your review helps our community grow</p>
            </div>
        </div>
    );
};

export default RatingBanner;
