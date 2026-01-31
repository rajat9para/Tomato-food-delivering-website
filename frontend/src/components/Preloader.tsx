import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Sparkles, UtensilsCrossed } from 'lucide-react';

export default function Preloader({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'success' | 'exit'>('loading');

    useEffect(() => {
        // Smooth progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => setPhase('success'), 200);
                    return 100;
                }
                // Accelerating progress for realistic feel
                const increment = prev < 50 ? 2 : prev < 80 ? 3 : 5;
                return Math.min(prev + increment, 100);
            });
        }, 50);

        return () => clearInterval(progressInterval);
    }, []);

    useEffect(() => {
        if (phase === 'success') {
            setTimeout(() => setPhase('exit'), 800);
        }
        if (phase === 'exit') {
            setTimeout(() => onComplete(), 600);
        }
    }, [phase, onComplete]);

    return (
        <AnimatePresence>
            {phase !== 'exit' && (
                <motion.div
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #FDFBF7 0%, #FFF5F0 50%, #FFE8E5 100%)'
                    }}
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Floating food particles */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-4xl opacity-10"
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: window.innerHeight + 100,
                                    rotate: Math.random() * 360
                                }}
                                animate={{
                                    y: -100,
                                    rotate: Math.random() * 360 + 360
                                }}
                                transition={{
                                    duration: 8 + Math.random() * 4,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.5
                                }}
                            >
                                {['🍕', '🍔', '🍜', '🍱', '🍛', '🥗'][i % 6]}
                            </motion.div>
                        ))}

                        {/* Gradient orbs */}
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
                            animate={{
                                scale: [1, 1.2, 1],
                                x: [0, 50, 0],
                                y: [0, -50, 0]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[100px]"
                            animate={{
                                scale: [1, 1.3, 1],
                                x: [0, -50, 0],
                                y: [0, 50, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center gap-8 px-4">
                        {/* Logo with animation */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                                delay: 0.1
                            }}
                            className="relative"
                        >
                            {/* Pulsing glow effect */}
                            <motion.div
                                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Logo container */}
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-orange-500 p-1 shadow-2xl">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: phase === 'loading' ? [0, 360] : 0 }}
                                        transition={{ duration: 2, repeat: phase === 'loading' ? Infinity : 0, ease: "linear" }}
                                    >
                                        <ChefHat className="w-16 h-16 md:w-20 md:h-20 text-primary" strokeWidth={2.5} />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Sparkles */}
                            {phase === 'success' && (
                                <>
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            initial={{ scale: 0, x: 0, y: 0 }}
                                            animate={{
                                                scale: [0, 1, 0],
                                                x: Math.cos(i * 60 * Math.PI / 180) * 80,
                                                y: Math.sin(i * 60 * Math.PI / 180) * 80
                                            }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            style={{
                                                left: '50%',
                                                top: '50%'
                                            }}
                                        >
                                            <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </motion.div>

                        {/* Brand name */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
                                tomato
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                                >
                                    <UtensilsCrossed className="w-10 h-10 md:w-12 md:h-12" />
                                </motion.div>
                            </h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl md:text-2xl text-gray-600 font-medium"
                            >
                                {phase === 'loading' && 'Preparing your feast...'}
                                {phase === 'success' && 'Fixing Hunger! �️'}
                            </motion.p>
                        </motion.div>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="w-64 md:w-80"
                        >
                            {/* Progress container */}
                            <div className="relative h-3 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-white/80">
                                {/* Animated progress bar */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-orange-500 to-primary rounded-full shadow-lg"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{
                                        backgroundSize: '200% 100%',
                                    }}
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                            x: ['-100%', '100%']
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    />
                                </motion.div>

                                {/* Success checkmark */}
                                {phase === 'success' && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>

                            {/* Progress percentage */}
                            <motion.div
                                className="text-center mt-3 text-sm font-bold text-gray-500 tracking-wider"
                                key={progress}
                            >
                                {progress}%
                            </motion.div>
                        </motion.div>

                        {/* Fun loading messages */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center max-w-md"
                        >
                            <AnimatePresence mode="wait">
                                {progress < 30 && (
                                    <motion.p
                                        key="msg1"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-gray-500 font-medium italic text-sm"
                                    >
                                        Heating up the kitchen...
                                    </motion.p>
                                )}
                                {progress >= 30 && progress < 60 && (
                                    <motion.p
                                        key="msg2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-gray-500 font-medium italic text-sm"
                                    >
                                        Adding secret ingredients...
                                    </motion.p>
                                )}
                                {progress >= 60 && progress < 90 && (
                                    <motion.p
                                        key="msg3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-gray-500 font-medium italic text-sm"
                                    >
                                        Plating with perfection...
                                    </motion.p>
                                )}
                                {progress >= 90 && phase === 'loading' && (
                                    <motion.p
                                        key="msg4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-gray-500 font-medium italic text-sm"
                                    >
                                        Almost ready to serve...
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Bottom brand mark */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute bottom-10 text-center"
                    >
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Crafted with ❤️ by Team DevX
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
