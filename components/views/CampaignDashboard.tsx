import React, { useState, useMemo } from 'react';
import { Campaign, Character, DND_CLASSES, SystemType } from '../../types';
import { Icons } from '../ui/Icons';

interface CampaignDashboardProps {
  campaign: Campaign;
  characters: Character[];
  onBack: () => void;
  onSelectCharacter: (charId: string) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void; // Opens settings pre-set to campaign tab
}

const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  campaign,
  characters,
  onBack,
  onSelectCharacter,
  onAddCharacter,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PC' | 'NPC'>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL'); // For DnD
  const [sortOrder, setSortOrder] = useState<'NAME' | 'RECENT'>('RECENT');

  // Filter Logic
  const filteredChars = useMemo(() => {
    return characters
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (c.customClass && c.customClass.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = typeFilter === 'ALL' 
          ? true 
          : typeFilter === 'PC' ? !c.isNpc : c.isNpc;
        
        const matchesClass = classFilter === 'ALL' 
          ? true 
          : c.dndClass === classFilter;

        return matchesSearch && matchesType && matchesClass;
      })
      .sort((a, b) => {
        if (sortOrder === 'NAME') return a.name.localeCompare(b.name);
        return b.updatedAt - a.updatedAt;
      });
  }, [characters, searchTerm, typeFilter, classFilter, sortOrder]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <header className="flex-none bg-slate-900/90 border-b border-slate-700 p-4 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <Icons.Back size={24} />
          </button>
          <div className="flex items-center gap-3">
             {campaign.logoUrl && (
               <img src={campaign.logoUrl} alt="Logo" className="w-10 h-10 rounded-full border border-slate-600 object-cover" />
             )}
             <div>
               <h1 className="text-xl font-bold text-white leading-tight">{campaign.name}</h1>
               {campaign.subTitle && <span className="text-xs text-slate-500 font-mono">{campaign.subTitle}</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onAddCharacter}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-900/20"
          >
            <Icons.Plus size={18} />
            <span className="hidden md:inline">캐릭터 추가</span>
          </button>
          <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <Icons.Settings size={20} />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-none p-4 md:px-8 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="이름, 클래스 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           <select 
             value={typeFilter} 
             onChange={(e) => setTypeFilter(e.target.value as any)}
             className="bg-slate-800 border-none text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500"
           >
             <option value="ALL">전체 유형</option>
             <option value="PC">PC (플레이어)</option>
             <option value="NPC">NPC</option>
           </select>

           {campaign.system === SystemType.DND5E && (
             <select 
                value={classFilter} 
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-800 border-none text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500 max-w-[150px]"
             >
               <option value="ALL">모든 클래스</option>
               {DND_CLASSES.map(cls => (
                 <option key={cls.value} value={cls.value}>{cls.label.split(' ')[0]}</option>
               ))}
             </select>
           )}

           <div className="h-4 w-px bg-slate-700 mx-1" />

           <button 
             onClick={() => setSortOrder(sortOrder === 'NAME' ? 'RECENT' : 'NAME')}
             className="text-slate-400 hover:text-blue-400 text-xs font-medium flex items-center gap-1"
           >
             <Icons.Refresh size={14} />
             {sortOrder === 'NAME' ? '이름순' : '최신순'}
           </button>
        </div>
      </div>

      {/* Character Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {filteredChars.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Icons.Users size={48} className="mb-4" />
            <p>등록된 캐릭터가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredChars.map((char) => {
               // Determine what to show in the subtitle
               let subInfo = char.summary;
               if (campaign.system === SystemType.DND5E && char.dndClass) subInfo = char.dndClass;
               else if (campaign.system === SystemType.CYBERPUNK_RED && char.cpredRole) subInfo = char.cpredRole;
               else if (campaign.system === SystemType.OTHER && char.customClass) subInfo = char.customClass;

               // Determine Display Image (Override Check)
               // Only use override if it is NOT a secret. Secrets should remain hidden on the dashboard.
               const activePortrait = char.extraFiles.find(f => f.useAsPortrait && f.imageUrl && !f.isSecret);
               const displayImg = activePortrait ? activePortrait.imageUrl : char.imageUrl;

               return (
                <div 
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`group cursor-pointer bg-slate-800 border ${activePortrait ? 'border-yellow-600' : 'border-slate-700'} hover:border-blue-500 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col`}
                >
                  {/* Image Container */}
                  <div className="aspect-square bg-slate-900 relative overflow-hidden">
                    {displayImg ? (
                      <img 
                        src={displayImg} 
                        alt={char.name} 
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${char.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Icons.User size={48} />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-sm ${char.isNpc ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {char.isNpc ? 'NPC' : 'PC'}
                      </span>
                    </div>
                    {char.extraFiles.length > 0 && (
                       <div className="absolute bottom-2 right-2">
                         <Icons.Folder size={16} className={`drop-shadow-md ${activePortrait ? 'text-yellow-400' : 'text-slate-500'}`} fill="currentColor" />
                       </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1 bg-slate-800 relative">
                     <h3 className="font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{char.name}</h3>
                     <p className="text-xs text-slate-500 truncate min-h-[1rem]">
                       {subInfo || '-'}
                     </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDashboard;