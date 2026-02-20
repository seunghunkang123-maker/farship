
import React, { useState, useMemo } from 'react';
import { Campaign, Character, DND_CLASSES, SystemType, CORE_MEMBERS } from '../../types';
import { Icons } from '../ui/Icons';
import { THEMES, THEME_KEYS } from '../../constants';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface CampaignDashboardProps {
  campaign: Campaign;
  characters: Character[];
  onBack: () => void;
  onSelectCharacter: (charId: string) => void;
  onAddCharacter: () => void;
  onOpenSettings: () => void;
  // New props for Truth Reveal
  revealedCharacterIds: Set<string>;
  isGlobalReveal: boolean;
  onToggleGlobalReveal: () => void;
  // Name Reveal State
  nameRevealedIds: Set<string>;
  onUpdateCampaign: (c: Campaign) => void;
}

const MEMBER_COLORS: Record<string, string> = {
  '승훈': 'bg-red-900/90 text-red-100 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]',
  '피쉬': 'bg-blue-900/90 text-blue-100 border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.3)]',
  '델리': 'bg-orange-900/90 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(234,88,12,0.3)]',
  '망령': 'bg-violet-900/90 text-violet-100 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
  '배추': 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  '유자': 'bg-yellow-900/90 text-yellow-100 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
};

const GUEST_COLOR = 'bg-slate-800/90 text-slate-300 border-slate-600 backdrop-blur-sm';

// Helper: Extract Numeric Level
const getLevelNumber = (levelStr?: string): number => {
  if (!levelStr) return 0;
  const num = parseInt(levelStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

// --- Power Level Visual Logic (Enhanced) ---
const getPowerVisuals = (system: SystemType, levelStr?: string, themeAccent?: string) => {
  if (system !== SystemType.DND5E) return null;
  
  const level = getLevelNumber(levelStr);
  if (level === 0) return null;

  let count = 0;
  let colorClass = themeAccent || 'text-stone-400';
  let effectClass = '';

  if (level <= 10) {
    count = Math.ceil(level / 2);
  } else if (level <= 20) {
    count = Math.ceil((level - 10) / 2);
    colorClass = 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.6)]';
  } else {
    count = Math.ceil((level - 20) / 2);
    colorClass = 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]';
    effectClass = 'animate-pulse';
  }

  count = Math.max(1, Math.min(count, 5));
  return { count, colorClass, effectClass };
};


