import React, { useState, useEffect, useMemo } from 'react';
import { Character, Campaign, DND_CLASSES, CPRED_ROLES, BOB_PLAYBOOKS, ExtraFile, SystemType, CharacterComment } from '../../types';
import { Icons } from '../ui/Icons';
import { fileToBase64 } from '../../services/storage';
import { THEMES, THEME_KEYS } from '../../constants';

// --- Sub-components defined outside to prevent re-mount on render ---

interface EditableFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
  type?: 'text' | 'textarea' | 'select' | 'toggle';
  options?: { label: string; value: string }[];
  placeholder?: string;
  isSecretField?: boolean;
  themeClasses: any; // Add theme classes
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  isEditing,
  type = 'text',
  options = [],
  placeholder = '',
  isSecretField = false,
  themeClasses
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!isEditing) {
    if (type === 'toggle') return null;

    let displayValue = value || '-';
    
    // Logic for secret fields (Real Name)
    if (isSecretField && value) {
       if (!isRevealed) {
         return (
           <div className="mb-4 group">
             <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${themeClasses.textSub}`}>{label}</label>
             <div 
               onClick={() => setIsRevealed(true)}
               className={`text-sm md:text-base p-2 rounded min-h-[2rem] cursor-pointer transition-colors flex items-center gap-2 border border-dashed ${themeClasses.bgPanel} ${themeClasses.border} ${themeClasses.textSub} hover:opacity-80`}
             >
                <Icons.Lock size={14} />
                <span className="tracking-widest">************</span>
                <span className="text-[10px] ml-auto">(클릭하여 열람)</span>
             </div>
           </div>
         );
       }
    }

    return (
      <div className="mb-4 group">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${themeClasses.textSub}`}>
          {label}
        </label>
        <div className={`text-sm md:text-base p-2 rounded min-h-[2rem] whitespace-pre-wrap ${themeClasses.bgPanel} ${themeClasses.textMain}`}>
          {type === 'select'
            ? options.find((o) => o.value === value)?.label || value
            : displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${themeClasses.textAccent}`}>
        {label}
      </label>
      {type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600`}
          placeholder={placeholder}
        />
      )}
      {type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none resize-none placeholder:text-slate-600`}
          placeholder={placeholder}
        />
      )}
      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {type === 'toggle' && (
        <div className="flex gap-2">
          <button
            onClick={() => onChange(false)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              !value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            PC
          </button>
          <button
            onClick={() => onChange(true)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              value ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            NPC
          </button>
        </div>
      )}
    </div>
  );
};

interface CharacterDetailProps {
  character: Character | null; // Null if creating new
  campaign: Campaign;
  onSave: (char: Character) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isEditingNew?: boolean;
  onAddComment?: (comment: CharacterComment) => void;
  onDeleteComment?: (commentId: string, charId: string) => void;
}

const CharacterDetail: React.FC<CharacterDetailProps> = ({ 
  character, campaign, onSave, onDelete, onClose, isEditingNew = false,
  onAddComment, onDeleteComment
}) => {
  const [isEditing, setIsEditing] = useState(isEditingNew);
  const [activeTab, setActiveTab] = useState<'INFO' | 'BIO' | 'FILES' | 'COMMENTS'>('INFO');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  
  // Comment State
  const [commentName, setCommentName] = useState('관찰자');
  const [commentText, setCommentText] = useState('');
  const [commentStyle, setCommentStyle] = useState<'NOTE'|'STAMP'|'WARNING'|'MEMO'>('NOTE');

  // Theme Integration
  const currentThemeKey = campaign.theme || THEME_KEYS.ADVENTURE;
  const theme = THEMES[currentThemeKey] || THEMES[THEME_KEYS.ADVENTURE];
  const tc = theme.classes; // shortcut

  // Form State
  const [formData, setFormData] = useState<Character>({
    id: '',
    campaignId: campaign.id,
    name: '',
    realName: '',
    isNpc: false,
    imageFit: 'cover',
    summary: '',
    description: '',
    extraFiles: [],
    comments: [],
    updatedAt: Date.now(),
  });

  useEffect(() => {
    if (character) {
      setFormData(character);
      setRevealedIds(new Set()); // Reset revealed secrets on load
    } else {
      // Initialize new character
      setFormData({
        id: crypto.randomUUID(),
        campaignId: campaign.id,
        name: '',
        realName: '',
        isNpc: false,
        imageFit: 'cover',
        summary: '',
        description: '',
        extraFiles: [],
        comments: [],
        updatedAt: Date.now(),
        // Defaults based on system
        dndClass: campaign.system === SystemType.DND5E ? DND_CLASSES[0].value : undefined,
        cpredRole: campaign.system === SystemType.CYBERPUNK_RED ? CPRED_ROLES[0].split(' ')[0] : undefined,
        customClass: campaign.system === SystemType.BAND_OF_BLADES ? BOB_PLAYBOOKS[0].split(' ')[0] : '',
      });
      setIsEditing(true);
      setRevealedIds(new Set());
    }
  }, [character, campaign]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    onSave({ ...formData, updatedAt: Date.now() });
    setIsEditing(false);
  };

  // Helper functions for ExtraFiles
  const addExtraFile = () => {
    const newFile: ExtraFile = { id: crypto.randomUUID(), title: '새 항목(비밀/진상)', content: '' };
    setFormData(prev => ({ ...prev, extraFiles: [...prev.extraFiles, newFile] }));
  };

  const removeExtraFile = (id: string) => {
    setFormData(prev => ({ ...prev, extraFiles: prev.extraFiles.filter(f => f.id !== id) }));
  };

  const updateExtraFile = (id: string, field: keyof ExtraFile, val: any) => {
    setFormData(prev => ({
      ...prev,
      extraFiles: prev.extraFiles.map(f => f.id === id ? { ...f, [field]: val } : f)
    }));
  };

  const handleExtraImageUpload = async (fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      updateExtraFile(fileId, 'imageUrl', base64);
    }
  };

  const togglePortraitOverride = (fileId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      extraFiles: prev.extraFiles.map(f => ({
        ...f,
        useAsPortrait: f.id === fileId ? isChecked : false 
      }))
    }));
  };

  const toggleSecret = (fileId: string, isSecret: boolean) => {
     updateExtraFile(fileId, 'isSecret', isSecret);
  };

  const revealSecret = (fileId: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.add(fileId);
      return next;
    });
  };

  // Comment Handlers
  const submitComment = () => {
    if (!commentText.trim()) return;
    if (!onAddComment) return;

    const newComment: CharacterComment = {
      id: crypto.randomUUID(),
      characterId: formData.id,
      userName: commentName || '익명',
      content: commentText,
      styleVariant: commentStyle,
      createdAt: Date.now()
    };
    
    onAddComment(newComment);
    setCommentText('');
  };

  const confirmDeleteComment = (commentId: string) => {
    if (confirm("이 기록을 삭제하시겠습니까?")) {
      if (onDeleteComment) onDeleteComment(commentId, formData.id);
    }
  };

  // Resolve display values
  let displayRole = '';
  if (campaign.system === SystemType.DND5E) displayRole = formData.dndClass || '';
  else if (campaign.system === SystemType.CYBERPUNK_RED) displayRole = formData.cpredRole || '';
  else displayRole = formData.customClass || '';

  const activePortraitFile = useMemo(() => {
    const candidates = formData.extraFiles.filter(f => f.useAsPortrait && f.imageUrl);
    const reversed = [...candidates].reverse();
    return reversed.find(f => !f.isSecret || revealedIds.has(f.id));
  }, [formData.extraFiles, revealedIds]);

  const displayImageUrl = activePortraitFile ? activePortraitFile.imageUrl : formData.imageUrl;

  // System Specific Labels
  let nameLabel = '이름';
  let realNameLabel = '본명/진명';
  let levelLabel = '레벨 / 경험치';
  let levelPlaceholder = '예: Lv.5';
  
  if (campaign.system === SystemType.CYBERPUNK_RED) {
    nameLabel = '핸들 (Handle)';
    realNameLabel = '실명 (Real Name)';
    levelLabel = '평판 (Reputation)';
    levelPlaceholder = '예: 4';
  } else if (campaign.system === SystemType.COC7) {
    levelLabel = '나이 / 경력';
    levelPlaceholder = '예: 34세, 고고학 교수';
  } else if (campaign.system === SystemType.BAND_OF_BLADES) {
    levelLabel = '등급 / 경험치';
    levelPlaceholder = '예: 베테랑, EXP 3';
  }
  
  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className={`w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-xl shadow-2xl border flex flex-col md:flex-row overflow-hidden ${tc.bgMain} ${tc.border} ${tc.font || ''}`}>
        
        {/* Left Column: Visuals */}
        <div className={`w-full md:w-1/3 p-6 flex flex-col border-r overflow-y-auto ${tc.bgPanel} ${tc.border}`}>
          <div className="flex justify-between md:hidden mb-4">
            <button onClick={onClose} className={tc.textSub}><Icons.Close /></button>
            <div className="flex gap-2">
              {isEditing ? (
                 <button onClick={handleSave} className={tc.textAccent}><Icons.Save /></button>
              ) : (
                 <button onClick={() => setIsEditing(true)} className={tc.textSub}><Icons.Edit /></button>
              )}
            </div>
          </div>

          <div className={`relative aspect-square w-full rounded-lg overflow-hidden mb-6 group transition-all duration-300 border-2 ${tc.border} bg-black/20`}>
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt={formData.name} 
                className={`w-full h-full transition-opacity duration-500 ${formData.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${tc.textSub}`}><Icons.User size={80} /></div>
            )}
            
            {isEditing && (
               <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white">
                 {activePortraitFile ? (
                   <div className="text-center p-4">
                     <Icons.Lock size={32} className="mb-2 mx-auto text-yellow-400" />
                     <span className="text-xs font-bold text-yellow-400">추가 파일 이미지가 적용 중입니다.</span>
                     <p className="text-[10px] mt-1 text-slate-300">파일 탭에서 옵션을 해제하거나,<br/>비밀을 다시 숨기세요.</p>
                   </div>
                 ) : (
                   <>
                     <Icons.Upload size={32} className="mb-2" />
                     <span className="text-xs">기본 이미지 변경</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </>
                 )}
               </label>
            )}
            
            {activePortraitFile && (
              <div className="absolute top-2 right-2 bg-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-yellow-400 animate-pulse">
                {activePortraitFile.isSecret ? '비밀 해제됨' : '변형 적용됨'}
              </div>
            )}
          </div>
          
          {isEditing && formData.imageUrl && !activePortraitFile && (
             <div className="flex justify-center gap-2 mb-4">
               <button onClick={() => setFormData(p => ({...p, imageFit: 'cover'}))} className={`px-2 py-1 text-xs rounded ${formData.imageFit==='cover' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>채우기</button>
               <button onClick={() => setFormData(p => ({...p, imageFit: 'contain'}))} className={`px-2 py-1 text-xs rounded ${formData.imageFit==='contain' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>맞추기</button>
             </div>
          )}

          <div className="text-center">
             <h2 className={`text-2xl font-black mb-1 break-keep ${tc.textMain}`}>{formData.name || (isEditing ? '이름 없음' : '')}</h2>
             
             {!isEditing && campaign.system === SystemType.CYBERPUNK_RED && formData.realName && (
               <div className="mb-2">
                 <span className={`text-xs mr-2 ${tc.textSub}`}>실명:</span> 
                 <span className={`text-sm blur-sm hover:blur-0 cursor-pointer transition-all duration-300 ${tc.textSub}`} title="클릭하여 확인">{formData.realName}</span>
               </div>
             )}

             <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${formData.isNpc ? 'bg-amber-600' : 'bg-emerald-600'} text-white`}>
                   {formData.isNpc ? 'NPC' : 'PC'}
                </span>
                <span className={`text-sm ${tc.textSub}`}>
                   {displayRole}
                </span>
                {formData.levelOrExp && (
                  <span className={`text-xs border px-1.5 py-0.5 rounded ${tc.border} ${tc.textSub}`}>
                    {formData.levelOrExp}
                  </span>
                )}
             </div>
             {isEditing ? (
               <input 
                 className={`w-full bg-transparent border-b text-center text-sm pb-2 focus:border-blue-500 outline-none ${tc.textSub} ${tc.border}`}
                 placeholder="한 줄 요약 입력"
                 value={formData.summary}
                 onChange={e => setFormData(p => ({...p, summary: e.target.value}))}
               />
             ) : (
               <p className={`text-sm italic ${tc.textSub}`}>"{formData.summary}"</p>
             )}
          </div>
        </div>

        {/* Right Column: Details (File View) */}
        <div className={`flex-1 flex flex-col relative bg-transparent`}>
          {/* Desktop Toolbar */}
          <div className={`hidden md:flex justify-between items-center p-4 border-b ${tc.border} ${tc.bgPanel}`}>
             <div className="flex gap-1">
               <button 
                 onClick={() => setActiveTab('INFO')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'INFO' ? tc.textMain + ' bg-white/5' : tc.textSub + ' hover:text-white'}`}
               >기본 정보</button>
               <button 
                 onClick={() => setActiveTab('BIO')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'BIO' ? tc.textMain + ' bg-white/5' : tc.textSub + ' hover:text-white'}`}
               >프로필/서사</button>
               <button 
                 onClick={() => setActiveTab('FILES')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'FILES' ? tc.textMain + ' bg-white/5' : tc.textSub + ' hover:text-white'} flex items-center gap-2`}
               >
                 추가 파일
                 {formData.extraFiles.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${tc.textMain} bg-white/20`}>{formData.extraFiles.length}</span>}
               </button>
               <button 
                 onClick={() => setActiveTab('COMMENTS')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'COMMENTS' ? tc.textMain + ' bg-white/5' : tc.textSub + ' hover:text-white'} flex items-center gap-2`}
               >
                 면담/기록
                 {formData.comments && formData.comments.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${tc.textMain} bg-white/20`}>{formData.comments.length}</span>}
               </button>
             </div>
             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${tc.buttonPrimary}`}><Icons.Save size={16}/> 저장</button>
                 </>
               ) : (
                 <>
                   <button onClick={() => setIsEditing(true)} className={`p-2 rounded ${tc.buttonSecondary}`}><Icons.Edit size={18} /></button>
                   <button onClick={() => onDelete(formData.id)} className={`p-2 rounded ${tc.buttonSecondary} hover:text-red-500`}><Icons.Trash size={18} /></button>
                 </>
               )}
               <button onClick={onClose} className={`p-2 rounded ml-2 ${tc.buttonSecondary}`}><Icons.Close size={20} /></button>
             </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {activeTab === 'INFO' && (
              <div className="space-y-6 max-w-2xl">
                 <EditableField 
                   label={nameLabel}
                   value={formData.name} 
                   onChange={(v) => setFormData(p => ({...p, name: v}))} 
                   isEditing={isEditing}
                   placeholder={campaign.system === SystemType.CYBERPUNK_RED ? '핸들 (예: Johnny Silverhand)' : '이름'}
                   themeClasses={tc}
                 />

                 {(isEditing || campaign.system === SystemType.CYBERPUNK_RED || formData.realName) && (
                   <EditableField 
                     label={realNameLabel}
                     value={formData.realName} 
                     onChange={(v) => setFormData(p => ({...p, realName: v}))} 
                     isEditing={isEditing}
                     placeholder="실제 이름 (선택 사항)"
                     isSecretField={campaign.system === SystemType.CYBERPUNK_RED}
                     themeClasses={tc}
                   />
                 )}
                 
                 <EditableField 
                   label="유형" 
                   value={formData.isNpc} 
                   onChange={(v) => setFormData(p => ({...p, isNpc: v}))} 
                   type="toggle"
                   isEditing={isEditing}
                   themeClasses={tc}
                 />

                 <EditableField 
                   label={levelLabel} 
                   value={formData.levelOrExp} 
                   onChange={(v) => setFormData(p => ({...p, levelOrExp: v}))} 
                   placeholder={levelPlaceholder}
                   isEditing={isEditing}
                   themeClasses={tc}
                 />

                 <div className="grid grid-cols-2 gap-4">
                   <EditableField 
                     label="나이" 
                     value={formData.age} 
                     onChange={(v) => setFormData(p => ({...p, age: v}))} 
                     placeholder="예: 25세" 
                     isEditing={isEditing}
                     themeClasses={tc}
                   />
                   <EditableField 
                     label="성별" 
                     value={formData.gender} 
                     onChange={(v) => setFormData(p => ({...p, gender: v}))} 
                     placeholder="예: 남성, 여성, 불명" 
                     isEditing={isEditing}
                     themeClasses={tc}
                   />
                   <EditableField 
                     label="신장 (키)" 
                     value={formData.height} 
                     onChange={(v) => setFormData(p => ({...p, height: v}))} 
                     placeholder="예: 175cm" 
                     isEditing={isEditing}
                     themeClasses={tc}
                   />
                   <EditableField 
                     label="체중" 
                     value={formData.weight} 
                     onChange={(v) => setFormData(p => ({...p, weight: v}))} 
                     placeholder="예: 70kg" 
                     isEditing={isEditing}
                     themeClasses={tc}
                   />
                 </div>
                 
                 <EditableField 
                   label="외모 묘사" 
                   value={formData.appearance} 
                   onChange={(v) => setFormData(p => ({...p, appearance: v}))} 
                   placeholder="눈동자 색, 머리 모양, 흉터 등 특징" 
                   type="textarea"
                   isEditing={isEditing}
                   themeClasses={tc}
                 />

                 <hr className={`my-4 ${tc.border}`} />

                 {/* System Specific Fields - Passing Theme */}
                 {campaign.system === SystemType.DND5E && (
                   <>
                     <EditableField 
                        label="클래스" 
                        value={formData.dndClass} 
                        onChange={(v) => setFormData(p => ({...p, dndClass: v}))} 
                        type="select"
                        options={DND_CLASSES}
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                     <EditableField 
                        label="서브클래스" 
                        value={formData.dndSubclass} 
                        onChange={(v) => setFormData(p => ({...p, dndSubclass: v}))} 
                        placeholder="예: 배틀 마스터"
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                   </>
                 )}
                 {campaign.system === SystemType.CYBERPUNK_RED && (
                   <>
                     <EditableField 
                        label="역할 (Role)" 
                        value={formData.cpredRole} 
                        onChange={(v) => setFormData(p => ({...p, cpredRole: v}))} 
                        type="select"
                        options={CPRED_ROLES.map(r => ({ label: r, value: r.split(' ')[0] }))}
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                     <EditableField 
                        label="출신/배경" 
                        value={formData.cpredOrigin} 
                        onChange={(v) => setFormData(p => ({...p, cpredOrigin: v}))} 
                        placeholder="예: 노마드 패밀리"
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                   </>
                 )}
                 {campaign.system === SystemType.COC7 && (
                   <>
                     <EditableField 
                        label="직업" 
                        value={formData.customClass} 
                        onChange={(v) => setFormData(p => ({...p, customClass: v}))} 
                        placeholder="예: 사립탐정"
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                     <EditableField 
                        label="출신/거주지" 
                        value={formData.customSubclass} 
                        onChange={(v) => setFormData(p => ({...p, customSubclass: v}))} 
                        placeholder="예: 아컴"
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                   </>
                 )}
                 {campaign.system === SystemType.BAND_OF_BLADES && (
                   <>
                     <EditableField 
                        label="플레이북" 
                        value={formData.customClass} 
                        onChange={(v) => setFormData(p => ({...p, customClass: v}))} 
                        type="select"
                        options={BOB_PLAYBOOKS.map(p => ({ label: p, value: p.split(' ')[0] }))}
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                     <EditableField 
                        label="상세 정보" 
                        value={formData.customSubclass} 
                        onChange={(v) => setFormData(p => ({...p, customSubclass: v}))} 
                        placeholder="예: 스코브란 출신"
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                   </>
                 )}
                 {campaign.system === SystemType.OTHER && (
                   <>
                     <EditableField 
                        label="클래스 / 직업" 
                        value={formData.customClass} 
                        onChange={(v) => setFormData(p => ({...p, customClass: v}))} 
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                     <EditableField 
                        label="종족 / 서브클래스" 
                        value={formData.customSubclass} 
                        onChange={(v) => setFormData(p => ({...p, customSubclass: v}))} 
                        isEditing={isEditing}
                        themeClasses={tc}
                     />
                   </>
                 )}

              </div>
            )}
            
            {activeTab === 'BIO' && (
               <div className="h-full flex flex-col">
                  <EditableField 
                    label="상세 서사 / 메모"
                    value={formData.description}
                    onChange={(v) => setFormData(p => ({...p, description: v}))}
                    type="textarea"
                    placeholder="캐릭터의 전체적인 배경 스토리나 중요한 메모를 작성하세요."
                    isEditing={isEditing}
                    themeClasses={tc}
                  />
               </div>
            )}

            {activeTab === 'FILES' && (
               <div className="space-y-4">
                  {isEditing && (
                    <button onClick={addExtraFile} className={`w-full py-2 border border-dashed rounded flex items-center justify-center gap-2 transition-colors ${tc.border} ${tc.textSub} hover:opacity-80`}>
                      <Icons.Plus size={16} /> 항목 추가
                    </button>
                  )}

                  {formData.extraFiles.length === 0 && !isEditing && (
                    <div className={`text-center py-8 ${tc.textSub}`}>추가 파일이 없습니다.</div>
                  )}

                  {formData.extraFiles.map((file) => {
                    const isMasked = !isEditing && file.isSecret && !revealedIds.has(file.id);

                    return (
                      <div key={file.id} className={`border rounded-lg p-4 overflow-hidden transition-all duration-300 ${tc.bgPanel} ${file.useAsPortrait ? 'border-yellow-500 shadow-md' : tc.border}`}>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            {isEditing ? (
                              <div className="flex-1 mr-4 space-y-2">
                                <input 
                                    value={file.title} 
                                    onChange={e => updateExtraFile(file.id, 'title', e.target.value)}
                                    className={`w-full bg-transparent border-b focus:border-blue-500 font-bold outline-none pb-1 ${tc.textMain} ${tc.border}`}
                                    placeholder="제목"
                                />
                                <div className="flex flex-wrap gap-4 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                      <input 
                                        type="checkbox" 
                                        checked={!!file.isSecret} 
                                        onChange={(e) => toggleSecret(file.id, e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-500 text-red-600 cursor-pointer accent-red-600"
                                      />
                                      <span className={`text-xs ${file.isSecret ? 'text-red-400 font-bold' : tc.textSub}`}>
                                        비밀글 설정
                                      </span>
                                  </label>
                                  {file.imageUrl && (
                                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input 
                                          type="checkbox" 
                                          checked={!!file.useAsPortrait} 
                                          onChange={(e) => togglePortraitOverride(file.id, e.target.checked)}
                                          className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer"
                                        />
                                        <span className={`text-xs ${file.useAsPortrait ? 'text-yellow-400 font-bold' : tc.textSub}`}>
                                          공개/해금 시 포트레잇 사용
                                        </span>
                                    </label>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <h4 className={`font-bold flex items-center gap-2 text-lg ${file.isSecret ? 'text-red-400' : 'text-yellow-500'}`}>
                                  {file.isSecret ? <Icons.Lock size={18}/> : <Icons.Folder size={18}/>} 
                                  {file.title}
                                </h4>
                              </div>
                            )}
                            
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => removeExtraFile(file.id)} className="text-red-500 hover:text-red-400 p-1 rounded transition-colors"><Icons.Trash size={18} /></button>
                              </div>
                            )}
                        </div>

                        {/* Content Body */}
                        {isMasked ? (
                          <div className={`relative h-40 rounded-lg flex flex-col items-center justify-center border border-dashed ${tc.border} bg-black/20`}>
                            <div className="z-10 flex flex-col items-center">
                              <Icons.Lock size={32} className={`mb-2 ${tc.textSub}`} />
                              <p className={`text-sm mb-3 ${tc.textSub}`}>이 파일은 숨겨져 있습니다.</p>
                              <button 
                                onClick={() => revealSecret(file.id)}
                                className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-100 rounded-lg text-sm font-bold shadow-lg transition-colors"
                              >
                                비밀 열기
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`transition-opacity duration-500 ${isEditing || revealedIds.has(file.id) ? 'opacity-100' : 'opacity-100'}`}>
                            {file.imageUrl && (
                                <div className={`relative mb-4 group rounded-lg overflow-hidden border aspect-square max-w-[400px] mx-auto bg-black/40 ${tc.border}`}>
                                  <img src={file.imageUrl} alt={file.title} className="w-full h-full object-cover" />
                                  {isEditing && (
                                    <div className="absolute top-2 right-2 flex gap-2">
                                      <button 
                                        onClick={() => {
                                            updateExtraFile(file.id, 'imageUrl', '');
                                            updateExtraFile(file.id, 'useAsPortrait', false);
                                        }}
                                        className="bg-black/70 hover:bg-red-600 text-white p-1.5 rounded cursor-pointer transition-colors backdrop-blur-sm"
                                      >
                                        <Icons.Close size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                            )}

                            {isEditing && !file.imageUrl && (
                              <div className="mb-4">
                                <label className={`flex items-center gap-2 text-sm cursor-pointer w-fit transition-colors ${tc.textSub} hover:${tc.textAccent}`}>
                                  <Icons.Image size={16} />
                                  <span>이미지 첨부</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExtraImageUpload(file.id, e)} />
                                </label>
                              </div>
                            )}

                            {isEditing ? (
                              <textarea 
                                value={file.content}
                                onChange={e => updateExtraFile(file.id, 'content', e.target.value)}
                                className={`w-full h-32 bg-slate-900 border rounded p-2 text-sm resize-y focus:outline-none ${tc.textMain} ${tc.border}`}
                                placeholder="내용 입력..."
                              />
                            ) : (
                              <p className={`text-sm whitespace-pre-wrap leading-relaxed ${tc.textMain}`}>
                                {file.content}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            )}

            {activeTab === 'COMMENTS' && (
              <div className="h-full flex flex-col relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                
                <div className="flex-1 space-y-4 pb-4 overflow-y-auto max-h-[500px] p-2">
                   {formData.comments && formData.comments.length > 0 ? (
                     <div className="flex flex-wrap gap-4 items-start content-start">
                        {formData.comments.map((comment) => {
                          // Style Variants (Field Manual Style - Improved Visibility)
                          let noteStyle = "bg-[#fef9c3] text-slate-900 font-hand -rotate-1 border-b-4 border-r-4 border-[#fde047] shadow-xl"; // Note
                          if (comment.styleVariant === 'STAMP') noteStyle = "border-[6px] border-red-800/80 text-red-800 font-display rotate-3 opacity-90 uppercase tracking-widest bg-transparent mix-blend-multiply shadow-none p-4";
                          if (comment.styleVariant === 'WARNING') noteStyle = "bg-black text-yellow-400 font-mono border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] font-bold tracking-tighter";
                          if (comment.styleVariant === 'MEMO') noteStyle = "bg-slate-50 text-slate-900 font-mono border border-slate-300 shadow-md rotate-1";

                          return (
                            <div 
                              key={comment.id} 
                              className={`relative p-4 w-60 min-h-[140px] transition-all hover:scale-105 hover:z-20 group cursor-default flex flex-col ${noteStyle}`}
                            >
                              <div className="text-xs font-bold opacity-70 mb-2 flex justify-between items-center border-b border-current pb-1">
                                <span>{comment.userName}</span>
                                {/* Delete Button (Visible on Hover) */}
                                <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteComment(comment.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-red-600 hover:text-white rounded-full p-1"
                                  title="삭제"
                                >
                                  <Icons.Close size={14}/>
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap text-lg leading-snug flex-1">{comment.content}</p>
                              
                              {/* Date stamp at bottom right */}
                              <div className="text-[10px] opacity-50 text-right mt-2 font-mono">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </div>

                              {comment.styleVariant === 'STAMP' && (
                                <div className="absolute inset-0 border-2 border-current opacity-20 rounded-sm pointer-events-none" />
                              )}
                            </div>
                          )
                        })}
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-12 opacity-50 font-mono border-2 border-dashed border-slate-600 rounded-lg bg-black/10">
                        <Icons.File className="mb-2 w-12 h-12" />
                        <span className="text-lg">기록된 특이사항 없음</span>
                        <span className="text-xs mt-1">NO RECORDS FOUND</span>
                     </div>
                   )}
                </div>

                {/* Input Area */}
                <div className={`p-4 border-t-2 border-dashed ${tc.border} bg-black/20 mt-auto`}>
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      value={commentName} 
                      onChange={e => setCommentName(e.target.value)}
                      className={`bg-transparent border-b ${tc.border} ${tc.textMain} text-sm px-2 py-1 w-32 focus:outline-none focus:border-blue-500 font-bold`}
                      placeholder="작성자 (코드네임)"
                    />
                    <select 
                      value={commentStyle}
                      onChange={e => setCommentStyle(e.target.value as any)}
                      className={`text-xs bg-slate-800 border-none rounded px-2 py-1 ${tc.textSub} cursor-pointer`}
                    >
                      <option value="NOTE">📒 메모지 (Note)</option>
                      <option value="STAMP">💮 도장 (Stamp)</option>
                      <option value="WARNING">⚠️ 경고 (Warning)</option>
                      <option value="MEMO">📄 공문 (Official)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <textarea 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className={`flex-1 h-24 bg-slate-900/80 border ${tc.border} rounded p-3 text-base ${tc.textMain} resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                      placeholder="추가 기록 사항 입력... (이곳에 작성된 내용은 모든 플레이어가 열람 가능합니다)"
                    />
                    <button 
                      onClick={submitComment}
                      className={`px-6 font-black text-sm uppercase tracking-wider rounded transition-transform active:scale-95 flex flex-col items-center justify-center ${tc.buttonPrimary}`}
                    >
                      <Icons.Save className="mb-1" size={20} />
                      등록<br/>POST
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetail;