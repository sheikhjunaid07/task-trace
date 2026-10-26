import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'search' | 'editor' | 'navigation' | 'general';
}

const SHORTCUTS: ShortcutItem[] = [
  {
    category: 'search',
    keys: ['/'],
    description: 'Quick-focus search field from anywhere on the board',
  },
  {
    category: 'search',
    keys: ['M'],
    description: 'Toggle "My Tasks" quick filter',
  },
  {
    category: 'search',
    keys: ['Esc'],
    description: 'Clear active search query or reset focus',
  },
  {
    category: 'editor',
    keys: ['⌘', '↵'],
    description: 'Save task changes from modal or editor (Ctrl+↵ on Windows)',
  },
  {
    category: 'editor',
    keys: ['Esc'],
    description: 'Discard uncommitted changes & close modal',
  },
  {
    category: 'general',
    keys: ['↵'],
    description: 'Confirm deletion in confirmation dialogs',
  },
  {
    category: 'general',
    keys: ['?'],
    description: 'Open or close this keyboard shortcuts guide',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl glass-card border border-white/10 p-4 sm:p-6 shadow-2xl cursor-default select-none"
          style={{ backgroundColor: 'var(--surface, #14151a)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Keyboard Shortcuts</h3>
                <p className="text-[11px] text-slate-400">Accelerate your workflow with quick keys</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Board & Navigation
              </div>
              <div className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === 'search').map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-xs text-slate-300 font-medium">{s.description}</span>
                    <div className="flex items-center space-x-1 shrink-0 ml-3">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-6 h-6 px-1.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Task Editing & Modals
              </div>
              <div className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === 'editor').map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-xs text-slate-300 font-medium">{s.description}</span>
                    <div className="flex items-center space-x-1 shrink-0 ml-3">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-6 h-6 px-1.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Dialogs & System
              </div>
              <div className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === 'general').map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-xs text-slate-300 font-medium">{s.description}</span>
                    <div className="flex items-center space-x-1 shrink-0 ml-3">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-6 h-6 px-1.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono text-slate-300 font-semibold">?</kbd> anywhere to toggle</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
