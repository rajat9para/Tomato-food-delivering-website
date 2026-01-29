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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + ratingImages.length > 5) {
                alert('You can only upload up to 5 photos');
                return;
            }

            const newImages = [...ratingImages, ...files];
            setRatingImages(newImages);

            // Create previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...ratingImages];
        newImages.splice(index, 1);
        setRatingImages(newImages);

        const newPreviews = [...imagePreviews];
        // Revoke URL to avoid memory leak
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

            // alert('Thank you for your rating!'); // Removing alert for smoother UI flow if parent handles it
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden relative animate-scale-in">

                {/* Header */}
                <div className="bg-[#D32F2F] p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm shadow-inner">
                            <Star size={24} fill="currentColor" className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-2xl leading-none mb-1">Rate Order</h3>
                            <p className="text-sm opacity-90 font-medium">{order.restaurantId?.name || 'Restaurant'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-[#FAFAFA]">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-3 mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRatingValue(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`${star <= ratingValue ? 'fill-[#D32F2F] text-[#D32F2F]' : 'text-gray-300'}`}
                                    strokeWidth={1.5}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Review Text */}
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us what you loved... (optional)"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F] outline-none text-gray-700 bg-white mb-4 resize-none h-24 text-sm shadow-sm"
                    />

                    {/* Image Upload */}
                    <div className="mb-6">
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                            {imagePreviews.map((preview, idx) => (
                                <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {imagePreviews.length < 5 && (
                                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#D32F2F] hover:bg-red-50 transition-colors">
                                    <Camera size={20} className="text-gray-400" />
                                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleSubmit}
                        disabled={submittingRating}
                        className="w-full bg-[#D32F2F] hover:bg-[#b71c1c] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submittingRating ? (
                            'Submitting...'
                        ) : (
                            <>
                                <Send size={16} /> SUBMIT FEEDBACK
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingBanner;
