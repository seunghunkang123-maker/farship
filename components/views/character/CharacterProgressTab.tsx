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

  return (
    <div className="space-y-8 p-1">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-serif ${themeClasses.textSub}`}>서사 진척도 (NARRATIVE PROGRESSION)</h3>
      </div>

      {/* Timeline / Steps */}
      {progression.stages.length === 0 ? (
        <div className={`text-center py-12 border border-dashed rounded-xl ${themeClasses.textSub} ${themeClasses.border}`}>
          <Icons.List className="mx-auto mb-2 opacity-50" size={32} />
          <p className="mb-4">등록된 진척 단계가 없습니다.</p>
          {isEditing && (
             <button
               onClick={handleAddStage}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors mx-auto ${themeClasses.buttonSecondary}`}
             >
               <Icons.Plus size={16} />
               <span>첫 단계 추가하기</span>
             </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 md:pl-10 space-y-12">
          {/* Vertical Line */}
          <div className="absolute left-[27px] md:left-[43px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-stone-700 via-stone-800 to-transparent opacity-50" />

          <AnimatePresence>
            {progression.stages.map((stage, index) => {
              const isCompleted = index < progression.currentStageIndex;
              const isCurrent = index === progression.currentStageIndex;
              const isFuture = index > progression.currentStageIndex;
              const isLinkedActive = stage.linkedProfileId && stage.linkedProfileId === activeProfileId;
              
              // Check if ANY stage is currently being viewed (linked active)
              // If so, we suppress the default "Current" pulse to avoid confusion
              const isAnyLinkedActive = progression.stages.some(s => s.linkedProfileId && s.linkedProfileId === activeProfileId);

              // Determine Styles
              let nodeColor = "bg-stone-800 border-stone-600 text-stone-500";
              let textColor = themeClasses.textSub;
              let borderColor = themeClasses.border;
              let opacity = "opacity-100"; // Always fully visible
              let isPulsing = false;

              if (isLinkedActive) {
                // Viewing this stage -> High Priority Highlight
                nodeColor = `bg-stone-900 border-current ${themeClasses.textAccent} shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110`;
                textColor = themeClasses.textAccent;
                borderColor = `border-current ${themeClasses.textAccent}`;
                isPulsing = true;
              } else if (isCurrent) {
                // Current Stage
                if (isAnyLinkedActive) {
                   // If viewing another stage, show Current as "Active but not focused"
                   nodeColor = `bg-stone-900 border-current ${themeClasses.textAccent} shadow-none`;
                   textColor = themeClasses.textAccent;
                   borderColor = `border-current ${themeClasses.textAccent}`;
                } else {
                   // Default state: Current is focused
                   nodeColor = `bg-stone-900 border-current ${themeClasses.textAccent} shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110`;
                   textColor = themeClasses.textAccent;
                   borderColor = `border-current ${themeClasses.textAccent}`;
                   isPulsing = true;
                }
              } else if (isCompleted) {
                nodeColor = `${themeClasses.buttonPrimary} border-transparent text-white shadow-lg shadow-amber-900/20`;
                textColor = themeClasses.textMain;
              } else {
                // Subsequent stages
                textColor = themeClasses.textMain;
              }

              return (
                <motion.div 
                  key={stage.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative flex items-start gap-6 group ${!isEditing && onPreviewStage ? 'cursor-pointer' : ''} ${opacity}`}
                  onClick={() => {
                    if (!isEditing && onPreviewStage) {
                      onPreviewStage(index);
                    }
                  }}
                >
                  {/* Node Indicator */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                     <div
                       className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${nodeColor} ${isPulsing ? 'animate-pulse' : ''}`}
                     >
                       <span className="text-xs md:text-sm font-bold font-mono">{index + 1}</span>
                     </div>
                     {isCurrent && <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${themeClasses.textAccent} ${!isAnyLinkedActive ? 'animate-pulse' : 'opacity-50'}`}>Current</div>}
                     {isLinkedActive && !isCurrent && <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${themeClasses.textAccent} animate-pulse`}>Viewing</div>}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 -mt-1 transition-all duration-300 ${isLinkedActive || (isCurrent && !isAnyLinkedActive) ? 'scale-[1.02]' : ''}`}>
                    {isEditing ? (
                      <div className={`bg-black/40 backdrop-blur-sm border rounded-xl p-4 space-y-3 shadow-xl ${borderColor}`}>
                        <div className="flex items-start justify-between gap-4">
                          <input
                            value={stage.title}
                            onChange={e => handleUpdateStage(stage.id, { title: e.target.value })}
                            placeholder="단계 제목 (예: 각성)"
                            className={`flex-1 bg-transparent border-b focus:border-opacity-100 outline-none px-1 py-1 text-base md:text-lg font-serif font-bold ${textColor} ${themeClasses.border}`}
                          />
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={stage.linkedProfileId || ''}
                              onChange={(e) => handleUpdateStage(stage.id, { linkedProfileId: e.target.value || undefined })}
                              className={`text-xs rounded-lg px-2 py-1.5 outline-none border bg-black/50 ${themeClasses.border} ${themeClasses.textSub} hover:bg-black/80 transition-colors`}
                            >
                              <option value="">(연동 없음)</option>
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
                              className={`p-1.5 rounded-lg transition-colors ${confirmDeleteId === stage.id ? 'text-red-500 bg-red-500/10' : 'text-stone-500 hover:text-red-400 hover:bg-stone-800'}`}
                            >
                              <Icons.Trash size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <textarea
                          value={stage.description}
                          onChange={e => handleUpdateStage(stage.id, { description: e.target.value })}
                          placeholder="내용 입력..."
                          className={`w-full bg-black/20 border rounded-lg px-3 py-2 text-sm outline-none min-h-[80px] resize-y ${themeClasses.textMain} ${themeClasses.border} focus:bg-black/40 transition-colors`}
                        />
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl border transition-all duration-300 ${isCurrent ? `bg-black/40 ${borderColor} shadow-lg` : 'border-transparent hover:bg-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                           <h4 className={`text-lg md:text-xl font-serif font-bold ${textColor}`}>
                             {stage.title || 'Untitled Chapter'}
                           </h4>
                           {stage.linkedProfileId && (
                             <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider uppercase border bg-black/30 backdrop-blur-sm ${isCompleted || isCurrent ? `${themeClasses.textAccent} border-current` : 'text-stone-500 border-stone-700'}`}>
                               <Icons.User size={12} />
                               <span>New Look</span>
                             </div>
                           )}
                        </div>
                        <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans ${themeClasses.textSub}`}>
                          {stage.description || 'No description available.'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Add Button at the end of timeline */}
          {isEditing && (
             <div className="pl-[27px] md:pl-[43px] relative z-10">
                <button
                  onClick={handleAddStage}
                  className={`w-8 h-8 md:w-10 md:h-10 -ml-4 md:-ml-5 rounded-full border-2 border-dashed flex items-center justify-center transition-all hover:scale-110 hover:border-solid hover:bg-stone-800 ${themeClasses.border} ${themeClasses.textSub}`}
                >
                  <Icons.Plus size={16} />
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterProgressTab;
