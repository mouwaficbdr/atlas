'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import type { MoodType } from '@/lib/types';

interface MoodAudioProps {
  mood: MoodType;
}

const MOOD_SOUNDS: Record<MoodType, string> = {
  'Île': 'https://assets.mixkit.co/sfx/preview/mixkit-crashing-waves-at-the-beach-1196.mp3',
  'Continental': 'https://assets.mixkit.co/sfx/preview/mixkit-wind-howling-at-night-1160.mp3',
  'Polaire': 'https://assets.mixkit.co/sfx/preview/mixkit-icy-wind-blowing-1161.mp3',
  'Tropical': 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3',
};

export default function MoodAudio({ mood }: MoodAudioProps) {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    const url = MOOD_SOUNDS[mood];
    if (!url) return;

    soundRef.current = new Howl({
      src: [url],
      loop: true,
      volume: 0.2,
      html5: true, // Use HTML5 Audio to allow large files
    });

    // Play sound (may be blocked by browser until first interaction)
    const playSound = () => {
        if (soundRef.current && !soundRef.current.playing()) {
            soundRef.current.play();
        }
    };

    window.addEventListener('click', playSound, { once: true });
    
    return () => {
      soundRef.current?.stop();
      soundRef.current?.unload();
      window.removeEventListener('click', playSound);
    };
  }, [mood]);

  return null; // Silent component
}
