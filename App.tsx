import React, { useState, useEffect } from 'react';
import { loadFullState, checkDatabaseConnection, saveCharacter as dbSaveCharacter, saveCampaign as dbSaveCampaign, deleteCharacter as dbDeleteCharacter, deleteCampaign as dbDeleteCampaign, saveSettings as dbSaveSettings, addComment as dbAddComment, deleteComment as dbDeleteComment } from './services/storage';
import { AppState, Campaign, Character, CharacterComment } from './types';
import Layout from './components/Layout';
import MainDashboard from './components/views/MainDashboard';
import CampaignDashboard from './components/views/CampaignDashboard';
import CharacterDetail from './components/views/CharacterDetail';
import DatabaseSetup from './components/views/DatabaseSetup';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';
import { Icons } from './components/ui/Icons';
import { INITIAL_STATE, THEMES, THEME_KEYS } from './constants';

const App: React.FC = () => {
  // --- 상태 관리 ---
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
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
  const init = async () => {
    setLoading(true);
    setDbError(null);

    // 1. DB 연결/테이블 존재 여부 체크
    const connectionError = await checkDatabaseConnection();
    if (connectionError) {
      console.error("DB Connection Error:", connectionError);
      // PGRST205: Relation not found (테이블 없음)
      // 42P01: Postgres undefined table
      if (connectionError.code === 'PGRST205' || connectionError.code === '42P01' || connectionError.message.includes('not find the table')) {
        setDbError(connectionError.message);
        setLoading(false);
        return;
      }
    }

    // 2. 데이터 로드
    const fetched = await loadFullState();
    setData(fetched);
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  // 에러 화면 (DB 미설정 등)
  if (dbError) {
    return <DatabaseSetup onRetry={init} errorMsg={dbError} />;
  }

  // 로딩 중 표시
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin text-blue-500"><Icons.Refresh size={48} /></div>
        <p className="text-slate-400">데이터베이스 동기화 중...</p>
      </div>
    );
  }

  // --- 액션 핸들러 ---
  
  // 에러 헬퍼
  const handleError = (e: any, defaultMsg: string) => {
    console.error(e);
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    
    // 테이블 없음 에러 발생 시 초기화 화면으로 유도
    if (msg.includes('relation') && msg.includes('does not exist') || msg.includes('not find the table')) {
       setDbError(msg);
       return;
    }

    alert(`${defaultMsg}\n\n상세 에러: ${msg}`);
  };

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
      handleError(e, "캐릭터 저장 중 오류가 발생했습니다.");
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
          handleError(e, "캐릭터 삭제 중 오류가 발생했습니다.");
        }
      }
    });
  };

  // 코멘트 CRUD
  const handleAddComment = async (comment: CharacterComment) => {
     try {
       await dbAddComment(comment);
       setData(prev => {
         if(!prev) return null;
         const charIndex = prev.characters.findIndex(c => c.id === comment.characterId);
         if(charIndex === -1) return prev;
         
         const updatedChar = {
            ...prev.characters[charIndex],
            comments: [...(prev.characters[charIndex].comments || []), comment]
         };
         
         const newChars = [...prev.characters];
         newChars[charIndex] = updatedChar;
         return { ...prev, characters: newChars };
       });
     } catch (e) {
       handleError(e, "코멘트 작성 실패");
     }
  };

  const handleDeleteComment = async (commentId: string, characterId: string) => {
    try {
      await dbDeleteComment(commentId);
      setData(prev => {
        if(!prev) return null;
        const charIndex = prev.characters.findIndex(c => c.id === characterId);
        if(charIndex === -1) return prev;

        const updatedChar = {
           ...prev.characters[charIndex],
           comments: prev.characters[charIndex].comments.filter(c => c.id !== commentId)
        };

        const newChars = [...prev.characters];
        newChars[charIndex] = updatedChar;
        return { ...prev, characters: newChars };
      });
    } catch (e) {
      handleError(e, "코멘트 삭제 실패");
    }
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
      handleError(e, "캠페인 업데이트 실패");
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
      handleError(e, "캠페인 생성 실패");
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
          handleError(e, "캠페인 삭제 실패");
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
      handleError(e, "설정 저장 실패");
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

  // Determine Theme
  const activeTheme = activeCampaign?.theme ? THEMES[activeCampaign.theme] : THEMES[THEME_KEYS.ADVENTURE];

  return (
    <Layout 
      backgrounds={currentBackgrounds}
      themeClasses={activeCampaign ? activeTheme.classes : undefined}
    >
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
          // Comment handlers
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
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