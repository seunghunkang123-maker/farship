import React, { useMemo } from 'react';
import { Icons } from '../ui/Icons';
import { Campaign, Character, CORE_MEMBERS } from '../../types';
import { SearchFilters } from '../../utils/searchUtils';

interface SearchFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  campaigns: Campaign[];
  characters: Character[];
}

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  isOpen, onClose, filters, onFilterChange, onSearch, campaigns, characters
}) => {
  // Collect all unique tags from characters
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    characters.forEach(c => {
      c.affiliations?.forEach(a => tags.add(a.name));
      c.secretProfile?.affiliations?.forEach(a => tags.add(a.name));
    });
    return Array.from(tags).sort();
  }, [characters]);

  // Collect all unique systems
  const allSystems = useMemo(() => {
    return Array.from(new Set(campaigns.map(c => c.system))).sort();
  }, [campaigns]);

  if (!isOpen) return null;

  const toggleFilter = (
    current: string[],
    value: string,
    key: 'campaignIds' | 'systems' | 'tags' | 'players'
  ) => {
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: newValues });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#1c1917] border-l border-stone-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
          <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
            <Icons.Search className="text-amber-500" /> 고급 필터
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Search Query */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">검색어</label>
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
              <input 
                value={filters.query}
                onChange={e => onFilterChange({ ...filters, query: e.target.value })}
                placeholder="이름, 설명, 태그, 내용 검색..."
                className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-200 focus:border-amber-500 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input 
                type="checkbox" 
                checked={filters.includeSecret}
                onChange={e => onFilterChange({ ...filters, includeSecret: e.target.checked })}
                className="rounded bg-stone-800 border-stone-600 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-stone-400">비밀 정보(Secret Profile) 포함 검색</span>
            </label>
          </div>

          {/* Campaign Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">캠페인</label>
            <div className="flex flex-wrap gap-2">
              {campaigns.map(camp => (
                <button
                  key={camp.id}
                  onClick={() => toggleFilter(filters.campaignIds, camp.id, 'campaignIds')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filters.campaignIds.includes(camp.id)
                      ? 'bg-amber-900/40 border-amber-500/50 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {camp.name}
                </button>
              ))}
            </div>
          </div>

          {/* System Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">시스템</label>
            <div className="flex flex-wrap gap-2">
              {allSystems.map(sys => (
                <button
                  key={sys}
                  onClick={() => toggleFilter(filters.systems, sys, 'systems')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filters.systems.includes(sys)
                      ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          {/* Player Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">플레이어</label>
            <div className="flex flex-wrap gap-2">
              {CORE_MEMBERS.map(member => (
                <button
                  key={member}
                  onClick={() => toggleFilter(filters.players, member, 'players')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filters.players.includes(member)
                      ? 'bg-blue-900/40 border-blue-500/50 text-blue-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {member}
                </button>
              ))}
            </div>
          </div>

          {/* PC/NPC Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">유형</label>
            <div className="flex bg-stone-800 rounded-lg p-1 border border-stone-700">
              <button
                onClick={() => onFilterChange({ ...filters, isNpc: undefined })}
                className={`flex-1 py-1.5 text-xs font-medium rounded ${filters.isNpc === undefined ? 'bg-stone-600 text-white shadow' : 'text-stone-400'}`}
              >
                전체
              </button>
              <button
                onClick={() => onFilterChange({ ...filters, isNpc: false })}
                className={`flex-1 py-1.5 text-xs font-medium rounded ${filters.isNpc === false ? 'bg-emerald-700 text-white shadow' : 'text-stone-400'}`}
              >
                PC
              </button>
              <button
                onClick={() => onFilterChange({ ...filters, isNpc: true })}
                className={`flex-1 py-1.5 text-xs font-medium rounded ${filters.isNpc === true ? 'bg-amber-700 text-white shadow' : 'text-stone-400'}`}
              >
                NPC
              </button>
            </div>
          </div>

          {/* Tags Filter (Top 20 most common?) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase">주요 태그</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleFilter(filters.tags, tag, 'tags')}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                    filters.tags.includes(tag)
                      ? 'bg-stone-200 text-stone-900 border-stone-200'
                      : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/50 flex justify-between items-center">
          <button 
            onClick={() => onFilterChange({
              query: '',
              campaignIds: [],
              systems: [],
              tags: [],
              players: [],
              isNpc: undefined,
              includeSecret: false
            })}
            className="text-xs text-stone-500 hover:text-stone-300 underline"
          >
            필터 초기화
          </button>
          <button onClick={onSearch} className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-amber-900/20">
            결과 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterPanel;
