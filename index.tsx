import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore (Supabase 라이브러리 인식 오류 방지)
import { createClient } from '@supabase/supabase-js';
import { Upload, Image as ImageIcon, Loader2, Users } from 'lucide-react';

// 사용자님의 정보 반영
const SUPABASE_URL = 'https://udzvkpkarlnegmxcxsdr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_G2WRJ8UTeVMQRhEtz5TubQ_YZdeDcqi';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  const [uploading, setUploading] = useState(false);
  const [characterList, setCharacterList] = useState<any[]>([]);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const { data, error } = await supabaseClient
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
      
      const { error: storageError } = await supabaseClient.storage
        .from('farship-images')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabaseClient.storage.from('farship-images').getPublicUrl(fileName);

      const { error: dbError } = await supabaseClient
        .from('characters')
        .insert([{ image_url: publicUrl }]);

      if (dbError) throw dbError;

      fetchCharacters();
      alert('캐릭터가 공용 DB에 등록되었습니다!');
      
    } catch (error: any) {
      alert('오류 발생: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
          <h1 className="text-3xl font-black text-blue-400 flex items-center gap-2">
            <Users size={32} /> 원양어선 공동 데이터베이스
          </h1>
          <label className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all shadow-lg active:scale-95">
            {uploading ? '업로드 중...' : '신규 캐릭터 등록'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characterList.map((char) => (
            <div key={char.id} className="bg-slate-900/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <div className="aspect-[3/4] bg-slate-800">
                <img src={char.image_url} className="w-full h-full object-cover" alt="Character" loading="lazy" />
              </div>
              <div className="p-4 text-center text-xs text-slate-500">
                등록일: {new Date(char.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 중복 선언 에러 방지를 위한 변수명 수정
const container = document.getElementById('root');
if (container) {
  const reactRoot = createRoot(container);
  reactRoot.render(<App />);
}
