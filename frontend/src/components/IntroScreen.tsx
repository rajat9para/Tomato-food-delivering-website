import { useEffect, useState } from 'react';

const IntroScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [text, setText] = useState('');
    const fullText = "Fixing Hunger";

    useEffect(() => {
        let index = 0;
        const typingInterval = setInterval(() => {
            setText(fullText.substring(0, index + 1));
            index++;
            if (index === fullText.length) clearInterval(typingInterval);
        }, 120); // Much slower typing

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 1000);
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearInterval(typingInterval);
        };
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center gap-8 animate-fade-in px-6 text-center">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] intro-logo-shadow p-4 border border-red-50 flex items-center justify-center">
                    <img src="/tomato-logo.png" alt="TOMATO" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-3">
                    <h1 className="text-5xl md:text-6xl font-bold text-primary tracking-tighter">
                        {text}<span className="animate-pulse">|</span>
                    </h1>
                    <p className="text-gray-400 font-semibold tracking-widest uppercase text-sm">Food Delivery Service</p>
                </div>
            </div>
        </div>
    );
};

export default IntroScreen;
