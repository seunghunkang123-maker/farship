import React, { useState } from 'react';
import { Character, CharacterProgress, CharacterProgressStage } from '../../../types';
import { Icons } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  character: Character;
  isEditing: boolean;
  onChange: (updated: Character) => void;
  onPreviewStage?: (index: number) => void;
  activeProfileId?: string;
  themeClasses: any;
}

const CharacterProgressTab: React.FC<Props> = ({ character, isEditing, onChange, onPreviewStage, activeProfileId, themeClasses }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    
    onChange({
      ...character,
      progression: { 
        ...progression, 
        stages: [...progression.stages, newStage] 
      }
    });
  };

  const handleUpdateStage = (id: string, updates: Partial<CharacterProgressStage>) => {
    const newStages = progression.stages.map(s => s.id === id ? { ...s, ...updates } : s);
    onChange({
      ...character,
      progression: { ...progression, stages: newStages }
    });
  };

  const handleDeleteStage = (id: string) => {
    const newStages = progression.stages.filter(s => s.id !== id);
    
    onChange({
      ...character,
      progression: { 
        ...progression, 
        stages: newStages,
        currentStageIndex: Math.min(progression.currentStageIndex, newStages.length)
      }
    });
    setConfirmDeleteId(null);
  };

  const toggleComplete = (index: number) => {
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
        <h3 className={`text-lg font-serif ${themeClasses.textSub}`}>서사 진척도</h3>
        {isEditing && (
          <button
            onClick={handleAddStage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${themeClasses.buttonSecondary}`}
          >
            <Icons.Plus size={16} />
            <span>단계 추가</span>
          </button>
        )}
      </div>

      {/* Timeline / Steps */}
      {progression.stages.length === 0 ? (
        <div className={`text-center py-12 border border-dashed rounded-xl ${themeClasses.textSub} ${themeClasses.border}`}>
          <Icons.List className="mx-auto mb-2 opacity-50" size={32} />
          <p>등록된 진척 단계가 없습니다.</p>
        </div>
      ) : (
        <div className={`relative pl-4 md:pl-8 space-y-8 before:absolute before:left-[23px] md:before:left-[39px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800`}>
          <AnimatePresence>
            {progression.stages.map((stage, index) => {
              const isCompleted = index < progression.currentStageIndex;
              const isCurrent = index === progression.currentStageIndex;
              const isLinkedActive = stage.linkedProfileId && stage.linkedProfileId === activeProfileId;
              const isHighlighted = isCompleted || isCurrent || isLinkedActive;
              
              // Dynamic Styles based on Theme
              let circleStyle = `${themeClasses.bgMain} ${themeClasses.border} ${themeClasses.textSub}`; // Default
              
              if (isCompleted) {
                 circleStyle = `${themeClasses.buttonPrimary} border-transparent`;
              } else if (isCurrent || isLinkedActive) {
                 circleStyle = `${themeClasses.bgMain} border-current ${themeClasses.textAccent} scale-110 shadow-[0_0_10px_rgba(0,0,0,0.3)]`;
              }

              return (
                <motion.div 
                  key={stage.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative flex items-start gap-4 group ${!isEditing && onPreviewStage ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!isEditing && onPreviewStage) {
                      onPreviewStage(index);
                    }
                  }}
                >
                  {/* Node */}
                  <button
                    onClick={(e) => {
                      if (isEditing) {
                        e.stopPropagation();
                        toggleComplete(index);
                      }
                    }}
                    title={isEditing ? (isCompleted ? "진행 취소" : "여기까지 완료 처리") : "이 단계의 상태로 프로필 보기"}
                    className={`relative z-10 shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isEditing ? 'cursor-pointer hover:scale-110' : ''} ${circleStyle}`}
                  >
                    {isCompleted ? <Icons.Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
                  </button>

                  {/* Content */}
                  <div className={`flex-1 pt-1 transition-opacity duration-300 ${isHighlighted ? 'opacity-100' : 'opacity-40'}`}>
                    
                    {isEditing ? (
                      <div className={`bg-black/20 border rounded-xl p-4 space-y-3 ${themeClasses.border}`}>
                        <div className="flex items-start justify-between gap-4">
                          <input
                            value={stage.title}
                            onChange={e => handleUpdateStage(stage.id, { title: e.target.value })}
                            placeholder="단계 제목 (예: 각성, 비밀의 폭로)"
                            className={`flex-1 bg-transparent border-b focus:border-opacity-100 outline-none px-1 py-1 text-base md:text-lg font-serif font-medium ${isCompleted ? themeClasses.textAccent : themeClasses.textMain} ${themeClasses.border}`}
                          />
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={stage.linkedProfileId || ''}
                              onChange={(e) => handleUpdateStage(stage.id, { linkedProfileId: e.target.value || undefined })}
                              className={`text-xs rounded-md px-2 py-1 outline-none border bg-black ${themeClasses.border} ${themeClasses.textSub}`}
                            >
                              <option value="">(연동 프로필 없음)</option>
                              <option value="BASE">기본 (BASE)</option>
                              {(character.profiles || []).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            
                            <button
                              onClick={() => {
                                if (confirmDeleteId === stage.id) {
                                  handleDeleteStage(stage.id);
                                } else {
                                  setConfirmDeleteId(stage.id);
                                  setTimeout(() => setConfirmDeleteId(null), 3000);
                                }
                              }}
                              className={`p-1.5 rounded-md transition-colors ${confirmDeleteId === stage.id ? 'text-red-500 bg-red-500/10' : 'text-stone-500 hover:text-red-500 hover:bg-stone-800'}`}
                              title={confirmDeleteId === stage.id ? "한 번 더 눌러 삭제" : "삭제"}
                            >
                              <Icons.Trash size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <textarea
                          value={stage.description}
                          onChange={e => handleUpdateStage(stage.id, { description: e.target.value })}
                          placeholder="이 단계에서 일어나는 일이나 조건..."
                          className={`w-full bg-black/20 border rounded-lg px-3 py-2 text-sm outline-none min-h-[60px] resize-y ${themeClasses.textMain} ${themeClasses.border}`}
                        />
                      </div>
                    ) : (
                      <div className="pt-1">
                        <h4 className={`text-base md:text-lg font-serif font-medium flex items-center gap-2 ${isCompleted || isLinkedActive ? themeClasses.textAccent : themeClasses.textMain}`}>
                          {stage.title || '(제목 없음)'}
                          {stage.linkedProfileId && (
                            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 border rounded-full font-bold tracking-wider ${themeClasses.textAccent} border-current opacity-80`}>
                              <Icons.Link size={10} />
                              프로필 변경
                            </span>
                          )}
                        </h4>
                        <p className={`text-sm mt-2 leading-relaxed whitespace-pre-wrap ${themeClasses.textSub}`}>
                          {stage.description}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CharacterProgressTab;
