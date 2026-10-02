import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'pitchd. | Daily Pitch & BPM Games',
    short_name: 'pitchd.',
    description: 'Free daily ear training: recreate a 4-note melody or guess a mystery tempo. New puzzle every day.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    categories: ['games', 'music', 'education'],
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Pitch daily', url: '/', icons: [{ src: '/icon.png', sizes: '512x512' }] },
      { name: 'BPM Guesser', url: '/bpm', icons: [{ src: '/icon.png', sizes: '512x512' }] },
    ],
  };
}
