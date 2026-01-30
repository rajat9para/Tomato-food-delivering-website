import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function TomatoIntro({ onComplete }: { onComplete: () => void }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [textIndex, setTextIndex] = useState(0);
    const words = ["Fast.", "Fresh.", "Delivered."];

    useEffect(() => {
        // 1. Check if user has seen intro
        const hasSeenIntro = localStorage.getItem('tomato_intro_seen');
        if (hasSeenIntro) {
            onComplete();
            return;
        }

        // 2. GSAP SVG Stroke Animation
        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    localStorage.setItem('tomato_intro_seen', 'true');
                    onComplete();
                }, 1000);
            }
        });

        tl.fromTo("#tomato-outline",
            { strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0 },
            { strokeDashoffset: 0, opacity: 1, duration: 2, ease: "power3.out" }
        )
            .to("#tomato-fill", { fill: "#FF4D4D", opacity: 0.8, duration: 1 }, "-=1")
            .to(".intro-text", { opacity: 1, y: 0, stagger: 0.4, duration: 0.8 }, "-=0.5");

        // 3. Sequential Text Logic
        const textInterval = setInterval(() => {
            setTextIndex((prev) => (prev < words.length - 1 ? prev + 1 : prev));
        }, 600);

        return () => clearInterval(textInterval);
    }, [onComplete]);

    return (
        <motion.div
            ref={containerRef}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />

            {/* SVG Tomato Logo */}
            <div className="relative z-10 mb-8">
                <svg width="120" height="120" viewBox="0 0 100 100" ref={svgRef} className="drop-shadow-[0_0_15px_rgba(255,77,77,0.5)]">
                    <path
                        id="tomato-outline"
                        d="M50 20C30 20 15 35 15 55C15 75 35 85 50 85C65 85 85 75 85 55C85 35 70 20 50 20Z"
                        fill="none"
                        stroke="#FF4D4D"
                        strokeWidth="2"
                    />
                    <path
                        id="tomato-fill"
                        d="M50 25C35 25 22 35 22 55C22 70 35 80 50 80C65 80 78 70 78 55C78 35 65 25 50 25Z"
                        fill="transparent"
                    />
                    {/* Subtle stem */}
                    <path d="M50 10 L50 22 M45 15 L55 15" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>

            {/* Typewriter Text */}
            <div className="h-12 overflow-hidden text-center">
                <motion.h1
                    key={words[textIndex]}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-4xl font-bold tracking-tighter text-white"
                >
                    {words[textIndex]}
                </motion.h1>
            </div>

            {/* Skip Button (UX Friendly) */}
            <button
                onClick={onComplete}
                className="absolute bottom-10 text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors"
            >
                Skip Intro
            </button>
        </motion.div>
    );
}