const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  campaign,
  characters,
  onBack,
  onSelectCharacter,
  onAddCharacter,
  onOpenSettings,
  revealedCharacterIds,
  isGlobalReveal,
  onToggleGlobalReveal,
  nameRevealedIds,
  onUpdateCampaign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PC' | 'NPC'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME' | 'RECENT' | 'LEVEL'>('RECENT');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [showTags, setShowTags] = useState(false);
  
  // Theme State
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const currentThemeKey = campaign.theme || THEME_KEYS.ADVENTURE;
  const theme = THEMES[currentThemeKey] || THEMES[THEME_KEYS.ADVENTURE];

  const handleThemeChange = async (newThemeKey: string) => {
    onUpdateCampaign({ ...campaign, theme: newThemeKey });
  };

  const filteredChars = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return characters
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(term) || 
                              (c.alias && c.alias.toLowerCase().includes(term)) ||
                              (c.customClass && c.customClass.toLowerCase().includes(term)) ||
                              (c.playerName && c.playerName.toLowerCase().includes(term)) ||
                              (c.affiliations && c.affiliations.some(a => a.name.toLowerCase().includes(term) || (a.rank && a.rank.toLowerCase().includes(term))));
        
        const matchesType = typeFilter === 'ALL' 
          ? true 
          : typeFilter === 'PC' ? !c.isNpc : c.isNpc;
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortOrder === 'NAME') return a.name.localeCompare(b.name);
        if (sortOrder === 'LEVEL') {
           const lvA = getLevelNumber(a.secretProfile?.levelOrExp || a.levelOrExp);
           const lvB = getLevelNumber(b.secretProfile?.levelOrExp || b.levelOrExp);
           return lvB - lvA; // High to Low
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [characters, searchTerm, typeFilter, sortOrder]);

  return (
    <div className={`flex flex-col h-full transition-colors duration-500 ${theme.classes.bgMain} ${theme.classes.font || ''}`}>
      {theme.classes.overlay && <div className={`absolute inset-0 pointer-events-none z-0 ${theme.classes.overlay}`} />}
      
      {/* Header Bar */}
      <header className={`flex-none p-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between backdrop-blur-md sticky top-0 z-20 border-b gap-4 md:gap-0 ${theme.classes.bgMain} ${theme.classes.border}`}>
        <div className="flex items-center gap-4 relative z-30 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme.classes.buttonSecondary}`}>
              <Icons.Back size={24} />
            </button>
            
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
               <img src={getOptimizedImageUrl(campaign.logoUrl, 100)} alt="Logo" className={`w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border flex-shrink-0 ${theme.classes.border}`} />
             )}
             <div className="min-w-0">
               <h1 className={`text-lg md:text-xl font-bold leading-tight truncate ${theme.classes.textMain}`}>{campaign.name}</h1>
               {campaign.subTitle && <span className={`text-[10px] md:text-xs font-mono truncate block ${theme.classes.textSub}`}>{campaign.subTitle}</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 relative z-30 w-full md:w-auto">
           {/* Global Reveal Toggle */}
           <button 
            onClick={onToggleGlobalReveal}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all shadow-lg border ${isGlobalReveal ? `bg-current/10 border-current ${theme.classes.textAccent}` : `${theme.classes.buttonSecondary} border-transparent bg-black/20`}`}
            title="모든 캐릭터의 진상(비밀)을 봅니다"
          >
            {isGlobalReveal ? <Icons.Lock size={18} className="animate-pulse" /> : <Icons.Lock size={18} />}
            <span className="hidden md:inline">{isGlobalReveal ? '진상 모드 ON' : '진상 일괄 전환'}</span>
          </button>

          {/* Show Tags Toggle */}
          <button 
            onClick={() => setShowTags(!showTags)}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all shadow-lg border ${showTags ? 'bg-stone-700 text-stone-200 border-stone-500' : `${theme.classes.buttonSecondary} border-transparent bg-black/20`}`}
            title="캐릭터 카드에 태그를 표시합니다"
          >
            <Icons.Tag size={18} className={showTags ? "text-white" : ""} />
            <span className="hidden md:inline">{showTags ? '태그 숨기기' : '태그 보이기'}</span>
          </button>

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
            placeholder="이름, 칭호, 소속, 플레이어 검색..."
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

           <div className={`h-4 w-px mx-1 opacity-30 ${theme.classes.textSub} bg-current`} />

           <select 
             value={sortOrder} 
             onChange={(e) => setSortOrder(e.target.value as any)}
             className={`bg-transparent border-none text-sm rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-opacity-50 ${theme.classes.textMain}`}
           >
             <option value="RECENT" className="bg-slate-800 text-slate-200">최신순</option>
             <option value="NAME" className="bg-slate-800 text-slate-200">이름순</option>
             <option value="LEVEL" className="bg-slate-800 text-slate-200">레벨순 (고레벨↑)</option>
           </select>

           <div className={`h-4 w-px mx-1 opacity-30 ${theme.classes.textSub} bg-current`} />

           <div className="flex bg-black/30 rounded-lg p-0.5 border border-white/10">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded transition-all ${viewMode === 'GRID' ? 'bg-stone-700 text-white shadow' : 'text-stone-500 hover:text-stone-300'}`}
                title="그리드 뷰"
              >
                <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                   <div className="bg-current rounded-[1px]"/>
                   <div className="bg-current rounded-[1px]"/>
                   <div className="bg-current rounded-[1px]"/>
                   <div className="bg-current rounded-[1px]"/>
                </div>
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded transition-all ${viewMode === 'LIST' ? 'bg-stone-700 text-white shadow' : 'text-stone-500 hover:text-stone-300'}`}
                title="리스트 뷰"
              >
                <div className="flex flex-col gap-0.5 w-3.5 h-3.5 justify-center">
                   <div className="bg-current h-0.5 w-full rounded-[1px]"/>
                   <div className="bg-current h-0.5 w-full rounded-[1px]"/>
                   <div className="bg-current h-0.5 w-full rounded-[1px]"/>
                </div>
              </button>
           </div>
        </div>
      </div>

      {/* Character Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
        {filteredChars.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center opacity-60 ${theme.classes.textSub}`}>
            <Icons.Users size={48} className="mb-4" />
            <p>등록된 캐릭터가 없습니다.</p>
          </div>
        ) : (
          <div className={`${viewMode === 'GRID' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4' : 'flex flex-col gap-2'}`}>
            {filteredChars.map((char) => {
               // Resolve Logic (Same as before)
               const isRevealed = isGlobalReveal || revealedCharacterIds.has(char.id);
               const isNameRevealed = nameRevealedIds.has(char.id);

               let nameToDisplay = char.name;
               let subName: string | null = null;

               if (isRevealed) {
                  if (char.secretProfile?.alias) {
                     nameToDisplay = char.secretProfile.alias;
                     subName = char.secretProfile.name || char.alias || char.name;
                  } else if (char.secretProfile?.name) {
                     nameToDisplay = char.secretProfile.name;
                     subName = char.alias || char.name;
                  } else {
                     nameToDisplay = char.alias || char.name;
                     subName = char.alias ? char.name : null;
                  }
               } else {
                  nameToDisplay = char.alias || char.name;
                  subName = char.alias ? char.name : null;
               }

               const summaryToDisplay = isRevealed ? (char.secretProfile?.summary || char.summary) : char.summary;
               const levelToDisplay = isRevealed ? (char.secretProfile?.levelOrExp || char.levelOrExp) : char.levelOrExp;

               const displayTags = (() => {
                  const publicAffs = char.affiliations || [];
                  const secretAffs = char.secretProfile?.affiliations || [];
                  if (!isRevealed) return publicAffs;
                  const secretMap = new Map(secretAffs.map(a => [a.name, a]));
                  const merged = [...secretAffs];
                  publicAffs.forEach(pa => {
                      if (!secretMap.has(pa.name)) merged.push(pa);
                  });
                  return merged.filter(a => !a.isHidden);
               })();

               const powerVisuals = getPowerVisuals(campaign.system, levelToDisplay, theme.classes.textAccent);
               const activePortrait = char.extraFiles.find(f => f.useAsPortrait && f.imageUrl && (!f.isSecret || isRevealed));
               let displayImg = activePortrait ? activePortrait.imageUrl : char.imageUrl;
               if (isRevealed && char.secretProfile?.image_url) displayImg = char.secretProfile.image_url;
               
               let badgeStyle = GUEST_COLOR;
               if (char.playerName && MEMBER_COLORS[char.playerName]) badgeStyle = MEMBER_COLORS[char.playerName];

               // Theme-based Styles for Revealed State
               // If revealed, we apply the theme accent color to border and text.
               // We use 'border-current' and 'text-[color]' classes to dynamically apply the color.
               const cardContainerClass = isRevealed 
                  ? `border-current ${theme.classes.textAccent} bg-current/5 shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                  : `${theme.classes.border} ${theme.classes.bgPanel}`;
               
               const cardTextClass = isRevealed
                  ? 'text-current font-bold'
                  : theme.classes.textMain;

               const cardSubTextClass = isRevealed
                  ? 'text-current opacity-70'
                  : theme.classes.textSub;

               // --- RENDER ITEM ---
               if (viewMode === 'LIST') {
                 return (
                   <div 
                     key={char.id}
                     onClick={() => onSelectCharacter(char.id)}
                     className={`group cursor-pointer rounded-lg overflow-hidden border transition-all duration-300 flex items-center p-2 gap-4 relative hover:pl-3 ${cardContainerClass} ${activePortrait && !isRevealed ? 'border-yellow-500/50' : ''}`}
                   >
                      {/* Portrait (Small) */}
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black/20 relative">
                        {displayImg ? (
                          <img src={getOptimizedImageUrl(displayImg, 100)} alt={nameToDisplay} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${cardSubTextClass}`}><Icons.User size={20} /></div>
                        )}
                        {/* NPC Badge Small */}
                        <div className={`absolute bottom-0 inset-x-0 h-3 ${char.isNpc ? 'bg-amber-600' : 'bg-emerald-600'} opacity-80`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                              <span className={`truncate text-sm md:text-base ${cardTextClass}`}>
                                {nameToDisplay}
                              </span>
                              {subName && (
                                <span className={`text-[10px] md:text-xs truncate opacity-50 ${char.isNameBlurred && !isRevealed && !isNameRevealed ? 'blur-[2px]' : ''}`}>
                                  {subName}
                                </span>
                              )}
                              {isRevealed && <Icons.Lock size={12} className="opacity-70" />}
                           </div>
                           <p className={`text-[11px] md:text-xs truncate opacity-60 hidden md:block ${cardSubTextClass}`}>
                             {summaryToDisplay}
                           </p>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                           {/* Level */}
                           {levelToDisplay && (
                              <span className="text-[10px] font-mono font-bold opacity-70 bg-black/20 px-2 py-1 rounded">
                                 {levelToDisplay}
                              </span>
                           )}

                           {/* Player Badge */}
                           {char.playerName && !isRevealed && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border truncate ${badgeStyle}`}>
                                 {char.playerName}
                              </span>
                           )}
                           
                           {/* Tags in List (Only Show First 2) */}
                           <div className="hidden lg:flex gap-1">
                              {displayTags.slice(0, 2).map(tag => (
                                 <span key={tag.id} className="text-[9px] px-1.5 py-0.5 bg-black/20 rounded border border-white/10 opacity-60">
                                    {tag.name}
                                 </span>
                              ))}
                              {displayTags.length > 2 && <span className="text-[9px] opacity-40">+{displayTags.length - 2}</span>}
                           </div>
                        </div>
                      </div>
                   </div>
                 );
               }

               // --- GRID VIEW (Existing) ---
               return (
                <div 
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border ${cardContainerClass} ${activePortrait && !isRevealed ? 'border-yellow-500' : ''}`}
                >
                  {/* Image Container */}
                  <div className="aspect-square bg-black/20 relative overflow-hidden">
                    {displayImg ? (
                      <img 
                        src={getOptimizedImageUrl(displayImg, 300)} 
                        alt={nameToDisplay} 
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${char.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${theme.classes.textSub}`}>
                        <Icons.User size={48} />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-sm ${char.isNpc ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {char.isNpc ? 'NPC' : 'PC'}
                      </span>
                    </div>

                    {isRevealed && (
                       <div className="absolute top-2 right-2 z-10">
                         <div className={`rounded-full p-1 border shadow-lg ${theme.classes.textAccent} border-current bg-black/50`}>
                           <Icons.Lock size={12} />
                         </div>
                       </div>
                    )}

                    {char.playerName && !isRevealed && (
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
                  <div className="p-3 flex flex-col relative flex-1">
                     <div className="flex justify-between items-start mb-1">
                       <div className="flex-1 min-w-0">
                         <h3 className={`truncate transition-colors group-hover:opacity-80 text-sm md:text-base ${cardTextClass}`}>
                           {nameToDisplay}
                         </h3>
                         {subName && (
                           <div className={`text-[10px] truncate ${cardSubTextClass} ${char.isNameBlurred && !isRevealed && !isNameRevealed ? 'blur-[2px] select-none hover:blur-none transition-all' : ''}`}>
                             {subName}
                           </div>
                         )}
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between mb-2">
                       <p className={`text-xs truncate font-medium ${cardSubTextClass}`}>
                          {/* Empty spacer or custom class if needed */}
                       </p>
                       
                       {powerVisuals && (
                         <div className={`flex gap-0.5 items-center ${powerVisuals.effectClass}`} title="Power Level">
                            {[1, 2, 3, 4, 5].map(step => (
                              <div 
                                key={step} 
                                className={`w-1.5 h-1.5 rotate-45 border ${step <= powerVisuals.count ? `${powerVisuals.colorClass} bg-current border-current` : `border-stone-600 bg-transparent`}`}
                              />
                            ))}
                         </div>
                       )}
                     </div>

                     {summaryToDisplay && (
                        <div className="mt-auto pt-2 border-t border-dashed border-white/10">
                          <p className={`text-[11px] italic line-clamp-2 leading-tight opacity-70 ${cardSubTextClass}`}>
                            "{summaryToDisplay}"
                          </p>
                        </div>
                     )}

                     {showTags && displayTags.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-white/10 flex flex-wrap gap-1.5">
                           {displayTags.map(tag => {
                              const isPublicRef = (char.affiliations || []).some(pa => pa.name === tag.name);
                              const isSecretStyle = !isPublicRef && isRevealed;
                              
                              // Dynamic Tag Style for Revealed
                              const tagClass = isSecretStyle 
                                 ? `border-current ${theme.classes.textAccent} bg-current/10 opacity-80`
                                 : `bg-black/20 ${theme.classes.textSub} ${theme.classes.border}`;

                              return (
                                 <span 
                                    key={tag.id} 
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${tag.isStrikethrough ? 'line-through opacity-50' : ''} ${tagClass}`}
                                 >
                                    {tag.name}
                                    {tag.rank && <span className="opacity-60 ml-1">| {tag.rank}</span>}
                                 </span>
                              );
                           })}
                        </div>
                     )}
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
