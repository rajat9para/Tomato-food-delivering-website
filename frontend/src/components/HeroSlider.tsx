import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: '/foodimages/f1.jpg',
      title: 'Authentic Indian Cuisine',
      subtitle: 'Experience the rich flavors of India'
    },
    {
      image: '/foodimages/f2.jpg',
      title: 'Delicious Fresh Food',
      subtitle: 'Fresh and flavorful dishes'
    },
    {
      image: '/foodimages/f3.jpg',
      title: 'Chef Special',
      subtitle: 'Handcrafted with love'
    },
    {
      image: '/foodimages/f4.jpg',
      title: 'Premium Platters',
      subtitle: 'Crispy, buttery, and delicious'
    },
    {
      image: '/foodimages/f5.jpg',
      title: 'Gourmet Selection',
      subtitle: 'Tangy and crunchy delight'
    },
    {
      image: '/foodimages/f6.jpg',
      title: 'Fresh Delicacies',
      subtitle: 'Spicy specialty dishes'
    },
    {
      image: '/foodimages/f7.jpg',
      title: 'Fusion Flavors',
      subtitle: 'Fusion of flavors'
    },
    {
      image: '/foodimages/f8.jpg',
      title: 'Exotic Delicacies',
      subtitle: 'Discover new tastes'
    },
    {
      image: '/foodimages/f9.jpg',
      title: 'Fresh and Healthy',
      subtitle: 'Nutritious meals for you'
    },
    {
      image: '/foodimages/f10.jpg',
      title: 'Street Food Vibes',
      subtitle: 'Authentic street flavors'
    },
    {
      image: '/foodimages/f11.jpg',
      title: 'Gourmet Experience',
      subtitle: 'Elevate your dining'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden rounded-2xl shadow-2xl">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
            <div className="p-6 md:p-8 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-2 animate-fadeIn">{slide.title}</h2>
              <p className="text-lg md:text-xl animate-fadeIn delay-200">{slide.subtitle}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-primary p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-primary p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
