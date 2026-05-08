"use client";

import { useState, useCallback, useEffect } from 'react';

type ToastItem = { id: number; message: string; type: 'success' | 'error' };

let globalShow: ((msg: string, type?: 'success' | 'error') => void) | null = null;

export function showToast(msg: string, type: 'success' | 'error' = 'success') {
  globalShow?.(msg, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  useEffect(() => {
    globalShow = add;
    return () => { globalShow = null; };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-5 py-2.5 rounded-full text-xs font-sans tracking-widest uppercase shadow-xl animate-in slide-in-from-bottom-3 fade-in duration-300 ${
            t.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-white text-black'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
