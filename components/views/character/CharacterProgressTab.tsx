import React, { useState } from 'react';
import { Character, CharacterProgress, CharacterProgressStage } from '../../../types';
import { Icons } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  character: Character;
  isEditing: boolean;
  onChange: (updated: Character) => void;
}

const CharacterProgressTab: React.FC<Props> = ({ character, isEditing, onChange }) => {
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [tempStage, setTempStage] = useState<CharacterProgressStage | null>(null);

  const progression = character.progression || {
    currentStageIndex: 0,
    stages: [],
    isSecret: false
  };

  const handleAddStage = () => {
    const newStage: CharacterProgressStage = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      isCompleted: false
    };
    setTempStage(newStage);
    setEditingStageId(newStage.id);
  };

  const handleEditStage = (stage: CharacterProgressStage) => {
    setTempStage({ ...stage });
    setEditingStageId(stage.id);
  };

  const handleSaveStage = () => {
    if (!tempStage || !tempStage.title.trim()) return;

    let newStages = [...progression.stages];
    const index = newStages.findIndex(s => s.id === tempStage.id);
    
    if (index >= 0) {
      newStages[index] = tempStage;
    } else {
      newStages.push(tempStage);
    }

    onChange({
      ...character,
      progression: { ...progression, stages: newStages }
    });
    setEditingStageId(null);
    setTempStage(null);
  };

  const handleDeleteStage = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const newStages = progression.stages.filter(s => s.id !== id);
    onChange({
      ...character,
      progression: { ...progression, stages: newStages }
    });
  };

  const handleCancel = () => {
    setEditingStageId(null);
    setTempStage(null);
  };

  const toggleComplete = (index: number) => {
    // If clicking a completed stage, uncomplete it and all after it?
    // Or just toggle? Usually progression is linear.
    // Let's make it set the currentStageIndex.
    
    // If clicking the current stage, maybe advance?
    // Let's just use the index to set "current completed up to here"
    
    const newIndex = index + 1;
    // If clicking the last completed one, maybe toggle off?
    // If clicking index 2 (3rd item), it means 0, 1, 2 are done. currentStageIndex = 3.
    
    // Simple logic: Set currentStageIndex to the clicked index + 1.
    // If clicked index is already the last completed one (index == currentStageIndex - 1), 
    // maybe we want to uncomplete it? -> Set to index.
    
    let nextIndex = index + 1;
    if (progression.currentStageIndex === index + 1) {
       nextIndex = index;
    }

    onChange({
      ...character,
      progression: { ...progression, currentStageIndex: nextIndex }
    });
  };

  return (
    <div className="space-y-8 p-1">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif text-stone-400">서사 진척도</h3>
        {isEditing && !editingStageId && (
          <button
            onClick={handleAddStage}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            <Icons.Plus size={16} />
            <span>단계 추가</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {editingStageId && tempStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-stone-900/50 border border-stone-700 rounded-xl p-4 space-y-4 overflow-hidden mb-6"
          >
            <div>
              <label className="block text-xs text-stone-500 mb-1">단계 제목</label>
              <input
                value={tempStage.title}
                onChange={e => setTempStage({ ...tempStage, title: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                placeholder="예: 각성, 비밀의 폭로, 결말"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">설명</label>
              <textarea
                value={tempStage.description}
                onChange={e => setTempStage({ ...tempStage, description: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none min-h-[60px]"
                placeholder="이 단계에서 일어나는 일이나 조건..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-stone-500 hover:text-stone-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveStage}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
              >
                저장
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline / Steps */}
      {progression.stages.length === 0 && !editingStageId ? (
        <div className="text-center py-12 text-stone-600 border border-dashed border-stone-800 rounded-xl">
          <Icons.List className="mx-auto mb-2 opacity-50" size={32} />
          <p>등록된 진척 단계가 없습니다.</p>
        </div>
      ) : (
        <div className="relative pl-4 md:pl-8 space-y-8 before:absolute before:left-[23px] md:before:left-[39px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
          {progression.stages.map((stage, index) => {
            const isCompleted = index < progression.currentStageIndex;
            const isCurrent = index === progression.currentStageIndex;
            
            return (
              <div key={stage.id} className="relative flex items-start gap-4 group">
                {/* Node */}
                <button
                  onClick={() => isEditing && toggleComplete(index)}
                  disabled={!isEditing}
                  className={`relative z-10 shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-amber-600 border-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]' 
                      : isCurrent
                        ? 'bg-stone-900 border-amber-600 text-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.2)]'
                        : 'bg-stone-950 border-stone-700 text-stone-700'
                  }`}
                >
                  {isCompleted ? <Icons.Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
                </button>

                {/* Content */}
                <div className={`flex-1 pt-1 transition-opacity duration-300 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className={`text-base md:text-lg font-serif font-medium ${isCompleted ? 'text-amber-500' : 'text-stone-300'}`}>
                      {stage.title}
                    </h4>
                    {isEditing && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => handleEditStage(stage)}
                            className="p-1 text-stone-500 hover:text-amber-500 transition-colors"
                          >
                            <Icons.Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-1 text-stone-500 hover:text-red-500 transition-colors"
                          >
                            <Icons.Trash size={14} />
                          </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 mt-1 leading-relaxed whitespace-pre-wrap">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CharacterProgressTab;
