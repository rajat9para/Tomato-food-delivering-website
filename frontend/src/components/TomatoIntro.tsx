import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TomatoIntro({ onComplete }: { onComplete: () => void }) {
    const [displayedText, setDisplayedText] = useState("");
    const fullText = "Your favorite meals are loading...";

    useEffect(() => {
        // Animation runs on every reload as requested
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    onComplete();
                }, 1500); // Wait a bit after typing finishes
            }
        }, 80); // Slightly slower for better typewriter feel

        return () => clearInterval(typeInterval);
    }, [onComplete]);

    return (
        <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FDFBF7] overflow-hidden"
        >
            <div className="flex flex-col items-center gap-8 px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black text-[#E23744] min-h-[4rem] font-serif tracking-tight">
                        {displayedText}
                        <span className="animate-pulse text-gray-400">|</span>
                    </h1>
                </div>

                <motion.img
                    src="/tomato-logo.png"
                    alt="Tomato"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: displayedText.length > 5 ? 1 : 0,
                        scale: displayedText.length > 5 ? 1 : 0.8
                    }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl"
                />
            </div>
        </motion.div>
    );
}
