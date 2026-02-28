import React, { useState, useMemo } from 'react';
import { Character, CharacterRelation } from '../../../types';
import { Icons } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  character: Character;
  allCharacters: Character[];
  isEditing: boolean;
  onChange: (updated: Character) => void;
}

const RELATION_TYPES: { value: CharacterRelation['type']; label: string; color: string }[] = [
  { value: 'ALLY', label: '동맹', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'ENEMY', label: '적대', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { value: 'FAMILY', label: '가족', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { value: 'LOVE', label: '연인', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  { value: 'BUSINESS', label: '비즈니스', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'SECRET', label: '비밀', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { value: 'OTHER', label: '기타', color: 'text-stone-400 border-stone-500/30 bg-stone-500/10' },
];

const CharacterRelationsTab: React.FC<Props> = ({ character, allCharacters, isEditing, onChange }) => {
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [tempRel, setTempRel] = useState<CharacterRelation | null>(null);

  const relations = character.relations || [];

  // Filter out self from potential targets and sort (Same Campaign First)
  const potentialTargets = useMemo(() => {
    const targets = allCharacters.filter(c => c.id !== character.id);
    return targets.sort((a, b) => {
      const aIsSame = a.campaignId === character.campaignId;
      const bIsSame = b.campaignId === character.campaignId;
      
      // 1. Priority: Same Campaign
      if (aIsSame && !bIsSame) return -1;
      if (!aIsSame && bIsSame) return 1;
      
      // 2. Priority: Name Alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [allCharacters, character.id, character.campaignId]);

  const handleAdd = () => {
    if (potentialTargets.length === 0) {
      alert('관계 맺을 다른 캐릭터가 없습니다.');
      return;
    }
    const newRel: CharacterRelation = {
      id: crypto.randomUUID(),
      targetCharacterId: potentialTargets[0].id,
      type: 'ALLY',
      description: '',
      isSecret: false
    };
    setTempRel(newRel);
    setEditingRelId(newRel.id);
  };

  const handleEdit = (rel: CharacterRelation) => {
    setTempRel({ ...rel });
    setEditingRelId(rel.id);
  };

  const handleSave = () => {
    if (!tempRel) return;

    let newRels = [...relations];
    const index = newRels.findIndex(r => r.id === tempRel.id);
    
    if (index >= 0) {
      newRels[index] = tempRel;
    } else {
      newRels.push(tempRel);
    }

    onChange({ ...character, relations: newRels });
    setEditingRelId(null);
    setTempRel(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const newRels = relations.filter(r => r.id !== id);
    onChange({ ...character, relations: newRels });
  };

  const handleCancel = () => {
    setEditingRelId(null);
    setTempRel(null);
  };

  const getTargetName = (id: string) => {
    const target = allCharacters.find(c => c.id === id);
    return target ? target.name : 'Unknown Character';
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif text-stone-400">인물 관계도</h3>
        {isEditing && !editingRelId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            <Icons.Plus size={16} />
            <span>관계 추가</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {editingRelId && tempRel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-stone-900/50 border border-stone-700 rounded-xl p-4 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">대상 캐릭터</label>
                <select
                  value={tempRel.targetCharacterId}
                  onChange={e => setTempRel({ ...tempRel, targetCharacterId: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                >
                  {potentialTargets.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">관계 유형</label>
                <select
                  value={tempRel.type}
                  onChange={e => setTempRel({ ...tempRel, type: e.target.value as any })}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                >
                  {RELATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">설명</label>
              <textarea
                value={tempRel.description}
                onChange={e => setTempRel({ ...tempRel, description: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none min-h-[60px]"
                placeholder="어떤 관계인지 서술하세요..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSecretRel"
                checked={tempRel.isSecret}
                onChange={e => setTempRel({ ...tempRel, isSecret: e.target.checked })}
                className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-600 focus:ring-amber-600 focus:ring-offset-stone-900"
              />
              <label htmlFor="isSecretRel" className="text-sm text-stone-400 select-none cursor-pointer">
                비밀 관계 (GM 및 본인만 확인 가능)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-stone-500 hover:text-stone-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
              >
                저장
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relations List */}
      {relations.length === 0 && !editingRelId ? (
        <div className="text-center py-12 text-stone-600 border border-dashed border-stone-800 rounded-xl">
          <Icons.Users className="mx-auto mb-2 opacity-50" size={32} />
          <p>등록된 관계가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {relations.map(rel => {
            const typeInfo = RELATION_TYPES.find(t => t.value === rel.type) || RELATION_TYPES[6];
            const targetChar = allCharacters.find(c => c.id === rel.targetCharacterId);
            
            return (
              <div 
                key={rel.id}
                className={`relative flex items-center gap-4 p-4 rounded-xl border border-stone-800 bg-stone-900/40 hover:bg-stone-900/60 transition-colors group ${rel.isSecret ? 'border-dashed border-purple-900/50' : ''}`}
              >
                {/* Target Avatar */}
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-stone-200 truncate">{targetChar?.name || 'Unknown'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-stone-400 line-clamp-2">{rel.description}</p>
                </div>

                {/* Actions */}
                {isEditing && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(rel)}
                      className="p-2 text-stone-500 hover:text-amber-500 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                      <Icons.Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rel.id)}
                      className="p-2 text-stone-500 hover:text-red-500 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                      <Icons.Trash size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CharacterRelationsTab;
