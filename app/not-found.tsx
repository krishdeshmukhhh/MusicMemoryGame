import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Not Found | pitchd.',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative w-full h-full min-h-[80vh]">
      <div className="w-full max-w-lg text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-8xl sm:text-[9rem] font-display text-white mb-2 tracking-tighter leading-none">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-sans text-text-muted mb-8 tracking-widest uppercase">
          Note Not Found
        </h2>
        
        <p className="text-[#a0a0a0] mb-12 font-sans leading-relaxed px-4">
          It looks like your ears wandered a bit too far off pitch. The frequency you are looking for doesn't exist.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs sm:text-sm shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
        >
          Return to Base
        </Link>
      </div>
    </main>
  );
}
