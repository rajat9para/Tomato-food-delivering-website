import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = true }) => {
    return (
        <div
            className={`
        relative overflow-hidden bg-glass backdrop-blur-md border border-glass-border 
        rounded-2xl shadow-glass transition-all duration-500
        ${hoverEffect ? 'hover:border-glass-highlight hover:bg-white/5 hover:-translate-y-1 hover:shadow-neon' : ''}
        ${className}
      `}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100" />

            {children}
        </div>
    );
};

export default GlassCard;
