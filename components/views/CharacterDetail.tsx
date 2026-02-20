import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Character, Campaign, DND_CLASSES, CPRED_ROLES, BOB_PLAYBOOKS, ExtraFile, SystemType, CharacterComment, CORE_MEMBERS, SecretProfile, CharacterAffiliation, CombatStat } from '../../types';
import { Icons } from '../ui/Icons';
import { uploadImage } from '../../services/upload';
import { THEMES, THEME_KEYS } from '../../constants';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

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

// --- Comment Styles & Fonts ---
const COMMENT_STYLES = {
  'NOTE': { label: '메모 (Simple)', class: 'bg-white/5 border-white/10 text-stone-300' },
  'OFFICIAL': { label: '공문 (Official)', class: 'bg-slate-900/90 border-slate-500/50 text-slate-200 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' },
  'WARNING': { label: '경고 (Warning)', class: 'bg-red-950/40 border-red-500/50 text-red-200' },
  'LOG': { label: '로그 (System Log)', class: 'bg-black/80 border-green-900/50 text-green-400 font-mono' },
  'STAMP': { label: '도장 (Stamped)', class: 'bg-amber-100/10 border-amber-500/30 text-amber-100/90' }
};

const COMMENT_FONTS = {
  'SANS': { label: '고딕 (Sans)', class: 'font-sans' },
  'SERIF': { label: '명조 (Serif)', class: 'font-serif' },
  'MONO': { label: '코딩 (Mono)', class: 'font-mono' },
  'HAND': { label: '손글씨 (Hand)', class: 'font-hand' },
  'FANTASY': { label: '판타지 (Fantasy)', class: 'font-fantasy' }
};

// --- Helper Components ---

// 1. Simple Markdown Render (Display)
const SimpleMarkdown: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  if (!text) return <span className="opacity-50">-</span>;

  return (
    <div className={className}>
      {text.split('\n').map((line, i) => (
        <div key={i} className="min-h-[1.5em] break-words">
          {line ? line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              return <strong key={j} className="font-black text-amber-500/90">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return <em key={j} className="text-white/80">{part.slice(1, -1)}</em>;
            }
            return <span key={j}>{part}</span>;
          }) : <br/>}
        </div>
      ))}
    </div>
  );
};

// 2. Rich Text Editor (Input)
interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, minHeight = "h-64" }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (type: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const symbol = type === 'bold' ? '**' : '*';
    
    const newVal = value.substring(0, start) + symbol + selectedText + symbol + value.substring(end);
    
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, end + symbol.length);
    }, 0);
  };

  return (
    <div className={`flex flex-col border border-stone-700 rounded-lg overflow-hidden bg-black/20 focus-within:border-amber-500/50 transition-colors ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-stone-900 border-b border-stone-800">
        <button 
          onClick={() => insertFormat('bold')} 
          className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/5 rounded transition-colors" 
          title="굵게 (**Text**)"
        >
          <Icons.Bold size={16} />
        </button>
        <button 
          onClick={() => insertFormat('italic')} 
          className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/5 rounded transition-colors" 
          title="기울임 (*Text*)"
        >
          <Icons.Italic size={16} />
        </button>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${minHeight} bg-transparent p-4 text-sm leading-relaxed outline-none resize-y placeholder:opacity-20 font-sans custom-scrollbar`}
        placeholder={placeholder}
      />
    </div>
  );
};

