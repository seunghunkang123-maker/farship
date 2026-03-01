import React, { useState, useMemo } from 'react';
import { Character, CharacterRelation, Campaign } from '../../../types';
import { Icons } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  character: Character;
  allCharacters: Character[];
  allCampaigns?: Campaign[];
  isEditing: boolean;
  onChange: (updated: Character) => void;
}

const RELATION_TYPES: { value: CharacterRelation['relationType']; label: string; color: string }[] = [
  { value: 'ALLY', label: '동맹', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'ENEMY', label: '적대', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { value: 'FAMILY', label: '가족', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { value: 'LOVE', label: '연인', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  { value: 'BUSINESS', label: '비즈니스', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'SECRET', label: '비밀', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { value: 'OTHER', label: '기타', color: 'text-stone-400 border-stone-500/30 bg-stone-500/10' },
];

const CharacterRelationsTab: React.FC<Props> = ({ character, allCharacters, allCampaigns = [], isEditing, onChange }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<string>('');

  const relations = character.relations || [];

  // Group potential targets by campaign
  const groupedTargets = useMemo(() => {
    // Filter out self and already related characters (optional, but let's allow multiple relations for now or filter?)
    // Actually, letting them have multiple relations with the same person is fine, but usually 1 is enough.
    const targets = allCharacters.filter(c => c.id !== character.id);
    const groups: Record<string, Character[]> = {};
    
    targets.forEach(c => {
      if (!groups[c.campaignId]) groups[c.campaignId] = [];
      groups[c.campaignId].push(c);
    });

    Object.keys(groups).forEach(campaignId => {
      groups[campaignId].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [allCharacters, character.id]);

  const handleQuickAdd = (targetId: string) => {
    if (!targetId) return;
    
    const newRel: CharacterRelation = {
      id: crypto.randomUUID(),
      sourceCharacterId: character.id,
      targetCharacterId: targetId,
      relationType: 'ALLY',
      description: '',
      isSecret: false,
      campaignId: character.campaignId
    };

    onChange({ ...character, relations: [newRel, ...relations] });
    setQuickAddTarget(''); // Reset dropdown
  };

  const handleUpdateRelation = (id: string, updates: Partial<CharacterRelation>) => {
    const newRels = relations.map(r => r.id === id ? { ...r, ...updates } : r);
    onChange({ ...character, relations: newRels });
  };

  const handleDelete = (id: string) => {
    const newRels = relations.filter(r => r.id !== id);
    onChange({ ...character, relations: newRels });
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif text-stone-400">인물 관계도</h3>
        
        {/* Quick Add Dropdown */}
        {isEditing && (
          <div className="relative w-48 md:w-64">
            <select
              value={quickAddTarget}
              onChange={e => handleQuickAdd(e.target.value)}
              className="w-full appearance-none bg-stone-900 border border-stone-700 hover:border-amber-700 rounded-lg px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
            >
              <option value="">+ 관계 추가 (캐릭터 선택)</option>
              {groupedTargets[character.campaignId] && (
                <optgroup label="현재 캠페인" className="bg-stone-950 text-amber-500 font-bold">
                  {groupedTargets[character.campaignId].map(c => (
                    <option key={c.id} value={c.id} className="text-stone-300 font-normal">{c.name}</option>
                  ))}
                </optgroup>
              )}
              {Object.entries(groupedTargets).map(([campaignId, chars]) => {
                if (campaignId === character.campaignId) return null;
                const camp = allCampaigns.find(c => c.id === campaignId);
                const campName = camp ? camp.name : '기타 캠페인';
                return (
                  <optgroup key={campaignId} label={campName} className="bg-stone-950 text-stone-500 font-bold">
                    {chars.map(c => (
                      <option key={c.id} value={c.id} className="text-stone-400 font-normal">{c.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
              <Icons.ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>

      {/* Relations List */}
      {relations.length === 0 ? (
        <div className="text-center py-12 text-stone-600 border border-dashed border-stone-800 rounded-xl">
          <Icons.Users className="mx-auto mb-2 opacity-50" size={32} />
          <p>등록된 관계가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {relations.map(rel => {
              const typeInfo = RELATION_TYPES.find(t => t.value === rel.relationType) || RELATION_TYPES[6];
              const targetChar = allCharacters.find(c => c.id === rel.targetCharacterId);
              
              if (isEditing) {
                // Editable Card
                return (
                  <motion.div 
                    key={rel.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative flex flex-col gap-3 p-4 rounded-xl border bg-stone-900/40 transition-colors ${rel.isSecret ? 'border-purple-900/50 border-dashed' : 'border-stone-800'}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-800 border border-stone-700">
                            {targetChar?.imageUrl ? (
                              <img src={targetChar.imageUrl} alt={targetChar.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-600">
                                <Icons.User size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-stone-200">{targetChar?.name || 'Unknown'}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-3">
                        <select
                          value={rel.relationType}
                          onChange={e => handleUpdateRelation(rel.id, { relationType: e.target.value as any })}
                          className={`text-xs px-2 py-1 rounded border outline-none cursor-pointer appearance-none ${typeInfo.color}`}
                        >
                          {RELATION_TYPES.map(t => (
                            <option key={t.value} value={t.value} className="bg-stone-900 text-stone-300">{t.label}</option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => handleUpdateRelation(rel.id, { isSecret: !rel.isSecret })}
                          className={`p-1.5 rounded-md transition-colors ${rel.isSecret ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'text-stone-500 hover:bg-stone-800'}`}
                          title="비밀 관계 토글"
                        >
                          {rel.isSecret ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                        </button>

                        <button
                          onClick={() => {
                            if (confirmDeleteId === rel.id) {
                              handleDelete(rel.id);
                            } else {
                              setConfirmDeleteId(rel.id);
                              setTimeout(() => setConfirmDeleteId(null), 3000);
                            }
                          }}
                          className={`p-1.5 rounded-md transition-colors ${confirmDeleteId === rel.id ? 'text-red-500 bg-red-500/10' : 'text-stone-500 hover:text-red-500 hover:bg-stone-800'}`}
                          title={confirmDeleteId === rel.id ? "한 번 더 눌러 삭제" : "삭제"}
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Description Input */}
                    <textarea
                      value={rel.description}
                      onChange={e => handleUpdateRelation(rel.id, { description: e.target.value })}
                      placeholder="이 캐릭터와의 관계를 설명해주세요..."
                      className="w-full bg-stone-950/50 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-300 focus:border-amber-700 outline-none min-h-[60px] resize-y"
                    />
                  </motion.div>
                );
              }

              // Read-only Card
              return (
                <div 
                  key={rel.id}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border border-stone-800 bg-stone-900/40 hover:bg-stone-900/60 transition-colors ${rel.isSecret ? 'border-dashed border-purple-900/50' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-800 border border-stone-700">
                      {targetChar?.imageUrl ? (
                        <img src={targetChar.imageUrl} alt={targetChar.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-600">
                          <Icons.User size={20} />
                        </div>
                      )}
                    </div>
                    {rel.isSecret && (
                      <div className="absolute -top-1 -right-1 bg-purple-900 text-purple-200 rounded-full p-1 border border-stone-900" title="비밀 관계">
                        <Icons.EyeOff size={10} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-stone-200 truncate">{targetChar?.name || 'Unknown'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 line-clamp-2">{rel.description}</p>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CharacterRelationsTab;

