import React, { useState, useEffect } from 'react';

interface LayoutProps {
  backgrounds: string[];
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ backgrounds, children }) => {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (backgrounds.length <= 1) return;

    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [backgrounds]);

  // Fallback if no images
  const currentBg = backgrounds.length > 0 ? backgrounds[bgIndex] : '';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === bgIndex ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;