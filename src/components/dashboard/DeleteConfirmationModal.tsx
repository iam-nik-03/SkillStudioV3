import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseTitle
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            className="relative w-full max-w-md bg-card border-t sm:border border-border/50 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 tablet:p-10 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 tablet:w-20 tablet:h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mb-6 shadow-inner border border-red-500/10">
                <AlertTriangle size={32} className="tablet:w-10 tablet:h-10" />
              </div>
              <h3 className="text-2xl tablet:text-3xl font-bold mb-2 tracking-tight">Erase Content?</h3>
              <p className="text-muted-foreground text-[10px] tablet:text-xs uppercase tracking-[0.2em] font-bold opacity-70">Irreversible Action Detected</p>
            </div>

            <div className="bg-muted/30 rounded-2xl tablet:rounded-3xl p-5 tablet:p-6 mb-8 tablet:mb-10 border border-border/40 backdrop-blur-sm">
              <p className="text-[10px] tablet:text-xs text-muted-foreground/60 uppercase tracking-widest font-bold mb-2">Subject Course</p>
              <p className="text-base tablet:text-lg font-bold text-foreground line-clamp-2 leading-snug">{courseTitle}</p>
            </div>

            <p className="text-sm tablet:text-base text-muted-foreground mb-8 tablet:mb-10 text-center leading-relaxed">
              This will permanently delete the course and all associated <span className="text-foreground font-bold">progress, notes, and milestones</span>.
            </p>

            <div className="flex flex-col tablet:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-2xl bg-muted/50 hover:bg-muted text-foreground text-sm tablet:text-base font-bold transition-all active:scale-[0.98] border border-border/40"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-[1.5] px-8 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm tablet:text-base font-bold transition-all active:scale-[0.98] shadow-lg shadow-red-500/30"
              >
                Permanently Delete
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
