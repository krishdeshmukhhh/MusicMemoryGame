import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type ArticleData = {
  title: string;
  description: string;
  date: string;
  sections: { heading: string; body: string }[];
  cta: string;
};

const ARTICLES: Record<string, ArticleData> = {
  'perfect-pitch-vs-relative-pitch': {
    title: 'Perfect Pitch vs. Relative Pitch: What Is the Difference?',
    description: 'A deep dive into absolute pitch recognition versus interval training, and how to test yourself.',
    date: '2026-04-30',
    cta: 'Test your pitch recognition right now.',
    sections: [
      {
        heading: 'Introduction',
        body: `If you have ever watched a musician identify a note in thin air — no reference, no instrument — you have witnessed what is known as absolute pitch, more commonly called perfect pitch. It is one of the most fascinating and debated abilities in music cognition, affecting roughly 1 in 10,000 people in the general population. But perfect pitch is far from the only way to have a "good ear." Relative pitch, the ability to identify musical intervals and relationships between notes, is arguably more important for practical musicianship and is a skill that virtually anyone can develop with deliberate practice.`
      },
      {
        heading: 'What Is Perfect Pitch?',
        body: `Perfect pitch (absolute pitch) is the rare ability to identify or produce a specific musical frequency without any external reference. Someone with perfect pitch can hear a car horn and say "That is an F-sharp," or sit down at a piano and play a requested note without hearing any other pitch first. Research published in the Journal of the Acoustical Society of America suggests that this ability has both genetic and environmental components. Children who begin intensive musical training before age six — particularly in tonal languages like Mandarin — are significantly more likely to develop it. Neuroimaging studies have found that people with perfect pitch tend to have a larger left planum temporale, a region of the brain's auditory cortex associated with pitch categorization and language processing.`
      },
      {
        heading: 'What Is Relative Pitch?',
        body: `Relative pitch is the ability to identify a note by comparing it to a known reference. If someone plays a C and then plays another note, a musician with strong relative pitch can identify the second note by recognizing the interval — the musical distance — between the two. This is the foundation of ear training curricula at music schools worldwide. Methods like the Kodály approach, solfège (do-re-mi), and interval recognition drills all build relative pitch. Unlike perfect pitch, relative pitch can be learned at any age. Jazz improvisers, choir singers, and studio musicians all rely heavily on relative pitch to navigate chord changes, harmonize in real-time, and transcribe music by ear.`
      },
      {
        heading: 'How Do They Compare?',
        body: `Perfect pitch and relative pitch are complementary, not competing, skills. Perfect pitch gives you an instant label for any frequency — useful for tuning, transcription, and composition. Relative pitch gives you the ability to understand harmonic context — how notes relate to each other within a key or progression. Many professional musicians have strong relative pitch but no perfect pitch at all. In fact, some researchers argue that over-reliance on perfect pitch can actually hinder musical flexibility, since music is fundamentally about relationships between sounds, not absolute frequencies. A musician with excellent relative pitch can transpose, improvise, and adapt in ways that raw frequency identification alone cannot provide.`
      },
      {
        heading: 'Can You Develop Perfect Pitch as an Adult?',
        body: `The short answer is: probably not true absolute pitch, but you can get remarkably close. Studies from the University of Chicago have shown that adults can improve their pitch identification accuracy through intensive training, though they rarely achieve the effortless, automatic categorization that characterizes true absolute pitch developed in childhood. What adults can develop is a form of "pseudo-absolute pitch" — the ability to internalize reference pitches (like the A440 tuning standard or the starting note of a favorite song) and use relative pitch from that anchor. Combined with consistent daily ear training practice, this approach can produce impressively accurate pitch identification in a matter of months.`
      },
      {
        heading: 'Testing Yourself',
        body: `Curious where you fall on the pitch perception spectrum? Games like pitchd. are designed to measure exactly this. By playing a sequence of notes and asking you to recreate them from memory, pitchd. tests both your absolute pitch recall and your relative pitch awareness. The harmonic scoring engine rewards you not just for exact matches, but for identifying correct musical intervals — meaning even if you do not have perfect pitch, your music theory knowledge is recognized and rewarded.`
      },
    ],
  },
  'how-to-train-your-ears': {
    title: 'The Ultimate Guide to Ear Training',
    description: 'Can you actually learn perfect pitch as an adult? We look at the science and the best daily routines.',
    date: '2026-04-28',
    cta: 'Put your training to the test right now.',
    sections: [
      {
        heading: 'Why Ear Training Matters',
        body: `Ear training is the systematic practice of improving your ability to identify and reproduce musical elements — pitches, intervals, chords, rhythms, and timbres — by ear. It is the connective tissue between music theory on paper and music as a living, breathing art form. Whether you are a bedroom producer trying to transcribe a melody, a jazz pianist navigating a lead sheet, or a singer tuning harmonies in real-time, your ears are your most important instrument. Studies published in Music Perception have consistently shown that musicians with stronger aural skills learn new pieces faster, improvise more fluently, and collaborate more effectively in ensemble settings.`
      },
      {
        heading: 'The Science of Auditory Learning',
        body: `Your brain processes pitch through a fascinating chain of events. Sound waves enter the ear canal, vibrate the eardrum, and are transduced into electrical signals by the hair cells of the cochlea. These signals travel via the auditory nerve to the primary auditory cortex, where they are sorted by frequency (tonotopic organization). With training, the brain develops more refined neural maps for pitch discrimination. A 2019 study in Nature Neuroscience demonstrated that consistent ear training physically changes the density of gray matter in the auditory cortex and strengthens connectivity to the prefrontal cortex, the region responsible for categorization and decision-making. In practical terms, this means ear training is not just "learning" — it is literally rewiring your brain for better musical perception.`
      },
      {
        heading: 'Building a Daily Practice Routine',
        body: `The most effective ear training happens in short, consistent sessions rather than marathon cramming. Aim for 10 to 15 minutes daily — this is enough to trigger neuroplastic change without fatiguing your auditory attention. A strong daily routine might look like this: Start with 3 minutes of interval identification, listening to two notes and naming the distance between them. Follow with 3 minutes of chord quality recognition — major, minor, diminished, augmented. Then spend 5 minutes on melodic dictation, listening to short melodic phrases and writing them down or playing them back. Finish with 2 to 3 minutes on a pitch memory game like pitchd., which challenges you to recall and reproduce sequences of notes from memory.`
      },
      {
        heading: 'Interval Recognition: The Foundation',
        body: `Intervals are the building blocks of all melody and harmony. There are 12 chromatic intervals within an octave, and learning to instantly recognize each one is the single most impactful ear training skill you can develop. A proven technique is to associate each interval with the opening notes of a well-known song: a perfect fourth sounds like the opening of "Here Comes the Bride," a perfect fifth like "Star Wars," and a minor second like the "Jaws" theme. Over time, you will internalize these patterns so deeply that interval identification becomes automatic, like reading words instead of sounding out individual letters.`
      },
      {
        heading: 'Chord and Progression Training',
        body: `Once intervals are solid, expand to chords and progressions. Start by distinguishing major from minor triads — major sounds "bright" or "happy," minor sounds "dark" or "sad." Then add diminished (tense, unstable) and augmented (eerie, dreamy). For progressions, learn to hear common patterns like I-IV-V-I (the backbone of pop and rock), ii-V-I (the foundation of jazz), and I-vi-IV-V (the "50s progression" used in thousands of pop songs). Training apps and games that play these progressions and ask you to identify the chords are invaluable for building this skill quickly.`
      },
      {
        heading: 'Melodic Dictation and Active Listening',
        body: `Melodic dictation — the practice of hearing a melody and writing it down in musical notation — is considered the gold standard of ear training at conservatories worldwide. Start simple: listen to three- or four-note melodies within a single octave, identify each pitch, and write them down. Gradually increase complexity by adding wider intervals, accidentals, and rhythmic variation. Active listening to music you love is equally important. When you listen to a song, try to follow the bass line independently from the melody. Identify chord changes. Notice when the key shifts. This habitual analytical listening trains your ear passively throughout the day, reinforcing the skills you practice in dedicated sessions.`
      },
      {
        heading: 'Tools and Technology',
        body: `Modern technology has made ear training more accessible and engaging than ever. Web-based games like pitchd. gamify the experience with daily challenges, global leaderboards, and a harmonic scoring engine that rewards partial credit for musically close guesses. Mobile apps like Functional Ear Trainer, Complete Ear Trainer, and TonalEnergy offer structured curricula covering intervals, chords, scales, and sight-singing. For producers and engineers, tools like SoundGym train frequency perception and EQ matching — skills essential for mixing and mastering. The key is consistency: pick the tools that keep you engaged and practice daily.`
      },
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: 'Article Not Found | pitchd.' };

  return {
    title: `${article.title} | pitchd. Articles`,
    description: article.description,
    alternates: {
      canonical: `https://pitchd.net/articles/${slug}`,
    },
    openGraph: {
      title: `${article.title} | pitchd.`,
      description: article.description,
      url: `https://pitchd.net/articles/${slug}`,
      type: 'article',
      publishedTime: article.date,
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticleContentPage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug];

  if (!article) notFound();

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      {/* Article JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description,
            "datePublished": article.date,
            "author": { "@type": "Organization", "name": "pitchd" },
            "publisher": { "@type": "Organization", "name": "pitchd", "url": "https://pitchd.net" },
            "mainEntityOfPage": `https://pitchd.net/articles/${slug}`,
          })
        }}
      />

      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

        <Link href="/articles" className="text-text-muted hover:text-white transition-colors text-sm uppercase tracking-widest mb-12 inline-block relative z-10">
          ← Back to Articles
        </Link>
        
        <span className="block text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-4 relative z-10">{article.date}</span>

        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          {article.title}
        </h1>

        <div className="prose prose-invert prose-purple max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">
            {article.description}
          </p>
          
          {article.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-2xl font-display text-white mt-12 mb-4">{section.heading}</h2>
              <p className="mb-6">{section.body}</p>
            </div>
          ))}

          <div className="mt-16 p-8 bg-black/40 rounded-2xl border border-purple-500/20 text-center">
            <h3 className="text-2xl font-display text-white mb-4">{article.cta}</h3>
            <p className="mb-8 text-sm">Stop reading about it and actually test your auditory memory right now against the rest of the world.</p>
            <Link 
              href="/"
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Play pitchd. Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
