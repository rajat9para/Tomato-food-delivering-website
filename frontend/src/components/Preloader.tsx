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
    const fullText = "your favourite food is loading";

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial setup
            gsap.set([leftCurtainRef.current, rightCurtainRef.current], {
                transformOrigin: 'center center'
            });

            // Create particles
            createParticles();

            // Main animation timeline - smoother and more polished
            const tl = gsap.timeline();

            // Phase 1: Background glow fade in
            tl.fromTo(glowRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
            )
                // Logo entrance with elastic effect
                .fromTo(logoRef.current,
                    { scale: 0, rotation: -180, opacity: 0 },
                    { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' },
                    '-=0.3'
                )
                // Logo continuous subtle float
                .to(logoRef.current, {
                    y: -8,
                    duration: 1.5,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                }, '<')
                // Progress bar animation - smoother
                .fromTo(progressBarRef.current,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 3, ease: 'power1.inOut' },
                    '-=0.8'
                )
                // Typing animation starts
                .add(() => {
                    startTypingAnimation();
                }, '-=2.5')
                // Wait for typing to complete
                .to({}, { duration: 3.5 })
                // Fade out text and logo with scale
                .to([logoRef.current, textRef.current, progressRef.current], {
                    opacity: 0,
                    scale: 0.9,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'power3.in'
                })
                // Curtain draw open effect - smoother easing
                .to(leftCurtainRef.current, {
                    x: '-100%',
                    duration: 1.5,
                    ease: 'expo.inOut'
                }, '-=0.3')
                .to(rightCurtainRef.current, {
                    x: '100%',
                    duration: 1.5,
                    ease: 'expo.inOut'
                }, '<')
                // Fade out container
                .to(containerRef.current, {
                    opacity: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => {
                        onComplete();
                    }
                });

            // Animate particles continuously
            animateParticles();

            // Glow pulse animation
            gsap.to(glowRef.current, {
                scale: 1.1,
                opacity: 0.6,
                duration: 2,
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
            className="fixed inset-0 z-[9999] overflow-hidden"
        >
            {/* Enhanced Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-800" />

            {/* Animated glow background */}
            <div
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(255,100,100,0.3) 0%, rgba(239,68,68,0.1) 40%, transparent 70%)',
                    filter: 'blur(60px)'
                }}
            />

            {/* Left Red Curtain - enhanced */}
            <div
                ref={leftCurtainRef}
                className="absolute top-0 left-0 w-1/2 h-full"
                style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 30%, #dc2626 60%, #b91c1c 100%)',
                    boxShadow: 'inset -30px 0 60px rgba(0,0,0,0.4), 10px 0 30px rgba(0,0,0,0.3)'
                }}
            >
                {/* Enhanced curtain folds */}
                <div className="absolute inset-0 flex">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1"
                            style={{
                                background: `linear-gradient(90deg, 
                  rgba(0,0,0,0.15) 0%, 
                  rgba(255,255,255,0.05) 15%, 
                  transparent 30%, 
                  transparent 70%, 
                  rgba(0,0,0,0.1) 85%, 
                  rgba(0,0,0,0.2) 100%)`,
                                borderRight: '1px solid rgba(0,0,0,0.1)'
                            }}
                        />
                    ))}
                </div>
                {/* Sheen effect */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)'
                    }}
                />
            </div>

            {/* Right Red Curtain - enhanced */}
            <div
                ref={rightCurtainRef}
                className="absolute top-0 right-0 w-1/2 h-full"
                style={{
                    background: 'linear-gradient(225deg, #dc2626 0%, #ef4444 30%, #dc2626 60%, #b91c1c 100%)',
                    boxShadow: 'inset 30px 0 60px rgba(0,0,0,0.4), -10px 0 30px rgba(0,0,0,0.3)'
                }}
            >
                {/* Enhanced curtain folds */}
                <div className="absolute inset-0 flex">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1"
                            style={{
                                background: `linear-gradient(90deg, 
                  rgba(0,0,0,0.2) 0%, 
                  rgba(0,0,0,0.1) 15%, 
                  transparent 30%, 
                  transparent 70%, 
                  rgba(255,255,255,0.05) 85%, 
                  rgba(0,0,0,0.15) 100%)`,
                                borderRight: '1px solid rgba(0,0,0,0.1)'
                            }}
                        />
                    ))}
                </div>
                {/* Sheen effect */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(225deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)'
                    }}
                />
            </div>

            {/* Center Content Container */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Particles container */}
                <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

                {/* Main content */}
                <div className="relative z-10 flex flex-col items-center">
                    {/* Enhanced Tomato Logo */}
                    <div
                        ref={logoRef}
                        className="relative mb-10"
                    >
                        <div className="relative w-36 h-36">
                            {/* Multiple glow rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="absolute -inset-2 rounded-full border border-red-300/20" />
                            <div className="absolute -inset-6 rounded-full border border-red-400/10" />

                            {/* Main logo circle with enhanced gradient */}
                            <div className="relative w-full h-full rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(145deg, #ff6b6b 0%, #ef4444 40%, #dc2626 100%)',
                                    boxShadow: '0 20px 60px rgba(220, 38, 38, 0.5), 0 0 80px rgba(239, 68, 68, 0.3), inset 0 -4px 20px rgba(0,0,0,0.2), inset 0 4px 20px rgba(255,255,255,0.2)'
                                }}
                            >
                                {/* Inner highlight */}
                                <div className="absolute top-5 left-5 w-10 h-10 bg-white/40 rounded-full blur-md" />
                                <div className="absolute top-8 left-8 w-4 h-4 bg-white/60 rounded-full" />

                                {/* Enhanced Tomato icon */}
                                <svg
                                    viewBox="0 0 64 64"
                                    className="w-22 h-22 text-white drop-shadow-lg"
                                    style={{ width: '88px', height: '88px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
                                    fill="currentColor"
                                >
                                    {/* Tomato body */}
                                    <ellipse cx="32" cy="38" rx="23" ry="21" />
                                    {/* Tomato highlight */}
                                    <ellipse cx="23" cy="31" rx="7" ry="5" fill="rgba(255,255,255,0.5)" />
                                    {/* Stem */}
                                    <path
                                        d="M32 17 L27 10 L32 13 L37 10 L35 17 Z"
                                        fill="#15803d"
                                    />
                                    <path
                                        d="M32 17 Q24 14 20 19 Q27 17 32 19 Q37 17 44 19 Q40 14 32 17"
                                        fill="#22c55e"
                                    />
                                </svg>
                            </div>

                            {/* Enhanced orbiting elements */}
                            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '10s' }}>
                                <div className="absolute -top-1 left-1/2 w-3 h-3 bg-white rounded-full shadow-lg" style={{ boxShadow: '0 0 10px rgba(255,255,255,0.8)' }} />
                            </div>
                            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-red-200 rounded-full shadow-lg" />
                            </div>
                            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                                <div className="absolute -bottom-1 left-1/3 w-1.5 h-1.5 bg-red-300 rounded-full" />
                            </div>
                        </div>

                        {/* Brand name with enhanced styling */}
                        <div className="mt-6 text-center">
                            <h1 className="text-6xl font-black text-white tracking-tight"
                                style={{
                                    textShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 60px rgba(239, 68, 68, 0.6), 0 0 100px rgba(239, 68, 68, 0.3)',
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                tomato
                            </h1>
                        </div>
                    </div>

                    {/* Enhanced Typing text */}
                    <div
                        ref={textRef}
                        className="relative"
                    >
                        <div className="backdrop-blur-md rounded-full px-10 py-5 border border-white/20"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)'
                            }}
                        >
                            <p className="text-2xl md:text-3xl font-medium text-white tracking-wide">
                                <span className="text-red-200">"</span>
                                {displayText}
                                <span
                                    ref={cursorRef}
                                    className="inline-block w-0.5 h-7 bg-white ml-1 align-middle"
                                    style={{ boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}
                                />
                                <span className="text-red-200">"</span>
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Progress bar */}
                    <div
                        ref={progressRef}
                        className="mt-10 w-72"
                    >
                        <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                            <div
                                ref={progressBarRef}
                                className="h-full origin-left rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, #ff9999 0%, #ffffff 50%, #ff9999 100%)',
                                    boxShadow: '0 0 20px rgba(255, 150, 150, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Enhanced Decorative elements */}
                    <div className="absolute -top-24 -left-40 w-20 h-20">
                        <div className="w-full h-full border-2 border-white/15 rounded-xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }} />
                    </div>
                    <div className="absolute -bottom-20 -right-36 w-16 h-16">
                        <div className="w-full h-full border-2 border-red-300/25 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
                    </div>
                    <div className="absolute top-1/2 -left-48 w-10 h-10">
                        <div className="w-full h-full bg-white/10 rounded-lg rotate-12 animate-pulse" style={{ animationDuration: '5s' }} />
                    </div>
                </div>
            </div>

            {/* Enhanced Corner decorations */}
            <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-white/15 rounded-tl-3xl" />
            <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-white/15 rounded-tr-3xl" />
            <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-white/15 rounded-bl-3xl" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-white/15 rounded-br-3xl" />
        </div>
    );
};

export default Preloader;
