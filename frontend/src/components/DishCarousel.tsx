import { useState, useEffect } from 'react';

interface DishCarouselProps {
  images: string[];
  alt: string;
}

const DishCarousel = ({ images, alt }: DishCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fallback images for consistent rendering
  const fallbackImages = [
    '/foodimages/f1.jpg',
    '/foodimages/f2.jpg',
    '/foodimages/f3.jpg',
    '/foodimages/f4.jpg',
    '/foodimages/f5.jpg',
    '/foodimages/f6.jpg',
    '/foodimages/f7.jpg',
    '/foodimages/f8.jpg',
    '/foodimages/f9.jpg',
    '/foodimages/f10.jpg',
    '/foodimages/f11.jpg'
  ];

  // Get image URL with proper handling
  const getImageUrl = (img: string) => {
    if (!img) return '';
    
    // Handle absolute URLs
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    
    // Handle relative paths from backend
    if (img.startsWith('/uploads/')) {
      return `http://localhost:5000${img}`;
    }
    
    // Handle foodimages paths
    if (img.includes('foodimages') || img.includes('foodimages')) {
      return img.startsWith('/') ? img : `/${img}`;
    }
    
    // Return as-is for other cases
    return img;
  };

  // Use fallback images if no images provided
  const displayImages = images && images.length > 0 ? images : fallbackImages;
  const validImages = displayImages.filter(img => img && img.trim() !== '');

  if (!validImages.length || imageError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center border-2 border-pink-100 rounded-xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🍽️</div>
          <span className="text-pink-600 font-semibold text-sm md:text-lg">No Image Available</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!validImages || validImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [validImages.length]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    // Try next fallback image or show error state
    if (validImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    } else {
      setImageError(true);
    }
  };

  return (
    <div className="relative w-full h-full group overflow-hidden rounded-xl">
      {/* Loading Overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src={getImageUrl(validImages[currentIndex])}
        alt={`${alt} ${currentIndex + 1}`}
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Overlay for single image */}
      {validImages.length === 1 && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      )}

      {/* Multiple Images Controls */}
      {validImages.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-pink-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-20 border border-pink-100"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-pink-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-20 border border-pink-100"
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 border-2 ${
                  idx === currentIndex 
                    ? 'bg-pink-500 border-pink-300 shadow-lg shadow-pink-500/50' 
                    : 'bg-white/80 border-pink-200 hover:bg-pink-300'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-3 right-3 bg-black/30 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-sm">
            {currentIndex + 1} / {validImages.length}
          </div>
        </>
      )}
    </div>
  );
};

export default DishCarousel;
