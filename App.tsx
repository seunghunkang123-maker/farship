
import React, { useState, useEffect, useRef } from 'react';
import { loadFullState, checkDatabaseConnection, saveCharacter as dbSaveCharacter, saveCampaign as dbSaveCampaign, deleteCharacter as dbDeleteCharacter, deleteCampaign as dbDeleteCampaign, saveSettings as dbSaveSettings, addComment as dbAddComment, updateComment as dbUpdateComment, deleteComment as dbDeleteComment, subscribeToChanges } from './services/storage';
import { AppState, Campaign, Character, CharacterComment } from './types';
import Layout from './components/Layout';
import MainDashboard from './components/views/MainDashboard';
import CampaignDashboard from './components/views/CampaignDashboard';
import CharacterDetail from './components/views/CharacterDetail';
import DatabaseSetup from './components/views/DatabaseSetup';
import AllCharactersView from './components/views/AllCharactersView';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';
import { Icons } from './components/ui/Icons';
import { INITIAL_STATE, THEMES, THEME_KEYS } from './constants';

const App: React.FC = () => {
  // --- 상태 관리 ---
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 네비게이션 상태
  const [currentView, setCurrentView] = useState<'HOME' | 'CAMPAIGN' | 'ALL_CHARACTERS'>('HOME');
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

  // Debounce Timer Ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 초기 로딩 및 Realtime 구독 ---
  const init = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsSyncing(true);

    if (showLoading) setDbError(null);

    // 1. DB 연결/테이블 존재 여부 체크 (최초 1회만 strict하게 체크)
    if (!data && showLoading) {
      const connectionError = await checkDatabaseConnection();
      if (connectionError) {
        console.error("DB Connection Error:", connectionError);
        // PGRST205 or 42P01: Table not found
        // 42703: Column not found
        const errMsg = connectionError.message || "";
        
        // Handle Network/URL errors specifically
        if (errMsg.includes('Failed to fetch') || errMsg.includes('error parsing URL')) {
           setDbError("서버에 연결할 수 없습니다.\n\n[해결 방법]\n1. Vercel 배포 환경이라면, Settings > Environment Variables 메뉴에\n   'VITE_SUPABASE_URL'과 'VITE_SUPABASE_ANON_KEY'가 올바르게 설정되었는지 확인하세요.\n2. 이전된 Supabase 프로젝트가 활성화 상태인지 확인하세요.");
           setLoading(false);
           setIsSyncing(false);
           return;
        }

        if (connectionError.code === 'PGRST205' || connectionError.code === '42P01' || errMsg.includes('not find the table') || errMsg.includes('relation "public.campaigns" does not exist')) {
          setDbError(connectionError.message);
          setLoading(false);
          setIsSyncing(false);
          return;
        }
      }
    }

    // 2. 데이터 로드 (Safe Fetch)
    try {
      const fetched = await loadFullState();
      setData(fetched);
    } catch (e) {
      console.error("Load failed:", e);
      if (showLoading) {
         // Check if it is a specific DB error that requires setup
         const errCode = (e as any)?.code;
         const errMsg = (e as any)?.message || "";
         
         if (errMsg.includes('Failed to fetch') || errMsg.includes('error parsing URL')) {
             setDbError("서버에 연결할 수 없습니다.\n\n[해결 방법]\n1. Vercel 배포 환경이라면, Settings > Environment Variables 메뉴에\n   'VITE_SUPABASE_URL'과 'VITE_SUPABASE_ANON_KEY'가 설정되어 있는지 확인하세요.\n2. .env 파일이 Git에 포함되지 않았으므로 Vercel에서 직접 설정해야 합니다.");
         } else if (errCode === '42P01' || errMsg.includes('does not exist')) {
             setDbError(`데이터베이스 초기화가 필요합니다.\n(${errMsg})`);
         } else {
             setDbError("데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.\n상세 에러: " + errMsg);
         }
      } else {
         console.warn("Background refresh failed. Keeping existing data to prevent data loss.");
      }
    } finally {
      if (showLoading) setLoading(false);
      else setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    init(true);

    // Realtime 구독 설정 (with Debounce)
    const unsubscribe = subscribeToChanges(() => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer (Debounce for 1 second)
      // This prevents rapid-fire updates from deleting/inserting file rows
      debounceTimerRef.current = setTimeout(() => {
        console.log("Remote changes detected (debounced). Refreshing...");
        init(false);
      }, 1000);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // 에러 화면
  if (dbError) {
    return <DatabaseSetup onRetry={() => init(true)} errorMsg={dbError} />;
  }

  // 로딩 중 표시 (최초 로드 시에만)
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
    // 캠페인 진입 시 진상 상태 초기화
    setRevealedCharacterIds(new Set());
    setNameRevealedIds(new Set()); 
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
    // Global Toggle 시 개별 상태 초기화하여 일관성 유지
    setRevealedCharacterIds(new Set());
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
      // setData 업데이트는 Realtime 구독이 자동으로 처리할 수도 있지만,
      // 사용자 경험(즉각적 반응)을 위해 로컬 상태도 같이 업데이트합니다.
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
       // Optimistic update
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

  const handleUpdateComment = async (comment: CharacterComment) => {
    try {
      await dbUpdateComment(comment);
      setData(prev => {
         if(!prev) return null;
         const charIndex = prev.characters.findIndex(c => c.id === comment.characterId);
         if(charIndex === -1) return prev;

         const oldComments = prev.characters[charIndex].comments || [];
         const updatedComments = oldComments.map(c => c.id === comment.id ? comment : c);
         
         const updatedChar = {
            ...prev.characters[charIndex],
            comments: updatedComments
         };
         
         const newChars = [...prev.characters];
         newChars[charIndex] = updatedChar;
         return { ...prev, characters: newChars };
      });
    } catch (e) {
      handleError(e, "코멘트 수정 실패");
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
    
  // activeCampaign이 있으면 그것만, 없으면 빈 배열 (하지만 CharacterDetail에서 activeCampaignId가 필수여서 보통 activeCampaignId를 참조)
  const campaignCharacters = activeCampaignId 
    ? data.characters.filter(c => c.campaignId === activeCampaignId)
    : [];

  const activeCharacter = activeCharacterId 
    ? data.characters.find(c => c.id === activeCharacterId)
    : null;

  // activeCampaign이 없을 때 (All View 등)에서 테마를 정할 필요가 있다면 기본 테마 사용
  const activeTheme = activeCampaign?.theme ? THEMES[activeCampaign.theme] : THEMES[THEME_KEYS.ADVENTURE];

  return (
    <Layout themeClasses={activeCampaign ? activeTheme.classes : undefined}>
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50">
           <div className="bg-black/80 backdrop-blur text-amber-500 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-amber-500/30 animate-pulse">
              <Icons.Refresh size={12} className="animate-spin" />
              Syncing...
           </div>
        </div>
      )}

      {currentView === 'HOME' && (
        <MainDashboard 
          campaigns={data.campaigns}
          onSelectCampaign={goToCampaign}
          onOpenSettings={() => {
            setSettingsStartTab('GLOBAL');
            setIsSettingsOpen(true);
          }}
          onOpenAllCharacters={() => setCurrentView('ALL_CHARACTERS')}
        />
      )}

      {currentView === 'ALL_CHARACTERS' && (
        <AllCharactersView
          campaigns={data.campaigns}
          characters={data.characters}
          onBack={goHome}
          onSelectCharacter={(id) => {
             // Find campaign for this char
             const char = data.characters.find(c => c.id === id);
             if (char) {
               setActiveCampaignId(char.campaignId);
               setActiveCharacterId(id);
               // We stay in ALL_CHARACTERS view logically in app state, but we render Detail modal on top.
               // Or better: switch context so Detail works properly.
               // CharacterDetail requires an activeCampaign prop.
             }
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
          revealedCharacterIds={revealedCharacterIds}
          isGlobalReveal={isGlobalReveal}
          onToggleGlobalReveal={toggleGlobalReveal}
          nameRevealedIds={nameRevealedIds}
          onUpdateCampaign={updateCampaign}
        />
      )}

      {/* Detail Modal Layer */}
      {(activeCharacterId || isCreatingCharacter) && (
        <CharacterDetail 
          character={activeCharacter || null}
          // Fallback to finding campaign if activeCampaign is null (e.g. from All View)
          campaign={activeCampaign || data.campaigns.find(c => c.id === activeCharacter?.campaignId)!}
          allCharacters={data.characters} 
          allCampaigns={data.campaigns} // Pass all campaigns for tag resolution
          isEditingNew={isCreatingCharacter}
          onSave={saveCharacter}
          onDelete={confirmDeleteCharacter}
          onClose={() => {
            setActiveCharacterId(null);
            setIsCreatingCharacter(false);
          }}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          isGlobalReveal={isGlobalReveal}
          isRevealed={activeCharacterId ? revealedCharacterIds.has(activeCharacterId) : false}
          onToggleReveal={(id, state) => toggleCharacterReveal(id, state)}
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
