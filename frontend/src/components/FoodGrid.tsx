import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface FoodGridProps {
  images?: string[];
  columns?: 2 | 3 | 4;
}

const defaultImages = [
  '/foodimages/ananthan-chithiraikani-ZwLHILZ9ML0-unsplash.jpg',
  '/foodimages/kalyani-akella-gml9g1kRQcM-unsplash.jpg',
  '/foodimages/mustafa-fatemi-gPKYe_RHmPM-unsplash.jpg',
  '/foodimages/prajakta-bagade-Vzvkp94lk_4-unsplash.jpg',
  '/foodimages/sanket-shah-eEWlcfydzQ4-unsplash.jpg',
  '/foodimages/shruthi-somu-axpIH7nTJiI-unsplash.jpg',
  '/foodimages/sumeet-b-e2b0-q7gjgg-unsplash.jpg',
  '/foodimages/vinitha-v-x_wBgeNg11o-unsplash.jpg'
];

const FoodGrid = ({ images = defaultImages, columns = 3 }: FoodGridProps) => {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = (index: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(index)) {
        newFavorites.delete(index);
      } else {
        newFavorites.add(index);
      }
      return newFavorites;
    });
  };

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid ${gridCols[columns]} gap-6 md:gap-8`}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          variants={item}
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        >
          {/* Image container with aspect ratio */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              src={image}
              alt={`Delicious food ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Top actions */}
              <div className="flex justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(index);
                  }}
                  className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/40 flex items-center justify-center transition-all shadow-lg ${
                    favorites.has(index)
                      ? 'bg-primary text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={favorites.has(index) ? 'currentColor' : 'none'}
                  />
                </motion.button>
              </div>

              {/* Bottom info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-sm">
                    {(4.0 + Math.random() * 1).toFixed(1)}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-full bg-white text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  View
                </motion.button>
              </div>
            </div>

            {/* Image number badge */}
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white font-black text-sm shadow-lg">
              {index + 1}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FoodGrid;
