import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/formatters';

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

const ImageCarousel = ({ images, alt }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback images from foodimages folder - ACTUAL existing files
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
    '/foodimages/f11.jpg',
    '/foodimages/f12.jpg',
  ];

  const displayImages = images && images.length > 0 ? images : fallbackImages;
  const validImages = displayImages.filter(img => img && img.trim() !== '');

  useEffect(() => {
    if (validImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 3000); // Auto-slide every 3 seconds

    return () => clearInterval(interval);
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-orange-100 flex items-center justify-center">
        <span className="text-primary/50 text-sm font-medium">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg group">
      {validImages.map((img, index) => {
        // For local images, use directly. For backend images, use getImageUrl
        const imageUrl = img.startsWith('/foodimages/') ? img : getImageUrl(img);
        return (
          <img
            key={index}
            src={imageUrl}
            alt={`${alt} ${index + 1}`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${index === currentIndex
              ? 'opacity-100 z-10 scale-100'
              : 'opacity-0 z-0 scale-105'
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
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`rounded-full transition-all duration-300 ${index === currentIndex
                ? 'bg-white w-6 h-2 shadow-lg'
                : 'bg-white/50 w-2 h-2 hover:bg-white/80'
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
