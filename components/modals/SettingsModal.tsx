import React, { useState } from 'react';
import { Campaign, SystemType } from '../../types';
import { Icons } from '../ui/Icons';
import { fileToBase64 } from '../../services/storage';

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
  isOpen, onClose, campaigns, globalBackgrounds, currentCampaignId,
  onUpdateCampaign, onAddCampaign, onDeleteCampaign, onUpdateGlobalBackgrounds
}) => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'CAMPAIGN'>('GLOBAL');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(currentCampaignId || campaigns[0]?.id);
  
  // New Campaign State
  const [isCreating, setIsCreating] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampSys, setNewCampSys] = useState<SystemType>(SystemType.DND5E);

  if (!isOpen) return null;

  const handleGlobalBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      onUpdateGlobalBackgrounds([...globalBackgrounds, base64]);
    }
  };

  const removeGlobalBg = (idx: number) => {
    const next = [...globalBackgrounds];
    next.splice(idx, 1);
    onUpdateGlobalBackgrounds(next);
  };

  const createCampaign = () => {
    if (!newCampName) return;
    
    let subTitle = 'New Campaign';
    switch (newCampSys) {
      case SystemType.DND5E: subTitle = 'Dungeons & Dragons 5th Ed'; break;
      case SystemType.CYBERPUNK_RED: subTitle = 'Cyberpunk RED'; break;
      case SystemType.COC7: subTitle = 'Call of Cthulhu 7th Ed'; break;
      case SystemType.BAND_OF_BLADES: subTitle = 'Band of Blades'; break;
      default: subTitle = 'Custom Rule Campaign';
    }

    const newCamp: Campaign = {
      id: crypto.randomUUID(),
      name: newCampName,
      system: newCampSys,
      backgroundImages: [],
      subTitle: subTitle
    };
    onAddCampaign(newCamp);
    setIsCreating(false);
    setNewCampName('');
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icons.Settings /> 환경 설정
          </h2>
          <button onClick={onClose}><Icons.Close /></button>
        </div>

        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('GLOBAL')}
            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'GLOBAL' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
          >메인 / 전체 설정</button>
          <button 
            onClick={() => setActiveTab('CAMPAIGN')}
            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'CAMPAIGN' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
          >캠페인 관리</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'GLOBAL' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">메인 배경 이미지 (순환)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {globalBackgrounds.map((bg, idx) => (
                    <div key={idx} className="relative aspect-video bg-slate-800 rounded overflow-hidden group border border-slate-700">
                      <img src={bg} className="w-full h-full object-cover" alt="bg" />
                      <button 
                        onClick={() => removeGlobalBg(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icons.Trash size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-700 hover:border-blue-500 rounded cursor-pointer transition-colors text-slate-500 hover:text-blue-500">
                    <Icons.Upload size={24} className="mb-2" />
                    <span className="text-xs">이미지 추가</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleGlobalBgUpload} />
                  </label>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'CAMPAIGN' && (
            <div className="flex flex-col md:flex-row gap-6 h-full">
               {/* Sidebar List */}
               <div className="w-full md:w-1/3 border-r border-slate-800 pr-0 md:pr-6 space-y-4">
                 <button 
                   onClick={() => setIsCreating(true)}
                   className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold flex items-center justify-center gap-2"
                 >
                   <Icons.Plus size={16} /> 신규 캠페인
                 </button>
                 
                 {isCreating && (
                   <div className="p-3 bg-slate-800 rounded border border-slate-700 animate-in fade-in slide-in-from-top-2">
                     <input 
                       className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm mb-2" 
                       placeholder="캠페인 이름"
                       value={newCampName}
                       onChange={e => setNewCampName(e.target.value)}
                     />
                     <select 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm mb-2"
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
                       <button onClick={() => setIsCreating(false)} className="text-xs text-slate-400 hover:text-white">취소</button>
                       <button onClick={createCampaign} className="text-xs text-blue-400 hover:text-blue-300 font-bold">생성</button>
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
                       className={`w-full text-left px-3 py-2 rounded text-sm truncate flex items-center gap-2 ${selectedCampaignId === c.id ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/50'}`}
                     >
                       {c.logoUrl ? (
                         <img src={c.logoUrl} className="w-6 h-6 rounded-full object-cover" />
                       ) : <div className="w-6 h-6 rounded-full bg-slate-700" />}
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
                        <div className="relative w-24 h-24 rounded-full bg-slate-800 overflow-hidden border border-slate-600 flex-shrink-0 group">
                           {selectedCampaign.logoUrl ? (
                             <img src={selectedCampaign.logoUrl} className="w-full h-full object-cover" />
                           ) : <Icons.Image className="w-full h-full p-6 text-slate-600" />}
                           <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                             <Icons.Upload className="text-white" />
                             <input type="file" className="hidden" onChange={async (e) => {
                                if(e.target.files?.[0]) {
                                  const url = await fileToBase64(e.target.files[0]);
                                  onUpdateCampaign({...selectedCampaign, logoUrl: url});
                                }
                             }} />
                           </label>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-500 block mb-1">캠페인 이름</label>
                          <input 
                            value={selectedCampaign.name}
                            onChange={(e) => onUpdateCampaign({...selectedCampaign, name: e.target.value})}
                            className="w-full bg-slate-800 border-b border-slate-600 p-2 text-white focus:outline-none focus:border-blue-500 mb-2"
                          />
                           <label className="text-xs font-bold text-slate-500 block mb-1">부제 (영어)</label>
                          <input 
                            value={selectedCampaign.subTitle || ''}
                            onChange={(e) => onUpdateCampaign({...selectedCampaign, subTitle: e.target.value})}
                            className="w-full bg-slate-800 border-b border-slate-600 p-2 text-white focus:outline-none focus:border-blue-500"
                          />
                          <p className="text-xs text-slate-600 mt-2">
                            시스템: <span className="text-slate-400 font-mono">{selectedCampaign.system}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800">
                        <button 
                          onClick={() => onDeleteCampaign(selectedCampaign.id)}
                          className="px-4 py-2 border border-red-900 text-red-500 hover:bg-red-900/20 rounded text-sm flex items-center gap-2"
                        >
                          <Icons.Trash size={14} /> 캠페인 삭제 (암호 필요)
                        </button>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-600">캠페인을 선택하세요</div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;