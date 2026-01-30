import { Linkedin, Github, Instagram, Code, Heart, MapPin, GraduationCap, X } from 'lucide-react';
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
    <footer className="relative bg-gray-950 font-display pt-32 pb-16 overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-20">
          {/* Brand Focus */}
          <div className="flex-1 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
                <img src="/tomato-logo.png" alt="T" className="w-10 h-10 brightness-0 invert" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">tomato</h1>
            </div>

            <div className="space-y-6">
              <p className="text-4xl md:text-6xl font-black text-white/90 leading-none tracking-tighter">
                Crafted with <span className="text-primary animate-pulse">Passion</span><br />
                By <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 font-black italic">Team DevX</span>
              </p>

              <div className="flex flex-wrap gap-8 text-gray-500 font-bold uppercase tracking-widest text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span>Dehradun, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  <span>GEHU - CSE Branch</span>
                </div>
              </div>
            </div>
          </div>

          {/* About & Interaction */}
          <div className="relative" ref={popupRef}>
            <div className="text-center md:text-right space-y-8">
              <h4 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">The Creators</h4>
              <button
                onClick={() => setShowTeam(!showTeam)}
                className="group relative inline-block p-1 bg-gradient-to-tr from-primary to-orange-400 rounded-full transition-transform hover:scale-110 active:scale-95 duration-500 shadow-2xl shadow-primary/20"
              >
                <div className="w-24 h-24 rounded-full border-4 border-gray-950 overflow-hidden bg-gray-900">
                  <img src="/foodimages/group-icon.jpg" alt="Team" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-xl">
                  <Heart size={20} fill="currentColor" />
                </div>
              </button>
              <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-xs md:ml-auto uppercase text-xs tracking-widest">
                A 6th Semester project aiming for excellence in food tech.
              </p>
            </div>

            {/* Masterpiece Team Popup */}
            {showTeam && (
              <div className="fixed md:absolute md:bottom-full md:right-0 bottom-4 left-4 right-4 mb-8 glass-card p-10 rounded-[3rem] shadow-3xl w-auto md:w-[450px] z-[200] border-white/20 animate-scale-in overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-400"></div>
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-black text-gray-950 tracking-tighter">Team DevX</h3>
                  <button onClick={() => setShowTeam(false)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="group flex items-center justify-between p-4 hover:bg-white/50 rounded-2xl transition-all border border-transparent hover:border-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black">
                          {member.name.charAt(0)}
                        </div>
                        <p className="font-black text-gray-950 tracking-tight">{member.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={member.github} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-black transition-all">
                          <Github size={18} />
                        </a>
                        <a href={member.linkedin} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                          <Linkedin size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            <span>Designed & Developed with</span>
            <Heart size={12} className="text-primary fill-primary" />
            <span>in GEHU, UK</span>
          </div>
          <p className="text-gray-600 font-black text-xs uppercase tracking-[0.4em]">
            &copy; 2024 Tomato Cloud. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;