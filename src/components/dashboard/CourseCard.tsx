import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Play, Edit3, Trash2, Share2, Clock, CheckCircle2, FolderUp, MoreHorizontal, Globe, Lock, Layout, Youtube } from 'lucide-react';
import { Course } from '../../types';
import { cn } from '../../utils/cn';

interface CourseCardProps {
  course: Course;
  onDelete: (id: string, title: string) => void;
  onShare: (course: Course) => void;
  onEdit: (course: Course) => void;
  index: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onDelete,
  onShare,
  onEdit,
  index
}) => {
  const [bgImage, setBgImage] = useState<string | null>(() => {
    return localStorage.getItem(`course-bg-${course.id}`);
  });

  const completedLessons = course.progress?.filter(p => p.completed).length || 0;
  const totalLessons = course.lessons?.length || 0;
  const moduleCount = course.modules?.length || 0;
  const totalDuration = course.lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const formatTotalDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds === 0) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  useEffect(() => {
    if (!bgImage) {
      // Extract keywords from title (words > 3 chars)
      const keywords = course.title
        .split(/[\s@]+/)
        .filter(w => w.length > 3)
        .join(',');
      
      const query = keywords || 'education,technology';
      // Use a more stable Unsplash URL format that doesn't require a redirect fetch
      // source.unsplash.com is deprecated and has CORS issues when fetched.
      // We'll use the URL directly in the style, and store it to avoid re-calculation.
      const imageUrl = `https://images.unsplash.com/featured/?${encodeURIComponent(query)}`;
      
      setBgImage(imageUrl);
      localStorage.setItem(`course-bg-${course.id}`, imageUrl);
    }
  }, [course.id, course.title, bgImage]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 20 }}
      className="group relative h-full"
    >
      <div className="relative bg-card rounded-[2rem] border border-border/50 overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 group-hover:border-primary/20 h-full flex flex-col backdrop-blur-sm shadow-sm">
        {/* Subtle Background Image */}
        {bgImage && (
          <div 
            className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.12] blur-[2px] transition-all duration-700 group-hover:opacity-20 group-hover:scale-110"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-card/50 to-card" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Thumbnail Area */}
          <div className="relative aspect-video bg-muted/50 overflow-hidden">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title} 
              className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 group-hover:rotate-1"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:scale-105 transition-all duration-1000">
              <FolderUp size={40} className="text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay Actions - Visible on hover (desktop) or always (mobile) */}
          <div className="absolute inset-0 bg-[#050816]/70 laptop:opacity-0 laptop:group-hover:opacity-100 transition-all duration-500 ease-out flex items-center justify-center gap-2.5 tablet:gap-3 backdrop-blur-sm z-20">
            <Link 
              to={`/course/${course.id}`}
              className="w-11 h-11 tablet:w-12 tablet:h-12 bg-primary text-white rounded-xl tablet:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/30"
            >
              <Play size={18} fill="currentColor" className="tablet:w-5 tablet:h-5" />
            </Link>
            <button 
              onClick={() => onEdit(course)}
              className="w-11 h-11 tablet:w-12 tablet:h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl tablet:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all backdrop-blur-md border border-white/10"
            >
              <Edit3 size={18} className="tablet:w-5 tablet:h-5" />
            </button>
            <button 
              onClick={() => onShare(course)}
              className="w-11 h-11 tablet:w-12 tablet:h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl tablet:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all backdrop-blur-md border border-white/10"
            >
              <Share2 size={18} className="tablet:w-5 tablet:h-5" />
            </button>
            <button 
              onClick={() => onDelete(course.id, course.title)}
              className="w-11 h-11 tablet:w-12 tablet:h-12 bg-red-500/20 text-red-500 rounded-xl tablet:rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all backdrop-blur-md border border-red-500/20"
            >
              <Trash2 size={18} className="tablet:w-5 tablet:h-5" />
            </button>
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 tablet:top-4 left-3 tablet:left-4 flex flex-col gap-1.5 tablet:gap-2 z-30">
            <div className={cn(
              "px-2.5 tablet:px-3 py-1 tablet:py-1 backdrop-blur-xl border rounded-lg text-[8px] tablet:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 tablet:gap-2 shadow-sm",
              course.sourceType === 'youtube' ? "bg-red-500/10 border-red-500/20 text-red-500" :
              course.sourceType === 'gdrive' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
              "bg-muted/90 border-border/50 text-muted-foreground"
            )}>
              {course.sourceType === 'youtube' && <Youtube size={12} />}
              {course.sourceType === 'gdrive' && <Globe size={12} />}
              {course.sourceType === 'local' && <FolderUp size={12} />}
              <span className="hidden sm:inline">
                {course.sourceType === 'youtube' ? 'YouTube Playlist' : 
                 course.sourceType === 'gdrive' ? 'Google Drive' : 'Local Upload'}
              </span>
              <span className="sm:hidden">
                {course.sourceType === 'youtube' ? 'YouTube' : 
                 course.sourceType === 'gdrive' ? 'Drive' : 'Local'}
              </span>
            </div>
            {course.isPublic !== undefined && (
              <div className={cn(
                "px-2.5 tablet:px-3 py-1 tablet:py-1 backdrop-blur-xl border rounded-lg text-[8px] tablet:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 tablet:gap-2 w-fit shadow-sm",
                course.isPublic ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
              )}>
                {course.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                {course.isPublic ? 'Public' : 'Private'}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 tablet:p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3 mb-2 tablet:mb-3">
            <h3 className="text-sm tablet:text-base font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors text-foreground">
              {course.title}
            </h3>
            <button className="p-1 px-2 hover:bg-muted rounded-lg transition-colors shrink-0 text-muted-foreground">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 tablet:gap-x-4 gap-y-2 text-[9px] tablet:text-[11px] text-muted-foreground mb-4 tablet:mb-6 font-medium">
            <div className="flex items-center gap-1.5 tablet:gap-2">
              <Layout size={11} className="text-primary/60" />
              {moduleCount} Modules
            </div>
            <div className="w-1 h-1 bg-border rounded-full" />
            <div className="flex items-center gap-1.5 tablet:gap-2">
              <Play size={11} className="text-primary/60" />
              {totalLessons} Lessons
            </div>
            {formatTotalDuration(totalDuration) && (
              <>
                <div className="w-1 h-1 bg-border rounded-full" />
                <div className="flex items-center gap-1.5 tablet:gap-2">
                  <Clock size={11} className="text-primary/60" />
                  {formatTotalDuration(totalDuration)}
                </div>
              </>
            )}
          </div>

          <div className="mt-auto space-y-2.5 tablet:space-y-3">
            <div className="flex items-center justify-between text-[10px] tablet:text-xs font-bold mb-1">
              <span className={cn(
                "px-2 py-0.5 rounded-md border",
                progressPercent === 100 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-primary/5 text-primary border-primary/10"
              )}>
                {progressPercent === 100 ? 'Course Completed' : 'Overall Progress'}
              </span>
              <span className="text-muted-foreground/80">{progressPercent}%</span>
            </div>
            <div className="relative w-full h-1.5 tablet:h-2 bg-muted/50 rounded-full overflow-hidden border border-border/40">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full transition-all duration-700",
                  progressPercent === 100 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                    : "bg-gradient-to-r from-primary via-primary to-secondary shadow-[0_0_15px_rgba(108,124,255,0.4)]"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
  );
};
