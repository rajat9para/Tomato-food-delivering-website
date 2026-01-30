import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TomatoIntro({ onComplete }: { onComplete: () => void }) {
    const [displayedText, setDisplayedText] = useState("");
    const [phase, setPhase] = useState<'typing' | 'curtain' | 'chef'>('typing');
    const fullText = "Your favorite meals are loading...";

    useEffect(() => {
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(typeInterval);
                // Start curtain animation after typing
                setTimeout(() => setPhase('curtain'), 800);
            }
        }, 100); // Slower typing for premium feel

        return () => clearInterval(typeInterval);
    }, []);

    useEffect(() => {
        if (phase === 'curtain') {
            // Show chef after curtain closes
            setTimeout(() => setPhase('chef'), 1200);
        }
        if (phase === 'chef') {
            // Complete after chef animation
            setTimeout(() => onComplete(), 2000);
        }
    }, [phase, onComplete]);

    return (
        <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FDFBF7] overflow-hidden"
        >
            <AnimatePresence mode="wait">
                {phase === 'typing' && (
                    <motion.div
                        key="typing"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center gap-6 px-4"
                    >
                        <motion.img
                            src="/tomato-logo.png"
                            alt="Tomato"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
                        />
                        <h1 className="text-2xl md:text-4xl font-bold text-[#E23744] min-h-[3rem] tracking-tight">
                            {displayedText}
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="text-[#E23744]/60 ml-0.5"
                            >
                                |
                            </motion.span>
                        </h1>
                    </motion.div>
                )}

                {phase === 'curtain' && (
                    <motion.div
                        key="curtain"
                        className="fixed inset-0 flex"
                        initial={{ opacity: 1 }}
                    >
                        {/* Left Curtain */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                            className="w-1/2 h-full bg-gradient-to-r from-[#E23744] to-[#c41e30]"
                        />
                        {/* Right Curtain */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                            className="w-1/2 h-full bg-gradient-to-l from-[#E23744] to-[#c41e30]"
                        />
                    </motion.div>
                )}

                {phase === 'chef' && (
                    <motion.div
                        key="chef"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 bg-gradient-to-b from-[#E23744] to-[#b91c2e] flex flex-col items-center justify-center"
                    >
                        {/* Chef Illustration */}
                        <motion.img
                            src="/chef-illustration.png"
                            alt="Chef"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
                            className="w-48 h-48 md:w-64 md:h-64 object-contain filter invert drop-shadow-2xl"
                        />

                        {/* Welcome Text */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-center mt-6"
                        >
                            <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tight">
                                Welcome to Tomato
                            </h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-white/80 mt-3 text-lg"
                            >
                                Delicious food, delivered fresh
                            </motion.p>
                        </motion.div>

                        {/* Subtle Loader */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="absolute bottom-12 flex gap-1.5"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                    className="w-2 h-2 bg-white rounded-full"
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
