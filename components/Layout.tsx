import React, { useState, useEffect } from 'react';

interface LayoutProps {
  backgrounds: string[];
  children: React.ReactNode;
  themeClasses?: {
    bgMain: string;
    overlay?: string;
  };
}

const Layout: React.FC<LayoutProps> = ({ backgrounds, children, themeClasses }) => {
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

  // Use Theme override or Default Slate-900
  const bgColorClass = themeClasses?.bgMain || 'bg-slate-900';

  return (
    <div className={`relative min-h-screen w-full overflow-hidden text-slate-100 font-sans transition-colors duration-500 ${bgColorClass}`}>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === bgIndex ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        {/* If no background image is present, the bgColorClass handles the base color */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent`} />
        
        {/* Theme Overlay Pattern */}
        {themeClasses?.overlay && (
           <div className={`absolute inset-0 opacity-50 ${themeClasses.overlay}`} />
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;