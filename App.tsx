import React, { useState, useEffect } from 'react';
import { loadState, saveState } from './services/storage';
import { AppState, Campaign, Character } from './types';
import Layout from './components/Layout';
import MainDashboard from './components/views/MainDashboard';
import CampaignDashboard from './components/views/CampaignDashboard';
import CharacterDetail from './components/views/CharacterDetail';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';

const App: React.FC = () => {
  // --- State ---
  const [data, setData] = useState<AppState>(loadState);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'HOME' | 'CAMPAIGN'>('HOME');
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null); // If set, Detail Modal is open
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsStartTab, setSettingsStartTab] = useState<'GLOBAL' | 'CAMPAIGN'>('GLOBAL');
  
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: () => void;
    title: string;
  }>({ isOpen: false, action: () => {}, title: '' });

  // --- Effects ---
  useEffect(() => {
    saveState(data);
  }, [data]);

  // --- Actions ---

  // Navigation
  const goToCampaign = (id: string) => {
    setActiveCampaignId(id);
    setCurrentView('CAMPAIGN');
  };

  const goHome = () => {
    setActiveCampaignId(null);
    setCurrentView('HOME');
  };

  // Character CRUD
  const saveCharacter = (char: Character) => {
    setData(prev => {
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
  };

  const confirmDeleteCharacter = (id: string) => {
    setPasswordModal({
      isOpen: true,
      title: '캐릭터 삭제',
      action: () => {
        setData(prev => ({
          ...prev,
          characters: prev.characters.filter(c => c.id !== id)
        }));
        setActiveCharacterId(null);
        setIsCreatingCharacter(false);
      }
    });
  };

  // Campaign CRUD
  const updateCampaign = (updated: Campaign) => {
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const addCampaign = (newCamp: Campaign) => {
    setData(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, newCamp]
    }));
  };

  const confirmDeleteCampaign = (id: string) => {
    setPasswordModal({
      isOpen: true,
      title: '캠페인 삭제',
      action: () => {
        setData(prev => ({
          ...prev,
          campaigns: prev.campaigns.filter(c => c.id !== id),
          characters: prev.characters.filter(c => c.campaignId !== id)
        }));
        if (activeCampaignId === id) goHome();
      }
    });
  };

  // Global Settings
  const updateGlobalBackgrounds = (bgs: string[]) => {
    setData(prev => ({ ...prev, globalBackgrounds: bgs }));
  };

  // --- Derived Data ---
  const activeCampaign = activeCampaignId 
    ? data.campaigns.find(c => c.id === activeCampaignId) 
    : null;
    
  const campaignCharacters = activeCampaignId 
    ? data.characters.filter(c => c.campaignId === activeCampaignId)
    : [];

  const activeCharacter = activeCharacterId 
    ? data.characters.find(c => c.id === activeCharacterId)
    : null;

  // Determine Backgrounds to show
  // If in campaign and campaign has BGs, use them. Else use Global.
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

      {/* Character Detail / Edit Modal */}
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

      {/* Settings Modal */}
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

      {/* Password Modal */}
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