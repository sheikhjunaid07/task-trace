import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Confirm Deletion',
  message,
  itemName,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [mounted, setMounted] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus safe default (Cancel) to prevent accidental deletions
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isLoading) {
          e.preventDefault();
          onCancel();
        }
      } else if (e.key === 'Enter' && !isLoading) {
        // If focus is specifically on the cancel or close button, respect native button activation
        if (
          document.activeElement === cancelButtonRef.current ||
          (document.activeElement as HTMLElement)?.getAttribute('data-action') === 'cancel'
        ) {
          return;
        }
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel, onConfirm]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLoading) onCancel();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl text-center select-none cursor-default"
          style={{ backgroundColor: 'var(--surface, #14151a)' }}
        >
          {/* Close button */}
          <button
            type="button"
            data-action="cancel"
            onClick={() => {
              if (!isLoading) onCancel();
            }}
            disabled={isLoading}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Warning Icon Badge */}
          <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <Trash2 className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* Main Title */}
          <h3 id="confirm-modal-title" className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
            {title}
          </h3>

          {/* Description */}
          <p id="confirm-modal-desc" className="text-xs sm:text-sm text-slate-300/90 mb-6 leading-relaxed">
            {message || (
              <>
                {itemName ? (
                  <span>
                    <span className="font-semibold text-white">"{itemName}"</span> will be permanently deleted.
                  </span>
                ) : (
                  'This item will be permanently deleted.'
                )}{' '}
                This action cannot be undone.
              </>
            )}
          </p>

          {/* Actions: Cancel & Confirm */}
          <div className="flex items-center space-x-3">
            <button
              ref={cancelButtonRef}
              type="button"
              data-action="cancel"
              onClick={() => {
                if (!isLoading) onCancel();
              }}
              disabled={isLoading}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <span>{cancelLabel}</span>
              <span className="hidden sm:inline-block text-[10px] font-mono opacity-50 px-1 py-0.2 rounded bg-white/5 border border-white/10">Esc</span>
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 border border-rose-500/40 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              {isLoading ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmLabel}</span>
                  <span className="hidden sm:inline-block text-[10px] font-mono opacity-80 px-1.5 py-0.2 rounded bg-black/25">↵</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
