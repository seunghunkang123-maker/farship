
import React, { useState, useMemo } from 'react';
import { Campaign, Character } from '../../types';
import { Icons } from '../ui/Icons';
import { THEMES, THEME_KEYS } from '../../constants';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface AllCharactersViewProps {
  campaigns: Campaign[];
  characters: Character[];
  onBack: () => void;
  onSelectCharacter: (charId: string) => void;
}

// Helper for Level Sorting
const getLevelNumber = (levelStr?: string): number => {
  if (!levelStr) return 0;
  const num = parseInt(levelStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

const AllCharactersView: React.FC<AllCharactersViewProps> = ({
  campaigns,
  characters,
  onBack,
  onSelectCharacter
}) => {
  const [sortOrder, setSortOrder] = useState<'NAME' | 'RECENT' | 'LEVEL'>('RECENT');
  const [groupByCampaign, setGroupByCampaign] = useState(true);

  // Sorting Function
  const sortCharacters = (chars: Character[]) => {
    return [...chars].sort((a, b) => {
      if (sortOrder === 'NAME') return a.name.localeCompare(b.name);
      if (sortOrder === 'LEVEL') {
         const lvA = getLevelNumber(a.secretProfile?.levelOrExp || a.levelOrExp);
         const lvB = getLevelNumber(b.secretProfile?.levelOrExp || b.levelOrExp);
         return lvB - lvA; // High to Low
      }
      // RECENT
      return b.updatedAt - a.updatedAt;
    });
  };

  // 1. Grouped Data
  const charactersByCampaign = useMemo(() => {
    const grouped: Record<string, Character[]> = {};
    campaigns.forEach(c => {
      const chars = characters.filter(char => char.campaignId === c.id);
      grouped[c.id] = sortCharacters(chars);
    });
    return grouped;
  }, [campaigns, characters, sortOrder]);

  // 2. Flat Data
  const allSortedCharacters = useMemo(() => {
    return sortCharacters(characters);
  }, [characters, sortOrder]);

  // Render a single character card (extracted for reuse)
  const renderCharacterCard = (char: Character, campaign?: Campaign) => {
    const activePortrait = char.extraFiles.find(f => f.useAsPortrait && f.imageUrl && !f.isSecret);
    const displayImg = activePortrait ? activePortrait.imageUrl : char.imageUrl;
    
    // Determine Theme based on Character's Campaign
    const charCampaign = campaign || campaigns.find(c => c.id === char.campaignId);
    const themeKey = charCampaign?.theme || THEME_KEYS.ADVENTURE;
    const tc = (THEMES[themeKey] || THEMES[THEME_KEYS.ADVENTURE]).classes;

    return (
      <div 
        key={char.id}
        onClick={() => onSelectCharacter(char.id)}
        className={`group cursor-pointer rounded-lg overflow-hidden border transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-xl ${tc.bgPanel} ${tc.border}`}
      >
        {/* Image */}
        <div className="aspect-square bg-black/20 relative overflow-hidden">
          {displayImg ? (
            <img 
              src={getOptimizedImageUrl(displayImg, 600)} 
              alt={char.name} 
              className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${char.imageFit === 'contain' ? 'object-contain' : 'object-cover object-top'}`}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${tc.textSub}`}><Icons.User size={32} /></div>
          )}
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold rounded text-white ${char.isNpc ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              {char.isNpc ? 'NPC' : 'PC'}
          </div>
          
          {/* Campaign Badge (Only in Unified View) */}
          {!groupByCampaign && charCampaign && (
             <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-1 text-[8px] text-center text-white/80 truncate">
                {charCampaign.name}
             </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
            <h3 className={`truncate text-sm font-bold ${tc.textMain}`}>{char.name}</h3>
            {char.alias && <div className={`text-[10px] truncate opacity-60 ${tc.textSub}`}>{char.alias}</div>}
            <div className="mt-1 flex items-center justify-between text-[10px] opacity-50">
              <span className={tc.textSub}>{char.playerName || '-'}</span>
              {char.levelOrExp && <span className={`bg-white/5 px-1 rounded ${tc.textSub}`}>{char.levelOrExp}</span>}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] font-sans text-stone-200 overflow-hidden">
      {/* Header */}
      <header className="flex-none p-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between backdrop-blur-md sticky top-0 z-20 border-b border-stone-800 bg-[#0c0a09]/90 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors">
            <Icons.Back size={24} />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-900/30 rounded-lg text-amber-500">
               <Icons.Library size={24} />
             </div>
             <div>
               <h1 className="text-lg md:text-xl font-bold leading-tight text-stone-200">전체 기록 열람</h1>
               <span className="text-[10px] md:text-xs font-mono text-stone-500">ALL ARCHIVES ACCESS</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Group Toggle */}
          <div className="flex bg-stone-900/50 p-1 rounded-lg border border-stone-800">
             <button
                onClick={() => setGroupByCampaign(true)}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${groupByCampaign ? 'bg-amber-700 text-white shadow' : 'text-stone-500 hover:text-stone-300'}`}
             >
                <Icons.Folder size={14}/> <span className="hidden sm:inline">캠페인별</span>
             </button>
             <button
                onClick={() => setGroupByCampaign(false)}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${!groupByCampaign ? 'bg-amber-700 text-white shadow' : 'text-stone-500 hover:text-stone-300'}`}
             >
                <Icons.Users size={14}/> <span className="hidden sm:inline">전체보기</span>
             </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3 bg-stone-900/50 p-1 rounded-lg border border-stone-800">
             <span className="text-[10px] font-bold text-stone-500 px-2 uppercase hidden sm:inline">Sort By</span>
             <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value as any)}
               className="bg-transparent border-none text-xs font-bold text-stone-300 focus:outline-none focus:text-amber-500 py-1"
             >
               <option value="RECENT" className="bg-stone-900">최신순 (Recent)</option>
               <option value="NAME" className="bg-stone-900">이름순 (Name)</option>
               <option value="LEVEL" className="bg-stone-900">레벨순 (Level)</option>
             </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-12 pb-20">
        
        {groupByCampaign ? (
          // --- GROUPED VIEW ---
          campaigns.map(campaign => {
            const campaignChars = charactersByCampaign[campaign.id] || [];
            if (campaignChars.length === 0) return null;

            return (
              <div key={campaign.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-6 border-b border-stone-800 pb-2">
                   {campaign.logoUrl ? (
                     <img src={getOptimizedImageUrl(campaign.logoUrl, 100)} className="w-10 h-10 rounded-full object-cover border border-stone-700" alt={campaign.name} />
                   ) : (
                     <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-500"><Icons.Folder size={20}/></div>
                   )}
                   <div>
                      <h2 className="text-xl font-bold font-serif text-stone-300">{campaign.name}</h2>
                      <span className="text-xs text-stone-500 font-mono uppercase">{campaign.system} • {campaignChars.length} Characters</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {campaignChars.map(char => renderCharacterCard(char, campaign))}
                </div>
              </div>
            );
          })
        ) : (
          // --- UNIFIED VIEW ---
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {allSortedCharacters.map(char => renderCharacterCard(char))}
             </div>
          </div>
        )}
        
        {characters.length === 0 && (
           <div className="text-center py-20 opacity-50">
              <Icons.Library size={48} className="mx-auto mb-4 text-stone-600"/>
              <p>등록된 캐릭터가 없습니다.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default AllCharactersView;
