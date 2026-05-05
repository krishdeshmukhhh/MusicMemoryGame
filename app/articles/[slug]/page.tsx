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
  'best-ear-training-games-online': {
    title: 'The Best Free Ear Training Games Online (2026)',
    description: 'A ranked list of the best free ear training games on the web — from daily pitch puzzles to interval drills.',
    date: '2026-05-01',
    cta: 'Try the top-ranked ear training game right now.',
    sections: [
      {
        heading: 'Why Ear Training Games Work',
        body: `Traditional ear training can feel like homework — interval flashcards, solfège drills, and textbook exercises that are hard to stick with. Games change the equation. When ear training is framed as a challenge, a streak, or a competition, your brain engages with it differently. The dopamine loop of scores, leaderboards, and daily resets keeps you coming back in a way that workbooks simply cannot. Research in educational psychology consistently shows that gamified skill-building produces faster retention and longer practice sessions than passive study. For musicians, this means ear training games are not just a fun distraction — they are often the most efficient path to a genuinely better ear.`
      },
      {
        heading: 'pitchd. — Best for Daily Pitch Memory',
        body: `pitchd. (pitchd.net) is a free daily ear training game modeled on the Wordle format. Each day, the same 5-round melody challenge is served to every player globally, with results ranked on a live leaderboard. The core mechanic is pure pitch memory: listen to a sequence of 4 notes, then recreate them on an on-screen piano. What sets pitchd. apart is its harmonic scoring engine — rather than binary right/wrong scoring, partial credit is awarded for musically intelligent near-misses (perfect fifths, octaves, fourths). This makes it rewarding for beginners and genuinely challenging for advanced musicians at the same time. No sign-up required, fully free, and playable on any device.`
      },
      {
        heading: 'Musicca — Best for Structured Interval Drills',
        body: `Musicca.com offers a comprehensive suite of ear training exercises covering intervals, chords, scales, and rhythms. Its interval recognition module is particularly strong — you hear two notes and must identify the interval from a multiple-choice list. The exercises scale in difficulty and track your accuracy over time. Musicca lacks the social and competitive layer that daily-challenge games provide, but for methodical, curriculum-style ear training, it remains one of the best free options available. It is especially useful for students preparing for music theory exams or conservatory auditions.`
      },
      {
        heading: 'Chrome Music Lab — Best for Beginners and Kids',
        body: `Chrome Music Lab (musiclab.chromeexperiments.com) is a collection of interactive experiments by Google that make musical concepts visceral and visual. The Spectrogram, Chord, and Melody tools are excellent entry points for people with no formal music background. It is not a structured ear training curriculum, but it builds intuition for how pitch, timbre, and rhythm work in a way that feels playful rather than academic. For younger learners or complete beginners, it is the friendliest starting point on this list.`
      },
      {
        heading: 'SoundGym — Best for Producers and Engineers',
        body: `SoundGym is purpose-built for audio professionals who need to train frequency perception, dynamic range awareness, and stereo imaging — skills that textbook ear training rarely covers. Its games include EQ matching, compression recognition, and reverb identification. The free tier offers limited daily plays; a paid subscription unlocks the full curriculum. If you produce, mix, or master music, SoundGym addresses a different set of ear skills than pitch-focused tools like pitchd. or Musicca, and it does so with a level of specificity that no other free tool matches.`
      },
      {
        heading: 'How to Build a Daily Ear Training Habit',
        body: `The most effective approach combines multiple game types in a short daily session. A proven 10-minute routine: start with 3 minutes on pitchd. for pitch memory and competitive benchmarking, then spend 4 minutes on Musicca for interval and chord recognition drills, and finish with 3 minutes of active listening — try to transcribe the bassline or chord progression of any song you are currently learning. Consistency matters far more than session length. Ten minutes every day for three months will transform your ear more reliably than occasional two-hour sessions.`
      },
    ],
  },
  'wordle-for-musicians': {
    title: 'The Best Wordle-Like Games for Musicians',
    description: 'Love Wordle? These daily music puzzle games give you the same satisfying loop — but for your ears instead of your vocabulary.',
    date: '2026-05-03',
    cta: 'Play today\'s musical Wordle right now.',
    sections: [
      {
        heading: 'Why Wordle Works — and Why Music Needs It',
        body: `Wordle became a global phenomenon not because word games are new, but because its specific design — one puzzle per day, same puzzle for everyone, shareable results — created a social ritual. The daily constraint forces you to engage consistently rather than binge. The shared puzzle gives everyone something to talk about. The emoji result card provides a low-friction way to share without spoiling. These mechanics translate perfectly to music. A daily pitch puzzle or music theory challenge gives musicians the same satisfying loop: play, reflect, share, repeat. Several developers have built Wordle-inspired music games, each targeting a different musical skill.`
      },
      {
        heading: 'pitchd. — Wordle for Pitch Memory',
        body: `pitchd. (pitchd.net) is the closest musical equivalent to Wordle for pitch recognition and ear training. Every day, a new 5-round melody challenge is served to all players simultaneously. You listen to a 4-note sequence and recreate it on a piano keyboard, then receive a score based on how close your guesses were harmonically. Results are expressed as a shareable emoji card — green squares for perfect matches, amber for near-misses, dark for misses — almost identical in format to Wordle's color grid. The competitive leaderboard adds a ranking dimension that Wordle lacks: you can see exactly what percentile you landed in compared to every other player that day. Completely free, no account needed.`
      },
      {
        heading: 'Heardle — Wordle for Song Recognition',
        body: `Heardle (originally heardle.app, now hosted in various community-run versions) challenged players to identify a song from progressively longer audio clips, starting from just one second. It was acquired by Spotify in 2022 and later shut down, but community remakes keep the concept alive across dozens of genre-specific variants (80s Heardle, K-Pop Heardle, Jazz Heardle, etc.). Heardle tests musical memory and breadth of listening rather than active musical skill, making it complementary to pitch-focused games like pitchd. A great daily warm-up for music trivia enthusiasts.`
      },
      {
        heading: 'Chordify Chord Guessing Games',
        body: `Chordify, best known for its automatic chord transcription tool, has introduced game modes where players identify chords from audio snippets. This targets a different ear training skill — harmonic recognition rather than melodic — and is particularly useful for guitarists, pianists, and producers who need to quickly identify chord qualities in context. While less polished as a daily game than pitchd. or Heardle, it fills an important niche in the ear training game ecosystem.`
      },
      {
        heading: 'Why the Daily Format is the Key Ingredient',
        body: `The common thread across all successful music Wordle games is the daily constraint. Without it, players tend to binge sessions for a few days and then abandon the habit. The single daily puzzle solves this by creating scarcity — you only get one shot today. It also creates shared cultural moments: communities on Reddit, Discord, and social media all discuss the same puzzle on the same day. For musicians, this daily touchpoint is one of the most painless ways to maintain an active ear training practice over months and years.`
      },
    ],
  },
  'how-to-get-perfect-pitch-as-an-adult': {
    title: 'Can You Get Perfect Pitch as an Adult? What Science Says',
    description: 'The honest answer about learning absolute pitch after childhood — and what you can realistically achieve with daily practice.',
    date: '2026-05-04',
    cta: 'Test and train your pitch recognition right now.',
    sections: [
      {
        heading: 'The Critical Period Problem',
        body: `For most of the 20th century, researchers believed that perfect pitch — the ability to identify or produce a musical note without an external reference — was a fixed trait, determined entirely by genetics and early childhood exposure. The "critical period" hypothesis holds that the brain's auditory cortex is especially plastic during early childhood (roughly ages 2 to 6), and that intense musical training during this window is necessary for absolute pitch to develop. Studies published in Psychological Science found that musicians who began training before age six were significantly more likely to possess absolute pitch than those who started later. If you missed that window, the traditional view said, you were out of luck.`
      },
      {
        heading: 'What Recent Research Actually Shows',
        body: `More recent neuroscience has complicated this picture considerably. A landmark 2019 study from the University of Chicago trained adult musicians on a pitch identification protocol and measured their accuracy before and after. Participants showed measurable improvement in absolute pitch identification — not perfect, automatic identification, but a statistically significant increase in accuracy that persisted after training ended. A 2022 paper in Frontiers in Psychology identified a subset of adults who, through intensive daily practice, developed what researchers call "quasi-absolute pitch" — pitch memory anchored to reference tones, accurate enough for practical musical use. The brain remains more plastic than the critical period hypothesis suggested.`
      },
      {
        heading: 'What "Pseudo-Absolute Pitch" Looks Like in Practice',
        body: `The realistic outcome for most adult learners is not the effortless, automatic frequency categorization of a natural absolute pitch possessor. Instead, it is a trained form of pitch memory that works through anchoring. You deeply internalize one or two reference pitches — middle C, or concert A440 — and then use relative pitch from those anchors to identify any other note. Many professional musicians use this method without realizing it. A touring keyboardist who can reliably find middle C from memory and work outward from there effectively functions with near-absolute pitch in most real-world situations.`
      },
      {
        heading: 'The Most Effective Training Protocol',
        body: `Research and practical experience converge on a few principles for adult pitch training. First, focus on one reference pitch at a time — trying to learn all 12 simultaneously produces interference and slows progress. Start with middle C or A440 (440 Hz), the universal tuning standard. Listen to it every day. Sing it. Play it. Associate it with a physical sensation in your voice. Second, use spaced repetition: test yourself on your reference pitch multiple times per day in short bursts rather than in long sessions. Third, incorporate pitch memory games into your daily routine — tools like pitchd. specifically target the pitch recall mechanism that absolute pitch relies on. Expect 3 to 6 months of consistent daily practice before your reference pitch becomes reliably internalized.`
      },
      {
        heading: 'The Role of Relative Pitch in Getting There',
        body: `Strong relative pitch is both a prerequisite and a shortcut to quasi-absolute pitch. If you can instantly recognize intervals — if a perfect fifth or a minor third triggers an immediate recognition response — you can build absolute pitch identification on top of a single memorized reference note rather than needing to memorize all 12 independently. This is why serious ear training programs emphasize interval recognition before tackling absolute pitch. The two skills reinforce each other: every time you use relative pitch from your memorized reference, you strengthen the memory trace of that reference tone.`
      },
      {
        heading: 'Honest Expectations',
        body: `You will not wake up one day with the automatic, effortless pitch identification of someone who was singing perfectly in tune at age three. But with 3 to 6 months of consistent daily practice — incorporating reference-pitch memorization, interval drills, and games like pitchd. for pitch memory — you can develop a functional, practical pitch sense that will serve you well in real musical situations. For most musicians, that outcome is more valuable than true perfect pitch anyway, because it comes packaged with the relative pitch and music theory knowledge that make you a better improviser, arranger, and collaborator.`
      },
    ],
  },
  'interval-recognition-training': {
    title: 'Interval Recognition Training: The Complete Beginner\'s Guide',
    description: 'Learn to identify all 12 musical intervals by ear using the song association method — the fastest proven approach for beginners.',
    date: '2026-05-02',
    cta: 'Put your interval recognition to the test.',
    sections: [
      {
        heading: 'What Is Interval Recognition?',
        body: `An interval is the musical distance between two notes. Interval recognition is the ability to hear two notes and instantly identify the distance between them — without needing to see the notes written down or locate them on an instrument. It is arguably the single most foundational ear training skill in music. Every melody is a sequence of intervals. Every chord is a stack of intervals. Every modulation is a shift in interval relationships. If you can hear intervals fluently, you can transcribe melodies, identify chords, and improvise over changes in real time. If you cannot, music theory remains abstract rather than viscerally felt.`
      },
      {
        heading: 'The 12 Intervals You Need to Know',
        body: `Within one octave, there are 12 chromatic intervals: minor second (1 semitone), major second (2), minor third (3), major third (4), perfect fourth (5), tritone (6), perfect fifth (7), minor sixth (8), major sixth (9), minor seventh (10), major seventh (11), and the octave (12). Each has a distinct character — the minor second sounds tense and dissonant, the major third bright and stable, the perfect fifth open and resonant, the tritone eerie and unstable. Learning to identify each one is a matter of building a mental library of these characters, each anchored to a recognizable sonic example.`
      },
      {
        heading: 'The Song Association Method',
        body: `The fastest proven technique for learning intervals is to associate each one with the opening notes of a familiar song — a mnemonic that fires immediately when you hear the interval. Widely used associations include: minor second = "Jaws" theme; major second = "Happy Birthday" (first two notes); minor third = "Smoke on the Water"; major third = "When the Saints Go Marching In"; perfect fourth = "Here Comes the Bride"; tritone = "The Simpsons" theme; perfect fifth = "Star Wars" main theme; minor sixth = "The Entertainer"; major sixth = "My Bonnie Lies Over the Ocean"; minor seventh = "Somewhere" from West Side Story; major seventh = "Take On Me" (A-ha); octave = "Somewhere Over the Rainbow." The goal is not to mentally hum the song every time — with practice, the recognition becomes direct and instantaneous, bypassing the song entirely.`
      },
      {
        heading: 'Ascending vs. Descending Intervals',
        body: `Most beginners learn intervals in their ascending form first (lower note to higher note), but real music uses descending intervals just as frequently. A descending perfect fifth sounds completely different from an ascending one if you have only ever practiced ascending. Once you have internalized the ascending version of each interval, immediately begin drilling descending versions with separate song associations. Descending minor third = "Hey Jude" opening; descending perfect fourth = "Born to Be Wild"; descending fifth = "Star Wars" (reversed). The asymmetry is frustrating at first but critical — real transcription requires both.`
      },
      {
        heading: 'Harmonic vs. Melodic Intervals',
        body: `The drills above focus on melodic intervals — notes played sequentially. Harmonic intervals are notes played simultaneously, like a chord. Recognizing harmonic intervals is a separate but related skill and is typically harder because the two pitches blend. Start by learning to hear the "color" of each harmonic interval: minor seconds sound extremely tense, major thirds warm and stable, perfect fifths open and hollow, tritones ambiguous and unsettling. Playing these intervals on a piano or guitar and singing along with each pitch is the most effective way to internalize harmonic interval color. Over time, your ear will recognize the quality of a harmonic interval the same way it recognizes a familiar face.`
      },
      {
        heading: 'How to Practice Daily',
        body: `A practical daily interval training routine requires only 10 minutes. Spend 4 minutes on a dedicated interval recognition app or site like Musicca, working through random ascending and descending interval identification. Spend 3 minutes on melodic dictation — listen to a simple melody (a children's song, a hymn, the opening of a film score) and identify each interval as you go. Finish with 3 minutes on pitchd., which challenges you to identify and reproduce pitch sequences using both pitch memory and interval awareness. Track your accuracy weekly. Most beginners see significant measurable improvement in 4 to 6 weeks of consistent daily practice.`
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

      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative">

        {/* Decorative Glow — clipped by its own container so card overflow-hidden isn't needed */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>

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
