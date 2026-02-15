
import React, { useState, useMemo } from 'react';
import { Campaign, Character, DND_CLASSES, SystemType, CORE_MEMBERS } from '../../types';
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

// 멤버별 색상 매핑
const MEMBER_COLORS: Record<string, string> = {
  '승훈': 'bg-red-900/90 text-red-100 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]', // 요청: 빨간색
  '피쉬': 'bg-blue-900/90 text-blue-100 border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.3)]', // 물/파랑
  '델리': 'bg-orange-900/90 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(234,88,12,0.3)]', // 델리/주황
  '망령': 'bg-violet-900/90 text-violet-100 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]', // 영혼/보라
  '배추': 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]', // 야채/초록
  '유자': 'bg-yellow-900/90 text-yellow-100 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]', // 유자/노랑
};

// 게스트(기본) 색상
const GUEST_COLOR = 'bg-slate-800/90 text-slate-300 border-slate-600 backdrop-blur-sm';

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
                              (c.customClass && c.customClass.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (c.playerName && c.playerName.toLowerCase().includes(searchTerm.toLowerCase()));
        
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
      <header className={`flex-none p-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between backdrop-blur-md sticky top-0 z-20 border-b gap-4 md:gap-0 ${theme.classes.bgMain} ${theme.classes.border}`}>
        <div className="flex items-center gap-4 relative z-30 w-full md:w-auto">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-3 overflow-hidden">
             {campaign.logoUrl && (
               <img src={campaign.logoUrl} alt="Logo" className={`w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border flex-shrink-0 ${theme.classes.border}`} />
             )}
             <div className="min-w-0">
               <h1 className={`text-lg md:text-xl font-bold leading-tight truncate ${theme.classes.textMain}`}>{campaign.name}</h1>
               {campaign.subTitle && <span className={`text-[10px] md:text-xs font-mono truncate block ${theme.classes.textSub}`}>{campaign.subTitle}</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 relative z-30 w-full md:w-auto">
          <button 
            onClick={onAddCharacter}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-colors shadow-lg ${theme.classes.buttonPrimary}`}
          >
            <Icons.Plus size={18} />
            <span className="inline">캐릭터 추가</span>
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
            placeholder="이름, 클래스, 플레이어 검색..."
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
             className={`bg-transparent border-none text-sm rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-opacity-50 ${theme.classes.textMain}`}
           >
             <option value="ALL" className="bg-slate-800 text-slate-200">전체 유형</option>
             <option value="PC" className="bg-slate-800 text-slate-200">PC (플레이어)</option>
             <option value="NPC" className="bg-slate-800 text-slate-200">NPC</option>
           </select>

           {campaign.system === SystemType.DND5E && (
             <select 
                value={classFilter} 
                onChange={(e) => setClassFilter(e.target.value)}
                className={`bg-transparent border-none text-sm rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-opacity-50 max-w-[120px] md:max-w-[150px] ${theme.classes.textMain}`}
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
        {filteredChars.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center opacity-60 ${theme.classes.textSub}`}>
            <Icons.Users size={48} className="mb-4" />
            <p>등록된 캐릭터가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
               
               // 플레이어 이름표 스타일 결정 (멤버별 색상 vs 게스트)
               let badgeStyle = GUEST_COLOR;
               if (char.playerName) {
                 if (MEMBER_COLORS[char.playerName]) {
                   badgeStyle = MEMBER_COLORS[char.playerName];
                 }
               }

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
                    
                    {/* PC/NPC Tag - Top Left */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-sm ${char.isNpc ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {char.isNpc ? 'NPC' : 'PC'}
                      </span>
                    </div>

                    {/* Player Name Badge - Top Right */}
                    {char.playerName && (
                       <div className="absolute top-2 right-2 z-10 max-w-[70%]">
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border truncate ${badgeStyle}`}>
                             <Icons.User size={8} className="shrink-0" fill="currentColor" />
                             <span className="truncate">{char.playerName}</span>
                          </span>
                       </div>
                    )}

                    {char.extraFiles.length > 0 && (
                       <div className="absolute bottom-2 right-2">
                         <Icons.Folder size={16} className={`drop-shadow-md ${activePortrait ? 'text-yellow-400' : theme.classes.textSub}`} fill="currentColor" />
                       </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1 relative">
                     <h3 className={`font-bold truncate transition-colors group-hover:opacity-80 text-sm md:text-base ${theme.classes.textMain}`}>{char.name}</h3>
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
