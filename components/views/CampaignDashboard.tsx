import React, { useState, useMemo } from 'react';
import { Campaign, Character, DND_CLASSES, SystemType } from '../../types';
import { Icons } from '../ui/Icons';
import { THEMES, THEME_KEYS } from '../../constants';
import { saveCampaign } from '../../services/storage';

interface CampaignDashboardProps {
  campaign: Campaign;
  characters: Character[];
  onBack: () => void;
  onSelectCharacter: (charId: string) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void;
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
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME' | 'RECENT'>('RECENT');
  
  // Theme State
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const currentThemeKey = campaign.theme || THEME_KEYS.ADVENTURE;
  const theme = THEMES[currentThemeKey] || THEMES[THEME_KEYS.ADVENTURE];

  const handleThemeChange = async (newThemeKey: string) => {
    try {
      // Optimistic update handled by parent usually, but here we trigger DB save
      // Note: In a real app, you'd update parent state via prop callback.
      // Since App.tsx holds state, we should ideally call onUpdateCampaign, 
      // but for now we will just save to DB and force reload or assume user refreshes if needed.
      // Better approach: We modify the campaign object in place visually or reload.
      // To keep it simple without refactoring App.tsx completely, we'll save and 
      // rely on the user navigating or 'App' state updates if passed down.
      // *Correction*: We don't have updateCampaign prop here. We will just save and reload window 
      // or better, if App passes an updater.
      // Given constraints, I'll direct save and reload page or just change local visual if I could.
      // Actually, let's just update the DB. The visual won't update until parent re-renders. 
      // But wait! 'campaign' prop is from parent state. 
      // To fix this proper: I'll accept that the visual update might need a refresh or 
      // assume the user is okay with a quick blip.
      // *Wait*, I can just reload the page for now to apply DB change if I can't update parent state.
      // OR better: Just use local state override for immediate visual feedback.
      
      await saveCampaign({ ...campaign, theme: newThemeKey });
      window.location.reload(); // Simple brute force to sync state for now.
    } catch (e) {
      console.error(e);
      alert('테마 저장 실패');
    }
  };

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
    <div className={`flex flex-col h-full transition-colors duration-500 ${theme.classes.bgMain} ${theme.classes.font || ''}`}>
      {/* Optional Theme Overlay */}
      {theme.classes.overlay && <div className={`absolute inset-0 pointer-events-none z-0 ${theme.classes.overlay}`} />}
      
