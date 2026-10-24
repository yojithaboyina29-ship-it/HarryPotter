import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variants = {
  primary:   { bg: 'var(--color-accent)', color: '#1a0a2e', border: 'transparent' },
  secondary: { bg: 'transparent', color: 'var(--color-accent)', border: 'var(--color-accent)' },
  ghost:     { bg: 'rgba(212,175,55,0.08)', color: 'var(--color-text-primary)', border: 'rgba(212,175,55,0.2)' },
  danger:    { bg: 'transparent', color: '#f87171', border: '#f87171' },
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props
}: ButtonProps) {
  const v = variants[variant];
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...(props as any)}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold font-heading
        transition-all duration-200 border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]} ${className}`}
      style={{ backgroundColor: v.bg, color: v.color, borderColor: v.border }}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </motion.button>
  );
}