// --- Radar Chart Component ---
const RadarChart: React.FC<{ stats: CombatStat[]; themeColor: string; hideLegend?: boolean }> = ({ stats, themeColor, hideLegend = false }) => {
  if (!stats || stats.length < 3) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-black/20 rounded-xl border border-dashed border-stone-800">
        <span className="text-xs text-stone-500">통계 데이터 부족 (3개 이상 필요)</span>
      </div>
    );
  }

  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 40;
  const maxVal = 5;

  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - (Math.PI / 2);
    const r = (value / maxVal) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const points = stats.map((s, i) => getPoint(s.value, i, stats.length));
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`flex flex-col items-center justify-center w-full py-4 ${themeColor}`}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[300px] overflow-visible">
        {/* Grids */}
        {[1, 2, 3, 4, 5].map(level => (
          <polygon
            key={level}
            points={stats.map((_, i) => {
              const p = getPoint(level, i, stats.length);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={1}
            className="text-stone-500"
          />
        ))}

        {/* Axes */}
        {points.map((p, i) => (
           <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.2} className="text-stone-500" />
        ))}

        {/* Shape */}
        <polygon points={polyPoints} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={2} />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="currentColor" />
        ))}

        {/* Labels */}
        {stats.map((s, i) => {
          const lp = getPoint(maxVal + 0.8, i, stats.length);
          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-bold fill-stone-400 uppercase"
            >
              {s.name}
            </text>
          );
        })}
      </svg>
      
      {/* Legend / Values */}
      {!hideLegend && (
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1">
          {stats.map(s => (
            <div key={s.name} className="flex justify-between items-center text-xs w-24">
               <span className="text-stone-500 truncate mr-2">{s.name}</span>
               <span className="font-bold opacity-80">{s.value}</span>
            </div>
          ))}
        </div>
      )}
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
  minHeight?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, onChange, isEditing, type = 'text', options = [], placeholder = '', isSecretField = false, themeClasses, highlight = false, minHeight
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  
  const displayClass = highlight ? `${themeClasses.textAccent} font-bold` : themeClasses.textMain;

  if (!isEditing) {
    if (type === 'toggle') return null;
    let displayValue = value || '-';
    
    // Secret Field Masking
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

    // Markdown Display for Textarea types
    if (type === 'textarea') {
      return (
        <div className="mb-4 group">
          <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${themeClasses.textSub}`}>{label}</label>
          <div className={`text-sm md:text-base p-3 rounded-lg min-h-[2rem] ${displayClass} border border-transparent`}>
            <SimpleMarkdown text={displayValue} />
          </div>
        </div>
      );
    }

    // Regular Text Display
    return (
      <div className="mb-4 group">
        <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${themeClasses.textSub}`}>{label}</label>
        <div className={`text-sm md:text-base p-2.5 rounded-lg min-h-[2rem] whitespace-pre-wrap ${displayClass}`}>
          {type === 'select' ? options.find((o) => o.value === value)?.label || value : displayValue}
        </div>
      </div>
    );
  }
  
  // EDIT MODE
  return (
    <div className="mb-4">
      <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block flex items-center gap-2 ${highlight ? themeClasses.textAccent : themeClasses.textSub}`}>
        {label} 
        {highlight && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${themeClasses.border} bg-black/30 tracking-normal`}>SECURE</span>}
      </label>
      
      {type === 'text' && <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/40 border rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none placeholder:opacity-20 text-sm ${themeClasses.textMain} ${highlight ? `border-current ring-1 ring-white/10 ${themeClasses.textAccent}` : themeClasses.border}`} placeholder={placeholder}/>}
      
      {type === 'textarea' && (
        <RichTextEditor 
          value={value || ''} 
          onChange={onChange} 
          placeholder={placeholder}
          minHeight={minHeight || "min-h-[300px]"} 
          className={highlight ? `border-current ring-1 ring-white/10 ${themeClasses.textAccent}` : ""}
        />
      )}
      
      {type === 'select' && <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-black/40 border ${themeClasses.border} rounded-lg p-2.5 focus:border-opacity-100 focus:outline-none text-sm ${themeClasses.textMain}`}>{options.map((opt) => <option key={opt.value} value={opt.value} className="bg-stone-900 text-stone-200">{opt.label}</option>)}</select>}
      
      {type === 'toggle' && <div className="flex gap-2 p-1 bg-black/20 rounded-lg w-fit"><button onClick={() => onChange(false)} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${!value ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500'}`}>PC</button><button onClick={() => onChange(true)} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${value ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-500'}`}>NPC</button></div>}
    </div>
  );
};

interface CharacterDetailProps {
  character: Character | null;
  campaign: Campaign;
  allCharacters?: Character[]; 
  allCampaigns?: Campaign[]; // New prop for grouping tags
  onSave: (char: Character) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isEditingNew?: boolean;
  onAddComment?: (comment: CharacterComment) => void;
  onUpdateComment?: (comment: CharacterComment) => void;
  onDeleteComment?: (commentId: string, charId: string) => void;
  isGlobalReveal?: boolean;
  isRevealed?: boolean;
  onToggleReveal?: (id: string, state: boolean) => void;
  isNameRevealed?: boolean;
  onToggleNameReveal?: (id: string, state: boolean) => void;
}

interface TagItem {
  name: string;
  rank?: string;
}

const CharacterDetail: React.FC<CharacterDetailProps> = ({ 
  character, campaign, allCharacters = [], allCampaigns = [], onSave, onDelete, onClose, isEditingNew = false,
  onAddComment, onUpdateComment, onDeleteComment, isGlobalReveal = false, isRevealed = false, onToggleReveal,
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

  // Tag Menu State
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  // Comment Editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Creation Form State
  const [commentName, setCommentName] = useState('관찰자');
  const [commentText, setCommentText] = useState('');
  const [commentStyle, setCommentStyle] = useState<string>('NOTE');
  const [commentFont, setCommentFont] = useState<string>('SANS');
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

  // Handle outside click for Tag Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };

    if (isTagMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagMenuOpen]);

  // Group tags by campaign for the dropdown
  // IMPORTANT: This now includes formData (current edits) to provide a "live" list.
  // If a tag is removed from formData and it was the last instance, it will disappear from groupedTags immediately.
  const groupedTags: Record<string, TagItem[]> = useMemo(() => {
    const tagsByCampaign: Record<string, Set<string>> = {};
    const campaignMap = new Map(allCampaigns.map(c => [c.id, c.name]));

    // Construct the "Effective" character list:
    // All characters EXCEPT the one currently being edited (old version), PLUS the current formData (new version).
    const effectiveCharacters = allCharacters.filter(c => c.id !== formData.id);
    effectiveCharacters.push(formData);

    // 1. Collect all tags
    effectiveCharacters.forEach(c => {
      const campName = campaignMap.get(c.campaignId) || 'Unknown Campaign';
      if (!tagsByCampaign[campName]) tagsByCampaign[campName] = new Set();

      const processTag = (name: string, rank?: string) => {
        if (!name || !name.trim()) return; // Filter empty tags
        // Store as stringified object to handle uniqueness
        tagsByCampaign[campName].add(JSON.stringify({ name: name.trim(), rank: rank ? rank.trim() : '' }));
      };

      c.affiliations?.forEach(a => processTag(a.name, a.rank));
      c.secretProfile?.affiliations?.forEach(a => processTag(a.name, a.rank));
    });

    // 2. Identify Universal Tags
    const tagNameCounts = new Map<string, Set<string>>();
    
    Object.entries(tagsByCampaign).forEach(([campName, tagSet]) => {
        tagSet.forEach(jsonStr => {
            const { name } = JSON.parse(jsonStr);
            if (!tagNameCounts.has(name)) tagNameCounts.set(name, new Set());
            tagNameCounts.get(name)?.add(campName);
        });
    });

    const universalTagNames = Array.from(tagNameCounts.entries())
        .filter(([_, campSet]) => campSet.size >= 2)
        .map(([name]) => ({ name, rank: '' })) // Universal import usually implies no rank
        .sort((a, b) => a.name.localeCompare(b.name));

    // 3. Convert Sets back to Objects and Sort
    const campaignTags: Record<string, TagItem[]> = {};
    Object.entries(tagsByCampaign).forEach(([campName, tagSet]) => {
        const sortedTags = Array.from(tagSet)
            .map(jsonStr => JSON.parse(jsonStr) as TagItem)
            .sort((a, b) => {
                const nameComp = a.name.localeCompare(b.name);
                if (nameComp !== 0) return nameComp;
                return (a.rank || '').localeCompare(b.rank || '');
            });
        if (sortedTags.length > 0) {
            campaignTags[campName] = sortedTags;
        }
    });

    return {
      Universal: universalTagNames,
      ...campaignTags
    };
  }, [allCharacters, allCampaigns, formData.id, formData.affiliations, formData.secretProfile?.affiliations, formData.campaignId]);

  // Check if any tags exist
  const hasExistingTags = useMemo(() => {
    return Object.values(groupedTags).some(arr => arr.length > 0);
  }, [groupedTags]);

  const currentAffiliations: CharacterAffiliation[] = useMemo(() => {
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

  const currentFiles: ExtraFile[] = useMemo(() => {
    if (isEditing) return editLayer === 'SECRET' ? (formData.secretProfile?.extraFiles || []) : formData.extraFiles;
    return isSecretRevealed ? (formData.secretProfile?.extraFiles || []) : formData.extraFiles;
  }, [formData, isEditing, editLayer, isSecretRevealed]);

  const currentComments: CharacterComment[] = useMemo(() => {
    if (isEditing) return editLayer === 'SECRET' ? (formData.secretProfile?.comments || []) : formData.comments;
    return isSecretRevealed ? (formData.secretProfile?.comments || []) : formData.comments;
  }, [formData, isEditing, editLayer, isSecretRevealed]);


  useEffect(() => {
    if (character) {
      if (!isEditing) {
        setFormData(character);
        const isMember = CORE_MEMBERS.includes(character.playerName || '');
        setIsGuestPlayer(!isMember && !!character.playerName);
        setShowAliasInput(!!character.alias);
        setShowSecretAliasInput(!!character.secretProfile?.alias);
        if (formData.id !== character.id) {
           setRevealedIds(new Set()); 
           setEditLayer('PUBLIC');
        }
      }
    } else {
      if (formData.id === '') { 
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
  }, [character, campaign, isEditing]);

  const updateSecretField = (field: keyof SecretProfile, value: any) => {
    setFormData(prev => ({ ...prev, secretProfile: { ...(prev.secretProfile || {}), [field]: value } }));
  };

  const resolveValue = (publicField: keyof Character, secretField: keyof SecretProfile): string => {
    let val: any;
    if (isEditing) {
      if (editLayer === 'SECRET') val = formData.secretProfile?.[secretField];
      else val = formData[publicField];
    } else {
      // View Mode
      if (isSecretRevealed && formData.secretProfile?.[secretField]) {
         val = formData.secretProfile[secretField];
      } else {
         val = formData[publicField];
      }
    }
    
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    // For numbers or booleans, convert to string
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    
    // For objects/arrays (like ExtraFile[]), return empty string as this function is for text fields
    return '';
  };

  const addExtraFile = () => {
    const newFile: ExtraFile = {
      id: crypto.randomUUID(),
      title: '새 항목',
      content: '',
      fileType: 'REGULAR',
      isSecret: editLayer === 'SECRET',
      useAsPortrait: false,
      combatStats: [],
      imageFit: 'cover'
    };
    
    if (editLayer === 'SECRET') {
        const current = formData.secretProfile?.extraFiles || [];
        updateSecretField('extraFiles', [newFile, ...current]);
    } else {
        setFormData(prev => ({ ...prev, extraFiles: [newFile, ...prev.extraFiles] }));
    }
  };

  const updateExtraFile = (id: string, field: keyof ExtraFile, value: any) => {
     const updater = (list: ExtraFile[]) => list.map(f => f.id === id ? { ...f, [field]: value } : f);
     if (editLayer === 'SECRET') {
         const current = formData.secretProfile?.extraFiles || [];
         updateSecretField('extraFiles', updater(current));
     } else {
         setFormData(prev => ({ ...prev, extraFiles: updater(prev.extraFiles) }));
     }
  };

  const removeExtraFile = (id: string) => {
     const filter = (list: ExtraFile[]) => list.filter(f => f.id !== id);
     if (editLayer === 'SECRET') {
         const current = formData.secretProfile?.extraFiles || [];
         updateSecretField('extraFiles', filter(current));
     } else {
         setFormData(prev => ({ ...prev, extraFiles: filter(prev.extraFiles) }));
     }
  };

  const toggleSecret = (id: string, isSecret: boolean) => {
     updateExtraFile(id, 'isSecret', isSecret);
  };

  const togglePortraitOverride = (id: string, useAsPortrait: boolean) => {
     // Enforce single portrait for simplicity or just toggle current
     const singleUpdater = (list: ExtraFile[]) => list.map(f => f.id === id ? { ...f, useAsPortrait } : { ...f, useAsPortrait: false });
     
     if (useAsPortrait) {
         if (editLayer === 'SECRET') {
             updateSecretField('extraFiles', singleUpdater(formData.secretProfile?.extraFiles || []));
         } else {
             setFormData(prev => ({ ...prev, extraFiles: singleUpdater(prev.extraFiles) }));
         }
     } else {
         updateExtraFile(id, 'useAsPortrait', false);
     }
  };

  const handleExtraImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files?.[0]) {
        try {
           const url = await uploadImage(e.target.files[0]);
           updateExtraFile(id, 'imageUrl', url);
        } catch (err) {
           alert("이미지 업로드 실패");
        }
     }
  };

  const startEditingComment = (comment: CharacterComment) => {
     setEditingCommentId(comment.id);
     setCommentName(comment.userName);
     setCommentText(comment.content);
     setCommentStyle(comment.styleVariant);
     setCommentFont(comment.font || 'SANS');
     const d = new Date(comment.createdAt);
     const dateStr = d.toISOString().split('T')[0];
     setCommentDate(dateStr);
  };

  const submitComment = () => {
     if (!commentText.trim()) return;
     
     const timestamp = new Date(commentDate).getTime();

     if (editingCommentId) {
        // Update existing
        const updated: CharacterComment = {
            id: editingCommentId,
            characterId: formData.id,
            userName: commentName,
            content: commentText,
            styleVariant: commentStyle as any,
            font: commentFont,
            createdAt: timestamp
        };
        
        if (isEditing && editLayer === 'SECRET') {
            const current = formData.secretProfile?.comments || [];
            updateSecretField('comments', current.map(c => c.id === editingCommentId ? updated : c));
        } else {
            if (onUpdateComment) onUpdateComment(updated);
            setFormData(prev => ({
                ...prev,
                comments: prev.comments.map(c => c.id === editingCommentId ? updated : c)
            }));
        }
        setEditingCommentId(null);
     } else {
        // Add new
        const newComment: CharacterComment = {
            id: crypto.randomUUID(),
            characterId: formData.id,
            userName: commentName,
            content: commentText,
            styleVariant: commentStyle as any,
            font: commentFont,
            createdAt: timestamp
        };

        if (isEditing && editLayer === 'SECRET') {
            const current = formData.secretProfile?.comments || [];
            updateSecretField('comments', [...current, newComment]);
        } else {
            if (onAddComment) onAddComment(newComment);
            setFormData(prev => ({
                ...prev,
                comments: [...prev.comments, newComment]
            }));
        }
     }
     setCommentText('');
  };

  const confirmDeleteComment = (commentId: string) => {
      if (!window.confirm("정말 삭제하시겠습니까?")) return;
      
      if (isEditing && editLayer === 'SECRET') {
          const current = formData.secretProfile?.comments || [];
          updateSecretField('comments', current.filter(c => c.id !== commentId));
      } else {
          if (onDeleteComment) onDeleteComment(commentId, formData.id);
          setFormData(prev => ({
              ...prev,
              comments: prev.comments.filter(c => c.id !== commentId)
          }));
      }
      
      if (editingCommentId === commentId) {
          setEditingCommentId(null);
          setCommentText('');
      }
  };

  const handleToggleReveal = () => {
    if (isGlobalReveal) return;
    if (onToggleReveal) {
      onToggleReveal(formData.id, !isSecretRevealed);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetLayer: 'PUBLIC' | 'SECRET') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadImage(e.target.files[0]);
        if (targetLayer === 'PUBLIC') setFormData(prev => ({ ...prev, imageUrl: url }));
        else updateSecretField('image_url', url);
      } catch (error) {
        alert("이미지 업로드 실패: " + (error as Error).message);
      }
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
    setEditLayer('PUBLIC');
    setIsEditing(false);
  };

  const addAffiliation = (inputName?: string, inputRank?: string) => {
    const nameToAdd = inputName || newAffiliationName;
    if (!nameToAdd.trim()) return;
    
    // Determine Rank: Use Input (Import) OR Manual Input
    let rankToAdd = undefined;
    if (inputName) {
        // If imported from list, inputRank can be used (even if empty/undefined)
        rankToAdd = inputRank; 
    } else {
        // Manual entry
        rankToAdd = hasRank ? newAffiliationRank.trim() : undefined;
    }

    // Check duplication in current list
    const currentList = editLayer === 'SECRET' 
        ? (currentAffiliations || []) 
        : (formData.affiliations || []);
    
    if (currentList.some(a => a.name === nameToAdd.trim())) {
        if (!inputName) alert("이미 존재하는 태그입니다.");
        return;
    }

    const newAff: CharacterAffiliation = {
      id: crypto.randomUUID(),
      name: nameToAdd.trim(),
      rank: rankToAdd,
      isStrikethrough: false,
      isHidden: false
    };

    if (editLayer === 'SECRET') {
      const cleanList = [...currentList, newAff].map(a => 
        a.id.startsWith('virtual-') ? { ...a, id: crypto.randomUUID() } : a
      );
      updateSecretField('affiliations', cleanList);
    } else {
      setFormData(prev => ({ ...prev, affiliations: [...(prev.affiliations || []), newAff] }));
    }

    if (!inputName) {
        setNewAffiliationName('');
        setNewAffiliationRank('');
        setHasRank(false);
    }
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
    } else {
      const currentList = formData.affiliations || [];
      setFormData(prev => ({ ...prev, affiliations: currentList.map((a, i) => i === index ? {...a, isHidden: !a.isHidden} : a) }));
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

  const activePortraitFile = useMemo(() => {
    const candidates = currentFiles.filter(f => f.useAsPortrait && f.imageUrl);
    const reversed = [...candidates].reverse();
    return reversed.find(f => !f.isSecret || revealedIds.has(f.id));
  }, [currentFiles, revealedIds]);

  let displayImageUrl = formData.imageUrl;
  if (isEditing) { if (editLayer === 'SECRET') displayImageUrl = formData.secretProfile?.image_url || formData.imageUrl; } 
  else { if (isSecretRevealed && formData.secretProfile?.image_url) displayImageUrl = formData.secretProfile.image_url; }
  if (activePortraitFile) displayImageUrl = activePortraitFile.imageUrl;

  let nameLabel = '이름 (NAME)'; let levelLabel = '레벨 / 경험치 (LEVEL / XP)'; let levelPlaceholder = '예: Lv.5';
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

  
  return (
    <div className="fixed inset-0 z-30 bg-black/90 backdrop-blur-md flex justify-center items-start md:items-center p-0 md:p-4 overflow-y-auto md:overflow-hidden">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`w-full min-h-full md:min-h-0 md:h-[95vh] md:max-w-[95vw] md:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border flex flex-col md:flex-row transition-all duration-500 ${tc.bgMain} ${isSecretRevealed ? `border-current ${tc.textAccent}` : tc.border}`}
      >
        
        {/* Left Column - Portrait & Status (Sidebar) */}
        <div className={`w-full md:w-[512px] p-6 md:p-8 flex flex-col border-r shrink-0 ${tc.bgPanel} ${tc.border} md:overflow-y-auto custom-scrollbar`}>
          {/* ... Sidebar content omitted for brevity ... */}
          <div className="flex justify-between md:hidden mb-6">
            <button onClick={onClose} className="p-2 bg-black/40 rounded-full"><Icons.Close size={20} /></button>
            <button onClick={handleSave} className="px-4 py-2 bg-amber-700 text-white rounded-lg font-black text-xs">저장</button>
          </div>
          
          <div className={`relative w-full max-w-[320px] md:max-w-[512px] aspect-square mx-auto rounded-xl overflow-hidden mb-8 group border-2 shadow-2xl transition-all ${isSecretRevealed ? `border-current ${tc.textAccent} shadow-[0_0_30px_rgba(0,0,0,0.3)]` : 'border-stone-800'} bg-stone-900/50`}>
            {displayImageUrl ? (
              <img src={getOptimizedImageUrl(displayImageUrl, 800)} alt={formData.name} className={`w-full h-full object-top transition-transform duration-1000 group-hover:scale-110 ${formData.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
            ) : <div className={`w-full h-full flex items-center justify-center opacity-10 ${tc.textSub}`}><Icons.User size={100} strokeWidth={1} /></div>}
            
            {isEditing && (
               <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black mb-2 shadow-lg"><Icons.Upload size={24} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">이미지 업데이트</span>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, editLayer)} />
               </label>
            )}

            {activePortraitFile && (
              <div className="absolute top-2 right-2 bg-yellow-600/90 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg border border-yellow-400/50">
                Active Override
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="flex flex-col gap-2 mb-6">
                {formData.imageUrl && !activePortraitFile && (
                  <div className="flex justify-center gap-2 bg-black/20 p-1 rounded-lg w-fit mx-auto">
                    <button onClick={() => setFormData(p => ({...p, imageFit: 'cover'}))} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${formData.imageFit==='cover' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500'}`}>Cover</button>
                    <button onClick={() => setFormData(p => ({...p, imageFit: 'contain'}))} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${formData.imageFit==='contain' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500'}`}>Fit</button>
                  </div>
                )}
                <div className="flex justify-center mt-2">
                   <div className="flex gap-2 p-1 bg-black/20 rounded-lg w-fit border border-stone-800">
                      <button onClick={() => setFormData(p => ({...p, isNpc: false}))} className={`px-6 py-2 rounded-md text-xs font-black transition-all uppercase tracking-wider ${!formData.isNpc ? 'bg-emerald-700 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>PC (Player)</button>
                      <button onClick={() => setFormData(p => ({...p, isNpc: true}))} className={`px-6 py-2 rounded-md text-xs font-black transition-all uppercase tracking-wider ${formData.isNpc ? 'bg-amber-700 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>NPC</button>
                   </div>
                </div>
            </div>
          )}

          <div className="text-center">
             <h2 className={`text-3xl font-black mb-3 tracking-tighter transition-colors ${isSecretRevealed ? tc.textAccent : tc.textMain}`}>{headerName}</h2>
             <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest ${formData.isNpc ? 'bg-amber-700 text-amber-100' : 'bg-emerald-700 text-emerald-100'}`}>{formData.isNpc ? 'NPC' : 'PC (PLAYER)'}</span>
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

             <div className="text-left mt-6 mb-6">
                <EditableField 
                  label="한 줄 소개 (Summary)" 
                  value={resolveValue('summary', 'summary')} 
                  onChange={v => editLayer === 'SECRET' ? updateSecretField('summary', v) : setFormData(p => ({...p, summary: v}))} 
                  isEditing={isEditing} 
                  type="textarea" 
                  minHeight="h-32" 
                  themeClasses={tc} 
                  highlight={editLayer === 'SECRET'} 
                />
             </div>

             {hasSecretProfile && !isEditing && (
               <button 
                  onClick={handleToggleReveal} 
                  disabled={isGlobalReveal} 
                  className={`w-full py-3 rounded-xl border text-[11px] font-black tracking-[0.2em] transition-all uppercase ${isSecretRevealed ? `bg-black/80 ${tc.textAccent} border-current shadow-lg` : 'bg-black/40 text-stone-600 border-stone-800'}`}
               >
                 {isGlobalReveal ? 'Global Override Active' : (isSecretRevealed ? 'Archive Decrypted' : 'Decrypt Records')}
               </button>
             )}
          </div>
        </div>

        {/* Right Column - Tabs & Content */}
        <div className="flex-1 flex flex-col relative md:h-full md:overflow-hidden">
          <div className={`sticky top-0 z-20 flex flex-col md:flex-row justify-between p-3 md:px-8 md:py-4 border-b ${tc.bgPanel} ${tc.border} backdrop-blur-xl shrink-0`}>
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
               {['INFO', 'BIO', 'FILES', 'COMMENTS'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`whitespace-nowrap px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-stone-500 hover:text-stone-300'}`}>{tab}</button>
               ))}
             </div>
             
             <div className="flex items-center gap-3 mt-3 md:mt-0">
               {isEditing && (
                 <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-stone-800">
                    <button onClick={() => setEditLayer('PUBLIC')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${editLayer === 'PUBLIC' ? 'bg-stone-700 text-white shadow-lg' : 'text-stone-500'}`}>PUBLIC</button>
                    {/* Secret Button - Dynamic Color */}
                    <button onClick={() => setEditLayer('SECRET')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${editLayer === 'SECRET' ? `bg-black text-white shadow-lg ring-1 ring-white/20` : 'text-stone-500'}`}>SECRET</button>
                 </div>
               )}
               <div className="hidden md:flex items-center gap-3">
                 {isEditing ? (
                   <>
                     <button onClick={() => onDelete(formData.id)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors bg-red-950/10 hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-900/30" title="캐릭터 삭제">
                        <Icons.Trash size={20} />
                     </button>
                     <button onClick={handleSave} className="px-6 py-2 bg-amber-700 text-white rounded-xl font-black text-xs tracking-widest hover:bg-amber-600 transition-colors">변경사항 저장</button>
                   </>
                 ) : (
                   <button onClick={() => setIsEditing(true)} className="p-2 text-stone-500 hover:text-white transition-colors"><Icons.Edit size={22} /></button>
                 )}
                 <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors"><Icons.Close size={24} /></button>
               </div>
             </div>
          </div>

          <div className="flex-1 md:overflow-y-auto p-6 md:p-12 custom-scrollbar">
            {activeTab === 'INFO' && (
              <div className="space-y-10 max-w-3xl">
                 <div className="grid md:grid-cols-2 gap-8">
                    {/* ... (First column content omitted - same as before) ... */}
                    <div className="col-span-2 md:col-span-1 space-y-6">
                       {/* Character Type, Alias, Name - Code Omitted for Brevity (Same as before) */}
                       {isEditing ? (
                          <>
                           {editLayer === 'PUBLIC' ? (
                             <>
                               <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-stone-800 mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Character Type</span>
                                  <div className="flex bg-black/40 rounded-lg p-1 border border-stone-800">
                                      <button onClick={() => setFormData(p => ({...p, isNpc: false}))} className={`px-4 py-1.5 rounded text-[10px] font-black uppercase transition-colors ${!formData.isNpc ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>PC</button>
                                      <button onClick={() => setFormData(p => ({...p, isNpc: true}))} className={`px-4 py-1.5 rounded text-[10px] font-black uppercase transition-colors ${formData.isNpc ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>NPC</button>
                                  </div>
                               </div>

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
                               <EditableField label={nameLabel} value={formData.name} onChange={(v) => setFormData(p => ({...p, name: v}))} isEditing={true} themeClasses={tc} />
                             </>
                           ) : (
                             <>
                               <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-amber-900/30">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                     <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showSecretAliasInput ? 'bg-amber-600' : 'bg-stone-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showSecretAliasInput ? 'translate-x-4' : 'translate-x-0'}`} />
                                     </div>
                                     <input type="checkbox" checked={showSecretAliasInput} onChange={(e) => setShowSecretAliasInput(e.target.checked)} className="hidden" />
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${tc.textAccent}`}>Enable Secret Alias</span>
                                  </label>
                               </div>
                               {showSecretAliasInput && <EditableField label={`${aliasLabel} (SECRET)`} value={formData.secretProfile?.alias} onChange={(v) => updateSecretField('alias', v)} isEditing={true} themeClasses={tc} highlight={true} />}
                               <EditableField label="진명 (TRUE NAME)" value={formData.secretProfile?.name} onChange={(v) => updateSecretField('name', v)} isEditing={true} themeClasses={tc} highlight={true} />
                             </>
                           )}
                          </>
                       ) : (
                          <>
                           {isSecretRevealed ? (
                              <>
                                 {formData.secretProfile?.alias && (
                                   <div className="mb-6">
                                      <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${tc.textAccent}`}>{aliasLabel}</label>
                                      <div className="text-xl font-black text-amber-100">{formData.secretProfile.alias}</div>
                                   </div>
                                 )}
                                 <div className="mb-6">
                                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${tc.textAccent}`}>진명 (TRUE NAME)</label>
                                    <div className="text-xl font-black text-stone-200">
                                       {resolveValue('name', 'name')}
                                    </div>
                                 </div>
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
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 block text-stone-500">{nameLabel}</label>
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
                       <EditableField label={levelLabel} value={resolveValue('levelOrExp', 'levelOrExp')} onChange={v => editLayer === 'SECRET' ? updateSecretField('levelOrExp', v) : setFormData(p => ({...p, levelOrExp: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                       
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
                    <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 block ${isEditing && editLayer === 'SECRET' ? tc.textAccent : tc.textSub}`}>소속 및 태그 (AFFILIATION) {isEditing && editLayer === 'SECRET' && <span className="text-[9px] bg-black/30 px-1 rounded ml-1 tracking-normal border border-white/20">SECURE EDIT</span>}</label>
                    {isEditing ? (
                       <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                             {currentAffiliations.map((aff, index) => {
                                const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                                const isSecretStyle = !isPublicRef && editLayer === 'SECRET';
                                // Dynamic Secret Tag Style
                                const tagStyle = isSecretStyle 
                                   ? `border-current ${tc.textAccent} ring-1 ring-white/10` 
                                   : 'border-stone-700 text-stone-200';
                                
                                return (
                                <div key={aff.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                                   className={`flex items-center gap-3 bg-stone-900 border rounded-xl pl-4 pr-2 py-2 text-xs font-bold cursor-move ${aff.isHidden ? 'opacity-40 border-dashed' : ''} ${tagStyle}`}>
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
                             <div className="relative flex-1" ref={tagMenuRef}>
                                <input 
                                   value={newAffiliationName} 
                                   onChange={e => setNewAffiliationName(e.target.value)} 
                                   onFocus={() => setIsTagMenuOpen(true)}
                                   className={`w-full bg-transparent border-b ${tc.border} focus:border-amber-500 outline-none text-xs py-1 text-stone-300 placeholder:text-stone-600`}
                                   placeholder="태그 입력 또는 선택..."
                                />
                                {isTagMenuOpen && hasExistingTags && (
                                   <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-stone-900 border border-stone-700 rounded-b-lg shadow-xl z-50 custom-scrollbar">
                                      {Object.entries(groupedTags).map(([group, tags]) => (
                                         <div key={group}>
                                            <div className="px-2 py-1 bg-stone-800 text-[10px] font-bold text-stone-500 uppercase">{group}</div>
                                            {tags.map((tag, idx) => (
                                               <button 
                                                 key={`${group}-${idx}`}
                                                 onClick={() => {
                                                    setNewAffiliationName(tag.name);
                                                    if(tag.rank) { setNewAffiliationRank(tag.rank); setHasRank(true); }
                                                    else { setNewAffiliationRank(''); setHasRank(false); }
                                                    setIsTagMenuOpen(false);
                                                 }}
                                                 className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-amber-900/30 hover:text-amber-400 flex justify-between"
                                               >
                                                  <span>{tag.name}</span>
                                                  {tag.rank && <span className="opacity-50 text-[10px]">{tag.rank}</span>}
                                               </button>
                                            ))}
                                         </div>
                                      ))}
                                   </div>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                   <input type="checkbox" checked={hasRank} onChange={e => setHasRank(e.target.checked)} className="rounded bg-black border-stone-700" />
                                   <span className="text-[10px] text-stone-500">Rank?</span>
                                </label>
                                {hasRank && (
                                   <input 
                                     value={newAffiliationRank} 
                                     onChange={e => setNewAffiliationRank(e.target.value)} 
                                     className={`w-20 bg-transparent border-b ${tc.border} focus:border-amber-500 outline-none text-xs py-1 text-stone-300`} 
                                     placeholder="직위/랭크"
                                   />
                                )}
                                <button onClick={() => addAffiliation()} className="p-1 bg-stone-700 hover:bg-stone-600 rounded text-white"><Icons.Plus size={14}/></button>
                             </div>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-2">* 드래그하여 순서 변경 가능. 공개/비공개 및 취소선 설정 가능.</p>
                       </div>
                    ) : (
                       <div className="flex flex-wrap gap-2">
                          {currentAffiliations.filter(a => !a.isHidden || isEditing || isSecretRevealed).map(aff => {
                             const isPublicRef = (formData.affiliations || []).some(pa => pa.name === aff.name);
                             const isSecretStyle = !isPublicRef && isSecretRevealed;
                             // Dynamic Tag Style
                             const tagClass = isSecretStyle 
                                ? `border-current ${tc.textAccent} bg-current/10 ring-1 ring-white/10`
                                : `bg-black/20 ${tc.textSub} border-stone-800`;

                             return (
                                <span key={aff.id} className={`text-xs px-2 py-1 rounded border ${aff.isStrikethrough ? 'line-through opacity-60' : ''} ${tagClass}`}>
                                   {aff.name}
                                   {aff.rank && <span className="opacity-60 ml-1">| {aff.rank}</span>}
                                   {aff.isHidden && <Icons.EyeOff size={10} className="inline ml-1 opacity-50"/>}
                                </span>
                             );
                          })}
                          {currentAffiliations.length === 0 && <span className="text-xs opacity-30">- 없음 -</span>}
                       </div>
                    )}
                 </div>

                 <EditableField label="외모 묘사 (APPEARANCE)" value={resolveValue('appearance', 'appearance')} onChange={v => editLayer === 'SECRET' ? updateSecretField('appearance', v) : setFormData(p => ({...p, appearance: v}))} isEditing={isEditing} type="textarea" themeClasses={tc} highlight={editLayer === 'SECRET'} />
              </div>
            )}

            {/* BIO TAB */}
            {activeTab === 'BIO' && (
              <div className="space-y-6 max-w-3xl">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <EditableField label="나이 (AGE)" value={resolveValue('age', 'age')} onChange={v => editLayer === 'SECRET' ? updateSecretField('age', v) : setFormData(p => ({...p, age: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                    <EditableField label="성별 (GENDER)" value={resolveValue('gender', 'gender')} onChange={v => editLayer === 'SECRET' ? updateSecretField('gender', v) : setFormData(p => ({...p, gender: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                    <EditableField label="키 (HEIGHT)" value={resolveValue('height', 'height')} onChange={v => editLayer === 'SECRET' ? updateSecretField('height', v) : setFormData(p => ({...p, height: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                    <EditableField label="몸무게 (WEIGHT)" value={resolveValue('weight', 'weight')} onChange={v => editLayer === 'SECRET' ? updateSecretField('weight', v) : setFormData(p => ({...p, weight: v}))} isEditing={isEditing} themeClasses={tc} highlight={editLayer === 'SECRET'} />
                 </div>
                 <EditableField label="상세 설명 (DESCRIPTION)" value={resolveValue('description', 'description')} onChange={v => editLayer === 'SECRET' ? updateSecretField('description', v) : setFormData(p => ({...p, description: v}))} isEditing={isEditing} type="textarea" themeClasses={tc} highlight={editLayer === 'SECRET'} />
              </div>
            )}

            {/* FILES TAB */}
            {activeTab === 'FILES' && (
               <div className="space-y-6 max-w-4xl">
                  {isEditing && (
                     <button onClick={addExtraFile} className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors ${editLayer === 'SECRET' ? `border-current ${tc.textAccent}` : 'border-stone-700 text-stone-500'}`}>
                        <Icons.Plus size={20} />
                        <span>{editLayer === 'SECRET' ? '시크릿 파일 추가' : '파일 추가'}</span>
                     </button>
                  )}
                  
                  <div className="grid gap-6">
                     {currentFiles.map((file, index) => (
                        <div key={file.id} className={`bg-black/20 border rounded-xl overflow-hidden ${file.isSecret ? `border-current ${tc.textAccent} bg-current/5` : 'border-stone-800'}`}>
                           {/* Header */}
                           <div className="flex items-center justify-between p-3 bg-black/40 border-b border-white/5">
                              {isEditing ? (
                                 <input value={file.title} onChange={e => updateExtraFile(file.id, 'title', e.target.value)} className="bg-transparent font-bold text-sm focus:outline-none flex-1" />
                              ) : (
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{file.title}</span>
                                    {file.isSecret && <Icons.Lock size={12} className="opacity-70" />}
                                    {file.useAsPortrait && <span className="text-[9px] bg-yellow-600/50 text-yellow-100 px-1.5 rounded">PORTRAIT</span>}
                                 </div>
                              )}
                              
                              {isEditing && (
                                 <div className="flex items-center gap-2">
                                    <button onClick={() => togglePortraitOverride(file.id, !file.useAsPortrait)} className={`p-1.5 rounded ${file.useAsPortrait ? 'text-yellow-400 bg-yellow-900/30' : 'text-stone-600 hover:text-stone-300'}`} title="초상화로 사용"><Icons.User size={16} /></button>
                                    <button onClick={() => toggleSecret(file.id, !file.isSecret)} className={`p-1.5 rounded ${file.isSecret ? `${tc.textAccent} bg-current/20` : 'text-stone-600 hover:text-stone-300'}`} title="비밀 설정"><Icons.Lock size={16} /></button>
                                    <button onClick={() => removeExtraFile(file.id)} className="p-1.5 text-red-500/50 hover:text-red-500"><Icons.Trash size={16} /></button>
                                 </div>
                              )}
                           </div>
                           
                           {/* Content */}
                           <div className="p-4 flex flex-col md:flex-row gap-6">
                              {/* Image Section */}
                              <div className="w-full md:w-1/3 space-y-2">
                                 {file.imageUrl ? (
                                    <div className="relative group rounded-lg overflow-hidden bg-black aspect-video md:aspect-square">
                                       <img src={getOptimizedImageUrl(file.imageUrl, 500)} className={`w-full h-full ${file.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} alt="File" />
                                       {isEditing && (
                                          <button onClick={() => updateExtraFile(file.id, 'imageUrl', '')} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Close size={12} /></button>
                                       )}
                                       {isEditing && (
                                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => updateExtraFile(file.id, 'imageFit', 'cover')} className="px-2 py-0.5 text-[9px] bg-black/80 text-white rounded">Cover</button>
                                             <button onClick={() => updateExtraFile(file.id, 'imageFit', 'contain')} className="px-2 py-0.5 text-[9px] bg-black/80 text-white rounded">Fit</button>
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    isEditing && (
                                       <label className="flex flex-col items-center justify-center w-full aspect-video md:aspect-square bg-white/5 border border-dashed border-stone-700 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                          <Icons.Upload size={24} className="text-stone-500 mb-2" />
                                          <span className="text-xs text-stone-500">이미지 업로드</span>
                                          <input type="file" className="hidden" onChange={e => handleExtraImageUpload(file.id, e)} />
                                       </label>
                                    )
                                 )}

                                 {/* Combat Stats (Radar Chart) */}
                                 {file.fileType === 'COMBAT' && (
                                    <div className="p-2 bg-black/40 rounded-lg">
                                       <RadarChart stats={file.combatStats || []} themeColor={tc.textAccent} />
                                    </div>
                                 )}
                              </div>

                              {/* Text Section */}
                              <div className="flex-1 min-w-0">
                                 {isEditing ? (
                                    <div className="h-full flex flex-col gap-2">
                                       <select 
                                         value={file.fileType || 'REGULAR'} 
                                         onChange={e => updateExtraFile(file.id, 'fileType', e.target.value)}
                                         className="bg-black/40 border border-stone-700 text-xs rounded p-1 w-fit"
                                       >
                                          <option value="REGULAR">일반 텍스트/이미지</option>
                                          <option value="COMBAT">전투/스탯 데이터</option>
                                       </select>
                                       
                                       {file.fileType === 'COMBAT' ? (
                                          <div className="mt-4 space-y-4">
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  {(file.combatStats || []).map((stat, idx) => (
                                                      <div key={idx} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-1">
                                                          <input
                                                              className={`w-20 bg-transparent border-b ${tc.border} text-xs font-bold text-center focus:border-amber-500 outline-none pb-1`}
                                                              value={stat.name}
                                                              onChange={(e) => {
                                                                  const newStats = [...(file.combatStats || [])];
                                                                  newStats[idx] = { ...stat, name: e.target.value };
                                                                  updateExtraFile(file.id, 'combatStats', newStats);
                                                              }}
                                                              placeholder="스탯명"
                                                          />
                                                          <div className="flex-1 flex flex-col gap-1">
                                                              <input
                                                                  type="range" min="1" max="5" step="1"
                                                                  value={stat.value}
                                                                  onChange={(e) => {
                                                                      const newStats = [...(file.combatStats || [])];
                                                                      newStats[idx] = { ...stat, value: parseInt(e.target.value) };
                                                                      updateExtraFile(file.id, 'combatStats', newStats);
                                                                  }}
                                                                  className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                                              />
                                                              <div className="flex justify-between text-[8px] text-stone-500 font-mono px-1">
                                                                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                                                              </div>
                                                          </div>
                                                          <span className={`text-sm font-black w-6 text-center ${tc.textAccent}`}>{stat.value}</span>
                                                          <button 
                                                              onClick={() => {
                                                                  const newStats = (file.combatStats || []).filter((_, i) => i !== idx);
                                                                  updateExtraFile(file.id, 'combatStats', newStats);
                                                              }}
                                                              className="p-1 text-stone-600 hover:text-red-500"
                                                          >
                                                              <Icons.Close size={14} />
                                                          </button>
                                                      </div>
                                                  ))}
                                              </div>
                                              <button
                                                  onClick={() => {
                                                      const newStats = [...(file.combatStats || []), { name: 'New Stat', value: 1 }];
                                                      updateExtraFile(file.id, 'combatStats', newStats);
                                                  }}
                                                  className="w-full py-2 border border-dashed border-stone-700 rounded-lg text-xs font-bold text-stone-500 hover:text-stone-300 hover:border-stone-500 transition-colors flex items-center justify-center gap-2"
                                              >
                                                  <Icons.Plus size={14} /> 스탯 항목 추가
                                              </button>
                                          </div>
                                       ) : (
                                          <RichTextEditor 
                                              value={file.content} 
                                              onChange={v => updateExtraFile(file.id, 'content', v)} 
                                              className="flex-1 min-h-[150px]"
                                              placeholder="내용을 입력하세요..."
                                          />
                                       )}
                                    </div>
                                 ) : (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                       <SimpleMarkdown text={file.content} />
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'COMMENTS' && (
               <div className="space-y-6 max-w-2xl mx-auto">
                  {/* Write Area */}
                  <div className={`p-4 rounded-xl border ${tc.bgPanel} ${tc.border} shadow-xl`}>
                     <div className="flex justify-between items-center mb-4">
                        <input 
                           value={commentName} 
                           onChange={e => setCommentName(e.target.value)} 
                           className={`bg-transparent font-bold text-sm outline-none ${tc.textMain}`}
                           placeholder="작성자 이름"
                        />
                        <input 
                           type="date"
                           value={commentDate}
                           onChange={e => setCommentDate(e.target.value)}
                           className="bg-transparent text-xs text-stone-500 outline-none"
                        />
                     </div>
                     <textarea 
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className={`w-full bg-black/20 rounded-lg p-3 text-sm min-h-[100px] outline-none resize-none mb-3 ${tc.textMain} placeholder:text-stone-600`}
                        placeholder="기록을 남기세요..."
                     />
                     <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                           {/* Style Selector */}
                           <div className="relative group">
                              <button className="p-1.5 rounded hover:bg-white/5 text-stone-400"><Icons.Palette size={16} /></button>
                              <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50 w-40">
                                 <div className="bg-stone-900 border border-stone-700 rounded-lg p-2 shadow-xl">
                                     {Object.entries(COMMENT_STYLES).map(([key, style]) => (
                                        <button key={key} onClick={() => setCommentStyle(key)} className={`w-full text-left text-xs p-1.5 rounded hover:bg-white/10 ${commentStyle === key ? 'text-amber-500 font-bold' : 'text-stone-400'}`}>
                                           {style.label}
                                        </button>
                                     ))}
                                 </div>
                              </div>
                           </div>
                           {/* Font Selector */}
                           <div className="relative group">
                              <button className="p-1.5 rounded hover:bg-white/5 text-stone-400"><Icons.Bold size={16} /></button>
                              <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50 w-32">
                                 <div className="bg-stone-900 border border-stone-700 rounded-lg p-2 shadow-xl">
                                     {Object.entries(COMMENT_FONTS).map(([key, font]) => (
                                        <button key={key} onClick={() => setCommentFont(key)} className={`w-full text-left text-xs p-1.5 rounded hover:bg-white/10 ${commentFont === key ? 'text-amber-500 font-bold' : 'text-stone-400'}`}>
                                           {font.label}
                                        </button>
                                     ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={submitComment}
                           className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!commentText.trim() ? 'bg-stone-800 text-stone-500' : 'bg-amber-700 text-white hover:bg-amber-600'}`}
                           disabled={!commentText.trim()}
                        >
                           {editingCommentId ? '수정 완료' : '기록 남기기'}
                        </button>
                     </div>
                  </div>

                  {/* List Area */}
                  <div className="space-y-4">
                     {currentComments.sort((a,b) => b.createdAt - a.createdAt).map(comment => {
                        const styleConfig = COMMENT_STYLES[comment.styleVariant as keyof typeof COMMENT_STYLES] || COMMENT_STYLES['NOTE'];
                        const fontConfig = COMMENT_FONTS[comment.font as keyof typeof COMMENT_FONTS] || COMMENT_FONTS['SANS'];
                        
                        return (
                           <div key={comment.id} className={`relative p-4 rounded-lg border transition-all ${styleConfig.class} ${fontConfig.class}`}>
                              <div className="flex justify-between items-start mb-2 opacity-70 text-xs">
                                 <span className="font-bold">{comment.userName}</span>
                                 <div className="flex items-center gap-2">
                                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    {(isEditing || comment.userName === commentName) && ( // Allow edit if name matches or in global edit mode
                                       <div className="flex gap-1 ml-2">
                                          <button onClick={() => startEditingComment(comment)} className="hover:text-amber-400"><Icons.Edit size={12} /></button>
                                          <button onClick={() => confirmDeleteComment(comment.id)} className="hover:text-red-400"><Icons.Close size={12} /></button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                 {comment.content}
                              </div>
                              {comment.styleVariant === 'STAMP' && (
                                 <div className="absolute -right-2 -bottom-2 opacity-20 rotate-[-15deg] border-4 border-red-500 text-red-500 font-black text-4xl p-2 rounded-lg pointer-events-none select-none">
                                    CONFIDENTIAL
                                 </div>
                              )}
                           </div>
                        );
                     })}
                     {currentComments.length === 0 && (
                        <div className="text-center py-10 opacity-30 text-sm">
                           기록된 코멘트가 없습니다.
                        </div>
                     )}
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