import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6' },
    md: { container: 'w-24 h-24', icon: 'w-10 h-10' },
    lg: { container: 'w-32 h-32', icon: 'w-14 h-14' }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`relative ${sizes[size].container} rounded-full bg-gradient-to-br from-primary to-orange-500 p-1 shadow-2xl`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <UtensilsCrossed className={`${sizes[size].icon} text-primary`} strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* Spinning gradient ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(226, 55, 68, 0.5) 50%, transparent 70%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 font-medium text-center"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
