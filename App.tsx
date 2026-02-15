import React, { useState, useEffect } from 'react';
import { loadFullState, saveCharacter as dbSaveCharacter, saveCampaign as dbSaveCampaign, deleteCharacter as dbDeleteCharacter, deleteCampaign as dbDeleteCampaign, saveSettings as dbSaveSettings } from './services/storage';
import { AppState, Campaign, Character } from './types';
import Layout from './components/Layout';
import MainDashboard from './components/views/MainDashboard';
import CampaignDashboard from './components/views/CampaignDashboard';
import CharacterDetail from './components/views/CharacterDetail';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';
import { Icons } from './components/ui/Icons';
import { INITIAL_STATE } from './constants';

const App: React.FC = () => {
  // --- 상태 관리 ---
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 네비게이션 상태
  const [currentView, setCurrentView] = useState<'HOME' | 'CAMPAIGN'>('HOME');
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null); 
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);

  // 모달 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsStartTab, setSettingsStartTab] = useState<'GLOBAL' | 'CAMPAIGN'>('GLOBAL');
  
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: () => void;
    title: string;
  }>({ isOpen: false, action: () => {}, title: '' });

  // --- 초기 로딩 ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fetched = await loadFullState();
      setData(fetched);
      setLoading(false);
    };
    init();
  }, []);

  // 로딩 중 표시
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin text-blue-500"><Icons.Refresh size={48} /></div>
        <p className="text-slate-400">서버와 통신 중입니다...</p>
      </div>
    );
  }

  // --- 액션 핸들러 ---

  // 네비게이션
  const goToCampaign = (id: string) => {
    setActiveCampaignId(id);
    setCurrentView('CAMPAIGN');
  };

  const goHome = () => {
    setActiveCampaignId(null);
    setCurrentView('HOME');
  };

  // 캐릭터 CRUD
  const saveCharacter = async (char: Character) => {
    try {
      // 1. DB 업데이트
      await dbSaveCharacter(char);
      
      // 2. 로컬 상태 업데이트 (화면 즉시 반영)
      setData(prev => {
        if (!prev) return null;
        const existingIdx = prev.characters.findIndex(c => c.id === char.id);
        let newChars;
        if (existingIdx >= 0) {
          newChars = [...prev.characters];
          newChars[existingIdx] = char;
        } else {
          newChars = [...prev.characters, char];
        }
        return { ...prev, characters: newChars };
      });
      setActiveCharacterId(null);
      setIsCreatingCharacter(false);
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  const confirmDeleteCharacter = (id: string) => {
    setPasswordModal({
      isOpen: true,
      title: '캐릭터 삭제',
      action: async () => {
        try {
          await dbDeleteCharacter(id);
          setData(prev => prev ? ({
            ...prev,
            characters: prev.characters.filter(c => c.id !== id)
          }) : null);
          setActiveCharacterId(null);
          setIsCreatingCharacter(false);
        } catch (e) {
          alert("삭제 중 오류가 발생했습니다.");
          console.error(e);
        }
      }
    });
  };

  // 캠페인 CRUD
  const updateCampaign = async (updated: Campaign) => {
    try {
      await dbSaveCampaign(updated);
      setData(prev => prev ? ({
        ...prev,
        campaigns: prev.campaigns.map(c => c.id === updated.id ? updated : c)
      }) : null);
    } catch (e) {
      console.error(e);
      alert("캠페인 업데이트 실패");
    }
  };

  const addCampaign = async (newCamp: Campaign) => {
    try {
      await dbSaveCampaign(newCamp);
      setData(prev => prev ? ({
        ...prev,
        campaigns: [...prev.campaigns, newCamp]
      }) : null);
    } catch (e) {
      console.error(e);
      alert("캠페인 생성 실패");
    }
  };

  const confirmDeleteCampaign = (id: string) => {
    setPasswordModal({
      isOpen: true,
      title: '캠페인 삭제',
      action: async () => {
        try {
          await dbDeleteCampaign(id);
          setData(prev => prev ? ({
            ...prev,
            campaigns: prev.campaigns.filter(c => c.id !== id),
            characters: prev.characters.filter(c => c.campaignId !== id)
          }) : null);
          if (activeCampaignId === id) goHome();
        } catch (e) {
          console.error(e);
          alert("삭제 실패");
        }
      }
    });
  };

  // 글로벌 설정 (배경 등)
  const updateGlobalBackgrounds = async (bgs: string[]) => {
    if (!data) return;
    try {
      await dbSaveSettings(data.password, bgs);
      setData(prev => prev ? ({ ...prev, globalBackgrounds: bgs }) : null);
    } catch (e) {
      console.error(e);
      alert("설정 저장 실패");
    }
  };

  // --- 화면 데이터 계산 ---
  const activeCampaign = activeCampaignId 
    ? data.campaigns.find(c => c.id === activeCampaignId) 
    : null;
    
  const campaignCharacters = activeCampaignId 
    ? data.characters.filter(c => c.campaignId === activeCampaignId)
    : [];

  const activeCharacter = activeCharacterId 
    ? data.characters.find(c => c.id === activeCharacterId)
    : null;

  const currentBackgrounds = (activeCampaign && activeCampaign.backgroundImages.length > 0)
    ? activeCampaign.backgroundImages
    : data.globalBackgrounds;

  return (
    <Layout backgrounds={currentBackgrounds}>
      {currentView === 'HOME' && (
        <MainDashboard 
          campaigns={data.campaigns}
          onSelectCampaign={goToCampaign}
          onOpenSettings={() => {
            setSettingsStartTab('GLOBAL');
            setIsSettingsOpen(true);
          }}
        />
      )}

      {currentView === 'CAMPAIGN' && activeCampaign && (
        <CampaignDashboard 
          campaign={activeCampaign}
          characters={campaignCharacters}
          onBack={goHome}
          onSelectCharacter={(id) => setActiveCharacterId(id)}
          onAddCharacter={() => {
            setActiveCharacterId(null);
            setIsCreatingCharacter(true);
          }}
          onOpenSettings={() => {
            setSettingsStartTab('CAMPAIGN');
            setIsSettingsOpen(true);
          }}
        />
      )}

      {/* 캐릭터 상세 / 편집 모달 */}
      {(activeCharacterId || isCreatingCharacter) && activeCampaign && (
        <CharacterDetail 
          character={activeCharacter || null}
          campaign={activeCampaign}
          isEditingNew={isCreatingCharacter}
          onSave={saveCharacter}
          onDelete={confirmDeleteCharacter}
          onClose={() => {
            setActiveCharacterId(null);
            setIsCreatingCharacter(false);
          }}
        />
      )}

      {/* 설정 모달 */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        campaigns={data.campaigns}
        globalBackgrounds={data.globalBackgrounds}
        currentCampaignId={activeCampaignId || undefined}
        onUpdateCampaign={updateCampaign}
        onAddCampaign={addCampaign}
        onDeleteCampaign={confirmDeleteCampaign}
        onUpdateGlobalBackgrounds={updateGlobalBackgrounds}
      />

      {/* 비밀번호 확인 모달 */}
      <PasswordModal 
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal(p => ({ ...p, isOpen: false }))}
        onConfirm={passwordModal.action}
        storedPassword={data.password}
        title={passwordModal.title}
      />
    </Layout>
  );
};

export default App;