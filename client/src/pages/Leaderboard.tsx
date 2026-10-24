import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award } from 'lucide-react';
import { leaderboard as leaderboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HouseBadge, { HOUSE_COLORS } from '../components/ui/HouseBadge';

interface HouseStanding {
  id: number;
  name: string;
  total_points: number;
  member_count: number;
  colors: string;
  motto: string;
}

interface TopUser {
  username: string;
  house_name: string;
  total_points: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [houses, setHouses] = useState<HouseStanding[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leaderboardApi.getHouses(),
      leaderboardApi.getUsers()
    ])
      .then(([housesRes, usersRes]) => {
        setHouses(housesRes.data.houses || []);
        setTopUsers(usersRes.data.users || []);
      })
      .catch(err => console.error('Error fetching leaderboard', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const maxPoints = Math.max(...houses.map(h => h.total_points), 100);

  return (
    <PageWrapper>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <Trophy className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
        </motion.div>
        <h1 className="text-4xl font-heading font-bold mb-3" style={{ color: 'var(--color-accent)' }}>
          The House Cup
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          House points are awarded for academic diligence, participation in the Great Hall discussions, and sending owl correspondence.
        </p>
      </div>

      {/* House Hourglasses Standings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {houses.map((house, index) => {
          const colors = HOUSE_COLORS[house.name] || { primary: '#d4af37', secondary: '#1a0a2e', bg: 'rgba(212,175,55,0.1)' };
          const fillPercentage = Math.min(Math.round((house.total_points / maxPoints) * 100), 100);
          const isUserHouse = user?.house_name === house.name;

          return (
            <motion.div
              key={house.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`text-center relative overflow-hidden flex flex-col h-full ${isUserHouse ? 'ring-2 ring-amber-400' : ''}`}
                glow={colors.primary}
              >
                {index === 0 && (
                  <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold bg-amber-400 text-purple-950 flex items-center gap-1">
                    👑 1st
                  </div>
                )}
                {isUserHouse && (
                  <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-400 text-amber-300">
                    Your House
                  </div>
                )}

                <div className="my-4">
                  <h3 className="font-heading font-bold text-xl mb-1" style={{ color: colors.primary }}>
                    {house.name}
                  </h3>
                  <p className="text-xs italic line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                    "{house.motto}"
                  </p>
                </div>

                {/* Animated Sand/Hourglass Column */}
                <div
                  className="w-20 h-44 mx-auto rounded-2xl border-2 p-1 flex flex-col justify-end relative my-4"
                  style={{ borderColor: colors.primary, backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    className="w-full rounded-xl relative overflow-hidden"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>

                <div className="mt-auto pt-3 border-t" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
                  <div className="text-3xl font-heading font-bold" style={{ color: colors.primary }}>
                    {house.total_points}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {house.member_count} enrolled witches & wizards
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Top Performing Wizards */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
          <Award className="w-6 h-6" /> Distinguished Students
        </h2>

        <Card>
          {topUsers.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-secondary)' }}>
              No students have earned merits yet. Start participating to lead the ranks!
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
              {topUsers.map((u, i) => (
                <div key={u.username} className="py-3 px-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-base w-6 text-center" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                      #{i + 1}
                    </span>
                    <div>
                      <span className="font-semibold block" style={{ color: 'var(--color-text-primary)' }}>
                        {u.username}
                      </span>
                      <div className="mt-0.5">
                        <HouseBadge house={u.house_name} size="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="font-heading font-bold text-base" style={{ color: 'var(--color-accent)' }}>
                    {u.total_points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
