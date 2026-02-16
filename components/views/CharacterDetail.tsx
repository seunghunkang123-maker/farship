
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Character, Campaign, DND_CLASSES, CPRED_ROLES, BOB_PLAYBOOKS, ExtraFile, SystemType, CharacterComment, CORE_MEMBERS, SecretProfile, CharacterAffiliation } from '../../types';
import { Icons } from '../ui/Icons';
import { fileToBase64 } from '../../services/storage';
import { THEMES, THEME_KEYS } from '../../constants';

// --- Colors Constant ---
const MEMBER_COLORS: Record<string, string> = {
  '승훈': 'bg-red-900/90 text-red-100 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]',
  '피쉬': 'bg-blue-900/90 text-blue-100 border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.3)]',
  '델리': 'bg-orange-900/90 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(234,88,12,0.3)]',
  '망령': 'bg-violet-900/90 text-violet-100 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
  '배추': 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  '유자': 'bg-yellow-900/90 text-yellow-100 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
};
const GUEST_COLOR = 'bg-slate-800/90 text-slate-300 border-slate-600 backdrop-blur-sm';

interface EditableFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
  type?: 'text' | 'textarea' | 'select' | 'toggle';
  options?: { label: string; value: string }[];
  placeholder?: string;
  isSecretField?: boolean;
  themeClasses: any;
  highlight?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, onChange, isEditing, type = 'text', options = [], placeholder = '', isSecretField = false, themeClasses, highlight = false
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const displayClass = highlight ? 'text-amber-400 font-bold' : themeClasses.textMain;

  if (!isEditing) {
    if (type === 'toggle') return null;
    let displayValue = value || '-';
    if (isSecretField && value && !isRevealed) {
         return (
           <div className="mb-4 group">
             <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${themeClasses.textSub}`}>{label}</label>
             <div onClick={() => setIsRevealed(true)} className={`text-sm md:text-base p-2 rounded min-h-[2rem] cursor-pointer transition-colors flex items-center gap-2 border border-dashed ${themeClasses.bgPanel} ${themeClasses.border} ${themeClasses.textSub} hover:opacity-80`}>
                <Icons.Lock size={14} /><span className="tracking-widest">************</span><span className="text-[10px] ml-auto">(클릭하여 열람)</span>
             </div>
           </div>
         );
    }
    return (
      <div className="mb-4 group">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${themeClasses.textSub}`}>{label}</label>
        <div className={`text-sm md:text-base p-2 rounded min-h-[2rem] whitespace-pre-wrap ${displayClass}`}>
          {type === 'select' ? options.find((o) => o.value === value)?.label || value : displayValue}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${highlight ? 'text-amber-500' : themeClasses.textAccent}`}>
        {label} {highlight && <span className="text-[10px] bg-amber-900/50 px-1 rounded ml-1">Secret</span>}
      </label>
      {type === 'text' && <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/20 border ${highlight ? 'border-amber-700 focus:border-amber-500' : themeClasses.border} rounded p-2 focus:border-opacity-100 focus:outline-none placeholder:opacity-30 ${themeClasses.textMain}`} placeholder={placeholder}/>}
      {type === 'textarea' && <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full h-32 bg-black/20 border ${highlight ? 'border-amber-700 focus:border-amber-500' : themeClasses.border} rounded p-2 focus:border-opacity-100 focus:outline-none resize-none placeholder:opacity-30 ${themeClasses.textMain}`} placeholder={placeholder}/>}
      {type === 'select' && <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/20 border ${themeClasses.border} rounded p-2 focus:border-opacity-100 focus:outline-none ${themeClasses.textMain}`}>{options.map((opt) => <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-200">{opt.label}</option>)}</select>}
      {type === 'toggle' && <div className="flex gap-2"><button onClick={() => onChange(false)} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${!value ? 'bg-emerald-700/80 text-white' : 'bg-black/20 text-slate-500'}`}>PC</button><button onClick={() => onChange(true)} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${value ? 'bg-amber-700/80 text-white' : 'bg-black/20 text-slate-500'}`}>NPC</button></div>}
    </div>
  );
};

interface CharacterDetailProps {
  character: Character | null;
  campaign: Campaign;
  onSave: (char: Character) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isEditingNew?: boolean;
  onAddComment?: (comment: CharacterComment) => void;
  onDeleteComment?: (commentId: string, charId: string) => void;
  // Reveal Props
  isGlobalReveal?: boolean;
  isRevealed?: boolean;
  onToggleReveal?: (id: string, state: boolean) => void;
  // Name Blur Reveal Props
  isNameRevealed?: boolean;
  onToggleNameReveal?: (id: string, state: boolean) => void;
}

