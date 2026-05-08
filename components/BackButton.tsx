"use client";

import { useRouter } from 'next/navigation';

export default function BackButton({ label, fallback }: { label: string; fallback: string }) {
  const router = useRouter();

  const handleBack = () => {
    // If there's a real previous entry in the session, go back to it.
    // referrer check catches the case where the user landed directly on the article
    // (e.g. from Google) — in that case we navigate to the fallback instead.
    if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-text-muted hover:text-white transition-colors text-sm uppercase tracking-widest mb-12 inline-block"
    >
      ← {label}
    </button>
  );
}
