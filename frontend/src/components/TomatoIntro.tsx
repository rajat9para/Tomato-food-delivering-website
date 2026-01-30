import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function TomatoIntro({ onComplete }: { onComplete: () => void }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // 1. Check if user has seen intro
        const hasSeenIntro = localStorage.getItem('tomato_intro_seen');
        if (hasSeenIntro) {
            onComplete();
            return;
        }

        // 2. GSAP Animation Sequence
        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    localStorage.setItem('tomato_intro_seen', 'true');
                    onComplete();
                }, 1200);
            }
        });

        // Step 1: Text Animation (Fade In & Up)
        tl.to(".intro-text-span", {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 1,
            ease: "power3.out"
        })
            .to(".intro-text-container", {
                y: -50,
                scale: 0.9,
                opacity: 0,
                duration: 0.8,
                delay: 1.0,  // Pause for reading
                ease: "power2.in"
            })

            // Step 2: Logo Drawing Animation
            .fromTo("#tomato-svg-container", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 })
            .fromTo("#tomato-outline",
                { strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0 },
                { strokeDashoffset: 0, opacity: 1, duration: 1.5, ease: "power3.out" }
            )
            .to("#tomato-fill", { fill: "#E23744", opacity: 1, duration: 0.8 }, "-=0.5");

    }, [onComplete]);

    // Split text for staggered animation
    const text = "Healthy and tasty food are on the way".split(" ");

    return (
        <motion.div
            ref={containerRef}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
        >
            {/* Background Subtle Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-red-50 to-white" />

            {/* Text Container */}
            <div className="intro-text-container absolute z-20 flex flex-wrap justify-center gap-x-3 px-8 text-center max-w-4xl">
                {text.map((word, i) => (
                    <span
                        key={i}
                        className="intro-text-span text-3xl md:text-5xl font-black text-[#2D2D2D] opacity-0 translate-y-10 inline-block"
                        style={{ color: word.toLowerCase() === 'tasty' || word.toLowerCase() === 'food' ? '#E23744' : '#2D2D2D' }}
                    >
                        {word}
                    </span>
                ))}
            </div>

            {/* SVG Tomato Logo (Initially Hidden) */}
            <div id="tomato-svg-container" className="relative z-10 opacity-0">
                <svg width="180" height="180" viewBox="0 0 100 100" ref={svgRef} className="drop-shadow-2xl">
                    <path
                        id="tomato-outline"
                        d="M50 20C30 20 15 35 15 55C15 75 35 85 50 85C65 85 85 75 85 55C85 35 70 20 50 20Z"
                        fill="none"
                        stroke="#E23744"
                        strokeWidth="3"
                    />
                    <path
                        id="tomato-fill"
                        d="M50 25C35 25 22 35 22 55C22 70 35 80 50 80C65 80 78 70 78 55C78 35 65 25 50 25Z"
                        fill="transparent"
                    />
                    {/* Subtle stem */}
                    <path d="M50 10 L50 22 M45 15 L55 15" stroke="#48BB78" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>

            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute bottom-10 text-gray-400 hover:text-[#E23744] text-xs tracking-[0.2em] uppercase transition-colors font-bold z-30"
            >
                Skip Intro
            </button>
        </motion.div>
    );
}
