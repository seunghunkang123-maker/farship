import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Upload, Image as ImageIcon, Loader2, Users } from 'lucide-react';

// 사용자님의 정보 반영
const SUPABASE_URL = 'https://udzvkpkarlnegmxcxsdr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_G2WRJ8UTeVMQRhEtz5TubQ_YZdeDcqi';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  const [uploading, setUploading] = useState(false);
  const [characterList, setCharacterList] = useState<any[]>([]); // 공통 캐릭터 리스트

  // 1. 웹사이트 접속 시 '장부'에서 데이터 읽어오기
  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setCharacterList(data);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileName = `${Date.now()}_${file.name}`;
      
      // 2. Storage에 이미지 파일 저장
      const { error: storageError } = await supabase.storage
        .from('farship-images')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('farship-images').getPublicUrl(fileName);

      // 3. '장부(Table)'에 이미지 주소 기록 (중요: 여기서 공통 반영이 일어남)
      const { error: dbError } = await supabase
        .from('characters')
        .insert([{ image_url: publicUrl }]);

      if (dbError) throw dbError;

      // 4. 장부 업데이트 후 다시 불러오기
      fetchCharacters();
      alert('캐릭터가 공용 DB에 등록되었습니다!');
      
    } catch (error: any) {
      alert('오류 발생: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black text-blue-400 flex items-center gap-2">
            <Users size={32} /> 원양어선 공동 데이터베이스
          </h1>
          <label className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all">
            {uploading ? '업로드 중...' : '신규 캐릭터 등록'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </header>

        {/* 5. 공통 리스트 출력 구역 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characterList.map((char) => (
            <div key={char.id} className="glass-panel rounded-2xl overflow-hidden border border-white/10">
              <div className="aspect-square bg-slate-800">
                <img src={char.image_url} className="w-full h-full object-cover" alt="Character" />
              </div>
              <div className="p-4 text-center text-sm text-slate-400">
                등록일: {new Date(char.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
