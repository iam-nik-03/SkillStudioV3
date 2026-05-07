import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Globe, Lock, Link as LinkIcon, Users } from 'lucide-react';

import { cn } from '../../utils/cn';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId: string;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  isPublic,
  onTogglePublic
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/course/${courseId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            className="relative w-full max-w-lg bg-card border-t sm:border border-border rounded-t-[2.5rem] sm:rounded-[3rem] p-8 tablet:p-12 shadow-2xl flex flex-col"
          >
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-500/10 shrink-0">
                <Users size={32} />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl tablet:text-3xl font-bold tracking-tight truncate">{courseTitle}</h3>
                <p className="text-muted-foreground text-sm tablet:text-base font-medium opacity-70">Control access and share the knowledge.</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Visibility Toggle */}
              <div className="bg-muted/30 rounded-[2rem] p-6 tablet:p-8 border border-border/40 backdrop-blur-md relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      isPublic ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                    )}>
                      {isPublic ? <Globe size={24} /> : <Lock size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-base tablet:text-lg">{isPublic ? 'Publicly Available' : 'Private Access'}</p>
                      <p className="text-xs tablet:text-sm text-muted-foreground font-medium">
                        {isPublic ? 'Anyone with the direct link can participate.' : 'Only you can see and manage this content.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onTogglePublic(!isPublic)}
                    className={cn(
                      "relative w-14 h-8 rounded-full transition-all duration-300 scale-110 active:scale-100",
                      isPublic ? "bg-emerald-500" : "bg-border/60"
                    )}
                  >
                    <motion.div
                      animate={{ x: isPublic ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
              </div>

              {/* Link Copy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] tablet:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Direct Course Link
                  </label>
                  {isPublic ? (
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500/60 font-bold uppercase tracking-widest">Link inactive</span>
                  )}
                </div>
                <div className="flex flex-col tablet:flex-row gap-3">
                  <div className="flex-1 bg-muted/50 border border-border/60 rounded-2xl px-5 py-4 text-sm font-medium text-muted-foreground truncate flex items-center gap-3 backdrop-blur-sm group-hover:border-primary/20 transition-colors">
                    <LinkIcon size={16} className="shrink-0 opacity-50" />
                    <span className="truncate">{shareUrl}</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="shrink-0 h-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center min-w-[120px] font-bold shadow-xl shadow-primary/20"
                  >
                    {copied ? (
                      <Check size={20} className="animate-in zoom-in" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Copy size={20} />
                        <span>Copy Link</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-muted hover:bg-muted/80 rounded-2xl text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
