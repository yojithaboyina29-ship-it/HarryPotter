import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/magical-ambience.wav');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error (user interaction required):', err);
      });
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all cursor-pointer"
        style={{
          backgroundColor: isPlaying ? 'rgba(212,175,55,0.2)' : 'rgba(22,16,43,0.85)',
          borderColor: isPlaying ? 'var(--color-accent)' : 'rgba(212,175,55,0.3)',
          color: isPlaying ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
          boxShadow: isPlaying ? '0 0 16px rgba(212,175,55,0.35)' : '0 4px 12px rgba(0,0,0,0.5)',
        }}
        title={isPlaying ? 'Pause magical background score' : 'Play magical background score'}
      >
        {isPlaying ? (
          <>
            <Volume2 className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="text-xs font-heading font-semibold flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3 h-3" /> Magic Score
            </span>
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4 opacity-70" />
            <span className="text-xs font-heading font-medium">BGM Off</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center bg-black/60 border border-amber-400/20 px-2 py-1.5 rounded-full"
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 accent-amber-400 cursor-pointer h-1"
              title="Volume"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
