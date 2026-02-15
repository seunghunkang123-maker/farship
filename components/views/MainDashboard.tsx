import React from 'react';
import { Campaign } from '../../types';
import { Icons } from '../ui/Icons';

interface MainDashboardProps {
  campaigns: Campaign[];
  onSelectCampaign: (id: string) => void;
  onOpenSettings: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ campaigns, onSelectCampaign, onOpenSettings }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-12 relative">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-0" />
      
      {/* Header - 원양어선 Team Brand Area */}
      <header className="flex flex-col items-center justify-center mb-24 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700 mt-8">
        
        {/* Settings Button (Top Right) */}
        <div className="absolute right-0 top-0">
          <button
            onClick={onOpenSettings}
            className="group flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-700/50 border border-white/5 hover:border-white/20 rounded-full transition-all duration-300 backdrop-blur-md"
            title="설정"
          >
            <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 hidden md:inline-block">SYSTEM CONFIG</span>
            <Icons.Settings size={18} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>
        
        {/* Main Logo Composition */}
        <div className="relative group cursor-default flex flex-col items-center">
          
          {/* Decorative Top Line */}
          <div className="flex items-center gap-4 text-slate-500 mb-4 opacity-60">
             <Icons.Clover size={16} className="text-amber-700" />
             <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
             <span className="text-[10px] font-mono tracking-[0.3em] uppercase">Adventure Ticket</span>
             <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
             <Icons.Clover size={16} className="text-amber-700" />
          </div>

          {/* Logo Circle */}
          <div className="relative w-40 h-40 mb-6">
             {/* Rotating Border */}
             <div className="absolute inset-0 rounded-full border border-dashed border-slate-600 animate-[spin_60s_linear_infinite] opacity-30" />
             <div className="absolute inset-2 rounded-full border border-double border-amber-800/40" />
             
             {/* Center Icon */}
             <div className="absolute inset-0 flex items-center justify-center text-slate-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <div className="relative z-10">
                  <Icons.Ship size={64} strokeWidth={1.5} />
                </div>
                {/* Waves behind */}
                <div className="absolute bottom-8 text-blue-500/20 z-0 scale-150">
                   <Icons.Waves size={48} />
                </div>
             </div>
             
             {/* Badge Text */}
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-3 py-1 rounded-full border border-slate-700 text-[10px] text-amber-500 font-mono tracking-widest shadow-xl">
               Since 2023
             </div>
          </div>

          {/* Team Name */}
          <h1 className="text-5xl md:text-7xl font-fantasy font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-stone-200 to-stone-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] tracking-tight pb-2 mb-2">
            원양어선
          </h1>
          
          {/* Subtitle / Infinity */}
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <span className="h-px w-8 bg-slate-700" />
            <Icons.Infinity size={18} className="opacity-50" />
            <span className="text-sm md:text-base font-serif italic tracking-wider text-slate-500">
              Character Database
            </span>
            <Icons.Infinity size={18} className="opacity-50" />
            <span className="h-px w-8 bg-slate-700" />
          </div>

          {/* Members List */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-md text-center">
             {['피쉬', '델리', '망령', '배추', '승훈', '유자'].map((member, idx) => (
               <div key={member} className="flex items-center gap-2 text-slate-500 text-xs md:text-sm font-serif">
                  <span className={`hover:text-amber-400 transition-colors cursor-default ${idx % 2 === 0 ? 'text-slate-400' : 'text-slate-500'}`}>{member}</span>
                  {idx < 5 && <span className="opacity-30 text-[10px]">|</span>}
               </div>
             ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 flex items-start justify-center pb-20 z-10 animate-in fade-in duration-1000 delay-200">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full max-w-7xl px-4">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign.id)}
              className="group relative flex flex-col w-full h-72 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Card Glass Background */}
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md border border-white/5 group-hover:border-white/10 group-hover:bg-slate-800/70 transition-all duration-300" />
              
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

              {/* Content Layout */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                
                {/* Logo with Glow */}
                <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500 ease-out">
                   <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
                     <div className="w-full h-full rounded-full overflow-hidden bg-black/80 relative ring-1 ring-white/10">
                        {campaign.logoUrl ? (
                          <img 
                            src={campaign.logoUrl} 
                            alt={campaign.name} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                            <Icons.Folder size={32} strokeWidth={1.5} />
                          </div>
                        )}
                     </div>
                   </div>
                </div>

                {/* Typography */}
                <div className="w-full space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-200 font-serif break-keep leading-tight transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-amber-100 group-hover:to-amber-500">
                    {campaign.name}
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-mono uppercase tracking-[0.15em] line-clamp-1 group-hover:text-amber-400/80 transition-colors">
                    {campaign.subTitle || 'Unknown Chronicle'}
                  </p>
                </div>
              </div>
            </button>
          ))}
          
          {/* Create New Campaign Card - Modernized */}
          <button
             onClick={onOpenSettings}
             className="group relative flex flex-col items-center justify-center w-full h-72 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-900/50 bg-slate-900/30 hover:bg-slate-800/50 backdrop-blur-sm transition-all duration-300 gap-4"
          >
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-amber-100 group-hover:scale-110 group-hover:bg-amber-900/50 group-hover:border-amber-700 transition-all duration-300 shadow-xl">
                <Icons.Plus size={24} />
             </div>
             <span className="text-xs font-bold text-slate-500 group-hover:text-amber-500 uppercase tracking-widest transition-colors">
               Start New Journey
             </span>
          </button>
        </div>
      </div>
      
      {/* Minimal Footer */}
      <footer className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
        <div className="flex items-center justify-center gap-2 opacity-30 text-[10px] text-slate-400 font-mono tracking-widest">
          <Icons.Anchor size={12} />
          <span>RPG TEAM</span>
          <span className="w-1 h-1 bg-current rounded-full" />
          <span>EST. 2023</span>
        </div>
      </footer>
    </div>
  );
};

export default MainDashboard;