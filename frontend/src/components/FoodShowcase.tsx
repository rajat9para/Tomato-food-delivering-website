import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface FoodShowcaseProps {
  images?: string[];
  autoplay?: boolean;
  interval?: number;
}

const mainImages = [
  '/thumbnails/50050-five-minute-ice-cream-DDMFS-4x3-076-fbf49ca6248e4dceb3f43a4f02823dd9.jpg',
  '/thumbnails/66FE2BE3-1758-4813-B086-1719799793ED.jpg',
  '/thumbnails/Cuisine_(268)_44.jpg',
  '/thumbnails/instant-jalebi-recipe-500x375.jpg',
  '/thumbnails/khaman-dhokla-recipe.jpg',
  '/thumbnails/maxresdefault.jpg',
  '/thumbnails/rasmalai (1).avif',
  '/thumbnails/rasmalai-2-e1505245876472-gpo.jpg',
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
      <div className="relative w-full h-[500px] md:h-[700px] lg:h-[850px] rounded-[3rem] overflow-hidden shadow-2xl group">
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
      </div>
    </div>
  );
};

export default FoodShowcase;
