import { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const score = resolvedSearchParams.score as string | undefined;
  const percentile = resolvedSearchParams.percentile as string | undefined;
  const streak = resolvedSearchParams.streak as string | undefined;

  let ogUrl = 'https://pitchd.net/api/og';
  if (score) {
    const params = new URLSearchParams();
    params.set('score', score);
    if (percentile) params.set('percentile', percentile);
    if (streak) params.set('streak', streak);
    ogUrl += `?${params.toString()}`;
  } else {
    ogUrl = 'https://pitchd.net/og.png';
  }

  return {
    title: `pitchd. Score: ${score || ''}`,
    openGraph: {
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: 'pitchd. Score',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogUrl],
    },
  };
}

export default function SharePage() {
  // Redirect immediately to the home page so they can play
  redirect('/');
}
