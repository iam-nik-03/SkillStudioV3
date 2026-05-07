import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit3, Save } from 'lucide-react';
import { Course } from '../../types';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newTitle: string, newThumbnail?: string) => void;
  course: Course | null;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  course
}) => {
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setThumbnail(course.thumbnail);
    }
  }, [course]);

  const handleSave = () => {
    if (course && title.trim()) {
      onSave(course.id, title.trim(), thumbnail);
      onClose();
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
              <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-inner border border-primary/10 shrink-0">
                <Edit3 size={32} />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl tablet:text-3xl font-bold tracking-tight">Refine Details</h3>
                <p className="text-muted-foreground text-sm tablet:text-base font-medium opacity-70">Elevate the metadata of your course.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] tablet:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 block px-2">
                  Identity Image (Thumbnail)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video bg-muted/30 border-2 border-dashed border-border/60 rounded-[2rem] overflow-hidden cursor-pointer group hover:border-primary/40 transition-all backdrop-blur-sm shadow-inner"
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-3">
                        <Edit3 size={32} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">Tap to Project Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white border border-white/30">
                      <Edit3 size={24} />
                    </div>
                  </div>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] tablet:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 block px-2">
                  Official Course Title
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-muted/50 border border-border/60 rounded-2xl px-6 py-4.5 text-base tablet:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="The Pinnacle of Knowledge..."
                />
              </div>

              <div className="flex flex-col tablet:flex-row gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-8 py-4 rounded-2xl bg-muted/50 hover:bg-muted text-foreground text-sm tablet:text-base font-bold transition-all active:scale-[0.98] border border-border/40"
                 >
                  Dismiss
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="flex-[1.5] px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-sm tablet:text-base font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                >
                  <Save size={20} />
                  Update Identity
                </button>
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
