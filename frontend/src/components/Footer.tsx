import { Linkedin, Github, Instagram, Code } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const Footer = () => {
  const [showTeam, setShowTeam] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowTeam(false);
      }
    };

    if (showTeam) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTeam]);

  const teamMembers = [
    { name: 'Rajat Singh Rawat', leetcode: '#', linkedin: '#', github: '#', instagram: '#' },
    { name: 'Rikshit Negi', leetcode: '#', linkedin: '#', github: '#', instagram: '#' },
    { name: 'Sneha Kandwal', leetcode: '#', linkedin: '#', github: '#', instagram: '#' },
    { name: 'Priyanshu Jugran', leetcode: '#', linkedin: '#', github: '#', instagram: '#' },
  ];

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center">
          {/* Left - Made with love */}
          <div>
            <p className="text-red-500 italic text-lg mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              Made with love by
            </p>
            <p className="text-red-500 italic text-5xl font-bold mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              Team DevX ❤️
            </p>
            <p className="text-gray-400 text-sm mb-1">
              Rajat Singh Rawat, Rikshit Negi, Sneha Kandwal, Priyanshu Jugran
            </p>
            <p className="text-gray-400 text-sm">
              Graphic Era Hill University, Dehradun
            </p>
            <p className="text-gray-400 text-sm">
              BTech CSE - 6th Semester
            </p>
          </div>

          {/* Right - About Us with popup */}
          <div className="relative" ref={popupRef}>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">About Us</p>
              <button
                onClick={() => setShowTeam(!showTeam)}
                className="hover:opacity-80 transition"
              >
                <img src="/foodimages/group-icon.jpg" alt="Team" className="w-16 h-16 rounded-full" />
              </button>
            </div>

            {/* Team Popup */}
            {showTeam && (
              <div className="absolute bottom-full right-0 mb-4 bg-white rounded-xl shadow-2xl p-6 w-80 z-50">
                <h3 className="text-red-500 font-bold text-lg mb-4 text-center">Team DevX</h3>
                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                      <p className="text-gray-800 font-semibold mb-2">{member.name}</p>
                      <div className="flex gap-3">
                        <a href={member.leetcode} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition">
                          <Code className="w-4 h-4 text-red-500" />
                        </a>
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition">
                          <Linkedin className="w-4 h-4 text-red-500" />
                        </a>
                        <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition">
                          <Github className="w-4 h-4 text-red-500" />
                        </a>
                        <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition">
                          <Instagram className="w-4 h-4 text-red-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 TOMATO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;