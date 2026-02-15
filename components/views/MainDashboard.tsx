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
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col items-center justify-center mb-12 relative">
        <div className="absolute right-0 top-0">
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="설정"
          >
            <Icons.Settings size={24} />
          </button>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tight mb-4 text-center">
          원양어선 캐릭터 데이터베이스
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-light tracking-widest text-center">
          열람할 캐릭터 데이터베이스를 선택하십시오
        </p>
      </header>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign.id)}
              className="group relative aspect-square bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-center p-6 shadow-lg hover:shadow-blue-500/20"
            >
              {/* Logo / Icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 mb-6 rounded-full bg-slate-900/50 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-blue-400 transition-colors">
                {campaign.logoUrl ? (
                  <img src={campaign.logoUrl} alt={campaign.name} className="w-full h-full object-cover" />
                ) : (
                  <Icons.Folder size={48} className="text-slate-600 group-hover:text-blue-400" />
                )}
              </div>
              
              {/* Text Info */}
              <div className="text-center z-10">
                <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-300 mb-1 break-keep">
                  {campaign.name}
                </h2>
                {campaign.subTitle && (
                  <p className="text-xs text-slate-500 font-mono group-hover:text-slate-400">
                    {campaign.subTitle}
                  </p>
                )}
              </div>
              
              {/* Hover Effect overlay */}
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
          
          {/* Add Campaign Button (Visual cue that setting handles this) */}
          <button
             onClick={onOpenSettings}
             className="hidden md:flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-700 rounded-xl hover:border-slate-500 hover:bg-slate-800/30 text-slate-600 hover:text-slate-400 transition-all"
          >
             <Icons.Plus size={48} className="mb-2" />
             <span className="text-sm font-medium">새 캠페인 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;