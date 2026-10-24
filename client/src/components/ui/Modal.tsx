import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300 }}
            className="relative w-full max-w-lg rounded-xl p-6 border"
            style={{ backgroundColor: 'var(--color-surface-light)', borderColor: 'rgba(212,175,55,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--color-accent)' }}>{title}</h3>}
              <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
