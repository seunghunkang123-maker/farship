
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Character, Campaign, DND_CLASSES, CPRED_ROLES, BOB_PLAYBOOKS, ExtraFile, SystemType, CharacterComment, CORE_MEMBERS, SecretProfile, CharacterAffiliation, CombatStat } from '../../types';
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

const RadarChart: React.FC<{ stats: CombatStat[], themeColor: string }> = ({ stats, themeColor }) => {
  const size = 220;
  const center = size / 2;
  const radius = center * 0.65;
  const sides = 6;
  const levels = 5;

  const getPoint = (i: number, val: number, max: number) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const r = (radius * val) / max;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const gridLines = [];
  for (let l = 1; l <= levels; l++) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const [x, y] = getPoint(i, l, levels);
      pts.push(`${x},${y}`);
    }
    gridLines.push(
      <polygon 
        key={l} 
        points={pts.join(' ')} 
        fill="none" 
        stroke="rgba(255,255,255,0.15)" 
        strokeWidth={l === levels ? "2" : "0.5"} 
      />
    );
  }

  const dataPoints = stats.map((s, i) => getPoint(i, s.value, levels));
  const dataPath = dataPoints.map(p => p.join(',')).join(' ');

  const labelPoints = stats.map((s, i) => {
    const [x, y] = getPoint(i, levels + 1.2, levels);
    return { x, y, name: s.name };
  });

  const brightChartColor = "#fbbf24"; 

  return (
    <div className="relative flex justify-center py-6">
      <svg width="0" height="0">
        <filter id="hyperglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </svg>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {gridLines}
        {stats.map((_, i) => {
          const [x, y] = getPoint(i, levels, levels);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
        })}
        
        <polygon 
          points={dataPath} 
          fill={`${brightChartColor}44`} 
          stroke={brightChartColor} 
          strokeWidth="4" 
          filter="url(#hyperglow)"
          className="transition-all duration-700 ease-out"
        />
        
        {dataPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="6" fill={brightChartColor} className="opacity-20 animate-pulse" />
            <circle cx={p[0]} cy={p[1]} r="3" fill={brightChartColor} />
            <circle cx={p[0]} cy={p[1]} r="1.5" fill="white" />
          </g>
        ))}
        
        {labelPoints.map((p, i) => (
          <text 
            key={i} 
            x={p.x} 
            y={p.y} 
            textAnchor="middle" 
            fill="white" 
            fontSize="11" 
            fontWeight="900" 
            dominantBaseline="middle" 
            className="opacity-80 uppercase tracking-widest font-black"
          >
            {p.name}
          </text>
        ))}
      </svg>
    </div>
  );
};

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
             <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${themeClasses.textSub}`}>{label}</label>
             <div onClick={() => setIsRevealed(true)} className={`text-sm md:text-base p-2.5 rounded-lg min-h-[2.5rem] cursor-pointer transition-colors flex items-center gap-2 border border-dashed ${themeClasses.bgPanel} ${themeClasses.border} ${themeClasses.textSub} hover:opacity-80`}>
                <Icons.Lock size={14} /><span className="tracking-widest">************</span><span className="text-[10px] ml-auto font-mono opacity-50">(ACCESS RESTRICTED)</span>
             </div>
           </div>
         );
    }
    return (
      <div className="mb-4 group">
        <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${themeClasses.textSub}`}>{label}</label>
        <div className={`text-sm md:text-base p-2.5 rounded-lg min-h-[2rem] whitespace-pre-wrap ${displayClass}`}>
          {type === 'select' ? options.find((o) => o.value === value)?.label || value : displayValue}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${highlight ? 'text-amber-500' : themeClasses.textAccent}`}>
        {label} {highlight && <span className="text-[9px] bg-amber-900/50 px-1 rounded ml-1 tracking-normal">SECURE</span>}
      </label>
      {type === 'text' && <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/40 border ${highlight ? 'border-amber-700 focus:border-amber-500' : themeClasses.border} rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none placeholder:opacity-20 text-sm ${themeClasses.textMain}`} placeholder={placeholder}/>}
      {type === 'textarea' && <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full h-32 bg-black/40 border ${highlight ? 'border-amber-700 focus:border-amber-500' : themeClasses.border} rounded-lg p-3 focus:border-opacity-100 focus:outline-none resize-none placeholder:opacity-20 text-sm leading-relaxed ${themeClasses.textMain}`} placeholder={placeholder}/>}
      {type === 'select' && <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/40 border ${themeClasses.border} rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none text-sm ${themeClasses.textMain}`}>{options.map((opt) => <option key={opt.value} value={opt.value} className="bg-stone-900 text-stone-200">{opt.label}</option>)}</select>}
      {type === 'toggle' && <div className="flex gap-2 p-1 bg-black/20 rounded-lg w-fit"><button onClick={() => onChange(false)} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${!value ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500'}`}>PC</button><button onClick={() => onChange(true)} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${value ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-500'}`}>NPC</button></div>}
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
  isGlobalReveal?: boolean;
  isRevealed?: boolean;
  onToggleReveal?: (id: string, state: boolean) => void;
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
  
  const [editLayer, setEditLayer] = useState<'PUBLIC' | 'SECRET'>('PUBLIC');
  const isSecretRevealed = isGlobalReveal || isRevealed;

  const [showAliasInput, setShowAliasInput] = useState(false);
  const [showSecretAliasInput, setShowSecretAliasInput] = useState(false);

  const [newAffiliationName, setNewAffiliationName] = useState('');
  const [newAffiliationRank, setNewAffiliationRank] = useState('');
  const [hasRank, setHasRank] = useState(false);
  
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [commentName, setCommentName] = useState('관찰자');
  const [commentText, setCommentText] = useState('');
  const [commentStyle, setCommentStyle] = useState<'NOTE'|'STAMP'|'WARNING'|'MEMO'>('NOTE');
  const [commentFont, setCommentFont] = useState<string>('HAND');
  const [commentDate, setCommentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isGuestPlayer, setIsGuestPlayer] = useState(false);

  const currentThemeKey = campaign.theme || THEME_KEYS.ADVENTURE;
  const theme = THEMES[currentThemeKey] || THEMES[THEME_KEYS.ADVENTURE];
  const tc = theme.classes;

  const [formData, setFormData] = useState<Character>({
    id: '', campaignId: campaign.id, name: '', realName: '', playerName: CORE_MEMBERS[0],
    isNpc: false, imageFit: 'cover', summary: '', description: '', extraFiles: [], comments: [],
    updatedAt: Date.now(), alias: '', isNameBlurred: false, affiliations: []
  });

  // Sync with Props, BUT PROTECT EDITING STATE
  useEffect(() => {
    if (character) {
      // CRITICAL FIX: If user is actively editing, DO NOT overwrite with incoming realtime changes.
      // This prevents typing from disappearing if another device triggers a save.
      if (!isEditing) {
        setFormData(character);
        const isMember = CORE_MEMBERS.includes(character.playerName || '');
        setIsGuestPlayer(!isMember && !!character.playerName);
        setShowAliasInput(!!character.alias);
        setShowSecretAliasInput(!!character.secretProfile?.alias);
        // Only reset ids if we are truly switching characters, not just refreshing the same one
        if (formData.id !== character.id) {
           setRevealedIds(new Set()); 
           setEditLayer('PUBLIC');
        }
      }
    } else {
      // Creating new
      if (formData.id === '') { // Only init if empty
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
    }
  }, [character, campaign, isEditing]); // Add isEditing to deps to re-eval if edit mode toggles

  const handleToggleReveal = () => {
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
      const currentList = currentAffiliations; 
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
      const currentList = [...currentAffiliations];
      if (aff.id.startsWith('virtual-')) {
         const newList = currentList.map((a, i) => {
             if (i === index) return { ...a, id: crypto.randomUUID(), isHidden: true };
             return a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a;
         });
         updateSecretField('affiliations', newList);
      } else {
         const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
         if (isPublicRef) {
            if (aff.isHidden) {
               const newList = currentList.filter(a => a.id !== aff.id).map(a => 
                   a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
               );
               updateSecretField('affiliations', newList);
            } else {
                const newList = currentList.map(a => 
                   a.id === aff.id ? { ...a, isHidden: true } : 
                   a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
               );
               updateSecretField('affiliations', newList);
            }
         } else {
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

  const currentAffiliations = useMemo(() => {
    const publicAffs = formData.affiliations || [];
    const secretAffs = formData.secretProfile?.affiliations || [];

    if (editLayer === 'PUBLIC' && isEditing) {
       return publicAffs;
    }

    if ((editLayer === 'SECRET' && isEditing) || (!isEditing && isSecretRevealed)) {
        const secretMap = new Map(secretAffs.map(a => [a.name, a]));
        const merged = [...secretAffs];
        publicAffs.forEach(pa => {
            if (!secretMap.has(pa.name)) {
                merged.push({ ...pa, id: `virtual-${pa.id}` }); 
            }
        });
        if (!isEditing) {
           return merged.filter(a => !a.isHidden);
        }
        return merged;
    }
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
    const newFile: ExtraFile = { 
      id: crypto.randomUUID(), 
      title: editLayer === 'SECRET' ? '새 비밀 항목' : '새 항목', 
      content: '', 
      fileType: 'REGULAR',
      combatStats: Array(6).fill(null).map((_, i) => ({ name: `STAT_${i+1}`, value: 3 })) 
    };
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
    
    if ((isEditing && editLayer === 'SECRET') || (!isEditing && isSecretRevealed)) {
       const newComments = [...(formData.secretProfile?.comments || []), newComment];
       if (!isEditing) {
          const updatedChar = {
             ...formData,
             secretProfile: { ...(formData.secretProfile || {}), comments: newComments }
          };
          setFormData(updatedChar);
          onSave(updatedChar); 
       } else {
          updateSecretField('comments', newComments);
       }
    } 
    else {
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

  const handleNameClick = () => {
    if (!isEditing && formData.alias && formData.isNameBlurred && !isNameRevealed && onToggleNameReveal) {
       onToggleNameReveal(formData.id, true);
    }
  };

  const headerName = useMemo(() => {
    if (isEditing) {
      if (editLayer === 'SECRET') {
         if (formData.secretProfile?.alias) return formData.secretProfile.alias;
         return formData.secretProfile?.name || '(비밀 이름 미설정)';
      }
      if (formData.alias) return formData.alias;
      return formData.name || '이름 없음';
    } else {
      if (isSecretRevealed) {
         if (formData.secretProfile?.alias) return formData.secretProfile.alias;
         return formData.secretProfile?.name || formData.alias || formData.name;
      }
      if (formData.alias) return formData.alias;
      return formData.name;
    }
  }, [isEditing, editLayer, isSecretRevealed, formData]);

  const subHeaderName = useMemo(() => {
     if (isEditing) return null;
     if (isSecretRevealed) {
        if (formData.secretProfile?.alias) {
           return <span className="opacity-70 transition-all duration-300 text-amber-500/80">{formData.secretProfile.name || formData.name}</span>;
        }
        return null;
     } 
     if (formData.alias) {
        if (formData.isNameBlurred && !isNameRevealed) return <span className="blur-sm select-none opacity-50 transition-all duration-300">{formData.name}</span>;
        return <span className="opacity-70 transition-all duration-300 text-amber-500/80">{formData.name}</span>;
     }
     return null;
  }, [isEditing, isSecretRevealed, formData, isNameRevealed]);
  
  return (
    <div className="fixed inset-0 z-30 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`w-full h-full md:max-w-7xl md:h-[95vh] md:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border flex flex-col md:flex-row overflow-hidden transition-all duration-500 ${tc.bgMain} ${isSecretRevealed ? 'border-amber-600/50' : tc.border}`}
      >
        
        {/* Left Column - Portrait & Status */}
        <div className={`w-full md:w-[350px] p-6 md:p-8 flex flex-col border-r shrink-0 ${tc.bgPanel} ${tc.border} md:overflow-y-auto`}>
          <div className="flex justify-between md:hidden mb-6">
            <button onClick={onClose} className="p-2 bg-black/40 rounded-full"><Icons.Close size={20} /></button>
            <button onClick={handleSave} className="px-4 py-2 bg-amber-700 text-white rounded-lg font-black text-xs">SAVE</button>
          </div>
          
          <div className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden mb-8 group border-2 shadow-2xl transition-all ${isSecretRevealed ? 'border-amber-500 shadow-amber-900/20' : 'border-stone-800'} bg-stone-900/50`}>
            {displayImageUrl ? (
              <img src={displayImageUrl} alt={formData.name} className={`w-full h-full transition-transform duration-1000 group-hover:scale-110 ${formData.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
            ) : <div className={`w-full h-full flex items-center justify-center opacity-10 ${tc.textSub}`}><Icons.User size={100} strokeWidth={1} /></div>}
            
            {isEditing && (
               <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black mb-2 shadow-lg"><Icons.Upload size={24} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Update Portrait</span>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, editLayer)} />
               </label>
            )}

            {activePortraitFile && (
              <div className="absolute top-2 right-2 bg-yellow-600/90 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg border border-yellow-400/50">
                Active Override
              </div>
            )}
          </div>
          
          {isEditing && formData.imageUrl && !activePortraitFile && (
             <div className="flex justify-center gap-2 mb-4 bg-black/20 p-1 rounded-lg w-fit mx-auto">
               <button onClick={() => setFormData(p => ({...p, imageFit: 'cover'}))} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${formData.imageFit==='cover' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500'}`}>Cover</button>
               <button onClick={() => setFormData(p => ({...p, imageFit: 'contain'}))} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${formData.imageFit==='contain' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500'}`}>Fit</button>
             </div>
          )}

          <div className="text-center">
             <h2 className={`text-3xl font-black mb-3 tracking-tighter transition-colors ${isSecretRevealed ? 'text-amber-400' : tc.textMain}`}>{headerName}</h2>
             <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest ${formData.isNpc ? 'bg-amber-700 text-amber-100' : 'bg-emerald-700 text-emerald-100'}`}>{formData.isNpc ? 'NON-PLAYER' : 'PLAYER-CHARACTER'}</span>
                <span className="text-sm font-black text-amber-500 font-mono tracking-tighter">{resolveValue('levelOrExp', 'levelOrExp')}</span>
             </div>
             
             {!isEditing && formData.playerName && (
                <div className="flex items-center justify-center mb-6">
                   {(() => {
                      const badgeStyle = MEMBER_COLORS[formData.playerName] || GUEST_COLOR;
                      return <span className={`px-4 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 shadow-lg ${badgeStyle}`}><Icons.User size={12} fill="currentColor" />{formData.playerName}</span>;
                   })()}
                </div>
             )}

             {hasSecretProfile && !isEditing && (
               <button onClick={handleToggleReveal} disabled={isGlobalReveal} className={`w-full py-3 rounded-xl border text-[11px] font-black tracking-[0.2em] transition-all uppercase ${isSecretRevealed ? 'bg-amber-950 text-amber-500 border-amber-600 shadow-lg shadow-amber-900/20' : 'bg-black/40 text-stone-600 border-stone-800'}`}>
                 {isGlobalReveal ? 'Global Override Active' : (isSecretRevealed ? 'Archive Decrypted' : 'Decrypt Records')}
               </button>
             )}
          </div>
        </div>

        {/* Right Column - Tabs & Content */}
        <div className="flex-1 flex flex-col relative md:h-full">
          {/* Header/Tabs Navigation */}
          <div className={`sticky top-0 z-20 flex flex-col md:flex-row justify-between p-3 md:px-8 md:py-4 border-b ${tc.bgPanel} ${tc.border} backdrop-blur-xl`}>
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
               {['INFO', 'BIO', 'FILES', 'COMMENTS'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`whitespace-nowrap px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-stone-500 hover:text-stone-300'}`}>{tab}</button>
               ))}
             </div>
             
             <div className="flex items-center gap-3 mt-3 md:mt-0">
               {isEditing && (
                 <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-stone-800">
                    <button onClick={() => setEditLayer('PUBLIC')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${editLayer === 'PUBLIC' ? 'bg-stone-700 text-white shadow-lg' : 'text-stone-500'}`}>PUBLIC</button>
                    <button onClick={() => setEditLayer('SECRET')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${editLayer === 'SECRET' ? 'bg-amber-800 text-amber-100 shadow-lg' : 'text-stone-500'}`}>SECRET</button>
                 </div>
               )}
               <div className="hidden md:flex items-center gap-3">
                 {isEditing ? <button onClick={handleSave} className="px-6 py-2 bg-amber-700 text-white rounded-xl font-black text-xs tracking-widest hover:bg-amber-600 transition-colors">SAVE CHANGES</button> : <button onClick={() => setIsEditing(true)} className="p-2 text-stone-500 hover:text-white transition-colors"><Icons.Edit size={22} /></button>}
                 <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors"><Icons.Close size={24} /></button>
               </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
            {activeTab === 'INFO' && (
              <div className="space-y-10 max-w-3xl">
                 <div className="grid md:grid-cols-2 gap-8">
                    {/* Identity Logic reused from previous block but simplified for visual */}
                    <div className="col-span-2 md:col-span-1 space-y-6">
                       {isEditing ? (
                          <>
                           {editLayer === 'PUBLIC' ? (
                             <>
                               <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-stone-800">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                     <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showAliasInput ? 'bg-amber-600' : 'bg-stone-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showAliasInput ? 'translate-x-4' : 'translate-x-0'}`} />
                                     </div>
                                     <input type="checkbox" checked={showAliasInput} onChange={(e) => setShowAliasInput(e.target.checked)} className="hidden" />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Enable Alias</span>
                                  </label>
                                  {showAliasInput && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                       <input type="checkbox" checked={formData.isNameBlurred || false} onChange={(e) => setFormData(p => ({...p, isNameBlurred: e.target.checked}))} className="w-3 h-3 text-amber-500 rounded bg-black" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Blur Name</span>
                                    </label>
                                  )}
                               </div>
                               {showAliasInput && <EditableField label={aliasLabel} value={formData.alias} onChange={(v) => setFormData(p => ({...p, alias: v}))} isEditing={true} themeClasses={tc} />}
                               <EditableField label="Identification" value={formData.name} onChange={(v) => setFormData(p => ({...p, name: v}))} isEditing={true} themeClasses={tc} />
                             </>
                           ) : (
                             <>
                               <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-amber-900/30">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                     <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showSecretAliasInput ? 'bg-amber-600' : 'bg-stone-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showSecretAliasInput ? 'translate-x-4' : 'translate-x-0'}`} />
                                     </div>
                                     <input type="checkbox" checked={showSecretAliasInput} onChange={(e) => setShowSecretAliasInput(e.target.checked)} className="hidden" />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Enable Secret Alias</span>
                                  </label>
                               </div>
                               {showSecretAliasInput && <EditableField label={`${aliasLabel} (SECRET)`} value={formData.secretProfile?.alias} onChange={(v) => updateSecretField('alias', v)} isEditing={true} themeClasses={tc} highlight={true} />}
                               <EditableField label="True Identity" value={formData.secretProfile?.name} onChange={(v) => updateSecretField('name', v)} isEditing={true} themeClasses={tc} highlight={true} />
                             </>
                           )}
                          </>
                       ) : (
                          <>
                           {isSecretRevealed ? (
                              <>
                                 {formData.secretProfile?.alias && (
                                   <div className="mb-6">
                                      <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 block text-amber-500">{aliasLabel}</label>
                                      <div className="text-xl font-black text-amber-100">{formData.secretProfile.alias}</div>
                                   </div>
                                 )}
                                 <EditableField label="True Identity" value={resolveValue('name', 'name')} onChange={()=>{}} isEditing={false} themeClasses={tc} highlight={true} />
                              </>
                           ) : (
                              <>
                                 {formData.alias && (
                                   <div className="mb-6">
                                      <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 block text-stone-500">{aliasLabel}</label>
                                      <div className="text-xl font-black text-stone-200">{formData.alias}</div>
                                   </div>
                                 )}
                                 <div className="mb-6">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 block text-stone-500">Identity</label>
                                    <div 
                                      onClick={handleNameClick}
                                      className={`text-xl font-black text-stone-200 transition-all ${formData.alias && formData.isNameBlurred && !isNameRevealed ? 'blur-md cursor-pointer hover:blur-none duration-300' : ''}`}
                                    >
                                       {formData.name}
                                    </div>
                                 </div>
                              </>
                           )}
                          </>
                       )}
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                       <EditableField label="Power Level / XP" value={resolveValue('levelOrExp', 'levelOrExp')} onChange={v => editLayer === 'SECRET' ? updateSecretField('levelOrExp', v) : setFormData(p => ({...p, levelOrExp: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                       
                       <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 block ${isEditing ? tc.textAccent : tc.textSub} mt-6`}>Player</label>
                       {isEditing ? (
                          <div className="flex flex-col gap-2">
                             <div className="flex bg-black/40 rounded-lg p-1 w-fit border border-stone-800">
                                <button onClick={() => { setIsGuestPlayer(false); setFormData(p => ({...p, playerName: CORE_MEMBERS[0]})); }} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${!isGuestPlayer ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-500'}`}>Member</button>
                                <button onClick={() => { setIsGuestPlayer(true); setFormData(p => ({...p, playerName: ''})); }} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${isGuestPlayer ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-500'}`}>Guest</button>
                             </div>
                             {!isGuestPlayer ? (
                               <select value={formData.playerName || CORE_MEMBERS[0]} onChange={(e) => setFormData(p => ({...p, playerName: e.target.value}))} className={`w-full bg-black/40 border ${tc.border} rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none text-sm ${tc.textMain}`}>{CORE_MEMBERS.map(member => (<option key={member} value={member} className="bg-stone-900">{member}</option>))}</select>
                             ) : (
                               <input type="text" value={formData.playerName || ''} onChange={(e) => setFormData(p => ({...p, playerName: e.target.value}))} className={`w-full bg-black/40 border ${tc.border} rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none text-sm ${tc.textMain}`} placeholder="Guest Name"/>
                             )}
                          </div>
                       ) : ( <div className="text-base font-medium">{formData.playerName || '-'}</div> )}
                    </div>
                 </div>

                 <div className="p-6 bg-black/30 rounded-2xl border border-stone-800">
                    <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 block ${isEditing && editLayer === 'SECRET' ? 'text-amber-500' : tc.textSub}`}>Affiliations & Tags {isEditing && editLayer === 'SECRET' && <span className="text-[9px] bg-amber-900/50 px-1 rounded ml-1 tracking-normal">SECURE EDIT</span>}</label>
                    {isEditing ? (
                       <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                             {currentAffiliations.map((aff, index) => {
                                const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                                const isSecretStyle = !isPublicRef && editLayer === 'SECRET';
                                return (
                                <div key={aff.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                                   className={`flex items-center gap-3 bg-stone-900 border rounded-xl pl-4 pr-2 py-2 text-xs font-bold cursor-move ${aff.isHidden ? 'opacity-40 border-dashed' : ''} ${isSecretStyle ? 'border-amber-700/50 text-amber-100' : 'border-stone-700'}`}>
                                   <span>{aff.name} <span className="opacity-50 font-normal">{aff.rank && `| ${aff.rank}`}</span></span>
                                   <div className="flex items-center gap-1 border-l border-stone-800 pl-2">
                                      {editLayer === 'SECRET' && (
                                         <button onClick={() => toggleAffiliationHidden(index, aff)} className={`p-1.5 rounded hover:bg-stone-800 ${aff.isHidden ? 'text-stone-500' : 'text-stone-300'}`}><Icons.EyeOff size={12}/></button>
                                      )}
                                      <button onClick={() => toggleAffiliationStrikethrough(index, aff)} className={`p-1.5 rounded hover:bg-stone-800 ${aff.isStrikethrough ? 'text-amber-500' : 'text-stone-500'}`}><Icons.Strikethrough size={12}/></button>
                                      <button onClick={() => removeAffiliation(index, aff)} className="p-1.5 rounded hover:bg-red-900/30 text-stone-500 hover:text-red-400"><Icons.Close size={12}/></button>
                                   </div>
                                </div>
                             )})}
                          </div>
                          <div className="flex flex-col md:flex-row gap-2 mt-4 bg-stone-900/50 p-2 rounded-xl border border-stone-800/50">
                             <input value={newAffiliationName} onChange={e => setNewAffiliationName(e.target.value)} className="flex-1 bg-transparent border-b border-stone-800 px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="New Tag Name..."/>
                             <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={hasRank} onChange={(e) => setHasRank(e.target.checked)} className="w-3 h-3 rounded bg-black border-stone-700 text-amber-600 focus:ring-0" /><span className="text-[10px] font-bold uppercase text-stone-500">Add Detail</span></label>
                                {hasRank && <input value={newAffiliationRank} onChange={e => setNewAffiliationRank(e.target.value)} className="w-32 bg-transparent border-b border-stone-800 px-2 py-1 text-xs focus:outline-none focus:border-amber-500 animate-in fade-in slide-in-from-right-2" placeholder="Rank/Detail..."/>}
                                <button onClick={addAffiliation} className="px-4 py-1.5 bg-stone-800 text-stone-200 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-stone-700 transition-colors ml-2">Add</button>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="flex flex-wrap gap-2">
                          {currentAffiliations.map(aff => {
                             const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                             const isSecretStyle = !isPublicRef && (isSecretRevealed || editLayer === 'SECRET');
                             return (
                             <span key={aff.id} className={`px-4 py-1.5 rounded-full text-[11px] font-black border tracking-tight ${aff.isStrikethrough ? 'line-through opacity-50 decoration-2 decoration-red-500' : ''} ${isSecretStyle ? 'bg-amber-900/30 text-amber-100 border-amber-600/40' : `${tc.bgPanel} ${tc.border} ${tc.textMain}`}`}>
                                {aff.name} {aff.rank && <span className="font-medium opacity-60 ml-1">| {aff.rank}</span>}
                             </span>
                          )})}
                          {currentAffiliations.length === 0 && <span className="text-xs text-stone-700 italic">No affiliations recorded.</span>}
                       </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                   {[ {f: 'age', l: 'Age'}, {f: 'gender', l: 'Gender'}, {f: 'height', l: 'Height'}, {f: 'weight', l: 'Weight'} ].map(field => (
                     <EditableField key={field.f} label={field.l} value={resolveValue(field.f as any, field.f as any)} onChange={v => editLayer === 'SECRET' ? updateSecretField(field.f as any, v) : setFormData(p => ({...p, [field.f]: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                   ))}
                 </div>
              </div>
            )}

            {activeTab === 'BIO' && (
              <div className="max-w-3xl animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                <EditableField label="Subject Narrative & Biography" value={resolveValue('description', 'description')} onChange={v => editLayer === 'SECRET' ? updateSecretField('description', v) : setFormData(p => ({...p, description: v}))} type="textarea" isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
              </div>
            )}

            {activeTab === 'FILES' && (
              <div className="space-y-8 max-w-4xl animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                {isEditing && <button onClick={addExtraFile} className="w-full py-5 border-2 border-dashed border-stone-800 rounded-2xl flex items-center justify-center gap-3 text-stone-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all font-black text-xs tracking-[0.2em] uppercase"><Icons.Plus size={18}/>Initialize New Data Node</button>}
                
                {currentFiles.map(file => (
                  <div key={file.id} className={`border-2 rounded-2xl p-6 md:p-8 ${tc.bgPanel} ${file.fileType === 'COMBAT' ? 'border-amber-900/30' : 'border-stone-800'} shadow-2xl`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      {isEditing ? <input value={file.title} onChange={e => updateExtraFile(file.id, 'title', e.target.value)} className="bg-transparent border-b border-stone-700 font-black text-xl outline-none focus:border-amber-500 w-full md:w-auto"/> : <h4 className="font-black text-2xl tracking-tighter uppercase">{file.title}</h4>}
                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <>
                           <select value={file.fileType || 'REGULAR'} onChange={e => updateExtraFile(file.id, 'fileType', e.target.value)} className="bg-stone-900 border border-stone-700 text-[10px] font-black rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 uppercase tracking-widest">
                            <option value="REGULAR">General Info</option>
                            <option value="COMBAT">Stats Overview</option>
                           </select>
                           {editLayer === 'PUBLIC' && <button onClick={() => toggleSecret(file.id, !file.isSecret)} className={`p-2 rounded-lg ${file.isSecret ? 'bg-red-900/50 text-red-200' : 'bg-stone-800 text-stone-500'}`} title="Toggle Secret"><Icons.Lock size={16}/></button>}
                           {file.imageUrl && <button onClick={() => togglePortraitOverride(file.id, !file.useAsPortrait)} className={`p-2 rounded-lg ${file.useAsPortrait ? 'bg-yellow-600 text-white' : 'bg-stone-800 text-stone-500'}`} title="Use as Portrait"><Icons.User size={16}/></button>}
                           <button onClick={() => removeExtraFile(file.id)} className="p-2 bg-stone-800 text-red-500 hover:bg-red-900/20 rounded-lg"><Icons.Trash size={16}/></button>
                          </>
                        )}
                      </div>
                    </div>

                    {file.fileType === 'COMBAT' && (
                      <div className="mb-10 p-6 md:p-10 bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="flex flex-col items-center">
                          <RadarChart stats={file.combatStats || []} themeColor={tc.textAccent.replace('text-', '')} />
                          {isEditing && (
                             <div className="w-full mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                               {file.combatStats?.map((s, i) => (
                                 <div key={i} className="flex flex-col gap-2 bg-stone-900/50 p-3 rounded-xl border border-white/5">
                                    <input value={s.name} onChange={e => { const newStats = [...(file.combatStats || [])]; newStats[i].name = e.target.value; updateExtraFile(file.id, 'combatStats', newStats); }} className="bg-transparent border-b border-white/10 text-[10px] font-black text-amber-500 uppercase outline-none focus:border-amber-500"/>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] text-stone-600 font-mono">RANK</span>
                                      <select value={s.value} onChange={e => { const newStats = [...(file.combatStats || [])]; newStats[i].value = parseInt(e.target.value); updateExtraFile(file.id, 'combatStats', newStats); }} className="bg-black text-[10px] text-stone-300 rounded px-2 py-1 focus:outline-none">
                                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                    </div>
                                 </div>
                               ))}
                             </div>
                          )}
                        </div>
                      </div>
                    )}

                    {file.imageUrl && <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative group">
                       <img src={file.imageUrl} className={`w-full max-h-[500px] ${file.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}/>
                       {isEditing && <button onClick={() => updateExtraFile(file.id, 'imageUrl', '')} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full"><Icons.Close size={16}/></button>}
                    </div>}
                    
                    {isEditing && !file.imageUrl && (
                       <div className="mb-6"><label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 bg-stone-900 rounded-lg hover:bg-stone-800 text-xs font-bold text-stone-400"><Icons.Image size={16}/> Attach Image <input type="file" accept="image/*" className="hidden" onChange={(e) => handleExtraImageUpload(file.id, e)} /></label></div>
                    )}

                    {isEditing ? (
                      <textarea value={file.content} onChange={e => updateExtraFile(file.id, 'content', e.target.value)} className="w-full h-40 bg-black/40 border border-stone-800 rounded-xl p-4 text-sm focus:border-amber-500 outline-none transition-colors" placeholder="Enter detailed information..."/>
                    ) : (
                      <p className="text-sm md:text-base opacity-80 whitespace-pre-wrap leading-relaxed px-1 font-serif">{file.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'COMMENTS' && (
              <div className="h-full flex flex-col space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
                 <div className="flex-1 space-y-6">
                    {currentComments.map(c => (
                       <div key={c.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-xl transition-transform hover:scale-[1.01] group relative">
                          <div className="flex justify-between text-[10px] mb-2 font-mono tracking-widest uppercase">
                             <span className="text-amber-500 font-black">{c.userName}</span>
                             <span className="opacity-40">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-stone-300 whitespace-pre-wrap">{c.content}</p>
                          {(isEditing && editLayer === 'SECRET') || (!isEditing && isSecretRevealed) ? (
                              <button onClick={() => confirmDeleteComment(c.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 text-red-400 rounded transition-all"><Icons.Close size={14}/></button>
                          ) : (
                              isEditing && <button onClick={() => confirmDeleteComment(c.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 text-red-400 rounded transition-all"><Icons.Close size={14}/></button>
                          )}
                       </div>
                    ))}
                    {currentComments.length === 0 && <div className="text-center py-20 text-stone-700 italic font-serif">Historical records remain empty.</div>}
                 </div>
                 
                 <div className="flex flex-col gap-4 p-6 bg-black/40 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                      <Icons.Edit size={16} className="text-amber-500" />
                      <input value={commentName} onChange={e => setCommentName(e.target.value)} className="bg-transparent text-sm font-black uppercase tracking-widest p-1 focus:outline-none text-white" placeholder="ARCHIVIST NAME"/>
                    </div>
                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="bg-transparent text-sm leading-relaxed h-28 focus:outline-none transition-colors resize-none placeholder:opacity-20" placeholder="Append record to historical archive..."/>
                    <button onClick={submitComment} className="py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-lg transition-all bg-amber-700 text-white hover:bg-amber-600 active:scale-[0.98]">Commit Record</button>
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
