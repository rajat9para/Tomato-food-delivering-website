import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/formatters';

interface DishCarouselProps {
  images: string[];
  alt: string;
}

const DishCarousel = ({ images, alt }: DishCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!images || images.length === 0 || imageError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-sm md:text-lg font-semibold">🍽️ No Image</span>
      </div>
    );
  }

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full group overflow-hidden">
      <img
        src={getImageUrl(images[currentIndex])}
        alt={`${alt} ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-500"
        loading="lazy"
        onError={() => setImageError(true)}
      />

      {images.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            →
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DishCarousel;
