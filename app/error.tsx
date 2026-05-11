"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fixed inset-0 bg-[#050505] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="font-display text-5xl text-white tracking-tighter mb-3">oops.</h1>
        <p className="text-[#a0a0a0] text-sm mb-6">Something went wrong on our end. Try refreshing — your progress is saved locally.</p>
        <button
          onClick={reset}
          className="w-full py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
