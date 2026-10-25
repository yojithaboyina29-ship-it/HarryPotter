import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { sorting } from '../services/api';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Animated sorting hat SVG
function SortingHat({ talking }: { talking: boolean }) {
  return (
    <motion.div className="flex justify-center mb-8"
      animate={talking ? { rotate: [-3, 3, -3] } : { rotate: 0 }}
      transition={talking ? { repeat: Infinity, duration: 0.5 } : {}}>
      <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
        {/* Hat brim */}
        <ellipse cx="60" cy="115" rx="55" ry="12" fill="#2d1f0e" />
        {/* Hat body */}
        <path d="M20 115 Q25 80 45 55 Q52 30 60 10 Q68 30 75 55 Q95 80 100 115 Z" fill="#1a0e05" />
        {/* Hat band */}
        <path d="M18 108 Q60 100 102 108" stroke="#d4af37" strokeWidth="4" fill="none" />
        {/* Hat highlight */}
        <path d="M50 15 Q55 35 52 60" stroke="#5a3d1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        <motion.ellipse cx="45" cy="80" rx="5" ry="4" fill="#d4af37"
          animate={talking ? { scaleY: [1, 0.3, 1] } : {}} transition={{ repeat: Infinity, duration: 1, delay: 0.5 }} />
        <motion.ellipse cx="75" cy="80" rx="5" ry="4" fill="#d4af37"
          animate={talking ? { scaleY: [1, 0.3, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} />
        {/* Mouth */}
        <motion.path d="M48 92 Q60 100 72 92" stroke="#d4af37" strokeWidth="2.5" fill="none" strokeLinecap="round"
          animate={talking ? { d: ['M48 92 Q60 100 72 92', 'M48 92 Q60 104 72 92', 'M48 92 Q60 100 72 92'] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }} />
      </svg>
    </motion.div>
  );
}

const HOUSE_THEMES: Record<string, { bg: string; primary: string; secondary: string }> = {
  Gryffindor:  { bg: 'radial-gradient(ellipse at center, #740001 0%, #1a0a2e 70%)', primary: '#D3A625', secondary: '#740001' },
  Hufflepuff:  { bg: 'radial-gradient(ellipse at center, #372E29 0%, #1a0a2e 70%)', primary: '#ECB939', secondary: '#372E29' },
  Ravenclaw:   { bg: 'radial-gradient(ellipse at center, #0E1A40 0%, #1a0a2e 70%)', primary: '#946B2D', secondary: '#0E1A40' },
  Slytherin:   { bg: 'radial-gradient(ellipse at center, #1A472A 0%, #1a0a2e 70%)', primary: '#5D5D5D', secondary: '#1A472A' },
};

interface QuestionState {
  sessionId: number;
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
}

interface ResultState {
  house: string;
  speech: string;
  traits: string[];
}

type Stage = 'intro' | 'loading' | 'question' | 'result' | 'error';

export default function SortingCeremony() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState<QuestionState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  // Fast typewriter effect (6ms)
  const typeText = useCallback((text: string) => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 8);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage === 'question' && currentQ) {
      typeText(currentQ.question);
    }
  }, [stage, currentQ, typeText]);

  // Already sorted?
  useEffect(() => {
    if (user?.house_name) {
      setResult({ house: user.house_name, speech: user.sorting_reason || '', traits: [] });
      setStage('result');
    }
  }, [user]);

  const startCeremony = async () => {
    setStage('loading');
    setError('');
    try {
      const res = await sorting.start();
      setCurrentQ(res.data);
      setStage('question');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start ceremony. Is the server running?');
      setStage('error');
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!currentQ || submitting) return;
    setSubmitting(true);
    try {
      const res = await sorting.answer(String(currentQ.sessionId), answer);
      if (res.data.completed) {
        // Show result
        await refreshUser();
        setResult(res.data);
        setStage('result');
      } else {
        setCurrentQ(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStage('error');
    } finally {
      setSubmitting(false);
    }
  };

  const houseTheme = result ? HOUSE_THEMES[result.house] : null;

  return (
    <div className="min-h-[calc(100vh-64px)]" style={{ backgroundColor: 'var(--color-primary)' }}>

      {/* INTRO */}
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4">
            <SortingHat talking={false} />
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl font-heading font-bold mb-4" style={{ color: 'var(--color-accent)' }}>
              The Sorting Ceremony
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-lg max-w-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              The ancient Sorting Hat will ask you five questions to determine your house.
              Answer honestly — the hat sees all.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <Button size="lg" onClick={startCeremony}>🎩 Put On the Hat</Button>
            </motion.div>
          </motion.div>
        )}

        {/* LOADING */}
        {stage === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-6">
            <SortingHat talking={true} />
            <p className="font-heading text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              The hat is thinking…
            </p>
            <LoadingSpinner size="md" />
          </motion.div>
        )}

        {/* QUESTION */}
        {stage === 'question' && currentQ && (
          <motion.div key={`q-${currentQ.questionNumber}`}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-12">

            {/* Progress */}
            <div className="w-full max-w-2xl mb-8">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Question {currentQ.questionNumber} of {currentQ.totalQuestions}</span>
                <span>{Math.round((currentQ.questionNumber / currentQ.totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--color-accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentQ.questionNumber / currentQ.totalQuestions) * 100}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
            </div>

            <SortingHat talking={true} />

            {/* Question bubble */}
            <div className="w-full max-w-2xl rounded-2xl border p-6 mb-8"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.2)' }}>
              <p className="text-xl font-heading text-center leading-relaxed min-h-[4rem]"
                style={{ color: 'var(--color-text-primary)' }}>
                "{displayedText}<span className="animate-pulse">|</span>"
              </p>
            </div>

            {/* Options */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option, i) => (
                <motion.button key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => submitAnswer(option)}
                  disabled={submitting}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(212,175,55,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  className="text-left px-5 py-4 rounded-xl border transition-all duration-150 text-sm disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-light)',
                    borderColor: 'rgba(212,175,55,0.2)',
                    color: 'var(--color-text-primary)',
                  }}>
                  <span style={{ color: 'var(--color-accent)' }} className="font-bold mr-2">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {stage === 'result' && result && houseTheme && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 py-12"
            style={{ background: houseTheme.bg }}>

            {/* Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div key={i} className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: houseTheme.primary, left: `${Math.random() * 100}%`, top: '100%' }}
                  animate={{ y: -window.innerHeight - 100, opacity: [0, 1, 0], rotate: 360 }}
                  transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, ease: 'easeOut' }} />
              ))}
            </div>

            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
              <SortingHat talking={false} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="relative z-10">
              <p className="text-sm uppercase tracking-widest mb-3 font-heading" style={{ color: houseTheme.primary }}>
                The Sorting Hat declares
              </p>
              <h1 className="text-6xl sm:text-8xl font-heading font-black mb-6" style={{ color: houseTheme.primary }}>
                {result.house}!
              </h1>

              {result.speech && (
                <div className="max-w-2xl mx-auto rounded-2xl border p-6 mb-8"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: `${houseTheme.primary}40` }}>
                  <p className="text-lg italic leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    "{result.speech}"
                  </p>
                </div>
              )}

              {result.traits.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {result.traits.map(trait => (
                    <span key={trait} className="px-3 py-1 rounded-full text-sm font-semibold font-heading"
                      style={{ backgroundColor: `${houseTheme.primary}20`, color: houseTheme.primary, border: `1px solid ${houseTheme.primary}40` }}>
                      {trait}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate('/schedule')}>
                  View Your Schedule
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate('/forum')}>
                  Enter House Forum
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ERROR */}
        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 gap-6 text-center">
            <p className="text-4xl">⚠️</p>
            <h2 className="text-2xl font-heading" style={{ color: 'var(--color-accent)' }}>Something went wrong</h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Button onClick={() => setStage('intro')}>Try Again</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
