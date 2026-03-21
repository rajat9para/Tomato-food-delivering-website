import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const AnimatedButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  className = '',
  type = 'button'
}: AnimatedButtonProps) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all overflow-hidden";

  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-2xl hover:shadow-red-300/50 disabled:opacity-50",
    secondary: "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white disabled:opacity-50",
    outline: "bg-transparent text-gray-700 border-2 border-gray-200 hover:border-primary hover:text-primary disabled:opacity-50",
    ghost: "bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>

      {/* Ripple effect */}
      {!disabled && (
        <motion.span
          className="absolute inset-0 bg-white/10"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  );
};

export default AnimatedButton;
