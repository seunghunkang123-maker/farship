import React, { useState } from 'react';
import { Icons } from '../ui/Icons';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  storedPassword: string;
  title?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onConfirm, storedPassword, title = "삭제 확인" }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === storedPassword) {
      onConfirm();
      setInput('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Icons.Lock size={18} className="text-red-400" />
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <Icons.Close size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-300 mb-4">
          작업을 수행하려면 비밀번호를 입력하십시오.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="비밀번호"
            className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-white focus:outline-none focus:border-blue-500`}
            autoFocus
          />
          
          {error && <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;