      {/* Header Bar */}
      <header className={`flex-none p-4 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 border-b ${theme.classes.bgMain} ${theme.classes.border}`}>
        <div className="flex items-center gap-4 relative z-30">
          <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme.classes.buttonSecondary}`}>
            <Icons.Back size={24} />
          </button>
          
          {/* Theme Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`p-2 rounded-full transition-colors ${theme.classes.buttonSecondary}`}
              title="테마 변경"
            >
              <Icons.Palette size={20} />
            </button>
            
            {isThemeMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-2 text-xs font-bold text-slate-500 uppercase">UI 테마 선택</div>
                {Object.entries(THEMES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleThemeChange(key);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${currentThemeKey === key ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             {campaign.logoUrl && (
               <img src={campaign.logoUrl} alt="Logo" className={`w-10 h-10 rounded-full object-cover border ${theme.classes.border}`} />
             )}
             <div>
               <h1 className={`text-xl font-bold leading-tight ${theme.classes.textMain}`}>{campaign.name}</h1>
               {campaign.subTitle && <span className={`text-xs font-mono ${theme.classes.textSub}`}>{campaign.subTitle}</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-30">
          <button 
            onClick={onAddCharacter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg ${theme.classes.buttonPrimary}`}
          >
            <Icons.Plus size={18} />
            <span className="hidden md:inline">캐릭터 추가</span>
          </button>
          <button onClick={onOpenSettings} className={`p-2 rounded-lg transition-colors ${theme.classes.buttonSecondary}`}>
            <Icons.Settings size={20} />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className={`flex-none p-4 md:px-8 border-b ${theme.classes.border} ${theme.classes.bgMain} flex flex-col md:flex-row gap-4 items-center justify-between relative z-10`}>
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Icons.Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.classes.textSub}`} size={16} />
          <input 
            type="text"
            placeholder="이름, 클래스 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-transparent border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none transition-colors ${theme.classes.textMain} ${theme.classes.border} focus:border-opacity-100 placeholder:opacity-50`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           <select 
             value={typeFilter} 
             onChange={(e) => setTypeFilter(e.target.value as any)}
             className={`bg-transparent border-none text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-opacity-50 ${theme.classes.textMain}`}
           >
             <option value="ALL" className="bg-slate-800 text-slate-200">전체 유형</option>
             <option value="PC" className="bg-slate-800 text-slate-200">PC (플레이어)</option>
             <option value="NPC" className="bg-slate-800 text-slate-200">NPC</option>
           </select>

           {campaign.system === SystemType.DND5E && (
             <select 
                value={classFilter} 
                onChange={(e) => setClassFilter(e.target.value)}
                className={`bg-transparent border-none text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-opacity-50 max-w-[150px] ${theme.classes.textMain}`}
             >
               <option value="ALL" className="bg-slate-800 text-slate-200">모든 클래스</option>
               {DND_CLASSES.map(cls => (
                 <option key={cls.value} value={cls.value} className="bg-slate-800 text-slate-200">{cls.label.split(' ')[0]}</option>
               ))}
             </select>
           )}

           <div className={`h-4 w-px mx-1 opacity-30 ${theme.classes.textSub} bg-current`} />

           <button 
             onClick={() => setSortOrder(sortOrder === 'NAME' ? 'RECENT' : 'NAME')}
             className={`text-xs font-medium flex items-center gap-1 transition-colors ${theme.classes.buttonSecondary}`}
           >
             <Icons.Refresh size={14} />
             {sortOrder === 'NAME' ? '이름순' : '최신순'}
           </button>
        </div>
      </div>

      {/* Character Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
        {filteredChars.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center opacity-60 ${theme.classes.textSub}`}>
            <Icons.Users size={48} className="mb-4" />
            <p>등록된 캐릭터가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredChars.map((char) => {
               let subInfo = char.summary;
               
               if (campaign.system === SystemType.DND5E && char.dndClass) {
                 subInfo = char.dndClass;
                 if (char.levelOrExp) subInfo += ` (Lv.${char.levelOrExp})`;
               }
               else if (campaign.system === SystemType.CYBERPUNK_RED && char.cpredRole) {
                 subInfo = char.cpredRole;
               }
               else if (campaign.system === SystemType.COC7 && char.customClass) {
                 subInfo = char.customClass; 
               }
               else if (campaign.system === SystemType.BAND_OF_BLADES && char.customClass) {
                 subInfo = char.customClass;
                 if (char.levelOrExp) subInfo += ` (${char.levelOrExp})`;
               }
               else if (campaign.system === SystemType.OTHER && char.customClass) {
                 subInfo = char.customClass;
               }

               const activePortrait = char.extraFiles.find(f => f.useAsPortrait && f.imageUrl && !f.isSecret);
               const displayImg = activePortrait ? activePortrait.imageUrl : char.imageUrl;

               return (
                <div 
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border ${theme.classes.bgPanel} ${activePortrait ? 'border-yellow-500' : theme.classes.border}`}
                >
                  {/* Image Container */}
                  <div className="aspect-square bg-black/20 relative overflow-hidden">
                    {displayImg ? (
                      <img 
                        src={displayImg} 
                        alt={char.name} 
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${char.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${theme.classes.textSub}`}>
                        <Icons.User size={48} />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-sm ${char.isNpc ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {char.isNpc ? 'NPC' : 'PC'}
                      </span>
                    </div>
                    {char.extraFiles.length > 0 && (
                       <div className="absolute bottom-2 right-2">
                         <Icons.Folder size={16} className={`drop-shadow-md ${activePortrait ? 'text-yellow-400' : theme.classes.textSub}`} fill="currentColor" />
                       </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1 relative">
                     <h3 className={`font-bold truncate transition-colors group-hover:opacity-80 ${theme.classes.textMain}`}>{char.name}</h3>
                     <p className={`text-xs truncate min-h-[1rem] ${theme.classes.textSub}`}>
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