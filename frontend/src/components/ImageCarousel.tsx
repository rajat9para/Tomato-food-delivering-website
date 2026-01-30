import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/formatters';

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

const ImageCarousel = ({ images, alt }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Fallback images from foodimages folder if no images provided
  const fallbackImages = [
    '/foodimages/ananthan-chithiraikani-5I4faGfaUHg-unsplash.jpg',
    '/foodimages/charlesdeluvio-PqsImnjuElM-unsplash.jpg',
    '/foodimages/gayatri-malhotra-mlwXrYYAOms-unsplash.jpg',
    '/foodimages/jaydeep-gajera-7yb08BMYhmQ-unsplash.jpg',
  ];

  const displayImages = images && images.length > 0 ? images : fallbackImages;
  const validImages = displayImages.filter(img => img && img.trim() !== '');

  if (validImages.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        <span className="text-red-400 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg group">
      {validImages.map((img, index) => {
        const imageUrl = getImageUrl(img);
        return (
          <img
            key={index}
            src={imageUrl}
            alt={`${alt} ${index + 1}`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            onError={(e) => {
              // Fallback to a default image if loading fails
              const target = e.target as HTMLImageElement;
              target.src = fallbackImages[index % fallbackImages.length];
            }}
          />
        );
      })}

      {validImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6 shadow-lg' : 'bg-white/60 w-1.5 hover:bg-white/80'
                }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
