import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'default' | 'compact' | 'icon-only';
  animated?: boolean;
}

const PremiumBadge = ({ variant = 'default', animated = true }: PremiumBadgeProps) => {
  const badgeContent = {
    'default': (
      <>
        <Crown className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-black uppercase tracking-wider text-xs">Premium</span>
        <Sparkles className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      </>
    ),
    'compact': (
      <>
        <Crown className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span className="font-black uppercase tracking-wider text-[10px]">Pro</span>
      </>
    ),
    'icon-only': (
      <Crown className="w-5 h-5 fill-yellow-400 text-yellow-400" />
    )
  };

  return (
    <motion.div
      whileHover={animated ? { scale: 1.05 } : {}}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
    >
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-orange-300"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      <div className="relative z-10 flex items-center gap-1.5">
        {badgeContent[variant]}
      </div>
    </motion.div>
  );
};

export default PremiumBadge;
