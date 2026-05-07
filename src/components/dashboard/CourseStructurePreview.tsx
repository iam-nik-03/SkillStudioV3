import React from 'react';
import { motion } from 'motion/react';
import { X, FolderUp, ChevronRight, Play, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CourseStructurePreviewProps {
  data: {
    title: string;
    modules: any[];
    lessons: any[];
  };
  onConfirm: () => void;
  onClose: () => void;
  isUploading: boolean;
  progress: number;
  isDriveImport: boolean;
}

export const CourseStructurePreview: React.FC<CourseStructurePreviewProps> = ({
  data,
  onConfirm,
  onClose,
  isUploading,
  progress,
  isDriveImport
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 100 }}
        className="glass border-t sm:border border-border/50 rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] backdrop-blur-2xl"
      >
          {/* Header */}
          <div className="p-6 tablet:p-8 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-4 tablet:gap-6">
              <div className="w-14 h-14 tablet:w-16 tablet:h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-500/10">
                <FolderUp size={28} />
              </div>
              <div>
                <h4 className="text-xl tablet:text-2xl font-bold text-foreground leading-tight tracking-tight">Logical Structure Detected</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] tablet:text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/10">{data.modules.length} Modules</span>
                  <span className="text-[10px] tablet:text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/10">{data.lessons.length} Learning Points</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 tablet:p-8 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <div className="bg-emerald-500/5 p-4 tablet:p-6 rounded-[1.5rem] border border-emerald-500/10 flex items-start gap-4 mb-4 backdrop-blur-sm">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-sm tablet:text-base text-muted-foreground leading-relaxed font-medium">
                High-fidelity data identification successful. Review the generated course hierarchy before final integration.
              </p>
            </div>

            {data.modules.map((mod, i) => (
              <motion.div 
                key={mod.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card/40 rounded-[2rem] p-6 tablet:p-8 border border-border/50 group hover:border-primary/40 transition-all backdrop-blur-sm shadow-lg overflow-hidden relative"
              >
                <div className="flex items-center gap-4 text-xs tablet:text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6 relative z-10">
                  <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                    {i + 1}
                  </div>
                  {mod.title}
                </div>
                <div className="space-y-3 pl-2 relative z-10">
                  {data.lessons
                    .filter((l) => l.moduleId === mod.id)
                    .map((l) => (
                      <div key={l.id} className="flex items-center gap-4 text-sm tablet:text-base text-muted-foreground group/item">
                        <div className="w-8 h-8 bg-muted/60 rounded-xl flex items-center justify-center group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all flex-shrink-0 border border-transparent group-hover/item:border-primary/20">
                          {l.type === 'pdf' ? (
                            <FileText size={16} />
                          ) : (
                            <Play size={16} fill="currentColor" />
                          )}
                        </div>
                        <span className="truncate flex-1 font-bold tracking-tight opacity-80 group-hover/item:opacity-100 group-hover/item:text-foreground transition-all">{l.title}</span>
                        {l.duration && (
                          <span className="text-[10px] tablet:text-xs text-muted-foreground font-mono bg-muted/80 px-2 py-0.5 rounded-lg border border-border/40">
                            {Math.floor(l.duration / 60)}:{(l.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 tablet:p-8 bg-muted/20 border-t border-border flex flex-col items-center gap-6">
            {isUploading && (
              <div className="w-full space-y-3 px-2">
                <div className="flex items-center justify-between text-[10px] tablet:text-xs font-bold uppercase tracking-[0.2em]">
                  <span className="text-emerald-500 flex items-center gap-3">
                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                    {isDriveImport ? 'Syncing Modules' : 'Structural Commit In Progress'}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden shadow-inner border border-border/40 p-[2px]">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col tablet:flex-row items-center gap-4 w-full">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="w-full tablet:flex-1 py-4.5 rounded-[1.5rem] text-sm font-bold text-muted-foreground hover:bg-muted transition-all border border-border/60 disabled:opacity-50 active:scale-95"
              >
                Dismiss Analysis
              </button>
              <button
                onClick={onConfirm}
                disabled={isUploading}
                className={cn(
                  "w-full tablet:flex-[2] py-4.5 rounded-[1.5rem] text-sm tablet:text-base font-bold transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50",
                  isUploading 
                    ? "bg-muted text-muted-foreground/30" 
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/30"
                )}
              >
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={24} />
                )}
                {isUploading ? 'Committing Changes...' : 'Initiate Neural Import'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
};
