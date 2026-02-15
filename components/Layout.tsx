
import React from 'react';

interface LayoutProps {
  // backgrounds prop is no longer used but kept for interface compatibility if needed, 
  // though we will ignore it in this new design.
  backgrounds?: string[]; 
  children: React.ReactNode;
  themeClasses?: {
    bgMain: string;
    overlay?: string;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, themeClasses }) => {
  // Use Theme override or Default Deep Stone/Black
  const bgColorClass = themeClasses?.bgMain || 'bg-[#0c0a09]'; // Stone 950 base

  return (
    <div className={`relative min-h-screen w-full overflow-hidden text-stone-200 font-sans transition-colors duration-500 ${bgColorClass}`}>
      {/* Static Background Layer - Unified Theme */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base Dark Background */}
        <div className="absolute inset-0 bg-[#0c0a09]" />
        
        {/* Ambient Amber Glow (Top Center) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950/60 to-transparent opacity-60" />
        
        {/* Subtle Noise Texture (Optional, simulates paper/stone grain) */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        {/* Theme Specific Overlay Pattern (if passed from campaign) */}
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
