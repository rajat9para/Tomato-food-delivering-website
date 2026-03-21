import { Linkedin, Github, Instagram, Heart, MapPin, GraduationCap, X, Code2 } from 'lucide-react';
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
    { name: 'Rajat Singh Rawat', leetcode: 'https://leetcode.com/', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
    { name: 'Rikshit Negi', leetcode: 'https://leetcode.com/', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
    { name: 'Sneha Kandwal', leetcode: 'https://leetcode.com/', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
    { name: 'Priyanshu Jugran', leetcode: 'https://leetcode.com/', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
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
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                <img src="/tomato-logo.png" alt="Tomato" className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">tomato</h1>
            </div>

            <div className="space-y-6">
              <p className="text-4xl md:text-5xl font-black text-white/90 leading-tight tracking-tight">
                Crafted with <span className="text-primary">Passion</span><br />
                By <span className="text-orange-400 font-black italic">Team DevX</span>
              </p>

              <div className="flex flex-wrap gap-8 text-gray-400 font-bold uppercase tracking-widest text-xs">
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

          {/* About & Interaction - Click to Open Popup */}
          <div className="relative" ref={popupRef}>
            <div className="text-center md:text-right space-y-8">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">The Creators</h4>
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
              <p className="text-gray-500 font-medium leading-relaxed max-w-xs md:ml-auto uppercase text-xs tracking-widest">
                A 6th Semester project aiming for excellence in food tech.
              </p>
            </div>

            {/* Team Popup with Social Links */}
            {showTeam && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 z-[199]" onClick={() => setShowTeam(false)}></div>
                {/* Modal */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl w-[90%] max-w-[480px] z-[200] animate-scale-in overflow-visible border border-gray-100">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-400 rounded-t-[2rem]"></div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">Team DevX</h3>
                    <button onClick={() => setShowTeam(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="group flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-200">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-base md:text-lg shadow-lg shadow-primary/20">
                            {member.name.charAt(0)}
                          </div>
                          <p className="font-bold md:font-black text-gray-900 tracking-tight text-sm md:text-base">{member.name}</p>
                        </div>
                        <div className="flex gap-1.5 md:gap-2">
                          <a href={member.leetcode} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg md:rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all" title="LeetCode">
                            <Code2 size={16} />
                          </a>
                          <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg md:rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white transition-all" title="GitHub">
                            <Github size={16} />
                          </a>
                          <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all" title="LinkedIn">
                            <Linkedin size={16} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-32 pt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            <span>Designed & Developed with</span>
            <Heart size={12} className="text-primary fill-primary" />
            <span>in GEHU, UK</span>
          </div>
          <p className="text-gray-500 font-black text-xs uppercase tracking-[0.4em]">
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