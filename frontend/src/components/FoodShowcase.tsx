import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface FoodShowcaseProps {
  images?: string[];
  autoplay?: boolean;
  interval?: number;
}

const mainImages = [
  '/foodimages/indian_cuisine.jpg',
  '/foodimages/Chicken-Chow-Mein-1.jpg',
  '/foodimages/white-sauce-pasta-2.jpg',
  '/foodimages/india-food-paratha-1120x732.jpg',
  '/foodimages/Desi-Chow-Mein-2.jpg',
  '/foodimages/ananthan-chithiraikani-5I4faGfaUHg-unsplash.jpg',
  '/foodimages/prchi-palwe-Tp1yIvG7aBw-unsplash.jpg',
  '/foodimages/sharan-pagadala-x_kx9A58rvw-unsplash.jpg',
  '/foodimages/kalyani-akella-69-Jb_PNqHI-unsplash.jpg',
  '/foodimages/pushpak-dsilva-e75FKtu30fQ-unsplash.jpg',
  '/foodimages/a-singh-W50inNOVUdU-unsplash.jpg',
  '/foodimages/charlesdeluvio-PqsImnjuElM-unsplash.jpg'
];

const thumbnailImages = [
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

const FoodShowcase = ({ images = mainImages, autoplay = true, interval = 4000 }: FoodShowcaseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, images.length, interval]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  return (
    <div className="relative w-full">
      {/* Main Carousel */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl group">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 }
            }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex]}
              alt={`Food showcase ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute inset-0 z-20 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrev}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-2xl"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={3} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-2xl"
          >
            <ChevronRight className="w-7 h-7" strokeWidth={3} />
          </motion.button>
        </div>

        {/* Play/Pause Control */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-2xl opacity-0 group-hover:opacity-100"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </motion.button>

        {/* Counter */}
        <div className="absolute bottom-6 left-6 z-20 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white font-bold text-sm shadow-2xl">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => goToIndex(index)}
              className={`transition-all ${index === currentIndex
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                } rounded-full`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {thumbnailImages.map((image, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToIndex(index)}
            className={`flex-shrink-0 relative group/thumb ${index === currentIndex ? 'ring-4 ring-primary' : 'ring-2 ring-white/20'
              } rounded-2xl overflow-hidden transition-all shadow-lg`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-48 h-36 md:w-56 md:h-40 object-cover"
            />
            <div
              className={`absolute inset-0 transition-opacity ${index === currentIndex
                ? 'bg-primary/20'
                : 'bg-black/30 group-hover/thumb:bg-black/10'
                }`}
            />
            {index === currentIndex && (
              <motion.div
                layoutId="activeThumb"
                className="absolute inset-0 border-4 border-primary rounded-2xl"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FoodShowcase;
