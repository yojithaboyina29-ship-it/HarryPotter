import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BookOpen, Clock, Users, Coffee } from 'lucide-react';
import { schedule as scheduleApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HouseBadge from '../components/ui/HouseBadge';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  'Potions', 'Charms', 'Transfiguration', 'Defense Against the Dark Arts',
  'Herbology', 'Astronomy', 'Divination', 'Arithmancy',
  'Care of Magical Creatures', 'History of Magic',
  'Quidditch', 'Dueling Club', 'Astronomy Club', 'Debate Society'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SESSION_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  class:  { icon: BookOpen, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  study:  { icon: Clock,    color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  club:   { icon: Users,    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  free:   { icon: Coffee,   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

export default function Schedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Record<string, Array<{ time: string; subject: string; type: string }>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not sorted
  useEffect(() => {
    if (!loading && user && !user.house_name) navigate('/sorting');
  }, [user, loading, navigate]);

  useEffect(() => {
    scheduleApi.get()
      .then(res => setTimetable(res.data.timetable))
      .catch(() => setShowForm(true))
      .finally(() => setLoading(false));
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const generateSchedule = async () => {
    if (selectedInterests.length === 0) {
      setError('Select at least one interest.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const res = await scheduleApi.generate(selectedInterests);
      setTimetable(res.data.timetable);
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate schedule.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  );

  return (
    <PageWrapper>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold" style={{ color: 'var(--color-accent)' }}>
            📅 Your Timetable
          </h1>
          {user?.house_name && (
            <div className="flex items-center gap-2 mt-2">
              <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">House:</span>
              <HouseBadge house={user.house_name} size="md" />
            </div>
          )}
        </div>
        {timetable && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
        )}
      </div>

      {/* Interest selector form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="font-heading text-lg mb-4" style={{ color: 'var(--color-accent)' }}>
            Choose Your Interests
          </h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {INTERESTS.map(interest => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: selectedInterests.includes(interest) ? 'var(--color-accent)' : 'transparent',
                  color: selectedInterests.includes(interest) ? '#1a0a2e' : 'var(--color-text-secondary)',
                  borderColor: selectedInterests.includes(interest) ? 'var(--color-accent)' : 'rgba(212,175,55,0.3)',
                }}>
                {interest}
              </button>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <Button onClick={generateSchedule} loading={generating}>
            ✨ Generate My Schedule
          </Button>
        </Card>
      )}

      {/* Timetable grid */}
      {timetable && !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((day, di) => (
            <motion.div key={day} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.07 }}>
              <h3 className="font-heading text-center text-sm font-bold mb-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--color-accent)' }}>
                {day}
              </h3>
              <div className="space-y-2">
                {(timetable[day] || []).map((session, si) => {
                  const config = SESSION_ICONS[session.type] || SESSION_ICONS.free;
                  const Icon = config.icon;
                  return (
                    <motion.div key={si} initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: di * 0.07 + si * 0.05 }}
                      className="p-3 rounded-xl border"
                      style={{ backgroundColor: config.bg, borderColor: `${config.color}30` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: config.color }} />
                        <span className="text-xs" style={{ color: config.color }}>{session.time}</span>
                      </div>
                      <p className="text-xs font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                        {session.subject}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Legend */}
      {timetable && !showForm && (
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          {Object.entries(SESSION_ICONS).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <Icon className="w-3 h-3" style={{ color: config.color }} />
                <span className="capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
