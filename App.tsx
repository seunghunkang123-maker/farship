
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

  // 진상(Truth) 모드 상태 관리
  const [revealedCharacterIds, setRevealedCharacterIds] = useState<Set<string>>(new Set());
  const [isGlobalReveal, setIsGlobalReveal] = useState(false);

  // 이름 블러 해제 상태 관리 (New)
  const [nameRevealedIds, setNameRevealedIds] = useState<Set<string>>(new Set());

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

  // 에러 화면
  if (dbError) {
    return <DatabaseSetup onRetry={init} errorMsg={dbError} />;
  }

  // 로딩 중 표시
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#1c1917] flex flex-col items-center justify-center text-stone-200 gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950/80 to-black pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 mb-4 text-amber-600 animate-pulse">
             <Icons.Ship size={64} strokeWidth={1} />
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }} />
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="mt-4 text-sm font-serif text-amber-500/80 tracking-widest uppercase">
            Loading Archives...
          </p>
        </div>
      </div>
    );
  }

  // --- 액션 핸들러 ---
  
  const handleError = (e: any, defaultMsg: string) => {
    console.error(e);
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    const code = (e as any)?.code;

    if (
      code === 'PGRST204' || 
      code === 'PGRST205' || 
      code === '42P01' || 
      code === '42703' ||
      msg.includes('does not exist') || 
      msg.includes('not find the table') ||
      msg.includes('not find the') 
    ) {
       setDbError(`${defaultMsg}\n(데이터베이스 스키마 업데이트가 필요합니다. 아래 2번 업데이트 쿼리를 실행하세요)\n\n상세 에러: ${msg}`);
       return;
    }

    alert(`${defaultMsg}\n\n상세 에러: ${msg}`);
  };

  // 네비게이션
  const goToCampaign = (id: string) => {
    setActiveCampaignId(id);
    setCurrentView('CAMPAIGN');
    // 캠페인 진입 시 진상 상태 초기화 (원하면 주석 처리)
    setRevealedCharacterIds(new Set());
    setNameRevealedIds(new Set()); // 이름 블러 해제 초기화
    setIsGlobalReveal(false);
  };

  const goHome = () => {
    setActiveCampaignId(null);
    setCurrentView('HOME');
  };

  // Truth Reveal Handlers
  const toggleCharacterReveal = (id: string, forceState?: boolean) => {
    setRevealedCharacterIds(prev => {
      const next = new Set(prev);
      const shouldReveal = forceState !== undefined ? forceState : !next.has(id);
      
      if (shouldReveal) next.add(id);
      else next.delete(id);
      
      return next;
    });
  };

  const toggleGlobalReveal = () => {
    setIsGlobalReveal(prev => !prev);
  };

  // Name Blur Reveal Handlers
  const toggleNameReveal = (id: string, forceState?: boolean) => {
    setNameRevealedIds(prev => {
      const next = new Set(prev);
      const shouldReveal = forceState !== undefined ? forceState : !next.has(id);
      if (shouldReveal) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // 캐릭터 CRUD
  const saveCharacter = async (char: Character) => {
    try {
      await dbSaveCharacter(char);
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
      // 저장 후 창을 닫지 않거나, 닫는 로직은 CharacterDetail 내부에서 처리
      // setActiveCharacterId(null); // (CharacterDetail에서 처리)
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

  const activeTheme = activeCampaign?.theme ? THEMES[activeCampaign.theme] : THEMES[THEME_KEYS.ADVENTURE];

  return (
    <Layout themeClasses={activeCampaign ? activeTheme.classes : undefined}>
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
          // Pass Truth Reveal State
          revealedCharacterIds={revealedCharacterIds}
          isGlobalReveal={isGlobalReveal}
          onToggleGlobalReveal={toggleGlobalReveal}
          // Pass Name Blur State
          nameRevealedIds={nameRevealedIds}
        />
      )}

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
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          // Pass Truth Reveal State
          isGlobalReveal={isGlobalReveal}
          isRevealed={activeCharacterId ? revealedCharacterIds.has(activeCharacterId) : false}
          onToggleReveal={(id, state) => toggleCharacterReveal(id, state)}
          // Pass Name Blur State
          isNameRevealed={activeCharacterId ? nameRevealedIds.has(activeCharacterId) : false}
          onToggleNameReveal={(id, state) => toggleNameReveal(id, state)}
        />
      )}

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
