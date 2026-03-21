const GlobalBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-[-1] bg-gradient-to-br from-[#FFF8F5] via-[#FFFAF8] to-[#FFF5F0] overflow-hidden">
      {/* Visible Tomato Logo Watermark - Top Right */}
      <div className="absolute top-[5%] right-[3%] pointer-events-none opacity-[0.08] rotate-12">
        <img src="/tomato-logo.png" alt="" className="w-[180px] h-[180px]" />
      </div>

      {/* Secondary Watermark - Bottom Left */}
      <div className="absolute bottom-[10%] left-[5%] pointer-events-none opacity-[0.05] -rotate-12">
        <img src="/tomato-logo.png" alt="" className="w-[120px] h-[120px]" />
      </div>

      {/* Zomato-inspired Color Orbs - Red, Pink, Orange accents */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-gradient-to-br from-red-100/50 to-pink-100/30 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] bg-gradient-to-tl from-orange-100/40 to-red-50/30 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Pink accent - center left */}
      <div className="absolute top-[30%] left-[10%] w-[35%] h-[35%] bg-pink-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Green accent - for freshness like Zomato */}
      <div className="absolute bottom-[25%] right-[15%] w-[25%] h-[25%] bg-green-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Blue accent - subtle for trust */}
      <div className="absolute top-[60%] left-[50%] w-[20%] h-[20%] bg-blue-50/25 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Subtle cross pattern overlay for texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23E23744' fill-opacity='0.5' fill-rule='evenodd'%3E%3Cpath d='M0 20h40v1H0zM20 0v40h1V0z'/%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};

export default GlobalBackground;
