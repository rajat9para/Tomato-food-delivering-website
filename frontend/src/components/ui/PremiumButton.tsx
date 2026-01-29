import React from 'react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline';
    children: React.ReactNode;
    isLoading?: boolean;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    isLoading,
    disabled,
    ...props
}) => {
    const baseStyles = "relative overflow-hidden font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-neon hover:-translate-y-0.5",
        ghost: "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} group`}
            disabled={isLoading || disabled}
            {...props}
        >
            {/* Ripple/Sheen Effect */}
            <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[100%]" />

            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </>
            ) : children}
        </button>
    );
};

export default PremiumButton;
