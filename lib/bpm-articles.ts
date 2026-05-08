export type ArticleSection = { heading: string; body: string };
export type ArticleData = {
  title: string;
  description: string;
  date: string;
  sections: ArticleSection[];
  cta: string;
};

export const BPM_ARTICLES: Record<string, ArticleData> = {
  'how-to-train-your-tempo-ear': {
    title: 'How to Train Your Tempo Ear',
    description: 'Internalize BPM and beat recognition with techniques used by professional drummers and producers.',
    date: '2026-05-05',
    cta: 'Test your tempo ear right now.',
    sections: [
      {
        heading: 'Why Tempo Recognition Is a Trainable Skill',
        body: `Most musicians treat tempo as a given — something you either have or you don't. But tempo recognition, like pitch recognition, is a skill that responds directly to deliberate practice. Professional drummers, session musicians, and music producers who work with click tracks daily develop an almost uncanny ability to identify and reproduce tempos by ear. Research in music cognition confirms this: regular exposure to specific tempos combined with active feedback — "was I faster or slower than the target?" — produces measurable improvement in tempo accuracy over weeks. The key word is active. Passive listening to music, even at high volumes for years, does not meaningfully improve your tempo ear. What works is testing, failing, adjusting, and testing again.`,
      },
      {
        heading: 'Active Listening: The Foundation',
        body: `The most underused tempo training technique is active listening with a reference. Pick any song, estimate its BPM, then check against a tap-tempo tool or DAW. Do this every time you listen to music. Over time, your estimates will get tighter. A refinement of this method: before you check, commit to a specific number — not a range, not "around 120," but exactly 117 or exactly 124. The act of committing a specific number forces your auditory system to resolve ambiguity rather than leaving it fuzzy. This specificity is what separates musicians who "have a good feel for tempo" from those who can actually name the BPM in a room.`,
      },
      {
        heading: 'Internal Metronome Development',
        body: `The most effective technique for building an internal clock is subdivided practice. Set a metronome to a target BPM — say, 90. Listen for 8 bars. Turn it off. Keep the tempo internally for another 8 bars, tapping or conducting. Turn the metronome back on and see if you drifted. This method, used extensively by jazz drummers and classical conductors, trains the brain to maintain a pulse in the absence of external reference. Start with simple, round tempos (60, 80, 100, 120) where the BPM maps cleanly to musical intuition. Once those feel automatic, move to asymmetric tempos like 73 or 97 where you cannot cheat by thinking in musical subdivisions.`,
      },
      {
        heading: 'Tempo Anchors: Building a Reference Library',
        body: `One of the fastest ways to improve BPM recognition is to deeply internalize a small set of reference tempos — three to five BPMs that you know in your bones. 60 BPM is the easiest starting point because it maps directly to one beat per second, a reference everyone has felt on a clock. 120 BPM is the heartbeat of most Western pop music. 90 BPM is the hip-hop and R&B standard. Once these anchors are solid, you can navigate to other tempos by comparison: "Is this faster or slower than 90? By how much?" This anchor-and-interpolate method is exactly how experienced producers estimate BPM so quickly — they are not processing each tempo from scratch.`,
      },
      {
        heading: 'Games and Tools That Accelerate Progress',
        body: `Passive tempo knowledge is transformed into active recognition skill through feedback loops — and games are the most efficient delivery mechanism for that feedback. pitchd.'s BPM Guesser is designed specifically for this: hear a mystery tempo, form a guess, compare against the actual value. The critical moment is not just seeing your score but internalizing the gap. If you guessed 95 and the answer was 108, spend a moment comparing how 95 and 108 feel differently. This post-round reflection is where the learning actually happens. Supplement games with a daily 5-minute practice of setting your DAW or metronome to random tempos, estimating blind, and checking. Within a month, your accuracy will be noticeably sharper.`,
      },
      {
        heading: 'What to Expect and How Fast It Works',
        body: `Tempo recognition training follows a predictable curve. The first two weeks produce rapid, visible gains — your error rate drops quickly as you build basic anchors and pattern recognition. Weeks three through six slow down but yield more precise discrimination: instead of knowing a tempo is "somewhere in the 100s," you start landing within 3–5 BPM consistently. True expert-level recognition — within 1–2 BPM on unfamiliar tempos — typically requires six months to a year of daily practice. The shortcut is consistency over duration. Ten minutes every day beats a two-hour session on weekends by a significant margin. Build the habit first, and the accuracy follows.`,
      },
    ],
  },
  'science-of-groove': {
    title: 'The Science of Groove: Why Tempo Perception Varies',
    description: 'Explore why some people naturally feel BPM better and what neuroscience tells us about rhythmic entrainment.',
    date: '2026-05-06',
    cta: 'Test your own rhythm perception right now.',
    sections: [
      {
        heading: 'What the Brain Does When It Hears a Beat',
        body: `When you hear a rhythmic pulse, your brain does something automatic and remarkable: it begins to predict when the next beat will arrive. This process, called beat induction, happens in milliseconds and involves a network of brain regions including the basal ganglia, supplementary motor area, and cerebellum — all regions traditionally associated with movement rather than hearing. The brain's motor system is deeply involved in rhythm perception, which explains why it is almost impossible to hear a strong beat without wanting to move. This coupling between auditory input and motor prediction is the neurological foundation of what musicians call groove.`,
      },
      {
        heading: 'Rhythmic Entrainment: Why Bodies Sync to Beats',
        body: `Entrainment is the tendency of biological oscillators — heartbeats, breathing cycles, neural firing patterns — to synchronize with external rhythmic stimuli. When you tap your foot to music, you are experiencing entrainment in its most visible form. Research published in Annals of the New York Academy of Sciences has shown that neural oscillations in the auditory cortex literally phase-lock to periodic sounds, including musical beats. This is not metaphorical synchronization — it is measurable electrical activity in the brain aligning with external rhythms. Entrainment is the biological mechanism that makes the experience of groove feel compulsive rather than chosen.`,
      },
      {
        heading: 'Why Some People Have a Better Natural Sense of Rhythm',
        body: `Individual differences in rhythmic ability trace back to several interacting factors. Genetic predisposition plays a role — twin studies have shown that beat synchronization ability is partially heritable. Early musical environment matters significantly: children who grow up in households where music is actively played (rather than merely consumed passively) develop stronger rhythmic processing by school age. Language background is another factor that surprises researchers: speakers of tonal languages like Mandarin and Vietnamese, who must track pitch contours for meaning, also show heightened temporal precision in rhythm tasks. Even dance culture shapes rhythmic perception — cultures with strong participatory dance traditions produce populations with measurably better beat synchronization than those with primarily passive listening cultures.`,
      },
      {
        heading: 'The Preferred Tempo: Why 120 BPM Feels Universal',
        body: `Across cultures and age groups, humans show a strong spontaneous preference for tempos between 100 and 130 BPM when tapping along to music or generating a comfortable walking pace. This range, centered around 120 BPM, corresponds closely to a natural human walking speed and the resting heartbeat of a mildly active person. Research by neuroscientist Aniruddh Patel suggests this "preferred tempo" is tied to the resonance frequency of the motor system — it is the rate at which the body's movement machinery operates most efficiently. This explains why 120 BPM is the industry standard for electronic dance music and why pop producers almost universally work in the 100–130 BPM range: it is the tempo at which human bodies find synchronization easiest.`,
      },
      {
        heading: 'Micro-Timing and the Feel of Groove',
        body: `Perfect metronomic timing is not the same as good groove. Human performers consistently play slightly ahead of or behind the beat in ways that are not random but systematic — and listeners perceive these deviations as expressive rather than wrong. A drummer who plays the snare a few milliseconds behind the click creates a "laid back" feel associated with soul and R&B. A pianist who plays slightly ahead creates urgency and forward momentum. These micro-timing deviations, typically in the range of 10–50 milliseconds, are invisible to conscious tempo perception but deeply felt emotionally. Understanding this distinction separates mechanical tempo accuracy — what a BPM guesser tests — from the nuanced human timing that makes music feel alive.`,
      },
      {
        heading: 'How to Use This Science to Train More Effectively',
        body: `The neuroscience of groove suggests several practical training principles. First, move when you practice tempo — the motor system is part of the tempo processing circuit, so tapping, conducting, or dancing while listening activates the full network. Second, use music you love rather than sterile click tracks whenever possible: emotional engagement with the stimulus strengthens neural encoding. Third, do not rely solely on visual metronomes — auditory beats drive entrainment more powerfully than visual flashes. Fourth, practice at your preferred tempo first (around 100–120 BPM) to build anchor knowledge, then deliberately practice at uncomfortable tempos (very slow at 40–60 BPM, very fast at 160+ BPM) where your motor system cannot easily entrain and you must rely on cognitive counting.`,
      },
    ],
  },
  'metronome-practice-internal-clock': {
    title: 'Metronome Practice: Building a Reliable Internal Clock',
    description: "Most musicians use the metronome wrong. Here's how to use it to develop an internal sense of tempo that lasts.",
    date: '2026-05-07',
    cta: 'Put your internal clock to the test.',
    sections: [
      {
        heading: 'The Problem With How Most Musicians Use a Metronome',
        body: `Walk into any music school and you will find students practicing with a metronome on for the entire session — every note, every repetition, with the click running continuously. This approach, while better than no metronome at all, produces a particular kind of musician: one who plays in time when the click is present and gradually drifts when it is not. The metronome becomes a crutch rather than a teacher. The goal of metronome practice should not be to play along with a click — it should be to internalize the click so thoroughly that you no longer need it. Achieving this requires a fundamentally different relationship with the metronome than most musicians have.`,
      },
      {
        heading: 'The On/Off Method',
        body: `The most effective metronome technique for building an internal clock is alternating between playing with the click and playing without it. Set your metronome to a comfortable tempo. Play 4 bars with the click on. Turn it off. Play 4 more bars, maintaining the tempo internally. Turn it back on: if you are in sync, the click feels like it appeared exactly where you expected. If you drifted, note the direction — were you rushing or dragging? — and adjust. This method creates feedback loops that passive click-following cannot produce. Every time the metronome re-enters, your brain receives information about where your internal tempo went wrong. Over hundreds of repetitions, these corrections accumulate into a genuinely stable internal clock.`,
      },
      {
        heading: 'Subdivision Reduction: The Advanced Version',
        body: `Once the on/off method feels manageable, the next step is reducing the click to larger subdivisions. Instead of every beat, set the metronome to click only on beat 1 of every bar. Now you must maintain 3 beats entirely on your own between each click. This is significantly harder than it sounds. The next level: click on beat 1 every 2 bars, then every 4 bars. Professional session drummers and conductors often practice with the click reduced to one pulse every 8 bars — a single reference point to anchor minutes of performance. Working at this level forces the body to develop autonomous rhythmic generation rather than responsive beat-following.`,
      },
      {
        heading: 'Tempo Mapping: Learning Specific BPMs',
        body: `Internalizing specific tempos — not just maintaining a pulse but knowing that 96 BPM feels different from 104 BPM — requires deliberate exposure. Choose 5 target tempos that matter for the music you play or produce. For pop and electronic: 90, 100, 120, 128, 140. For jazz: 120, 160, 200, 240, 280. For classical: 60, 80, 100, 120, 144. Set each one on a metronome and sit with it for 2 full minutes — not playing, just listening and feeling. Conduct in the air. Breathe in sync. Tap. Let the tempo become embodied rather than intellectual. Return to each target tempo daily for a week, then test yourself: can you tap it accurately without checking? This process, repeated across your target range, builds a tempo map that makes BPM recognition feel intuitive.`,
      },
      {
        heading: 'The Displaced Downbeat Technique',
        body: `One of the most powerful — and initially disorienting — metronome exercises is displaced downbeat practice. Set your click to 60 BPM, but mentally hear it as beat 2 and beat 4 rather than 1 and 3. This means you are hearing the click as a backbeat rather than a downbeat, doubling the effective tempo to 120 BPM with the click marking only the offbeats. This technique, standard in jazz and funk drumming pedagogy, forces your internal clock to do heavy lifting because the click is no longer confirming your natural pulse emphasis — it is landing in the gaps. Practicing this way builds a much more robust internal clock than click-on-the-beat practice, because your sense of tempo can no longer lean on metrical emphasis for support.`,
      },
      {
        heading: 'Testing Your Internal Clock',
        body: `The practical test of a good internal clock is simple: tap a tempo without any reference, have someone check it against a metronome, and see how close you are. Elite session musicians typically land within 2–3 BPM of their intended tempo. A more systematic approach is to use a game like pitchd.'s BPM Guesser in reverse: instead of identifying a mystery tempo, try to produce specific tempos by tapping or adjusting a slider to your felt sense of 95, 112, or 138 BPM, then check the result. Regular testing transforms vague intuition into precise knowledge. The goal is not to hit every tempo exactly — it is to develop a reliable, specific, adjustable internal clock that you can trust when no external reference is available.`,
      },
    ],
  },
};
