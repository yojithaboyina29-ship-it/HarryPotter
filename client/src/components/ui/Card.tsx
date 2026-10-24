import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string; // hex color for glow
  onClick?: () => void;
}

export default function Card({ children, className = '', hover, glow, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: glow ? `0 8px 32px ${glow}30` : '0 8px 32px rgba(212,175,55,0.1)' } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`rounded-xl p-5 border ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'rgba(212,175,55,0.15)',
      }}>
      {children}
    </motion.div>
  );
}
