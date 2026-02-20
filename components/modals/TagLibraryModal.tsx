import React, { useState, useMemo } from 'react';
import { Icons } from '../ui/Icons';
import { TagItem } from '../../types';

interface TagLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedTags: Record<string, TagItem[]>;
  onAddTag: (tag: TagItem) => void;
  existingTags: string[]; // Names of tags already added
  themeColor: string; // Accent color class
}

const TagLibraryModal: React.FC<TagLibraryModalProps> = ({
  isOpen, onClose, groupedTags, onAddTag, existingTags, themeColor
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedTags;
    
    const result: Record<string, TagItem[]> = {};
    Object.entries(groupedTags).forEach(([group, tags]) => {
      const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (filtered.length > 0) {
        result[group] = filtered;
      }
    });
    return result;
  }, [groupedTags, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1917] border border-stone-700 w-full max-w-2xl max-h-[80vh] rounded-xl flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-stone-800 bg-stone-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-stone-200">
            <Icons.Tags className={themeColor} /> 태그 라이브러리
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><Icons.Close /></button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/30">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="태그 검색..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="text-center text-stone-500 py-10 flex flex-col items-center gap-2">
              <Icons.Search size={32} className="opacity-20" />
              <span>검색 결과가 없습니다.</span>
            </div>
          ) : (
            Object.entries(filteredGroups).map(([group, tags]) => (
              <div key={group} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-stone-800/50 pb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${themeColor.replace('text-', 'bg-')}`}></span>
                  {group}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => {
                    const isAdded = existingTags.includes(tag.name);
                    return (
                      <button
                        key={`${group}-${idx}`}
                        onClick={() => !isAdded && onAddTag(tag)}
                        disabled={isAdded}
                        className={`
                          group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                          ${isAdded 
                            ? 'bg-stone-800/30 border-stone-800 text-stone-600 cursor-not-allowed opacity-50' 
                            : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-500 hover:bg-stone-700 hover:text-white hover:shadow-lg hover:-translate-y-0.5'
                          }
                        `}
                      >
                        <span>{tag.name}</span>
                        {tag.rank && <span className="opacity-50 text-[10px] border-l border-white/10 pl-2 ml-1">{tag.rank}</span>}
                        {isAdded && <Icons.Check size={12} className="text-green-500 ml-1 animate-in zoom-in duration-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm font-bold transition-colors">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagLibraryModal;
