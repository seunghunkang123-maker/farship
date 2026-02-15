import React, { useState, useEffect, useMemo } from 'react';
import { Character, Campaign, DND_CLASSES, CPRED_ROLES, ExtraFile, SystemType } from '../../types';
import { Icons } from '../ui/Icons';
import { fileToBase64 } from '../../services/storage';

// --- Sub-components defined outside to prevent re-mount on render (Fixes IME issue) ---

interface EditableFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
  type?: 'text' | 'textarea' | 'select' | 'toggle';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  isEditing,
  type = 'text',
  options = [],
  placeholder = '',
}) => {
  if (!isEditing) {
    if (type === 'toggle') return null;
    return (
      <div className="mb-4 group">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
          {label}
        </label>
        <div className="text-slate-200 text-sm md:text-base bg-slate-800/50 p-2 rounded min-h-[2rem] whitespace-pre-wrap">
          {type === 'select'
            ? options.find((o) => o.value === value)?.label || value
            : value || '-'}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      {type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
          placeholder={placeholder}
        />
      )}
      {type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none resize-none"
          placeholder={placeholder}
        />
      )}
      {type === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
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
}

const CharacterDetail: React.FC<CharacterDetailProps> = ({ character, campaign, onSave, onDelete, onClose, isEditingNew = false }) => {
  const [isEditing, setIsEditing] = useState(isEditingNew);
  const [activeTab, setActiveTab] = useState<'INFO' | 'BIO' | 'FILES'>('INFO');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  
  // Form State
  const [formData, setFormData] = useState<Character>({
    id: '',
    campaignId: campaign.id,
    name: '',
    isNpc: false,
    imageFit: 'cover',
    summary: '',
    description: '',
    extraFiles: [],
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
        isNpc: false,
        imageFit: 'cover',
        summary: '',
        description: '',
        extraFiles: [],
        updatedAt: Date.now(),
        // Defaults based on system
        dndClass: campaign.system === SystemType.DND5E ? DND_CLASSES[0].value : undefined,
        cpredRole: campaign.system === SystemType.CYBERPUNK_RED ? CPRED_ROLES[0].split(' ')[0] : undefined,
        customClass: campaign.system === SystemType.OTHER ? '' : undefined
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
        useAsPortrait: f.id === fileId ? isChecked : false // Ensure only one can be active at a time for configuration simplicity
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

  // Resolve display values
  let displayRole = '';
  if (campaign.system === SystemType.DND5E) displayRole = formData.dndClass || '';
  else if (campaign.system === SystemType.CYBERPUNK_RED) displayRole = formData.cpredRole || '';
  else displayRole = formData.customClass || '';

  // Calculate Logic for Display Image
  // Logic: 
  // 1. Find all files marked as useAsPortrait.
  // 2. Filter out those that are Secret AND NOT Revealed.
  // 3. Pick the last one (assuming later added files are "newer" forms).
  // 4. Fallback to main image.
  const activePortraitFile = useMemo(() => {
    const candidates = formData.extraFiles.filter(f => f.useAsPortrait && f.imageUrl);
    // Reverse to check latest first
    const reversed = [...candidates].reverse();
    // Find the first valid one (Not secret OR is Revealed)
    return reversed.find(f => !f.isSecret || revealedIds.has(f.id));
  }, [formData.extraFiles, revealedIds]);

  const displayImageUrl = activePortraitFile ? activePortraitFile.imageUrl : formData.imageUrl;
  
  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className="bg-slate-900 w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-xl shadow-2xl border border-slate-700 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Column: Visuals */}
        <div className="w-full md:w-1/3 bg-slate-950 p-6 flex flex-col border-r border-slate-800 overflow-y-auto">
          <div className="flex justify-between md:hidden mb-4">
            <button onClick={onClose}><Icons.Close /></button>
            <div className="flex gap-2">
              {isEditing ? (
                 <button onClick={handleSave} className="text-blue-400"><Icons.Save /></button>
              ) : (
                 <button onClick={() => setIsEditing(true)}><Icons.Edit /></button>
              )}
            </div>
          </div>

          <div className="relative aspect-square w-full rounded-lg bg-slate-900 border-2 border-slate-800 overflow-hidden mb-6 group transition-all duration-300">
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt={formData.name} 
                className={`w-full h-full transition-opacity duration-500 ${formData.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700"><Icons.User size={80} /></div>
            )}
            
            {/* Overlay for editing Main Image */}
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
            
            {/* Indicator badge */}
            {activePortraitFile && (
              <div className="absolute top-2 right-2 bg-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-yellow-400 animate-pulse">
                {activePortraitFile.isSecret ? '비밀 해제됨' : '변형 적용됨'}
              </div>
            )}
          </div>
          
          {isEditing && formData.imageUrl && !activePortraitFile && (
             <div className="flex justify-center gap-2 mb-4">
               <button onClick={() => setFormData(p => ({...p, imageFit: 'cover'}))} className={`px-2 py-1 text-xs rounded ${formData.imageFit==='cover' ? 'bg-blue-600' : 'bg-slate-800'}`}>채우기</button>
               <button onClick={() => setFormData(p => ({...p, imageFit: 'contain'}))} className={`px-2 py-1 text-xs rounded ${formData.imageFit==='contain' ? 'bg-blue-600' : 'bg-slate-800'}`}>맞추기</button>
             </div>
          )}

          <div className="text-center">
             <h2 className="text-2xl font-black text-white mb-1 break-keep">{formData.name || (isEditing ? '이름 없음' : '')}</h2>
             <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${formData.isNpc ? 'bg-amber-600' : 'bg-emerald-600'} text-white`}>
                   {formData.isNpc ? 'NPC' : 'PC'}
                </span>
                <span className="text-slate-400 text-sm">
                   {displayRole}
                </span>
             </div>
             {isEditing ? (
               <input 
                 className="w-full bg-transparent border-b border-slate-700 text-center text-sm text-slate-400 pb-2 focus:border-blue-500 outline-none"
                 placeholder="한 줄 요약 입력"
                 value={formData.summary}
                 onChange={e => setFormData(p => ({...p, summary: e.target.value}))}
               />
             ) : (
               <p className="text-slate-400 text-sm italic">"{formData.summary}"</p>
             )}
          </div>
        </div>

        {/* Right Column: Details (File View) */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          {/* Desktop Toolbar */}
          <div className="hidden md:flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
             <div className="flex gap-1">
               <button 
                 onClick={() => setActiveTab('INFO')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'INFO' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
               >기본 정보</button>
               <button 
                 onClick={() => setActiveTab('BIO')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'BIO' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
               >프로필/서사</button>
               <button 
                 onClick={() => setActiveTab('FILES')} 
                 className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'FILES' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'} flex items-center gap-2`}
               >
                 추가 파일
                 {formData.extraFiles.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full">{formData.extraFiles.length}</span>}
               </button>
             </div>
             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm"><Icons.Save size={16}/> 저장</button>
                 </>
               ) : (
                 <>
                   <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Icons.Edit size={18} /></button>
                   <button onClick={() => onDelete(formData.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded"><Icons.Trash size={18} /></button>
                 </>
               )}
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded ml-2"><Icons.Close size={20} /></button>
             </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {activeTab === 'INFO' && (
              <div className="space-y-6 max-w-2xl">
                 <EditableField 
                   label="이름" 
                   value={formData.name} 
                   onChange={(v) => setFormData(p => ({...p, name: v}))} 
                   isEditing={isEditing}
                 />
                 <EditableField 
                   label="유형" 
                   value={formData.isNpc} 
                   onChange={(v) => setFormData(p => ({...p, isNpc: v}))} 
                   type="toggle"
                   isEditing={isEditing}
                 />
                 
                 {campaign.system === SystemType.DND5E && (
                   <>
                     <EditableField 
                        label="클래스" 
                        value={formData.dndClass} 
                        onChange={(v) => setFormData(p => ({...p, dndClass: v}))} 
                        type="select"
                        options={DND_CLASSES}
                        isEditing={isEditing}
                     />
                     <EditableField 
                        label="서브클래스" 
                        value={formData.dndSubclass} 
                        onChange={(v) => setFormData(p => ({...p, dndSubclass: v}))} 
                        placeholder="예: 배틀 마스터 (Battle Master)"
                        isEditing={isEditing}
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
                     />
                     <EditableField 
                        label="출신/배경" 
                        value={formData.cpredOrigin} 
                        onChange={(v) => setFormData(p => ({...p, cpredOrigin: v}))} 
                        placeholder="예: 노마드 패밀리 출신"
                        isEditing={isEditing}
                     />
                   </>
                 )}

                 {campaign.system === SystemType.OTHER && (
                   <>
                     <EditableField 
                        label="클래스 / 직업" 
                        value={formData.customClass} 
                        onChange={(v) => setFormData(p => ({...p, customClass: v}))} 
                        placeholder="예: 탐정, 뱀파이어, 학생 등"
                        isEditing={isEditing}
                     />
                     <EditableField 
                        label="종족 / 서브클래스 / 상세" 
                        value={formData.customSubclass} 
                        onChange={(v) => setFormData(p => ({...p, customSubclass: v}))} 
                        placeholder="예: 엘프, 벤트루 클랜 등"
                        isEditing={isEditing}
                     />
                   </>
                 )}
                 
                 {isEditing && (
                   <p className="text-xs text-slate-500 mt-8 pt-4 border-t border-slate-800">
                     * 필수 정보만 입력하면 등록 가능합니다.
                   </p>
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
                  />
               </div>
            )}

            {activeTab === 'FILES' && (
               <div className="space-y-4">
                  {isEditing && (
                    <button onClick={addExtraFile} className="w-full py-2 border border-dashed border-slate-600 text-slate-400 hover:text-blue-400 hover:border-blue-400 rounded flex items-center justify-center gap-2 transition-colors">
                      <Icons.Plus size={16} /> 항목 추가 (비밀/진상/아이템 등)
                    </button>
                  )}

                  {formData.extraFiles.length === 0 && !isEditing && (
                    <div className="text-center text-slate-500 py-8">추가 파일이 없습니다.</div>
                  )}

                  {formData.extraFiles.map((file) => {
                    // Render Logic: Mask if secret and not revealed (only in view mode)
                    const isMasked = !isEditing && file.isSecret && !revealedIds.has(file.id);

                    return (
                      <div key={file.id} className={`bg-slate-800 border rounded-lg p-4 overflow-hidden transition-all duration-300 ${file.useAsPortrait ? 'border-yellow-500 shadow-md shadow-yellow-900/20' : 'border-slate-700'}`}>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            {isEditing ? (
                              <div className="flex-1 mr-4 space-y-2">
                                <input 
                                    value={file.title} 
                                    onChange={e => updateExtraFile(file.id, 'title', e.target.value)}
                                    className="w-full bg-transparent border-b border-slate-600 focus:border-blue-500 text-white font-bold outline-none pb-1"
                                    placeholder="제목 (예: 숨겨진 과거)"
                                />
                                <div className="flex flex-wrap gap-4 pt-1">
                                  {/* Secret Toggle */}
                                  <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                      <input 
                                        type="checkbox" 
                                        checked={!!file.isSecret} 
                                        onChange={(e) => toggleSecret(file.id, e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-500 text-red-600 focus:ring-offset-0 focus:ring-0 cursor-pointer accent-red-600"
                                      />
                                      <span className={`text-xs ${file.isSecret ? 'text-red-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        비밀글 설정
                                      </span>
                                  </label>

                                  {/* Portrait Toggle (Only if image exists) */}
                                  {file.imageUrl && (
                                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input 
                                          type="checkbox" 
                                          checked={!!file.useAsPortrait} 
                                          onChange={(e) => togglePortraitOverride(file.id, e.target.checked)}
                                          className="w-4 h-4 rounded border-slate-500 text-blue-600 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                                        />
                                        <span className={`text-xs ${file.useAsPortrait ? 'text-yellow-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
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
                                {file.useAsPortrait && (
                                  <span className="text-[10px] text-yellow-600 font-bold bg-yellow-900/30 px-2 rounded-full w-fit mt-1">
                                    {file.isSecret ? '해금 시 포트레잇 변경' : '현재 적용 중'}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => removeExtraFile(file.id)} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors"><Icons.Trash size={18} /></button>
                              </div>
                            )}
                        </div>

                        {/* Content Body */}
                        {isMasked ? (
                          <div className="relative h-40 bg-slate-900/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-700/50">
                            <div className="absolute inset-0 overflow-hidden rounded-lg opacity-20" 
                                style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #1e293b 10px, #1e293b 20px)'}} 
                            />
                            <div className="z-10 flex flex-col items-center">
                              <Icons.Lock size={32} className="text-slate-500 mb-2" />
                              <p className="text-slate-400 text-sm mb-3">이 파일은 숨겨져 있습니다.</p>
                              <button 
                                onClick={() => revealSecret(file.id)}
                                className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-100 rounded-lg text-sm font-bold shadow-lg transition-colors border border-red-700/50"
                              >
                                비밀 열기 (Reveal)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`transition-opacity duration-500 ${isEditing || revealedIds.has(file.id) ? 'opacity-100' : 'opacity-100'}`}>
                            {/* Image Section */}
                            {file.imageUrl && (
                                <div className="relative mb-4 group rounded-lg overflow-hidden bg-black/40 border border-slate-700/50 aspect-square max-w-[400px] mx-auto">
                                  <img src={file.imageUrl} alt={file.title} className="w-full h-full object-cover" />
                                  {isEditing && (
                                    <div className="absolute top-2 right-2 flex gap-2">
                                      <label className="bg-black/70 hover:bg-blue-600 text-white p-1.5 rounded cursor-pointer transition-colors backdrop-blur-sm">
                                        <Icons.Edit size={14} />
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExtraImageUpload(file.id, e)} />
                                      </label>
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

                            {/* Upload Button (Only if no image and in edit mode) */}
                            {isEditing && !file.imageUrl && (
                              <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 cursor-pointer w-fit transition-colors">
                                  <Icons.Image size={16} />
                                  <span>이미지 첨부</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExtraImageUpload(file.id, e)} />
                                </label>
                              </div>
                            )}

                            {/* Text Content */}
                            {isEditing ? (
                              <textarea 
                                value={file.content}
                                onChange={e => updateExtraFile(file.id, 'content', e.target.value)}
                                className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 resize-y focus:outline-none focus:border-blue-500"
                                placeholder="내용 입력..."
                              />
                            ) : (
                              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-700">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetail;