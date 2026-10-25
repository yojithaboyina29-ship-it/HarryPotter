import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HouseBadge from '../ui/HouseBadge';

const navLinks = [
  { to: '/sorting', label: 'Sorting Hat' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/owl-post', label: 'Owl Post' },
  { to: '/forum', label: 'Forum' },
  { to: '/leaderboard', label: 'House Cup' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}
      className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Zap className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
            </motion.div>
            <span className="font-heading font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
              Hogwarts Portal
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: location.pathname === link.to ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  backgroundColor: location.pathname === link.to ? 'rgba(212,175,55,0.1)' : 'transparent',
                }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {(user.house_name || user.house) && <HouseBadge house={(user.house_name || user.house)!} />}
                <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <User className="w-4 h-4" />{user.username}
                </span>
                <button onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:bg-red-900/30 hover:text-red-400"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}>Login</Link>
                <Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#1a0a2e' }}>
                  Enroll
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg" style={{ color: 'var(--color-accent)' }}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid rgba(212,175,55,0.1)' }}
            className="md:hidden overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: location.pathname === link.to ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                {user ? (
                  <>
                    <p className="px-3 py-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.username} {user.house_name && `· ${user.house_name}`}
                    </p>
                    <button onClick={() => { logout(); setMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Login</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Enroll Now</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