const CharacterDetail: React.FC<CharacterDetailProps> = ({ 
  character, campaign, onSave, onDelete, onClose, isEditingNew = false,
  onAddComment, onDeleteComment, isGlobalReveal = false, isRevealed = false, onToggleReveal,
  isNameRevealed = false, onToggleNameReveal
}) => {
  const [isEditing, setIsEditing] = useState(isEditingNew);
  const [activeTab, setActiveTab] = useState<'INFO' | 'BIO' | 'FILES' | 'COMMENTS'>('INFO');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  
  // Local reveal state (synced with props)
  const [editLayer, setEditLayer] = useState<'PUBLIC' | 'SECRET'>('PUBLIC');
  const isSecretRevealed = isGlobalReveal || isRevealed;

  // Edit Mode UI Toggle for Alias
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [showSecretAliasInput, setShowSecretAliasInput] = useState(false);

  // Affiliation Editing State
  const [newAffiliationName, setNewAffiliationName] = useState('');
  const [newAffiliationRank, setNewAffiliationRank] = useState('');
  const [hasRank, setHasRank] = useState(false);
  
  // Drag & Drop State
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Comment State
  const [commentName, setCommentName] = useState('관찰자');
  const [commentText, setCommentText] = useState('');
  const [commentStyle, setCommentStyle] = useState<'NOTE'|'STAMP'|'WARNING'|'MEMO'>('NOTE');
  const [commentFont, setCommentFont] = useState<string>('HAND');
  const [commentDate, setCommentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isGuestPlayer, setIsGuestPlayer] = useState(false);

  // Theme
  const currentThemeKey = campaign.theme || THEME_KEYS.ADVENTURE;
  const theme = THEMES[currentThemeKey] || THEMES[THEME_KEYS.ADVENTURE];
  const tc = theme.classes;

  const [formData, setFormData] = useState<Character>({
    id: '', campaignId: campaign.id, name: '', realName: '', playerName: CORE_MEMBERS[0],
    isNpc: false, imageFit: 'cover', summary: '', description: '', extraFiles: [], comments: [],
    updatedAt: Date.now(), alias: '', isNameBlurred: false, affiliations: []
  });

  useEffect(() => {
    if (character) {
      setFormData(character);
      setRevealedIds(new Set()); 
      const isMember = CORE_MEMBERS.includes(character.playerName || '');
      setIsGuestPlayer(!isMember && !!character.playerName);
      setShowAliasInput(!!character.alias);
      setShowSecretAliasInput(!!character.secretProfile?.alias);
      setEditLayer('PUBLIC');
    } else {
      setFormData({
        id: crypto.randomUUID(), campaignId: campaign.id, name: '', realName: '', playerName: CORE_MEMBERS[0],
        isNpc: false, imageFit: 'cover', summary: '', description: '', extraFiles: [], comments: [], updatedAt: Date.now(),
        dndClass: campaign.system === SystemType.DND5E ? DND_CLASSES[0].value : undefined,
        cpredRole: campaign.system === SystemType.CYBERPUNK_RED ? CPRED_ROLES[0].split(' ')[0] : undefined,
        customClass: campaign.system === SystemType.BAND_OF_BLADES ? BOB_PLAYBOOKS[0].split(' ')[0] : '',
        alias: '', isNameBlurred: false, affiliations: []
      });
      setIsEditing(true);
      setRevealedIds(new Set());
      setIsGuestPlayer(false);
      setShowAliasInput(false);
      setShowSecretAliasInput(false);
      setEditLayer('PUBLIC');
    }
  }, [character, campaign]);

  const handleToggleReveal = () => {
    // If Global Reveal is ON, individual toggle is disabled (visual logic handles this, but double check)
    if (isGlobalReveal) return;
    if (onToggleReveal) {
      onToggleReveal(formData.id, !isSecretRevealed);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetLayer: 'PUBLIC' | 'SECRET') => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      if (targetLayer === 'PUBLIC') setFormData(prev => ({ ...prev, imageUrl: base64 }));
      else updateSecretField('image_url', base64);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) { alert("이름을 입력해주세요."); return; }
    if (formData.secretProfile && Object.keys(formData.secretProfile).length === 0) {
       setFormData(prev => ({ ...prev, secretProfile: undefined }));
    }
    
    // Clear aliases if toggles are off
    const finalData = { ...formData };
    if (!showAliasInput) {
       finalData.alias = '';
       finalData.isNameBlurred = false;
    }
    if (finalData.secretProfile && !showSecretAliasInput) {
       finalData.secretProfile.alias = '';
    }

    onSave({ ...finalData, updatedAt: Date.now() });
    setIsEditing(false);
  };

  const updateSecretField = (field: keyof SecretProfile, value: any) => {
    setFormData(prev => ({ ...prev, secretProfile: { ...(prev.secretProfile || {}), [field]: value } }));
  };

  // Affiliation Logic
  const addAffiliation = () => {
    if (!newAffiliationName.trim()) return;
    const newAff: CharacterAffiliation = {
      id: crypto.randomUUID(),
      name: newAffiliationName.trim(),
      rank: hasRank ? newAffiliationRank.trim() : undefined,
      isStrikethrough: false,
      isHidden: false
    };

    if (editLayer === 'SECRET') {
      // When adding new tag in Secret Mode, we treat the current view (combined list) as the new state.
      // But simple add just appends.
      const currentList = currentAffiliations; // Use the combined list
      // We must sanitize this list (remove virtual IDs) before saving
      const cleanList = [...currentList, newAff].map(a => 
        a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
      );
      updateSecretField('affiliations', cleanList);
    } else {
      const currentList = formData.affiliations || [];
      setFormData(prev => ({ ...prev, affiliations: [...currentList, newAff] }));
    }

    setNewAffiliationName('');
    setNewAffiliationRank('');
    setHasRank(false);
  };

  const removeAffiliation = (index: number, aff: CharacterAffiliation) => {
    if (editLayer === 'SECRET') {
      // In Secret Mode, "removing" implies:
      // 1. If it's a "virtual" (inherited public) tag -> We must "hide" it.
      // 2. If it's a real secret tag -> We delete it.
      
      const currentList = [...currentAffiliations];
      
      if (aff.id.startsWith('virtual-')) {
         // It's a public tag we want to hide.
         // We must materialize it into the secret profile as HIDDEN.
         // And materialize all others to preserve order/structure.
         const newList = currentList.map((a, i) => {
             if (i === index) return { ...a, id: crypto.randomUUID(), isHidden: true };
             return a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a;
         });
         updateSecretField('affiliations', newList);
      } else {
         // It's a real secret tag (either created there or previously materialized).
         // Just remove it from the list.
         // But wait! If it matched a public tag name, removing it effectively "un-overrides" it,
         // causing the public tag to re-appear (ghost) in the next render.
         // So if it matches a public tag, we must toggle "Hidden" instead of deleting.
         const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
         
         if (isPublicRef) {
            // It overrides a public tag. To "remove" it visually, we must set isHidden=true.
            // If it was already isHidden=true (and user is deleting the hidden entry), 
            // then maybe they want to reset to public state? 
            // Let's assume click 'X' means "I don't want to see this". So isHidden=true.
            // If it's ALREADY hidden, maybe we remove the override (reset)? 
            // Let's implement toggle hidden logic for that.
            // Here, 'X' button usually means delete.
            // Let's say: If it overrides public -> Set Hidden. If already Hidden -> Delete (Reset to public).
            
            if (aff.isHidden) {
               // Deleting a hidden override -> Reset to Public (remove from secret list)
               const newList = currentList.filter(a => a.id !== aff.id).map(a => 
                   a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
               );
               updateSecretField('affiliations', newList);
            } else {
               // Hiding it
                const newList = currentList.map(a => 
                   a.id === aff.id ? { ...a, isHidden: true } : 
                   a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
               );
               updateSecretField('affiliations', newList);
            }
         } else {
             // Pure secret tag -> Delete
             const newList = currentList.filter(a => a.id !== aff.id).map(a => 
                 a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
             );
             updateSecretField('affiliations', newList);
         }
      }
    } else {
      const currentList = formData.affiliations || [];
      setFormData(prev => ({ ...prev, affiliations: currentList.filter((_, i) => i !== index) }));
    }
  };

  const toggleAffiliationStrikethrough = (index: number, aff: CharacterAffiliation) => {
    if (editLayer === 'SECRET') {
        const currentList = [...currentAffiliations];
        const newList = currentList.map((a, i) => {
            if (i === index) return { ...a, isStrikethrough: !a.isStrikethrough };
            return a;
        }).map(a => a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a);
        updateSecretField('affiliations', newList);
    } else {
      const currentList = formData.affiliations || [];
      setFormData(prev => ({ ...prev, affiliations: currentList.map((a, i) => i === index ? {...a, isStrikethrough: !a.isStrikethrough} : a) }));
    }
  };

  const toggleAffiliationHidden = (index: number, aff: CharacterAffiliation) => {
    if (editLayer === 'SECRET') {
        const currentList = [...currentAffiliations];
        const newList = currentList.map((a, i) => {
            if (i === index) return { ...a, isHidden: !a.isHidden };
            return a;
        }).map(a => a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a);
        updateSecretField('affiliations', newList);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (position: number) => {
    dragItem.current = position;
    setDraggingIndex(position);
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    const fromIndex = dragItem.current;
    const toIndex = dragOverItem.current;

    if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const listCopy = [...currentAffiliations];
    const item = listCopy[fromIndex];
    listCopy.splice(fromIndex, 1);
    listCopy.splice(toIndex, 0, item);

    if (editLayer === 'SECRET') {
       // Materialize all virtual tags when saving order
       const cleanList = listCopy.map(a => a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a);
       updateSecretField('affiliations', cleanList);
    } else {
       setFormData(prev => ({ ...prev, affiliations: listCopy }));
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const resolveValue = (field: keyof Character, secretField: keyof SecretProfile): string => {
    if (isEditing) {
      if (editLayer === 'SECRET') return (formData.secretProfile?.[secretField] as string) || '';
      return (formData[field] as string) || '';
    } else {
      if (isSecretRevealed) {
         const secretVal = formData.secretProfile?.[secretField] as string | undefined;
         return (secretVal && secretVal.trim() !== '') ? secretVal : ((formData[field] as string) || '');
      }
      return (formData[field] as string) || '';
    }
  };

  // Get current Affiliations list for display/edit
  // Updated Logic: When Viewing OR Editing in Secret Mode, show Combined list.
  const currentAffiliations = useMemo(() => {
    const publicAffs = formData.affiliations || [];
    const secretAffs = formData.secretProfile?.affiliations || [];

    if (editLayer === 'PUBLIC' && isEditing) {
       return publicAffs; // Normal Edit Mode
    }

    if ((editLayer === 'SECRET' && isEditing) || (!isEditing && isSecretRevealed)) {
        // Combined View / Edit
        // Strategy:
        // 1. Secret List defines the base order and content.
        // 2. Public tags NOT present in Secret List (by name) are appended at the end (or implicitly at start if empty).
        // 3. Since users can reorder, we essentially just need: SecretList + (PublicList - SecretList).
        
        const secretMap = new Map(secretAffs.map(a => [a.name, a]));
        const merged = [...secretAffs];
        
        // Append public tags that aren't already overridden/referenced in secret list
        publicAffs.forEach(pa => {
            if (!secretMap.has(pa.name)) {
                // Add as 'virtual' item (ghost)
                // Use a special ID so we know it's virtual
                merged.push({ ...pa, id: `virtual-${pa.id}` }); 
            }
        });
        
        // In View mode, we filter hidden. In Edit mode, we show them (maybe dimmed).
        if (!isEditing) {
           return merged.filter(a => !a.isHidden);
        }
        return merged;
    }
    
    // Default Public View
    return publicAffs;
  }, [formData, isEditing, editLayer, isSecretRevealed]);

  const currentFiles = useMemo(() => {
    if (isEditing) return editLayer === 'SECRET' ? (formData.secretProfile?.extraFiles || []) : formData.extraFiles;
    return isSecretRevealed ? (formData.secretProfile?.extraFiles || []) : formData.extraFiles;
  }, [formData, isEditing, editLayer, isSecretRevealed]);

  const currentComments = useMemo(() => {
    if (isEditing) return editLayer === 'SECRET' ? (formData.secretProfile?.comments || []) : formData.comments;
    return isSecretRevealed ? (formData.secretProfile?.comments || []) : formData.comments;
  }, [formData, isEditing, editLayer, isSecretRevealed]);

  const addExtraFile = () => {
    const newFile: ExtraFile = { id: crypto.randomUUID(), title: editLayer === 'SECRET' ? '새 비밀 항목' : '새 항목', content: '' };
    if (editLayer === 'SECRET') {
       const newFiles = [...(formData.secretProfile?.extraFiles || []), newFile];
       updateSecretField('extraFiles', newFiles);
    } else {
       setFormData(prev => ({ ...prev, extraFiles: [...prev.extraFiles, newFile] }));
    }
  };

  const removeExtraFile = (id: string) => {
    if (editLayer === 'SECRET') {
       const newFiles = (formData.secretProfile?.extraFiles || []).filter(f => f.id !== id);
       updateSecretField('extraFiles', newFiles);
    } else {
       setFormData(prev => ({ ...prev, extraFiles: prev.extraFiles.filter(f => f.id !== id) }));
    }
  };

  const updateExtraFile = (id: string, field: keyof ExtraFile, val: any) => {
    if (editLayer === 'SECRET') {
       const newFiles = (formData.secretProfile?.extraFiles || []).map(f => f.id === id ? { ...f, [field]: val } : f);
       updateSecretField('extraFiles', newFiles);
    } else {
       setFormData(prev => ({ ...prev, extraFiles: prev.extraFiles.map(f => f.id === id ? { ...f, [field]: val } : f) }));
    }
  };

  const handleExtraImageUpload = async (fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      updateExtraFile(fileId, 'imageUrl', base64);
    }
  };

  const togglePortraitOverride = (fileId: string, isChecked: boolean) => {
    if (editLayer === 'SECRET') {
       const newFiles = (formData.secretProfile?.extraFiles || []).map(f => ({ ...f, useAsPortrait: f.id === fileId ? isChecked : false }));
       updateSecretField('extraFiles', newFiles);
    } else {
       setFormData(prev => ({ ...prev, extraFiles: prev.extraFiles.map(f => ({ ...f, useAsPortrait: f.id === fileId ? isChecked : false })) }));
    }
  };

  const toggleSecret = (fileId: string, isSecret: boolean) => updateExtraFile(fileId, 'isSecret', isSecret);
  const revealSecret = (fileId: string) => setRevealedIds(prev => { const next = new Set(prev); next.add(fileId); return next; });

  const submitComment = () => {
    if (!commentText.trim()) return;
    const selectedTime = commentDate ? new Date(commentDate).getTime() : Date.now();
    const newComment: CharacterComment = {
      id: crypto.randomUUID(), characterId: formData.id, userName: commentName || '익명',
      content: commentText, styleVariant: commentStyle, font: commentFont, createdAt: selectedTime
    };
    
    // CRITICAL FIX: If revealed (view or edit), save to secret profile and update character
    if ((isEditing && editLayer === 'SECRET') || (!isEditing && isSecretRevealed)) {
       const newComments = [...(formData.secretProfile?.comments || []), newComment];
       // We must update state AND save to DB immediately if not editing
       if (!isEditing) {
          const updatedChar = {
             ...formData,
             secretProfile: {
                ...(formData.secretProfile || {}),
                comments: newComments
             }
          };
          setFormData(updatedChar);
          onSave(updatedChar); // This saves the whole character including secret json
       } else {
          updateSecretField('comments', newComments);
       }
    } 
    else {
      // Normal Public Comment -> Separate Table
      if (onAddComment) onAddComment(newComment); 
    }
    setCommentText('');
  };

  const confirmDeleteComment = (commentId: string) => {
    if (confirm("이 기록을 삭제하시겠습니까?")) {
      if ((isEditing && editLayer === 'SECRET') || (!isEditing && isSecretRevealed)) {
         const newComments = (formData.secretProfile?.comments || []).filter(c => c.id !== commentId);
         if (!isEditing) {
             const updatedChar = { ...formData, secretProfile: { ...(formData.secretProfile || {}), comments: newComments } };
             setFormData(updatedChar);
             onSave(updatedChar);
         } else {
            updateSecretField('comments', newComments);
         }
      } else {
         if (onDeleteComment) onDeleteComment(commentId, formData.id);
      }
    }
  };

  let displayRole = '';
  if (campaign.system === SystemType.DND5E) displayRole = formData.dndClass || '';
  else if (campaign.system === SystemType.CYBERPUNK_RED) displayRole = formData.cpredRole || '';
  else displayRole = formData.customClass || '';

  const activePortraitFile = useMemo(() => {
    const candidates = currentFiles.filter(f => f.useAsPortrait && f.imageUrl);
    const reversed = [...candidates].reverse();
    return reversed.find(f => !f.isSecret || revealedIds.has(f.id));
  }, [currentFiles, revealedIds]);

  let displayImageUrl = formData.imageUrl;
  if (isEditing) { if (editLayer === 'SECRET') displayImageUrl = formData.secretProfile?.image_url || formData.imageUrl; } 
  else { if (isSecretRevealed && formData.secretProfile?.image_url) displayImageUrl = formData.secretProfile.image_url; }
  if (activePortraitFile) displayImageUrl = activePortraitFile.imageUrl;

  let nameLabel = '이름'; let levelLabel = '레벨 / 경험치'; let levelPlaceholder = '예: Lv.5';
  const aliasLabel = campaign.aliasLabel || '이명/칭호';
  if (campaign.system === SystemType.CYBERPUNK_RED) { nameLabel = '이름 (Name)'; levelLabel = '평판 (Reputation)'; levelPlaceholder = '예: 4'; }
  else if (campaign.system === SystemType.COC7) { levelLabel = '나이 / 경력'; levelPlaceholder = '예: 34세, 고고학 교수'; }
  else if (campaign.system === SystemType.BAND_OF_BLADES) { levelLabel = '등급 / 경험치'; levelPlaceholder = '예: 베테랑, EXP 3'; }

  const hasSecretProfile = formData.secretProfile && Object.keys(formData.secretProfile).length > 0;

  // Logic for Click-to-Unblur
  const handleNameClick = () => {
    if (!isEditing && formData.alias && formData.isNameBlurred && !isNameRevealed && onToggleNameReveal) {
       onToggleNameReveal(formData.id, true);
    }
  };

  const headerName = useMemo(() => {
    if (isEditing) {
      // Edit Mode
      if (editLayer === 'SECRET') {
         // Priority: Secret Alias -> Secret Name -> Default
         if (formData.secretProfile?.alias) return formData.secretProfile.alias;
         return formData.secretProfile?.name || '(비밀 이름 미설정)';
      }
      // Public Edit Mode
      if (formData.alias) return formData.alias;
      return formData.name || '이름 없음';
    } else {
      // View Mode
      if (isSecretRevealed) {
         // Priority: Secret Alias -> Secret Name -> Public Alias -> Public Name
         if (formData.secretProfile?.alias) return formData.secretProfile.alias;
         return formData.secretProfile?.name || formData.alias || formData.name;
      }
      // Public View Mode
      if (formData.alias) return formData.alias;
      return formData.name;
    }
  }, [isEditing, editLayer, isSecretRevealed, formData]);

  const subHeaderName = useMemo(() => {
     if (isEditing) return null;
     
     // Secret View Mode
     if (isSecretRevealed) {
        // If Secret Alias exists, show Secret Name as subtitle
        if (formData.secretProfile?.alias) {
           return <span className="opacity-70 transition-all duration-300 text-amber-500/80">{formData.secretProfile.name || formData.name}</span>;
        }
        return null;
     } 
     
     // Public View Mode
     if (formData.alias) {
        // Apply reveal logic here for Left Column Subheader
        if (formData.isNameBlurred && !isNameRevealed) return <span className="blur-sm select-none opacity-50 transition-all duration-300">{formData.name}</span>;
        return <span className="opacity-70 transition-all duration-300 text-amber-500/80">{formData.name}</span>;
     }
     return null;
  }, [isEditing, isSecretRevealed, formData, isNameRevealed]);
  
  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200 overflow-hidden">
      {/* Container - Stop Propagation to prevent auto close when clicking inside */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-xl shadow-2xl border flex flex-col md:flex-row overflow-hidden transition-colors duration-500 ${tc.bgMain} ${isSecretRevealed ? 'border-amber-600 shadow-amber-900/50' : tc.border} ${tc.font || ''} md:overflow-hidden overflow-y-auto`}
      >
        
        {/* Left Column: Visuals */}
        <div className={`w-full md:w-1/3 p-4 md:p-6 flex flex-col border-r shrink-0 transition-colors duration-500 ${tc.bgPanel} ${tc.border} md:overflow-y-auto`}>
          <div className="flex justify-between md:hidden mb-4">
            <button onClick={onClose} className={tc.textSub}><Icons.Close /></button>
            <div className="flex gap-2">
              {isEditing ? (
                 <button onClick={handleSave} className={tc.textAccent}><Icons.Save /></button>
              ) : (
                 <>
                  <button onClick={() => setIsEditing(true)} className={tc.textSub}><Icons.Edit /></button>
                  <button onClick={() => onDelete(formData.id)} className={`${tc.textSub} hover:text-red-500`}><Icons.Trash /></button>
                 </>
              )}
            </div>
          </div>

          <div className={`relative aspect-square w-full rounded-lg overflow-hidden mb-6 group transition-all duration-300 border-2 shadow-lg ${isSecretRevealed ? 'border-amber-500 shadow-amber-900/40' : tc.border} bg-black/20`}>
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt={formData.name} 
                className={`w-full h-full transition-opacity duration-500 ${formData.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center opacity-30 ${tc.textSub}`}><Icons.User size={80} /></div>
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
                     <span className="text-xs">{editLayer === 'SECRET' ? '비밀(진상) 이미지 변경' : '기본 이미지 변경'}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, editLayer)} />
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
             <div className="min-h-[2.5rem] flex flex-col items-center justify-center mb-2">
               <h2 className={`text-2xl font-black break-keep leading-tight transition-all duration-700 ${isSecretRevealed ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : tc.textMain}`}>
                  <span key={isSecretRevealed || (isEditing && editLayer === 'SECRET') ? 'secret' : 'public'} className="animate-in fade-in slide-in-from-bottom-2 duration-500 block">
                    {headerName}
                  </span>
               </h2>
               {subHeaderName && <div className="text-sm font-serif mt-1">{subHeaderName}</div>}
             </div>
             
             {!isEditing && formData.playerName && (
                <div className="flex items-center justify-center gap-2 mb-3">
                   {(() => {
                      const badgeStyle = MEMBER_COLORS[formData.playerName] || GUEST_COLOR;
                      return <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${badgeStyle}`}><Icons.User size={10} fill="currentColor" />{formData.playerName}</span>;
                   })()}
                </div>
             )}
             
             {!isEditing && hasSecretProfile && (
                <div className="flex justify-center my-4">
                   <button 
                      onClick={handleToggleReveal}
                      disabled={isGlobalReveal}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 shadow-xl ${isGlobalReveal ? 'bg-amber-950/50 text-amber-500/50 border-amber-800/50 cursor-not-allowed' : isSecretRevealed ? 'bg-amber-950 text-amber-500 border-amber-600 shadow-amber-900/40' : 'bg-black/40 text-stone-500 border-stone-800 hover:text-stone-300'}`}
                   >
                      {isSecretRevealed ? <Icons.Lock size={16} className={isGlobalReveal ? "text-amber-500/50" : "text-amber-500"} /> : <Icons.Lock size={16} />}
                      <span className="text-xs font-bold tracking-widest">{isGlobalReveal ? 'GLOBAL REVEAL ACTIVE' : (isSecretRevealed ? 'TRUTH REVEALED' : 'REVEAL TRUTH')}</span>
                   </button>
                </div>
             )}

             <div className="flex items-center justify-center gap-2 mb-4 mt-2">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${formData.isNpc ? 'bg-amber-700 text-amber-100' : 'bg-emerald-700 text-emerald-100'}`}>
                   {formData.isNpc ? 'NPC' : 'PC'}
                </span>
                <span className={`text-sm font-medium ${tc.textSub}`}>
                   {displayRole}
                </span>
                {(formData.levelOrExp || (isSecretRevealed && formData.secretProfile?.levelOrExp)) && (
                  <span className={`text-xs border px-1.5 py-0.5 rounded opacity-70 ${tc.border} ${tc.textSub}`}>
                    {resolveValue('levelOrExp', 'levelOrExp')}
                  </span>
                )}
             </div>
             
             {isEditing ? (
               <input 
                 className={`w-full bg-transparent border-b text-center text-sm pb-2 focus:border-opacity-100 outline-none ${editLayer === 'SECRET' ? 'border-amber-600 text-amber-400 placeholder:text-amber-900' : `${tc.textSub} ${tc.border}`}`}
                 placeholder={editLayer === 'SECRET' ? "비밀(진상) 요약" : "한 줄 요약 입력"}
                 value={editLayer === 'SECRET' ? (formData.secretProfile?.summary || '') : formData.summary}
                 onChange={e => {
                    const val = e.target.value;
                    if(editLayer === 'SECRET') updateSecretField('summary', val);
                    else setFormData(p => ({...p, summary: val}));
                 }}
               />
             ) : (
               <p className={`text-sm italic opacity-80 ${isSecretRevealed ? 'text-amber-400' : tc.textSub}`}>
                 "{resolveValue('summary', 'summary')}"
               </p>
             )}
          </div>
        </div>

        {/* Right Column */}
        <div className={`flex-1 flex flex-col relative bg-transparent md:h-full h-auto`}>
          <div className={`sticky top-0 z-20 flex flex-col md:flex-row justify-between items-stretch md:items-center p-2 md:p-4 border-b ${tc.bgPanel} ${tc.border} shadow-lg md:shadow-none`}>
             <div className="flex gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
               <button onClick={() => setActiveTab('INFO')} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg md:rounded-t-lg transition-colors flex-shrink-0 ${activeTab === 'INFO' ? tc.textMain + ' bg-white/10 md:bg-white/5 md:border-b-2 ' + tc.border : tc.textSub + ' hover:text-white'}`}>기본 정보</button>
               <button onClick={() => setActiveTab('BIO')} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg md:rounded-t-lg transition-colors flex-shrink-0 ${activeTab === 'BIO' ? tc.textMain + ' bg-white/10 md:bg-white/5 md:border-b-2 ' + tc.border : tc.textSub + ' hover:text-white'}`}>프로필/서사</button>
               <button onClick={() => setActiveTab('FILES')} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg md:rounded-t-lg transition-colors flex-shrink-0 ${activeTab === 'FILES' ? tc.textMain + ' bg-white/10 md:bg-white/5 md:border-b-2 ' + tc.border : tc.textSub + ' hover:text-white'} flex items-center gap-2`}>추가 파일{currentFiles.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${tc.textMain} bg-white/10`}>{currentFiles.length}</span>}</button>
               <button onClick={() => setActiveTab('COMMENTS')} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg md:rounded-t-lg transition-colors flex-shrink-0 ${activeTab === 'COMMENTS' ? tc.textMain + ' bg-white/10 md:bg-white/5 md:border-b-2 ' + tc.border : tc.textSub + ' hover:text-white'} flex items-center gap-2`}>면담/기록{currentComments.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${tc.textMain} bg-white/10`}>{currentComments.length}</span>}</button>
             </div>
             
             {isEditing && (
                <div className="flex items-center justify-end bg-black/40 rounded-lg p-1 mt-2 md:mt-0 md:mr-4 border border-stone-700 w-full md:w-auto">
                   <button onClick={() => setEditLayer('PUBLIC')} className={`flex-1 md:flex-none text-center px-3 py-1 text-xs font-bold rounded transition-colors ${editLayer === 'PUBLIC' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}>공개 정보</button>
                   <button onClick={() => setEditLayer('SECRET')} className={`flex-1 md:flex-none text-center px-3 py-1 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 ${editLayer === 'SECRET' ? 'bg-amber-800 text-amber-100' : 'text-stone-500 hover:text-amber-500'}`}><Icons.Lock size={10} /> 비밀 정보</button>
                </div>
             )}

             <div className="hidden md:flex items-center gap-2">
               {isEditing ? (
                 <><button onClick={handleSave} className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-transform active:scale-95 ${tc.buttonPrimary}`}><Icons.Save size={16}/> 저장</button></>
               ) : (
                 <><button onClick={() => setIsEditing(true)} className={`p-2 rounded hover:bg-white/10 ${tc.buttonSecondary}`}><Icons.Edit size={18} /></button><button onClick={() => onDelete(formData.id)} className={`p-2 rounded hover:bg-white/10 ${tc.buttonSecondary} hover:text-red-500`}><Icons.Trash size={18} /></button></>
               )}
               <button onClick={onClose} className={`p-2 rounded ml-2 hover:bg-white/10 ${tc.buttonSecondary}`}><Icons.Close size={20} /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative md:h-full min-h-[50vh]">
            {(isSecretRevealed || (isEditing && editLayer === 'SECRET')) && (
               <div className="absolute top-0 left-0 w-full h-1 bg-amber-600 shadow-[0_0_10px_#d97706] z-10" />
            )}

            {activeTab === 'INFO' && (
              <div className="space-y-6 max-w-2xl animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                 
                 {/* Identity Section */}
                 <div className={`p-4 rounded-lg border bg-black/10 ${tc.border}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${tc.border} ${isEditing && editLayer === 'SECRET' ? 'text-amber-500' : tc.textMain}`}>
                       신원 정보 (Identity)
                    </h3>

                    {isEditing ? (
                       <div className="space-y-4">
                          {editLayer === 'PUBLIC' ? (
                             <>
                               {/* Public Alias Toggle */}
                               <div className="flex items-center gap-2 mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                     <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showAliasInput ? 'bg-amber-600' : 'bg-stone-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showAliasInput ? 'translate-x-4' : 'translate-x-0'}`} />
                                     </div>
                                     <input type="checkbox" checked={showAliasInput} onChange={(e) => setShowAliasInput(e.target.checked)} className="hidden" />
                                     <span className={`text-xs font-bold ${showAliasInput ? 'text-amber-400' : 'text-stone-500'}`}>이명 사용</span>
                                  </label>
                               </div>

                               {showAliasInput && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                     <EditableField label={aliasLabel} value={formData.alias} onChange={(v) => setFormData(p => ({...p, alias: v}))} isEditing={true} placeholder={aliasLabel} themeClasses={tc} />
                                     <div className="mb-2">
                                       <label className="flex items-center gap-2 cursor-pointer w-fit p-1 hover:bg-white/5 rounded">
                                          <input type="checkbox" checked={formData.isNameBlurred || false} onChange={(e) => setFormData(p => ({...p, isNameBlurred: e.target.checked}))} className="w-3 h-3 text-amber-500" />
                                          <span className="text-[10px] text-stone-400">이명 사용 시 본명 가리기 (블러 처리)</span>
                                       </label>
                                     </div>
                                  </div>
                               )}
                               
                               <EditableField 
                                  label="이름 (Name)" 
                                  value={formData.name} 
                                  onChange={(v) => setFormData(p => ({...p, name: v}))} 
                                  isEditing={true} 
                                  placeholder="이름" 
                                  themeClasses={tc} 
                               />
                             </>
                          ) : (
                             // Secret Identity Editing
                             <>
                               {/* Secret Alias Toggle */}
                               <div className="flex items-center gap-2 mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                     <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showSecretAliasInput ? 'bg-amber-600' : 'bg-stone-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showSecretAliasInput ? 'translate-x-4' : 'translate-x-0'}`} />
                                     </div>
                                     <input type="checkbox" checked={showSecretAliasInput} onChange={(e) => setShowSecretAliasInput(e.target.checked)} className="hidden" />
                                     <span className={`text-xs font-bold ${showSecretAliasInput ? 'text-amber-400' : 'text-stone-500'}`}>이명 사용</span>
                                  </label>
                               </div>

                               {showSecretAliasInput && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                     <EditableField 
                                        label={`${aliasLabel} (비밀)`}
                                        value={formData.secretProfile?.alias} 
                                        onChange={(v) => updateSecretField('alias', v)} 
                                        isEditing={true} 
                                        placeholder="비밀 이명/핸들" 
                                        themeClasses={tc} 
                                        highlight={true}
                                     />
                                  </div>
                               )}

                               <EditableField 
                                  label="이름 (Secret Name)" 
                                  value={formData.secretProfile?.name} 
                                  onChange={(v) => updateSecretField('name', v)} 
                                  isEditing={true} 
                                  placeholder="비밀 이름" 
                                  themeClasses={tc} 
                                  highlight={true} 
                               />
                             </>
                          )}
                       </div>
                    ) : (
                       // View Mode
                       <div className="space-y-4">
                          {isSecretRevealed ? (
                             // Truth View
                             <>
                                {formData.secretProfile?.alias && (
                                   <div className="mb-4 group">
                                      <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${tc.textSub} text-amber-500`}>{aliasLabel}</label>
                                      <div className={`text-lg font-serif font-bold ${tc.textAccent}`}>{formData.secretProfile.alias}</div>
                                   </div>
                                )}
                                <EditableField 
                                   label={formData.secretProfile?.alias ? "이름 (Secret Name)" : nameLabel}
                                   value={resolveValue('name', 'name')} 
                                   onChange={() => {}} 
                                   isEditing={false} 
                                   themeClasses={tc} 
                                   highlight={true} 
                                />
                             </>
                          ) : (
                             // Public View
                             <>
                                {formData.alias && (
                                   <div className="mb-4 group">
                                      <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${tc.textSub}`}>{aliasLabel}</label>
                                      <div className={`text-lg font-serif font-bold ${tc.textAccent}`}>{formData.alias}</div>
                                   </div>
                                )}
                                
                                <div className="mb-4 group">
                                   <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${tc.textSub}`}>{formData.alias ? '이름 (Name)' : nameLabel}</label>
                                   <div 
                                      onClick={handleNameClick}
                                      className={`text-sm md:text-base p-2 rounded min-h-[2rem] transition-all duration-300 ${tc.textMain} ${formData.alias && formData.isNameBlurred && !isNameRevealed ? 'blur-sm select-none cursor-pointer hover:bg-white/5' : ''}`}
                                      title={formData.alias && formData.isNameBlurred && !isNameRevealed ? "클릭하여 확인 (일시적 해제)" : ""}
                                   >
                                      {formData.name}
                                   </div>
                                </div>
                             </>
                          )}
                       </div>
                    )}
                 </div>

                 {/* Other Info Fields */}
                 <div className="mb-4">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isEditing ? tc.textAccent : tc.textSub}`}>플레이어 (Player)</label>
                    {isEditing ? (
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => { setIsGuestPlayer(false); setFormData(p => ({...p, playerName: CORE_MEMBERS[0]})); }} className={`px-3 py-1 text-xs rounded-full border transition-colors ${!isGuestPlayer ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>고정 멤버</button>
                             <button onClick={() => { setIsGuestPlayer(true); setFormData(p => ({...p, playerName: ''})); }} className={`px-3 py-1 text-xs rounded-full border transition-colors ${isGuestPlayer ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>게스트 (직접 입력)</button>
                         </div>
                         {!isGuestPlayer ? (
                           <select value={formData.playerName || CORE_MEMBERS[0]} onChange={(e) => setFormData(p => ({...p, playerName: e.target.value}))} className={`w-full bg-black/20 border ${tc.border} rounded p-2 focus:border-opacity-100 focus:outline-none ${tc.textMain}`}>{CORE_MEMBERS.map(member => (<option key={member} value={member} className="bg-slate-800 text-slate-200">{member}</option>))}</select>
                         ) : (
                           <input type="text" value={formData.playerName || ''} onChange={(e) => setFormData(p => ({...p, playerName: e.target.value}))} className={`w-full bg-black/20 border ${tc.border} rounded p-2 focus:border-opacity-100 focus:outline-none placeholder:opacity-30 ${tc.textMain}`} placeholder="게스트 이름 입력"/>
                         )}
                       </div>
                    ) : ( <div className={`text-sm md:text-base p-2 rounded min-h-[2rem] whitespace-pre-wrap ${tc.textMain}`}>{formData.playerName || '-'}</div> )}
                 </div>
                 
                 <EditableField label="유형" value={formData.isNpc} onChange={(v) => setFormData(p => ({...p, isNpc: v}))} type="toggle" isEditing={isEditing} themeClasses={tc} />
                 
                 {/* Level & Affiliations Block */}
                 <div className="space-y-4">
                    <EditableField label={levelLabel} value={resolveValue('levelOrExp', 'levelOrExp')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('levelOrExp', v) : setFormData(p => ({...p, levelOrExp: v}))} placeholder={levelPlaceholder} isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'}/>
                    
                    {/* Affiliations UI */}
                    <div className="mb-4">
                       <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isEditing && editLayer === 'SECRET' ? 'text-amber-500' : tc.textSub}`}>
                          소속/태그 (Affiliation/Tag) {isEditing && editLayer === 'SECRET' && <span className="text-[10px] bg-amber-900/50 px-1 rounded ml-1">Secret</span>}
                       </label>
                       
                       {isEditing ? (
                          <div className="space-y-2">
                             {/* List of existing in current layer */}
                             <div className="flex flex-wrap gap-2 mb-2">
                                {currentAffiliations.map((aff, index) => {
                                   // Logic to distinguish style in Edit Mode (mainly for Secret Layer)
                                   // Check if this tag exists in the public list (by name)
                                   const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                                   // Apply Secret style ONLY if it is NOT a public reference (purely secret) AND we are in secret edit mode
                                   const isSecretStyle = !isPublicRef && editLayer === 'SECRET';
                                   
                                   return (
                                   <div 
                                      key={aff.id} 
                                      draggable 
                                      onDragStart={() => handleDragStart(index)}
                                      onDragEnter={() => handleDragEnter(index)}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={(e) => e.preventDefault()}
                                      className={`flex items-center gap-2 bg-black/30 border rounded px-2 py-1 text-sm cursor-move transition-all ${draggingIndex === index ? 'opacity-50 scale-95 border-amber-500' : ''} ${isSecretStyle ? 'border-amber-600/50 text-amber-100' : 'border-stone-600'} ${aff.isStrikethrough ? 'line-through opacity-60 text-stone-500' : ''} ${aff.isHidden ? 'opacity-40 border-dashed' : ''}`}
                                   >
                                      <span>{aff.name} {aff.rank && <span className="text-xs opacity-60">| {aff.rank}</span>}</span>
                                      <div className="flex items-center gap-1 ml-1 border-l border-stone-600 pl-1">
                                         {editLayer === 'SECRET' && (
                                            <button onClick={() => toggleAffiliationHidden(index, aff)} className={`hover:text-stone-300 p-0.5 rounded ${aff.isHidden ? 'text-stone-400' : 'text-stone-600'}`} title={aff.isHidden ? "숨김 해제" : "비밀 모드에서 숨김"}>
                                               {aff.isHidden ? <Icons.EyeOff size={12} /> : <Icons.Eye size={12} />}
                                            </button>
                                         )}
                                         <button onClick={() => toggleAffiliationStrikethrough(index, aff)} className={`hover:text-amber-500 p-0.5 rounded ${aff.isStrikethrough ? 'text-amber-600' : 'text-stone-500'}`} title="취소선 토글"><Icons.Strikethrough size={12} /></button>
                                         <button onClick={() => removeAffiliation(index, aff)} className="hover:text-red-500 p-0.5 rounded text-stone-500" title="삭제"><Icons.Close size={14} /></button>
                                      </div>
                                   </div>
                                   );
                                })}
                             </div>
                             
                             {/* Add New Input */}
                             <div className={`p-3 bg-black/20 rounded border ${editLayer === 'SECRET' ? 'border-amber-900/30' : 'border-stone-700/50'}`}>
                                <div className="flex gap-2 mb-2">
                                   <input 
                                      className={`flex-1 bg-transparent border-b text-sm py-1 focus:outline-none focus:border-opacity-100 placeholder:opacity-30 ${editLayer === 'SECRET' ? 'border-amber-600 text-amber-400 placeholder:text-amber-900/50 focus:border-amber-500' : `${tc.border} ${tc.textMain}`}`}
                                      placeholder="소속/태그 명칭 입력"
                                      value={newAffiliationName}
                                      onChange={(e) => setNewAffiliationName(e.target.value)}
                                   />
                                   <button onClick={addAffiliation} className={`px-3 py-1 rounded text-xs font-bold ${tc.buttonPrimary}`}>추가</button>
                                </div>
                                <div className="flex items-center gap-4">
                                   <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={hasRank} onChange={(e) => setHasRank(e.target.checked)} className="w-3 h-3 rounded text-amber-600 focus:ring-0" />
                                      <span className="text-xs text-stone-400">세부 설정</span>
                                   </label>
                                   {hasRank && (
                                      <input 
                                         className={`flex-1 bg-transparent border-b text-xs py-1 focus:outline-none focus:border-opacity-100 placeholder:opacity-30 animate-in fade-in slide-in-from-left-2 ${editLayer === 'SECRET' ? 'border-amber-600 text-amber-400 placeholder:text-amber-900/50 focus:border-amber-500' : `${tc.border} ${tc.textMain}`}`}
                                         placeholder="하위종/직위/계급 등 입력"
                                         value={newAffiliationRank}
                                         onChange={(e) => setNewAffiliationRank(e.target.value)}
                                      />
                                   )}
                                </div>
                             </div>
                          </div>
                       ) : (
                          <div className="flex flex-wrap gap-2 min-h-[2rem] items-center">
                             {currentAffiliations.length > 0 ? (
                                currentAffiliations.map(aff => {
                                   // Logic to distinguish style in View Mode
                                   // If it's a public tag (name matches public list), keep public style.
                                   // Only strictly secret tags (not present in public) get secret style.
                                   const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                                   const isSecretStyle = (!isPublicRef && (isSecretRevealed || editLayer === 'SECRET'));

                                   return (
                                   <span key={aff.id} className={`px-3 py-1 rounded-full text-xs font-medium border shadow-sm flex items-center gap-1 transition-all ${aff.isStrikethrough ? 'line-through opacity-50 decoration-2 decoration-red-500/50' : ''} ${isSecretStyle ? 'bg-amber-900/30 text-amber-100 border-amber-600/40' : `${tc.bgPanel} ${tc.border} ${tc.textMain}`}`}>
                                      {aff.name}
                                      {aff.rank && <span className="opacity-70 font-light ml-1">{aff.rank}</span>}
                                   </span>
                                   );
                                })
                             ) : (
                                <span className="text-sm opacity-30">-</span>
                             )}
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <EditableField label="나이" value={resolveValue('age', 'age')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('age', v) : setFormData(p => ({...p, age: v}))} placeholder="예: 25세" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
                   <EditableField label="성별" value={resolveValue('gender', 'gender')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('gender', v) : setFormData(p => ({...p, gender: v}))} placeholder="예: 남성" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
                   <EditableField label="신장" value={resolveValue('height', 'height')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('height', v) : setFormData(p => ({...p, height: v}))} placeholder="예: 175cm" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
                   <EditableField label="체중" value={resolveValue('weight', 'weight')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('weight', v) : setFormData(p => ({...p, weight: v}))} placeholder="예: 70kg" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
                 </div>
                 <EditableField label="외모 묘사" value={resolveValue('appearance', 'appearance')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('appearance', v) : setFormData(p => ({...p, appearance: v}))} placeholder="특징" type="textarea" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
                 <hr className={`my-4 border-dashed opacity-50 ${tc.border}`} />
                 {campaign.system === SystemType.DND5E && <><EditableField label="클래스" value={formData.dndClass} onChange={(v) => setFormData(p => ({...p, dndClass: v}))} type="select" options={DND_CLASSES} isEditing={isEditing} themeClasses={tc} /><EditableField label="서브클래스" value={formData.dndSubclass} onChange={(v) => setFormData(p => ({...p, dndSubclass: v}))} placeholder="서브클래스" isEditing={isEditing} themeClasses={tc} /></>}
              </div>
            )}
            
            {activeTab === 'BIO' && (
               <div className="h-full flex flex-col animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                  <EditableField label="상세 서사 / 메모" value={resolveValue('description', 'description')} onChange={(v) => editLayer === 'SECRET' ? updateSecretField('description', v) : setFormData(p => ({...p, description: v}))} type="textarea" placeholder="상세 내용" isEditing={isEditing} themeClasses={tc} highlight={isEditing && editLayer === 'SECRET'} />
               </div>
            )}

            {activeTab === 'FILES' && (
               <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                  {isEditing && (
                    <button onClick={addExtraFile} className={`w-full py-3 border border-dashed rounded flex items-center justify-center gap-2 transition-colors ${tc.border} ${tc.textSub} hover:bg-white/5`}>
                      <Icons.Plus size={16} /> 항목 추가 ({editLayer === 'SECRET' ? '비밀' : '공개'})
                    </button>
                  )}
                  {currentFiles.length === 0 && !isEditing && <div className={`text-center py-8 opacity-50 ${tc.textSub}`}>추가 파일이 없습니다.</div>}
                  {currentFiles.map((file) => {
                    const isMasked = !isEditing && file.isSecret && !revealedIds.has(file.id);
                    return (
                      <div key={file.id} className={`border rounded-lg p-4 overflow-hidden transition-all duration-300 ${tc.bgPanel} ${file.useAsPortrait ? 'border-yellow-500/50 shadow-md' : tc.border}`}>
                        <div className="flex justify-between items-start mb-4">
                            {isEditing ? (
                              <div className="flex-1 mr-4 space-y-2">
                                <input value={file.title} onChange={e => updateExtraFile(file.id, 'title', e.target.value)} className={`w-full bg-transparent border-b focus:border-opacity-100 font-bold outline-none pb-1 ${tc.textMain} ${tc.border}`} placeholder="제목" />
                                <div className="flex flex-wrap gap-4 pt-1">
                                  {editLayer === 'PUBLIC' && (<label className="flex items-center gap-2 cursor-pointer group w-fit"><input type="checkbox" checked={!!file.isSecret} onChange={(e) => toggleSecret(file.id, e.target.checked)} className="w-4 h-4" /><span className={`text-xs ${file.isSecret ? 'text-red-400 font-bold' : tc.textSub}`}>비밀글 (목록 숨김)</span></label>)}
                                  {file.imageUrl && <label className="flex items-center gap-2 cursor-pointer group w-fit"><input type="checkbox" checked={!!file.useAsPortrait} onChange={(e) => togglePortraitOverride(file.id, e.target.checked)} className="w-4 h-4" /><span className={`text-xs ${file.useAsPortrait ? 'text-yellow-400 font-bold' : tc.textSub}`}>포트레잇 사용</span></label>}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col"><h4 className={`font-bold flex items-center gap-2 text-lg ${file.isSecret ? 'text-red-400' : 'text-yellow-500/80'}`}>{file.isSecret ? <Icons.Lock size={18}/> : <Icons.Folder size={18}/>} {file.title}</h4></div>
                            )}
                            {isEditing && <div className="flex items-center gap-2"><button onClick={() => removeExtraFile(file.id)} className="text-red-500 hover:text-red-400 p-1 rounded"><Icons.Trash size={18} /></button></div>}
                        </div>
                        {isMasked ? (
                          <div className={`relative h-40 rounded-lg flex flex-col items-center justify-center border border-dashed ${tc.border} bg-black/10`}><div className="z-10 flex flex-col items-center"><Icons.Lock size={32} className={`mb-2 opacity-50 ${tc.textSub}`} /><p className={`text-sm mb-3 opacity-70 ${tc.textSub}`}>비밀 내용</p><button onClick={() => revealSecret(file.id)} className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-red-100 rounded-lg text-sm font-bold shadow-lg transition-colors">열기</button></div></div>
                        ) : (
                          <div className={`transition-opacity duration-500 ${isEditing || revealedIds.has(file.id) ? 'opacity-100' : 'opacity-100'}`}>
                            {file.imageUrl && <div className={`relative mb-4 group rounded-lg overflow-hidden border aspect-square max-w-[400px] mx-auto bg-black/40 ${tc.border}`}><img src={file.imageUrl} className="w-full h-full object-cover" />{isEditing && <div className="absolute top-2 right-2 flex gap-2"><button onClick={() => {updateExtraFile(file.id, 'imageUrl', ''); updateExtraFile(file.id, 'useAsPortrait', false);}} className="bg-black/70 hover:bg-red-600 text-white p-1.5 rounded"><Icons.Close size={14} /></button></div>}</div>}
                            {isEditing && !file.imageUrl && <div className="mb-4"><label className={`flex items-center gap-2 text-sm cursor-pointer w-fit transition-colors p-2 rounded hover:bg-white/5 ${tc.textSub}`}><Icons.Image size={16} /><span>이미지 첨부</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleExtraImageUpload(file.id, e)} /></label></div>}
                            {isEditing ? <textarea value={file.content} onChange={e => updateExtraFile(file.id, 'content', e.target.value)} className={`w-full h-32 bg-black/20 border rounded p-2 text-sm resize-y focus:outline-none ${tc.textMain} ${tc.border}`} placeholder="내용 입력..." /> : <p className={`text-sm whitespace-pre-wrap leading-relaxed opacity-90 ${tc.textMain}`}>{file.content}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            )}

            {activeTab === 'COMMENTS' && (
              <div className="h-full flex flex-col relative animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
                <div className="flex-1 space-y-4 pb-4 overflow-y-auto max-h-[500px] md:max-h-none p-2 custom-scrollbar">
                   {currentComments && currentComments.length > 0 ? (
                     <div className="flex flex-wrap gap-4 items-start content-start justify-center md:justify-start">
                        {currentComments.map((comment) => {
                          let noteStyle = "bg-[#fef9c3] text-stone-800 -rotate-1 border-b-2 border-r-2 border-[#fcd34d] shadow-lg"; 
                          let fontClass = "font-hand"; 
                          if (comment.font === 'SERIF') fontClass = "font-serif"; else if (comment.font === 'MONO') fontClass = "font-mono"; else if (comment.font === 'SANS') fontClass = "font-sans"; else if (comment.font === 'BOLD') fontClass = "font-bold-display";
                          if (comment.styleVariant === 'STAMP') noteStyle = "border-4 border-red-900/60 text-red-900 rotate-2 bg-red-50/10 backdrop-blur-sm p-4 rounded-lg uppercase tracking-widest shadow-none font-black mix-blend-normal";
                          if (comment.styleVariant === 'WARNING') noteStyle = "bg-stone-900 text-amber-500 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-bold tracking-tight rounded-md";
                          if (comment.styleVariant === 'MEMO') noteStyle = "bg-slate-50 text-slate-800 border border-slate-300 shadow rotate-0 rounded-sm";

                          return (
                            <div key={comment.id} className={`relative p-4 w-full md:w-64 min-h-[140px] transition-all hover:scale-105 hover:z-20 group cursor-default flex flex-col ${noteStyle} ${fontClass}`}>
                              <div className="text-xs font-bold opacity-60 mb-2 flex justify-between items-center border-b border-current pb-1 font-sans">
                                <span>{comment.userName}</span>
                                {(!isEditing || editLayer === 'PUBLIC') && (<button onClick={(e) => { e.stopPropagation(); confirmDeleteComment(comment.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 hover:bg-red-600 hover:text-white rounded-full p-1" title="삭제"><Icons.Close size={12}/></button>)}
                                {(isEditing && editLayer === 'SECRET') && (<button onClick={(e) => { e.stopPropagation(); confirmDeleteComment(comment.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 hover:bg-red-600 hover:text-white rounded-full p-1" title="비밀 기록 삭제"><Icons.Close size={12}/></button>)}
                              </div>
                              <p className="whitespace-pre-wrap text-base leading-snug flex-1">{comment.content}</p>
                              <div className="text-[10px] opacity-40 text-right mt-2 font-mono">{new Date(comment.createdAt).toLocaleDateString()}</div>
                              {comment.styleVariant === 'STAMP' && (<div className="absolute inset-0 border-4 border-current opacity-10 rounded-lg pointer-events-none" />)}
                            </div>
                          )
                        })}
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-12 opacity-40 border-2 border-dashed rounded-lg bg-black/5" style={{borderColor: 'currentColor'}}>
                        <Icons.File className="mb-2 w-12 h-12" />
                        <span className="text-lg">기록된 특이사항 없음</span>
                        <span className="text-xs mt-1">NO RECORDS FOUND</span>
                     </div>
                   )}
                </div>

                <div className={`p-4 border-t-2 border-dashed ${tc.border} bg-black/10 mt-auto rounded-b-xl`}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <input value={commentName} onChange={e => setCommentName(e.target.value)} className={`bg-transparent border-b ${tc.border} ${tc.textMain} text-sm px-2 py-1 w-24 focus:outline-none focus:border-opacity-100 font-bold`} placeholder="작성자"/>
                    <input type="date" value={commentDate} onChange={e => setCommentDate(e.target.value)} className={`bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white cursor-pointer`} title="날짜 선택"/>
                    <select value={commentStyle} onChange={e => setCommentStyle(e.target.value as any)} className={`text-xs bg-black/30 border border-white/10 rounded px-2 py-1 ${tc.textSub} cursor-pointer`}><option value="NOTE">📒 메모지</option><option value="STAMP">💮 도장</option><option value="WARNING">⚠️ 경고</option><option value="MEMO">📄 공문</option></select>
                     <select value={commentFont} onChange={e => setCommentFont(e.target.value)} className={`text-xs bg-black/30 border border-white/10 rounded px-2 py-1 ${tc.textSub} cursor-pointer`}><option value="HAND">✍️ 손글씨</option><option value="SANS">🅰️ 고딕(기본)</option><option value="SERIF">✒️ 명조(진지)</option><option value="MONO">💻 코딩(기계)</option><option value="BOLD">📢 도현(강조)</option></select>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className={`flex-1 h-20 md:h-24 bg-black/20 border ${tc.border} rounded p-3 text-base ${tc.textMain} resize-none focus:border-opacity-100 focus:outline-none placeholder:opacity-40`} placeholder={editLayer === 'SECRET' ? "비밀 기록 사항 입력..." : "기록 사항 입력..."}/>
                    <button onClick={submitComment} className={`px-6 py-2 md:py-0 font-bold text-sm uppercase tracking-wider rounded transition-transform active:scale-95 flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 shadow-lg ${tc.buttonPrimary}`}><Icons.Save className="mb-0 md:mb-1" size={20} />등록</button>
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
