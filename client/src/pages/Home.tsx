import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, GraduationCap, Mail, MessageSquare, Trophy, Sparkles } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: GraduationCap,
    title: 'Sorting Hat Ceremony',
    description: 'Answer the Sorting Hat\'s questions and discover your true Hogwarts house.',
    link: '/sorting',
    color: '#d4af37',
  },
  {
    icon: Mail,
    title: 'Owl Post',
    description: 'Send enchanted letters to fellow students with AI-powered magical styling.',
    link: '/owl-post',
    color: '#946B2D',
  },
  {
    icon: MessageSquare,
    title: 'House Forums',
    description: 'Engage in discussions with your house members and earn house points.',
    link: '/forum',
    color: '#5D9B9B',
  },
  {
    icon: Trophy,
    title: 'House Cup',
    description: 'Track the House Cup standings and compete for glory.',
    link: '/leaderboard',
    color: '#D3A625',
  },
];

function HeroStars() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-accent-light"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: star.delay }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative text-center py-16 sm:py-24">
        <HeroStars />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10"
        >
          {/* Lightning bolt */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 border border-accent/30 mb-8"
          >
            <Zap className="w-10 h-10 text-accent" />
          </motion.div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-text-primary mb-4">
            Welcome to{' '}
            <span className="text-accent">Hogwarts</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10"
          >
            Your magical portal to the Wizarding World. Get sorted, attend classes,
            send owl post, and compete for the House Cup.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link to={user.house_name ? '/forum' : '/sorting'}>
                <Button size="lg">
                  <Sparkles className="w-5 h-5" />
                  {user.house_name ? 'Enter the Castle' : 'Begin Sorting Ceremony'}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">
                    <Sparkles className="w-5 h-5" />
                    Begin Your Journey
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Already Enrolled
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl font-heading text-center text-accent mb-12"
        >
          Discover the Magic
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={feature.link}>
                <Card hover className="h-full text-center">
                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                    style={{ backgroundColor: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
                  >
                    <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-heading text-lg text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center py-16 border-t border-accent/10"
      >
        <p className="text-text-secondary text-sm font-heading">
          ⚡ Built with magic and technology for the Hackathon ⚡
        </p>
      </motion.section>
    </PageWrapper>
  );
}
