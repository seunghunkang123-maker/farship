import React, { useState } from 'react';
import { Character, CharacterAsset } from '../../../types';
import { Icons } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  character: Character;
  isEditing: boolean;
  onChange: (updated: Character) => void;
}

const ASSET_TYPES: { value: CharacterAsset['assetType']; label: string; icon: any }[] = [
  { value: 'EQUIPMENT', label: '장비', icon: Icons.Sword },
  { value: 'SPELL', label: '주문', icon: Icons.Scroll },
  { value: 'ARTIFACT', label: '유물', icon: Icons.Gem },
  { value: 'CYBERWARE', label: '사이버웨어', icon: Icons.Cpu },
  { value: 'ABILITY', label: '특수능력', icon: Icons.Zap },
  { value: 'OTHER', label: '기타', icon: Icons.Box },
];

const CharacterAssetsTab: React.FC<Props> = ({ character, isEditing, onChange }) => {
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [tempAsset, setTempAsset] = useState<CharacterAsset | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const assets = character.assets || [];

  const handleAdd = () => {
    const newAsset: CharacterAsset = {
      id: crypto.randomUUID(),
      characterId: character.id,
      name: '',
      assetType: 'EQUIPMENT',
      description: '',
      status: 'Active',
      isSecret: false
    };
    setTempAsset(newAsset);
    setEditingAssetId(newAsset.id);
  };

  const handleEdit = (asset: CharacterAsset) => {
    setTempAsset({ ...asset });
    setEditingAssetId(asset.id);
  };

  const handleSave = () => {
    if (!tempAsset || !tempAsset.name.trim()) return;

    let newAssets = [...assets];
    const index = newAssets.findIndex(a => a.id === tempAsset.id);
    
    if (index >= 0) {
      newAssets[index] = tempAsset;
    } else {
      newAssets.push(tempAsset);
    }

    onChange({ ...character, assets: newAssets });
    setEditingAssetId(null);
    setTempAsset(null);
  };

  const handleDelete = (id: string) => {
    const newAssets = assets.filter(a => a.id !== id);
    onChange({ ...character, assets: newAssets });
    setConfirmDeleteId(null);
  };

  const handleCancel = () => {
    setEditingAssetId(null);
    setTempAsset(null);
  };

  // Group assets by type
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.assetType]) acc[asset.assetType] = [];
    acc[asset.assetType].push(asset);
    return acc;
  }, {} as Record<string, CharacterAsset[]>);

  return (
    <div className="space-y-8 p-1">
      {/* Header / Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif text-stone-400">장비 및 능력</h3>
        {isEditing && !editingAssetId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            <Icons.Plus size={16} />
            <span>추가</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {editingAssetId && tempAsset && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-stone-900/50 border border-stone-700 rounded-xl p-4 space-y-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">이름</label>
                <input
                  value={tempAsset.name}
                  onChange={e => setTempAsset({ ...tempAsset, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                  placeholder="아이템/능력 이름"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">유형</label>
                <select
                  value={tempAsset.assetType}
                  onChange={e => setTempAsset({ ...tempAsset, assetType: e.target.value as any })}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">설명</label>
              <textarea
                value={tempAsset.description}
                onChange={e => setTempAsset({ ...tempAsset, description: e.target.value })}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none min-h-[80px]"
                placeholder="효과, 외형, 역사 등..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">상태 (선택)</label>
                <input
                  value={tempAsset.status || ''}
                  onChange={e => setTempAsset({ ...tempAsset, status: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-amber-700 outline-none"
                  placeholder="예: 파손됨, 강화됨, 분실"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input 
                  type="checkbox" 
                  id="asset-secret"
                  checked={tempAsset.isSecret}
                  onChange={e => setTempAsset({ ...tempAsset, isSecret: e.target.checked })}
                  className="w-4 h-4 bg-stone-950 border-stone-800 rounded text-amber-600 focus:ring-amber-900"
                />
                <label htmlFor="asset-secret" className="text-xs text-stone-400 cursor-pointer">비밀 설정 (진상 모드에서만 보임)</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-stone-500 hover:text-stone-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
              >
                저장
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset List */}
      {assets.length === 0 && !editingAssetId ? (
        <div className="text-center py-12 text-stone-600 border border-dashed border-stone-800 rounded-xl">
          <Icons.Box className="mx-auto mb-2 opacity-50" size={32} />
          <p>등록된 장비나 능력이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {ASSET_TYPES.map(type => {
            const typeAssets = groupedAssets[type.value];
            if (!typeAssets?.length) return null;

            return (
              <div key={type.value}>
                <div className="flex items-center gap-2 mb-3 text-stone-500 border-b border-stone-800 pb-1">
                  <type.icon size={16} />
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="group relative bg-stone-900/30 border border-stone-800 rounded-xl p-4 hover:border-stone-600 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-stone-200">{asset.name}</h4>
                          {asset.isSecret && <Icons.Lock size={12} className="text-amber-600" />}
                        </div>
                        {asset.status && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-800 text-stone-400 rounded border border-stone-700">
                            {asset.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-400 whitespace-pre-wrap leading-relaxed">
                        {asset.description}
                      </p>
                      
                      {asset.linkUrl && (
                        <a 
                          href={asset.linkUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 mt-2"
                        >
                          <Icons.Link size={10} />
                          참조 링크
                        </a>
                      )}

                      {isEditing && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded p-1">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-1 text-stone-400 hover:text-amber-500 transition-colors"
                            title="수정"
                          >
                            <Icons.Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirmDeleteId === asset.id) {
                                handleDelete(asset.id);
                              } else {
                                setConfirmDeleteId(asset.id);
                                setTimeout(() => setConfirmDeleteId(null), 3000);
                              }
                            }}
                            className={`p-1 transition-colors ${confirmDeleteId === asset.id ? 'text-red-500 bg-red-500/10 rounded' : 'text-stone-400 hover:text-red-500'}`}
                            title={confirmDeleteId === asset.id ? "한 번 더 눌러 삭제" : "삭제"}
                          >
                            <Icons.Trash size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CharacterAssetsTab;
