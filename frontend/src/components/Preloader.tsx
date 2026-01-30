import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
    onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftCurtainRef = useRef<HTMLDivElement>(null);
    const rightCurtainRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    const [displayText, setDisplayText] = useState('');
    const fullText = "Your favorite meals are loading...";

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial setup
            gsap.set([leftCurtainRef.current, rightCurtainRef.current], {
                transformOrigin: 'center center'
            });

            // Initial states
            gsap.set([logoRef.current, progressRef.current, textRef.current], { opacity: 0, scale: 0.8 });

            // Create particles
            createParticles();

            // Main animation timeline - Masterpiece Sequence
            const tl = gsap.timeline();

            // Phase 1: Background glow fade in
            tl.fromTo(glowRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }
            )
                // Phase 2: Typing Animation Starts First
                .to(textRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' })
                .add(() => {
                    startTypingAnimation();
                }, '-=0.4')

                // Phase 3: Logo entrance with elastic effect (after typing started)
                .fromTo(logoRef.current,
                    { scale: 0, rotation: -180, opacity: 0 },
                    { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.4)' },
                    '-=1.5'
                )
                // Logo continuous subtle float
                .to(logoRef.current, {
                    y: -12,
                    duration: 2,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                }, '<')

                // Phase 4: Progress bar appearance
                .fromTo(progressRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
                    '-=1'
                )
                .fromTo(progressBarRef.current,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 3.5, ease: 'power1.inOut' },
                    '-=0.5'
                )

                // Phase 5: Exit Sequence
                .to({}, { duration: 1 }) // Wait for completion
                .to([logoRef.current, textRef.current, progressRef.current], {
                    opacity: 0,
                    scale: 1.1,
                    filter: 'blur(10px)',
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power4.in'
                })
                // Curtain draw open effect - smoother easing
                .to(leftCurtainRef.current, {
                    x: '-100%',
                    duration: 1.8,
                    ease: 'expo.inOut'
                }, '-=0.4')
                .to(rightCurtainRef.current, {
                    x: '100%',
                    duration: 1.8,
                    ease: 'expo.inOut'
                }, '<')
                // Fade out container
                .to(containerRef.current, {
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    onComplete: () => {
                        onComplete();
                    }
                });

            // Animate particles continuously
            animateParticles();

            // Glow pulse animation
            gsap.to(glowRef.current, {
                scale: 1.2,
                opacity: 0.5,
                duration: 3,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });

        }, containerRef);

        return () => ctx.revert();
    }, [onComplete]);

    const createParticles = () => {
        if (!particlesRef.current) return;

        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute rounded-full';

            // Varied sizes for depth
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            // Alternate between red shades and white
            const colorChoice = i % 3;
            if (colorChoice === 0) {
                particle.classList.add('bg-red-400');
            } else if (colorChoice === 1) {
                particle.classList.add('bg-red-300');
            } else {
                particle.classList.add('bg-white');
            }

            // Random starting position
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;

            gsap.set(particle, {
                left: `${startX}%`,
                top: `${startY}%`,
                opacity: Math.random() * 0.4 + 0.1,
                scale: Math.random() * 0.6 + 0.4
            });

            particlesRef.current.appendChild(particle);
        }
    };

    const animateParticles = () => {
        if (!particlesRef.current) return;

        const particles = particlesRef.current.children;

        Array.from(particles).forEach((particle, i) => {
            // More organic movement
            gsap.to(particle, {
                y: `random(-150, 150)`,
                x: `random(-150, 150)`,
                rotation: `random(0, 360)`,
                scale: `random(0.5, 1.2)`,
                duration: `random(4, 8)`,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: i * 0.05
            });
        });
    };

    const startTypingAnimation = () => {
        let index = 0;
        const typingInterval = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayText(fullText.slice(0, index));
                index++;
            } else {
                clearInterval(typingInterval);
                // Smoother cursor blink
                gsap.to(cursorRef.current, {
                    opacity: 0,
                    duration: 0.6,
                    repeat: 4,
                    yoyo: true,
                    ease: 'steps(1)'
                });
            }
        }, 90);
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] overflow-hidden bg-black"
        >
            {/* Base Background */}
            <div className="absolute inset-0 bg-red-900" />

            {/* Animated glow background - more vibrant */}
            <div
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(185,28,28,0.2) 40%, transparent 70%)',
                    filter: 'blur(80px)'
                }}
            />

            {/* Left Red Curtain - Masterpiece Realism */}
            <div
                ref={leftCurtainRef}
                className="absolute top-0 left-0 w-1/2 h-full z-20"
                style={{
                    background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 40%, #ef4444 60%, #b91c1c 100%)',
                    boxShadow: 'inset -20px 0 50px rgba(0,0,0,0.5), 15px 0 30px rgba(0,0,0,0.3)'
                }}
            >
                {/* Curtain folds with deep shadows */}
                <div className="absolute inset-0 flex">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 h-full"
                            style={{
                                background: `linear-gradient(90deg, 
                  rgba(0,0,0,0.2) 0%, 
                  rgba(255,255,255,0.05) 15%, 
                  transparent 40%, 
                  transparent 60%, 
                  rgba(0,0,0,0.1) 85%, 
                  rgba(0,0,0,0.3) 100%)`,
                                borderRight: '1px solid rgba(0,0,0,0.15)'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Right Red Curtain - Masterpiece Realism */}
            <div
                ref={rightCurtainRef}
                className="absolute top-0 right-0 w-1/2 h-full z-20"
                style={{
                    background: 'linear-gradient(225deg, #b91c1c 0%, #dc2626 40%, #ef4444 60%, #b91c1c 100%)',
                    boxShadow: 'inset 20px 0 50px rgba(0,0,0,0.5), -15px 0 30px rgba(0,0,0,0.3)'
                }}
            >
                {/* Curtain folds with deep shadows */}
                <div className="absolute inset-0 flex">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 h-full"
                            style={{
                                background: `linear-gradient(90deg, 
                  rgba(0,0,0,0.3) 0%, 
                  rgba(0,0,0,0.1) 15%, 
                  transparent 40%, 
                  transparent 60%, 
                  rgba(255,255,255,0.05) 85%, 
                  rgba(0,0,0,0.2) 100%)`,
                                borderRight: '1px solid rgba(0,0,0,0.15)'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Center Content Container */}
            <div className="absolute inset-0 flex items-center justify-center z-30">
                {/* Particles container */}
                <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

                {/* Main content */}
                <div className="relative z-10 flex flex-col items-center">
                    {/* Masterpiece Tomato Orb Logo */}
                    <div
                        ref={logoRef}
                        className="relative mb-8"
                    >
                        <div className="relative w-40 h-40">
                            {/* Outer Atmosphere Glow */}
                            <div className="absolute -inset-10 bg-red-500/20 rounded-full blur-3xl animate-pulse" />

                            {/* Orbiting Rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-spin" style={{ animationDuration: '8s' }} />
                            <div className="absolute -inset-4 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />

                            {/* Main Glossy Sphere */}
                            <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    background: 'radial-gradient(circle at 30% 30%, #ff8888 0%, #ef4444 40%, #991b1b 100%)',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 -10px 20px rgba(0,0,0,0.4), inset 0 10px 20px rgba(255,255,255,0.4)'
                                }}
                            >
                                {/* Inner Gloss Highlights */}
                                <div className="absolute top-[10%] left-[15%] w-[40%] h-[40%] bg-white/30 rounded-full blur-xl" />
                                <div className="absolute top-[15%] left-[20%] w-6 h-6 bg-white/60 rounded-full" />

                                {/* Tomato Illustration - Enhanced */}
                                <svg
                                    viewBox="0 0 64 64"
                                    className="w-24 h-24 text-white drop-shadow-2xl"
                                    style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))' }}
                                    fill="currentColor"
                                >
                                    <ellipse cx="32" cy="38" rx="23" ry="21" />
                                    <ellipse cx="23" cy="31" rx="8" ry="6" fill="rgba(255,255,255,0.4)" />
                                    <path d="M32 17 L27 10 L32 13 L37 10 L35 17 Z" fill="#166534" />
                                    <path d="M32 17 Q24 14 20 19 Q27 17 32 19 Q37 17 44 19 Q40 14 32 17" fill="#22c55e" />
                                </svg>

                                {/* Sub-surface scattering effect */}
                                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-red-600/40 to-transparent" />
                            </div>
                        </div>

                        {/* Brand Name - Masterpiece Typography */}
                        <div className="mt-8 text-center">
                            <h1 className="text-7xl font-black text-white tracking-tighter"
                                style={{
                                    textShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 50px rgba(239, 68, 68, 0.4)',
                                    fontFamily: "'Outfit', 'Lato', sans-serif"
                                }}
                            >
                                tomato
                            </h1>
                        </div>
                    </div>

                    {/* Enhanced Typing Box */}
                    <div
                        ref={textRef}
                        className="relative"
                    >
                        <div className="backdrop-blur-xl rounded-2xl px-12 py-6 border border-white/10 shadow-3xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(31,0,0,0.4) 0%, rgba(20,0,0,0.6) 100%)',
                            }}
                        >
                            <p className="text-xl md:text-2xl font-semibold text-white/90 tracking-wide text-center">
                                <span className="text-red-400 mr-2 opacity-50">"</span>
                                {displayText}
                                <span
                                    ref={cursorRef}
                                    className="inline-block w-1 h-6 bg-red-500 ml-1 align-middle"
                                    style={{ boxShadow: '0 0 15px rgba(239,68,68,0.8)' }}
                                />
                                <span className="text-red-400 ml-2 opacity-50">"</span>
                            </p>
                        </div>
                    </div>

                    {/* Precision Progress Bar */}
                    <div
                        ref={progressRef}
                        className="mt-12 w-80"
                    >
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div
                                ref={progressBarRef}
                                className="h-full origin-left rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #fca5a5 100%)',
                                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold mt-4 text-center">
                            Establishing Gourmet Connection
                        </p>
                    </div>
                </div>
            </div>

            {/* Corner Luxury Stamps */}
            <div className="absolute top-12 left-12 w-16 h-16 border-l border-t border-white/10 rounded-tl-2xl opacity-40" />
            <div className="absolute top-12 right-12 w-16 h-16 border-r border-t border-white/10 rounded-tr-2xl opacity-40" />
            <div className="absolute bottom-12 left-12 w-16 h-16 border-l border-b border-white/10 rounded-bl-2xl opacity-40" />
            <div className="absolute bottom-12 right-12 w-16 h-16 border-r border-b border-white/10 rounded-br-2xl opacity-40" />
        </div>
    );
};

export default Preloader;

