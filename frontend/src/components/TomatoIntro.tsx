import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TomatoIntro({ onComplete }: { onComplete: () => void }) {
    const [displayedText, setDisplayedText] = useState("");
    const fullText = "Your favorite meals are loading...";

    useEffect(() => {
        const hasSeenIntro = localStorage.getItem('tomato_intro_seen');
        if (hasSeenIntro) {
            onComplete();
            return;
        }

        let index = 0;
        const typeInterval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    localStorage.setItem('tomato_intro_seen', 'true');
                    onComplete();
                }, 2000);
            }
        }, 50);

        return () => clearInterval(typeInterval);
    }, [onComplete]);

    return (
        <motion.div
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
        >
            <div className="flex flex-col items-center gap-8 px-4">
                <h1 className="text-3xl md:text-5xl font-black text-[#2D2D2D] text-center min-h-[4rem] font-sans">
                    {displayedText}
                    <span className="animate-pulse text-[#E23744]">|</span>
                </h1>

                <motion.img
                    src="/tomato-logo.png"
                    alt="Tomato"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        opacity: displayedText.length > 5 ? 1 : 0,
                        scale: displayedText.length > 5 ? 1 : 0.5
                    }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl"
                />
            </div>
        </motion.div>
    );
}
