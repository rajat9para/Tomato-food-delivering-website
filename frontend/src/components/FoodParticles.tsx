import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const foodEmojis = ['🍕', '🍔', '🍜', '🍱', '🍛', '🥗', '🍝', '🌮', '🥙', '🍣', '🥘', '🍲'];

const FoodParticles = ({ count = 15 }: { count?: number }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: 20 + Math.random() * 30,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute opacity-5"
          style={{
            fontSize: `${particle.size}px`,
            left: `${particle.x}%`,
          }}
          initial={{ y: `${particle.y}%`, rotate: 0 }}
          animate={{
            y: '-10%',
            rotate: 360
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: particle.delay
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
};

export default FoodParticles;
