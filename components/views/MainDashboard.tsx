
import React from 'react';
import { Campaign } from '../../types';
import { Icons } from '../ui/Icons';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface MainDashboardProps {
  campaigns: Campaign[];
  onSelectCampaign: (id: string) => void;
  onOpenSettings: () => void;
  onOpenAllCharacters: () => void; // New Prop
}

const MainDashboard: React.FC<MainDashboardProps> = ({ campaigns, onSelectCampaign, onOpenSettings, onOpenAllCharacters }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-12 relative custom-scrollbar">
      
      {/* Header - Logo Only Area */}
      <header className="flex flex-col items-center justify-center mb-8 md:mb-16 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700 mt-8 md:mt-16">
        
        {/* Buttons (Top Right) */}
        <div className="absolute right-0 top-0 flex items-center gap-2">
          {/* All Characters Button */}
          <button
            onClick={onOpenAllCharacters}
            className="group flex items-center p-2 md:p-3 text-stone-500 hover:text-emerald-500 bg-stone-900/50 hover:bg-stone-800 border border-stone-800 hover:border-emerald-900/50 rounded-full transition-all duration-500 backdrop-blur-md shadow-lg"
            title="전체 캐릭터 열람"
          >
            <div className="max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-500 ease-out">
              <span className="text-xs font-bold whitespace-nowrap pl-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 tracking-wider font-mono text-emerald-500">
                ALL ARCHIVES
              </span>
            </div>
            <Icons.Library size={20} />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="group flex items-center p-2 md:p-3 text-stone-500 hover:text-amber-500 bg-stone-900/50 hover:bg-stone-800 border border-stone-800 hover:border-amber-900/50 rounded-full transition-all duration-500 backdrop-blur-md shadow-lg"
            title="설정"
          >
            <div className="max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-500 ease-out">
              <span className="text-xs font-bold whitespace-nowrap pl-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 tracking-wider font-mono text-amber-500">
                SYSTEM CONFIG
              </span>
            </div>
            <Icons.Settings size={20} className="transition-transform duration-700 ease-in-out group-hover:rotate-180" />
          </button>
        </div>
        
        {/* Main Logo Composition */}
        <div className="relative group cursor-default flex flex-col items-center">
          
          {/* Decorative Top Line */}
          <div className="flex items-center gap-4 text-stone-600 mb-4 md:mb-6 opacity-60">
             <Icons.Clover size={14} className="text-amber-800" />
             <div className="h-px w-12 md:w-16 bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
             <span className="text-[10px] font-serif tracking-[0.4em] uppercase text-amber-900/70">Archive</span>
             <div className="h-px w-12 md:w-16 bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
             <Icons.Clover size={14} className="text-amber-800" />
          </div>

          {/* Logo Circle */}
          <div className="relative w-28 h-28 md:w-40 md:h-40 mb-2">
             {/* Glowing Background */}
             <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full" />
             
             {/* Center Icon */}
             <div className="absolute inset-0 flex items-center justify-center text-stone-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <div className="relative z-10 text-amber-700/80">
                  <Icons.Ship className="w-12 h-12 md:w-[72px] md:h-[72px]" strokeWidth={1} />
                </div>
             </div>
             
             {/* Rings */}
             <div className="absolute inset-0 rounded-full border border-stone-800 opacity-50" />
             <div className="absolute inset-[-4px] rounded-full border border-dashed border-stone-800/50 animate-[spin_60s_linear_infinite]" />
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 flex items-start justify-center pb-20 z-10 animate-in fade-in duration-1000 delay-200">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 w-full max-w-6xl px-4">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign.id)}
              className="group relative flex flex-col w-full h-56 md:h-64 bg-[#1c1917] rounded-sm overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-stone-800 hover:border-amber-700/50"
            >
              {/* Card Texture / Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content Layout */}
              <div className="relative z-10 h-full flex flex-row items-center p-4 md:p-6 text-left gap-4 md:gap-6">
                
                {/* Logo Area */}
                <div className="relative shrink-0">
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-0.5 bg-gradient-to-b from-stone-700 to-stone-900 shadow-xl group-hover:shadow-amber-900/20 transition-all duration-500">
                     <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0a09] relative flex items-center justify-center">
                        {campaign.logoUrl ? (
                          <img 
                            src={getOptimizedImageUrl(campaign.logoUrl, 200)} 
                            alt={campaign.name} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0" 
                          />
                        ) : (
                          <Icons.Folder size={32} strokeWidth={1} className="text-stone-700 group-hover:text-amber-700 transition-colors" />
                        )}
                     </div>
                   </div>
                </div>

                {/* Typography Area */}
                <div className="flex-1 flex flex-col justify-center border-l border-stone-800 pl-4 md:pl-6 h-3/4 group-hover:border-amber-900/30 transition-colors">
                  <h2 className="text-lg md:text-2xl font-serif font-bold text-stone-300 break-keep leading-snug mb-1 md:mb-2 group-hover:text-amber-500 transition-colors duration-300">
                    {campaign.name}
                  </h2>
                  <p className="text-[10px] md:text-[11px] text-stone-600 font-mono uppercase tracking-widest line-clamp-1 group-hover:text-amber-700/80 transition-colors">
                    {campaign.subTitle || 'Unknown Chronicle'}
                  </p>
                  <div className="mt-2 md:mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                     <span className="text-[10px] text-stone-500 font-sans border border-stone-700 px-2 py-0.5 rounded-full">
                       {campaign.system}
                     </span>
                  </div>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-2 right-2 text-stone-800 group-hover:text-amber-900/40 transition-colors duration-500">
                <Icons.Clover size={12} />
              </div>
            </button>
          ))}
          
          {/* Create New Campaign Card - Simple & Clean */}
          <button
             onClick={onOpenSettings}
             className="group relative flex flex-col items-center justify-center w-full h-56 md:h-64 rounded-sm border border-dashed border-stone-800 hover:border-amber-700/50 bg-transparent hover:bg-stone-900/30 transition-all duration-300 gap-3"
          >
             <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center text-stone-600 group-hover:text-amber-500 group-hover:border-amber-500/50 transition-all duration-300">
                <Icons.Plus size={20} />
             </div>
             <span className="text-xs font-serif font-bold text-stone-600 group-hover:text-amber-600 tracking-widest transition-colors">
               Create New World
             </span>
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
        <div className="flex items-center justify-center gap-3 opacity-20 text-[10px] text-stone-500 font-mono tracking-[0.2em]">
          <span>RPG TEAM</span>
          <span className="w-px h-3 bg-stone-700" />
          <span>EST. 2023</span>
        </div>
      </footer>
    </div>
  );
};

export default MainDashboard;
