
import React, { useState } from 'react';
import { Campaign, SystemType } from '../../types';
import { Icons } from '../ui/Icons';
import { uploadImage } from '../../services/upload';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  globalBackgrounds: string[];
  currentCampaignId?: string; // If set, opens that campaign's settings
  onUpdateCampaign: (c: Campaign) => void;
  onAddCampaign: (c: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onUpdateGlobalBackgrounds: (bgs: string[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, campaigns, currentCampaignId,
  onUpdateCampaign, onAddCampaign, onDeleteCampaign
}) => {
  // Default to Campaign view since we removed Global Backgrounds
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(currentCampaignId || campaigns[0]?.id);
  
  // New Campaign State
  const [isCreating, setIsCreating] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampSys, setNewCampSys] = useState<SystemType>(SystemType.DND5E);

  if (!isOpen) return null;

  const createCampaign = () => {
    if (!newCampName) return;
    
    let subTitle = 'New Campaign';
    let defaultAliasLabel = '이명/칭호';

    switch (newCampSys) {
      case SystemType.DND5E: 
        subTitle = 'Dungeons & Dragons 5th Ed'; 
        defaultAliasLabel = '이명 (Alias)';
        break;
      case SystemType.CYBERPUNK_RED: 
        subTitle = 'Cyberpunk RED'; 
        defaultAliasLabel = '핸들 (Handle)';
        break;
      case SystemType.COC7: 
        subTitle = 'Call of Cthulhu 7th Ed'; 
        defaultAliasLabel = '칭호 (Title)';
        break;
      case SystemType.BAND_OF_BLADES: 
        subTitle = 'Band of Blades'; 
        defaultAliasLabel = '코드네임 (Codename)';
        break;
      default: 
        subTitle = 'Custom Rule Campaign';
    }

    const newCamp: Campaign = {
      id: crypto.randomUUID(),
      name: newCampName,
      system: newCampSys,
      backgroundImages: [],
      subTitle: subTitle,
      aliasLabel: defaultAliasLabel
    };
    onAddCampaign(newCamp);
    setIsCreating(false);
    setNewCampName('');
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Fixed height using h-[80vh] */}
      <div className="bg-[#1c1917] border border-stone-700 w-full max-w-4xl h-[80vh] rounded-xl flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Decorative Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex justify-between items-center p-6 border-b border-stone-800 relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-200">
            <Icons.Settings className="text-amber-600" /> 환경 설정
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><Icons.Close /></button>
        </div>

        {/* Tab Headers (Simplified) */}
        <div className="flex border-b border-stone-800 relative z-10">
          <div className="px-6 py-3 text-sm font-bold text-amber-500 border-b-2 border-amber-500 bg-white/5 flex items-center gap-2">
            <Icons.Folder size={14}/> 캠페인 관리
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
            <div className="flex flex-col md:flex-row gap-6 h-full">
               {/* Sidebar List */}
               <div className="w-full md:w-1/3 border-r border-stone-800 pr-0 md:pr-6 space-y-4">
                 <button 
                   onClick={() => setIsCreating(true)}
                   className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-stone-100 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 border border-amber-600/50 transition-colors"
                 >
                   <Icons.Plus size={16} /> 신규 캠페인
                 </button>
                 
                 {isCreating && (
                   <div className="p-3 bg-stone-800 rounded border border-stone-600 animate-in fade-in slide-in-from-top-2 shadow-xl">
                     <input 
                       className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-sm mb-2 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500" 
                       placeholder="캠페인 이름"
                       value={newCampName}
                       onChange={e => setNewCampName(e.target.value)}
                     />
                     <select 
                        className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-sm mb-2 text-stone-200 focus:outline-none focus:border-amber-500"
                        value={newCampSys}
                        onChange={e => setNewCampSys(e.target.value as SystemType)}
                     >
                       <option value={SystemType.DND5E}>DnD 5e</option>
                       <option value={SystemType.CYBERPUNK_RED}>Cyberpunk RED</option>
                       <option value={SystemType.COC7}>Call of Cthulhu 7th</option>
                       <option value={SystemType.BAND_OF_BLADES}>Band of Blades</option>
                       <option value={SystemType.OTHER}>기타 (자유 입력)</option>
                     </select>
                     <div className="flex justify-end gap-2">
                       <button onClick={() => setIsCreating(false)} className="text-xs text-stone-500 hover:text-stone-300">취소</button>
                       <button onClick={createCampaign} className="text-xs text-amber-500 hover:text-amber-400 font-bold">생성</button>
                     </div>
                   </div>
                 )}

                 <div className="space-y-1">
                   {campaigns.map(c => (
                     <button
                       key={c.id}
                       onClick={() => {
                         setSelectedCampaignId(c.id);
                         setIsCreating(false);
                       }}
                       className={`w-full text-left px-3 py-2 rounded text-sm truncate flex items-center gap-2 transition-colors ${selectedCampaignId === c.id ? 'bg-stone-800 text-amber-400 font-bold border border-stone-700' : 'text-stone-500 hover:bg-stone-800/50 hover:text-stone-300'}`}
                     >
                       {c.logoUrl ? (
                         <img src={getOptimizedImageUrl(c.logoUrl, 100)} className="w-6 h-6 rounded-full object-cover border border-stone-600" />
                       ) : <div className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700" />}
                       {c.name}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Detail Editor */}
               <div className="flex-1 pl-0 md:pl-2">
                 {selectedCampaign ? (
                   <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="relative w-24 h-24 rounded-full bg-stone-800 overflow-hidden border border-stone-600 flex-shrink-0 group shadow-2xl">
                           {selectedCampaign.logoUrl ? (
                             <img src={getOptimizedImageUrl(selectedCampaign.logoUrl, 300)} className="w-full h-full object-cover" />
                           ) : <Icons.Image className="w-full h-full p-6 text-stone-700" />}
                           <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                             <Icons.Upload className="text-amber-400" />
                             <input type="file" className="hidden" onChange={async (e) => {
                                if(e.target.files?.[0]) {
                                  try {
                                    const url = await uploadImage(e.target.files[0]);
                                    onUpdateCampaign({...selectedCampaign, logoUrl: url});
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }
                             }} />
                           </label>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-stone-500 block mb-1 uppercase tracking-wider">부제 (Subtitle)</label>
                          <input 
                            value={selectedCampaign.subTitle || ''}
                            onChange={(e) => onUpdateCampaign({...selectedCampaign, subTitle: e.target.value})}
                            className="w-full bg-stone-800/50 border-b border-stone-600 p-2 text-stone-300 focus:outline-none focus:border-amber-500 mb-4 font-mono text-sm"
                          />
                          
                          <label className="text-xs font-bold text-amber-600 block mb-1 uppercase tracking-wider">세계 설정 (World Setting)</label>
                          <input 
                            value={selectedCampaign.name}
                            onChange={(e) => onUpdateCampaign({...selectedCampaign, name: e.target.value})}
                            className="w-full bg-stone-800/50 border-b border-stone-600 p-2 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors font-serif text-lg mb-4"
                          />

                          <label className="text-xs font-bold text-stone-500 block mb-1 uppercase tracking-wider">이명/칭호 항목명 (Alias Label)</label>
                          <input 
                            value={selectedCampaign.aliasLabel || ''}
                            onChange={(e) => onUpdateCampaign({...selectedCampaign, aliasLabel: e.target.value})}
                            className="w-full bg-stone-800/50 border-b border-stone-600 p-2 text-stone-300 focus:outline-none focus:border-amber-500 mb-2 font-mono text-sm"
                            placeholder="예: 핸들, 코드네임, 호, 이명 등"
                          />
                          
                          <p className="text-xs text-stone-600 mt-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-stone-600" />
                            시스템: <span className="text-stone-400 font-mono">{selectedCampaign.system}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-800">
                        <button 
                          onClick={() => onDeleteCampaign(selectedCampaign.id)}
                          className="px-4 py-2 border border-red-900/50 text-red-500/70 hover:text-red-400 hover:bg-red-950/30 rounded text-sm flex items-center gap-2 transition-colors"
                        >
                          <Icons.Trash size={14} /> 캠페인 삭제 (암호 필요)
                        </button>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center text-stone-700 flex-col gap-2 opacity-50">
                     <Icons.Settings size={48} />
                     <span>설정할 캠페인을 선택하세요</span>
                   </div>
                 )}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
