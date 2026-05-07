import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Bookmark, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  X,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  Compass,
  Library,
  Youtube,
  Users,
  Loader2,
  ChevronRight,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { Course } from '../types';
import { CourseCard } from '../components/dashboard/CourseCard';
import { DeleteConfirmationModal } from '../components/dashboard/DeleteConfirmationModal';
import { ShareModal } from '../components/dashboard/ShareModal';
import { EditCourseModal } from '../components/dashboard/EditCourseModal';
import { UploadPanel } from '../components/dashboard/UploadPanel';
import { useFileStore } from '../store/FileStore';
import { useAuth } from '../store/AuthContext';
import { cn } from '../utils/cn';
import { getCourses, getCourseDetail, deleteCourse, updateCourse, saveCourse } from '../utils/courseDB';
import { api } from '../utils/api';

interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoCount: number;
}

const CATEGORIES = [
  'Programming', 'Design', 'Business', 'AI & Data', 'Marketing', 'Photography', 'Music'
];

const RECENT_SEARCHES = [
  'React Course', 'Python for Beginners', 'UI/UX Design', 'Machine Learning'
];

export const Workspace: React.FC = () => {
  const { deleteFilesForCourse } = useFileStore();
  const { logActivity } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeView, setActiveView] = useState<'library' | 'discover'>('library');
  const [activeTab, setActiveTab] = useState<'all' | 'review'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showImport, setShowImport] = useState(false);
  
  // Discover State
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState<YouTubePlaylist[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const discoverResultsRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; course: Course | null }>({
    isOpen: false,
    course: null
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; course: Course | null }>({
    isOpen: false,
    course: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  // Discover Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (discoverQuery.trim()) {
        searchPlaylists(discoverQuery);
      } else {
        setDiscoverResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [discoverQuery]);

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      
      const coursesWithDetails = await Promise.all(data.map(async (c: Course) => {
        try {
          const detail = await getCourseDetail(c.id);
          return { 
            ...c, 
            bookmarks: detail?.bookmarks || [],
            lessons: detail?.lessons || [],
            modules: detail?.modules || [],
            progress: detail?.progress || []
          };
        } catch (e) {
          return { ...c, bookmarks: [], lessons: [], modules: [], progress: [] };
        }
      }));

      setCourses(coursesWithDetails);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaylists = async (query: string) => {
    setDiscoverLoading(true);
    setDiscoverError(null);
    console.log(`Starting search for: ${query}`);
    try {
      const { data, error } = await api.get<YouTubePlaylist[]>(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      console.log('Search response:', { data, error });
      if (error) throw new Error(error);
      setDiscoverResults(data || []);
      if (data && data.length > 0 && activeView === 'discover') {
        setTimeout(() => {
          discoverResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setDiscoverError(err.message);
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleStartCourse = async (playlist: YouTubePlaylist) => {
    try {
      setDiscoverLoading(true);
      console.log(`Starting course for playlist: ${playlist.id}`);
      const { data: playlistData, error } = await api.get<any>(`/api/youtube/playlist/${playlist.id}`);
      console.log('Playlist details response:', { playlistData, error });
      if (error || !playlistData) throw new Error(error || 'Failed to fetch playlist details');

      const courseId = `yt-${playlist.id}`;
      const course = {
        id: courseId,
        title: playlistData.title,
        sourceType: 'youtube',
        thumbnail: playlistData.thumbnail,
        modules: [
          {
            id: `mod-${playlist.id}`,
            courseId: courseId,
            title: 'Course Content',
            orderIndex: 0
          }
        ],
        lessons: playlistData.videos.map((v: any, index: number) => ({
          id: `lesson-${v.id}-${index}`,
          courseId: courseId,
          moduleId: `mod-${playlist.id}`,
          title: v.title,
          youtubeId: v.id,
          orderIndex: index,
          type: 'youtube'
        }))
      };

      console.log('Saving course:', course);
      await saveCourse(course);
      await logActivity('Imported Course', { title: course.title, source: 'youtube' });
      await fetchCourses(); // Refresh library
      toast.success('Course imported successfully');
      navigate(`/course/${courseId}`);
    } catch (err: any) {
      console.error('Failed to start course:', err);
      toast.error('Error starting course: ' + err.message);
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const detail = await getCourseDetail(deleteModal.id);
      if (detail) {
        const lessonIds = detail.lessons?.map((l: any) => l.id) || [];
        await deleteFilesForCourse(lessonIds);
      }

      await deleteCourse(deleteModal.id);
      await logActivity('Deleted Course', { title: deleteModal.title });
      setCourses(prev => prev.filter(c => c.id !== deleteModal.id));
      toast.success('Course deleted successfully');
    } catch (err) {
      toast.error('Failed to delete course');
    } finally {
      setDeleteModal({ isOpen: false, id: '', title: '' });
    }
  };

  const handleEditSave = async (id: string, title: string, thumbnail?: string) => {
    try {
      await updateCourse(id, { title, thumbnail });
      setCourses(prev => prev.map(c => c.id === id ? { ...c, title, thumbnail } : c));
      toast.success('Course updated successfully');
    } catch (err) {
      toast.error('Failed to update course');
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!shareModal.course) return;
    try {
      await updateCourse(shareModal.course.id, { isPublic });
      setCourses(prev => prev.map(c => c.id === shareModal.course?.id ? { ...c, isPublic } : c));
      setShareModal(prev => ({ ...prev, course: prev.course ? { ...prev.course, isPublic } : null }));
      toast.success(`Course is now ${isPublic ? 'public' : 'private'}`);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const filteredCourses = useMemo(() => {
    let result = activeTab === 'all' 
      ? courses 
      : courses.filter(c => c.bookmarks && c.bookmarks.length > 0);
    
    if (searchQuery) {
      result = result.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return result;
  }, [courses, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const totalLessons = courses.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);
    const completedLessons = courses.reduce((acc, c) => acc + (c.progress?.filter(p => p.completed).length || 0), 0);
    return {
      total: courses.length,
      completed: completedLessons,
      totalLessons,
      percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
  }, [courses]);

  return (
    <>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 tablet:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <section className="mb-6 tablet:mb-12">
          <div className="flex flex-col laptop:flex-row laptop:items-end justify-between gap-6 mb-8 tablet:mb-12">
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-primary font-bold text-[9px] tablet:text-xs uppercase tracking-[0.2em] mb-2 tablet:mb-3 opacity-80"
              >
                <Sparkles size={14} className="fill-current" />
                Unified Workspace
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl tablet:text-4xl desktop:text-5xl font-bold tracking-tight text-foreground leading-[1.1]"
              >
                Learn, Manage, <span className="text-primary italic-serif px-1">Discover</span>
              </motion.h1>
            </div>
            
            <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/50 w-fit shadow-inner backdrop-blur-sm">
              <button 
                onClick={() => setActiveView('library')}
                className={cn(
                  "px-4 tablet:px-6 py-2.5 tablet:py-3 rounded-xl text-[11px] tablet:text-sm font-bold transition-all flex items-center gap-2",
                  activeView === 'library' ? "bg-background text-foreground shadow-lg border border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Library size={15} />
                My Library
              </button>
              <button 
                onClick={() => setActiveView('discover')}
                className={cn(
                  "px-4 tablet:px-6 py-2.5 tablet:py-3 rounded-xl text-[11px] tablet:text-sm font-bold transition-all flex items-center gap-2",
                  activeView === 'discover' ? "bg-background text-foreground shadow-lg border border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Compass size={15} />
                Discover
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'library' ? (
              <motion.div 
                key="library-hero"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 laptop:grid-cols-3 gap-6 tablet:gap-8"
              >
                <div className="laptop:col-span-2">
                  <div className="bg-muted/30 p-6 tablet:p-10 rounded-3xl tablet:rounded-[2.5rem] border border-border/40 relative overflow-hidden group h-full flex flex-col justify-center shadow-sm backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity hidden tablet:block rotate-12 group-hover:rotate-6 duration-1000">
                      <TrendingUp size={240} />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary/10 transition-all group-hover:px-4">
                        <TrendingUp size={12} className="animate-pulse" />
                        Learning Momentum
                      </div>
                      <h2 className="text-xl tablet:text-2xl desktop:text-3xl font-bold mb-8 tracking-tight leading-tight text-foreground">
                        You've reached <span className="text-primary">{stats.percent}%</span> of your <br className="hidden tablet:block" /> course completion goals.
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 tablet:gap-10 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold leading-none mb-1">{stats.total}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Courses</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={22} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold leading-none mb-1">{stats.completed}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Finished</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowImport(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] text-sm group/btn shadow-lg"
                      >
                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                        Explore Library
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 tablet:gap-4">
                  <div 
                    className="glass p-5 tablet:p-6 rounded-[1.5rem] tablet:rounded-[2rem] border border-border/50 flex-1 flex flex-col justify-between group cursor-pointer hover:border-primary/30 transition-all shadow-lg"
                    onClick={() => setActiveView('discover')}
                  >
                    <div>
                      <div className="w-9 h-9 tablet:w-11 tablet:h-11 bg-primary/10 rounded-xl tablet:rounded-2xl flex items-center justify-center text-primary border border-primary/20 mb-3 tablet:mb-4 group-hover:scale-110 transition-transform">
                        <Search size={18} className="tablet:w-5 tablet:h-5" />
                      </div>
                      <h3 className="text-base tablet:text-lg font-bold mb-1.5">Discover Courses</h3>
                      <p className="text-[10px] tablet:text-xs text-muted-foreground leading-relaxed">
                        Find top-rated YouTube playlists and convert them to courses.
                      </p>
                    </div>
                    <div className="mt-3 tablet:mt-4 flex items-center gap-2 text-primary font-bold text-[10px] tablet:text-xs">
                      Explore Now <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="discover-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass p-6 tablet:p-12 rounded-[2rem] tablet:rounded-[3rem] border border-border/50 relative overflow-hidden"
              >
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-2xl tablet:text-4xl font-bold mb-6 tracking-tight">Master any topic with YouTube.</h2>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={discoverQuery}
                        onChange={(e) => setDiscoverQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Search for a course topic..." 
                        className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm tablet:text-lg font-medium shadow-2xl"
                      />
                      {discoverLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin text-primary" size={20} />
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    <AnimatePresence>
                      {showSuggestions && !discoverQuery && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-4 glass border border-border rounded-2xl p-6 shadow-2xl z-50 text-left"
                        >
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History size={14} />
                            Recent Searches
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {RECENT_SEARCHES.map(search => (
                              <button
                                key={search}
                                onClick={() => setDiscoverQuery(search)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-sm font-medium group"
                              >
                                <Search size={16} className="text-muted-foreground group-hover:text-primary" />
                                {search}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="mt-6 tablet:mt-10 flex flex-wrap justify-center gap-1.5 tablet:gap-3 p-4 rounded-[2rem] bg-muted/30 border border-border/50 backdrop-blur-sm max-w-2xl mx-auto">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setDiscoverQuery(cat)}
                        className="px-3 py-1.5 tablet:px-5 tablet:py-2.5 rounded-full bg-background/50 border border-border hover:border-primary/50 hover:bg-primary/5 text-[10px] tablet:text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Main Content Section */}
        <section className="min-h-[50vh]">
          <AnimatePresence mode="wait">
            {activeView === 'library' ? (
              <motion.div 
                key="library-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-6 mb-8 tablet:mb-10">
                  <div className="flex flex-col tablet:flex-row tablet:items-center gap-4 tablet:gap-8">
                    <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight">My Courses</h2>
                    <div className="flex bg-muted p-1 rounded-2xl border border-border w-fit">
                      <button 
                        onClick={() => setActiveTab('all')}
                        className={cn(
                          "px-4 tablet:px-5 py-2 rounded-xl text-xs tablet:text-sm font-bold transition-all",
                          activeTab === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setActiveTab('review')}
                        className={cn(
                          "px-4 tablet:px-5 py-2 rounded-xl text-xs tablet:text-sm font-bold transition-all flex items-center gap-2",
                          activeTab === 'review' ? "bg-amber-500 text-primary-foreground shadow-lg shadow-amber-500/20" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Bookmark size={14} />
                        Review
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative group flex-1 tablet:flex-none">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search library..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-muted border border-border rounded-2xl pl-12 pr-6 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full tablet:w-64"
                      />
                    </div>
                    <div className="flex bg-muted p-1 rounded-xl border border-border">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          viewMode === 'grid' ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <LayoutGrid size={18} />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          viewMode === 'list' ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6 tablet:gap-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[350px] tablet:h-[420px] rounded-[2rem] tablet:rounded-[2.5rem] bg-muted animate-pulse border border-border" />
                    ))}
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-16 tablet:py-24 glass rounded-[2rem] tablet:rounded-[3rem] border border-border/50 px-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-primary">
                      {activeTab === 'all' ? <Library size={32} /> : <Bookmark size={32} />}
                    </div>
                    <h3 className="text-xl tablet:text-2xl font-bold mb-3">
                      {activeTab === 'all' ? "Your library is empty" : "No review lessons"}
                    </h3>
                    <p className="text-xs tablet:text-sm text-muted-foreground max-w-md mx-auto mb-8">
                      {activeTab === 'all' 
                        ? "Start by importing a course or discovering new ones on YouTube." 
                        : "Lessons you bookmark for review will appear here for quick access."}
                    </p>
                    {activeTab === 'all' && (
                    <div className="flex flex-wrap justify-center gap-4 tablet:gap-6">
                      <button 
                        onClick={() => setShowImport(true)}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 shadow-lg border border-primary/20"
                      >
                        Import Content
                      </button>
                      <button 
                        onClick={() => setActiveView('discover')}
                        className="bg-muted text-foreground px-8 py-4 rounded-2xl font-bold hover:bg-muted/80 transition-all border border-border/40 shadow-sm"
                      >
                        Discover Courses
                      </button>
                    </div>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-4 tablet:gap-6 desktop:gap-8",
                    viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 tablet:grid-cols-2 desktop:grid-cols-3" : "grid-cols-1"
                  )}>
                    <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course, idx) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          index={idx}
                          onDelete={(id, title) => setDeleteModal({ isOpen: true, id, title })}
                          onShare={(course) => setShareModal({ isOpen: true, course })}
                          onEdit={(course) => setEditModal({ isOpen: true, course })}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="discover-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={discoverResultsRef}
                className="scroll-mt-32"
              >
                {discoverError ? (
                  <div className="text-center py-12 tablet:py-20 glass rounded-2xl border border-destructive/20">
                    <p className="text-destructive font-bold text-lg mb-4">{discoverError}</p>
                    <button 
                      onClick={() => searchPlaylists(discoverQuery)}
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
                    >
                      Try Again
                    </button>
                  </div>
                ) : discoverResults.length > 0 ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl tablet:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-primary" />
                        Search Results
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6 tablet:gap-8">
                      {discoverResults.map((playlist, i) => (
                        <motion.div 
                          key={playlist.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass rounded-[2rem] overflow-hidden group border border-border/50 hover:border-primary/30 transition-all shadow-xl flex flex-col"
                        >
                          <div className="aspect-video relative overflow-hidden ring-1 ring-white/5">
                            <img 
                              src={playlist.thumbnail} 
                              alt={playlist.title}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px]">
                              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500 ease-out border-4 border-white/20">
                                <Play fill="currentColor" size={28} className="translate-x-1" />
                              </div>
                            </div>
                            <div className="absolute bottom-4 right-4 px-4 py-2 bg-[#050816]/80 backdrop-blur-xl rounded-2xl text-[10px] font-bold text-white flex items-center gap-2.5 border border-white/10 shadow-2xl">
                              <Youtube size={14} className="text-red-500" />
                              <span className="tracking-widest uppercase">{playlist.videoCount} Episodes</span>
                            </div>
                          </div>
                          <div className="p-6 tablet:p-8 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/10">YouTube</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Users size={12} />
                                {playlist.channelTitle}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                              {playlist.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-8 line-clamp-2 leading-relaxed flex-1">
                              {playlist.description || "No description provided."}
                            </p>
                            <button 
                              onClick={() => handleStartCourse(playlist)}
                              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-primary/20 group/btn"
                            >
                              <Play size={18} fill="currentColor" />
                              Start Course
                              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : discoverLoading ? (
                  <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="glass h-[400px] rounded-[2rem] animate-pulse border border-border/50" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] animate-ping opacity-20"></div>
                      <Sparkles size={48} className="text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">Discover New Skills</h3>
                    <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
                      Search for topics you want to learn and we'll find the best YouTube playlists for you.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Modals */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
          onConfirm={handleDeleteConfirm}
          courseTitle={deleteModal.title}
        />

        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, course: null })}
          courseTitle={shareModal.course?.title || ''}
          courseId={shareModal.course?.id || ''}
          isPublic={shareModal.course?.isPublic || false}
          onTogglePublic={handleTogglePublic}
        />

        <EditCourseModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, course: null })}
          onSave={handleEditSave}
          course={editModal.course}
        />

        {/* Import Panel Modal */}
        <AnimatePresence>
          {showImport && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-xl" 
                onClick={() => setShowImport(false)}
              />
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                className="relative w-full max-w-3xl sm:max-h-[85vh] overflow-y-auto custom-scrollbar"
              >
                <div className="absolute top-6 right-6 z-10">
                  <button 
                    onClick={() => setShowImport(false)}
                    className="p-3 bg-muted hover:bg-muted/80 rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                  >
                    <X size={24} />
                  </button>
                </div>
                <UploadPanel onUploadComplete={() => {
                  fetchCourses();
                  setShowImport(false);
                  toast.success('Course synchronized successfully');
                }} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pt-10 border-t border-border flex items-center justify-between text-muted-foreground text-sm">
          <p>© 2026 SkillStudio. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Crafted by</span>
            <span className="font-bold text-foreground tracking-widest uppercase text-[10px] px-2 py-1 bg-muted rounded-lg border border-border">
              Nik
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};
