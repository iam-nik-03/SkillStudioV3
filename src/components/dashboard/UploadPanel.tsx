import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderUp, 
  X, 
  CheckCircle2, 
  Loader2, 
  Link2, 
  Youtube,
  Cloud,
  FileVideo,
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { parseLocalFolder, parseGDriveFolder, parseYoutubePlaylist } from '../../utils/courseParser';
import { useFileStore } from '../../store/FileStore';
import { cn } from '../../utils/cn';
import { saveCourse } from '../../utils/courseDB';
import { extractDriveId, fetchGDriveCourse } from '../../utils/gdrive';
import { extractPlaylistId, fetchYoutubePlaylist } from '../../utils/youtube';
import { CourseStructurePreview } from './CourseStructurePreview';

interface UploadPanelProps {
  onUploadComplete: () => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'completed';

export const UploadPanel: React.FC<UploadPanelProps> = ({ onUploadComplete }) => {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [driveLink, setDriveLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isDriveImport, setIsDriveImport] = useState(false);
  const [isYoutubeImport, setIsYoutubeImport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { setFiles } = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    
    setState('uploading');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const data = parseLocalFolder(files);
      setExtractedData(data);
      setState('processing');
      setProgress(100);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse local folder");
      setState('idle');
    } finally {
      clearInterval(interval);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleLocalUpload(files);
  }, []);

  const handleDriveImport = async () => {
    const folderId = extractDriveId(driveLink);
    if (!folderId) {
      toast.error("Invalid Google Drive folder link. Please ensure it's a public link.");
      return;
    }

    setState('uploading');
    setProgress(0);
    setIsDriveImport(true);

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const gdriveData = await fetchGDriveCourse(folderId);
      const data = parseGDriveFolder(gdriveData.title, gdriveData.files);
      setExtractedData({ ...data, rootFolderId: folderId });
      setState('processing');
      setProgress(100);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch Google Drive course");
      setState('idle');
      setIsDriveImport(false);
    } finally {
      clearInterval(interval);
    }
  };

  const handleYoutubeImport = async () => {
    const playlistId = extractPlaylistId(youtubeLink);
    if (!playlistId) {
      toast.error("Invalid YouTube playlist link. Please provide a valid URL.");
      return;
    }

    setState('uploading');
    setProgress(0);
    setIsYoutubeImport(true);

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const youtubeData = await fetchYoutubePlaylist(playlistId);
      const data = parseYoutubePlaylist(youtubeData.title, youtubeData.videos);
      setExtractedData({ ...data, thumbnail: youtubeData.thumbnail });
      setState('processing');
      setProgress(100);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch YouTube playlist");
      setState('idle');
      setIsYoutubeImport(false);
    } finally {
      clearInterval(interval);
    }
  };

  const handleConfirmPublish = async () => {
    setState('uploading');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 100);

    try {
      const courseId = crypto.randomUUID();
      
      if (!isDriveImport && !isYoutubeImport) {
        await Promise.all(extractedData.lessons.map(async (l: any) => {
          if (l.file) await setFiles(l.id, l.file);
        }));
      }

      let sourceType: 'local' | 'gdrive' | 'youtube' = 'local';
      if (isDriveImport) sourceType = 'gdrive';
      if (isYoutubeImport) sourceType = 'youtube';

      await saveCourse({
        id: courseId,
        title: extractedData.title,
        sourceType,
        thumbnail: extractedData.thumbnail,
        rootFolderId: extractedData.rootFolderId,
        lastSyncTime: isDriveImport ? new Date().toISOString() : undefined,
        modules: extractedData.modules,
        lessons: extractedData.lessons.map(({ file, ...rest }: any) => rest)
      });

      clearInterval(interval);
      setProgress(100);
      setState('completed');
      setTimeout(() => {
        onUploadComplete();
        setState('idle');
        setExtractedData(null);
        setIsDriveImport(false);
        setIsYoutubeImport(false);
        setDriveLink('');
        setYoutubeLink('');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize import");
      setState('processing');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 tablet:p-6 laptop:p-8 glass rounded-[2.5rem] border border-border/50 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between mb-8 tablet:mb-10 gap-4">
        <div>
          <h2 className="text-xl tablet:text-2xl font-bold tracking-tight mb-1 text-foreground">Import Selection</h2>
          <p className="text-sm text-muted-foreground font-medium opacity-70">Initialize your learning trajectory.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] tablet:text-xs font-bold uppercase tracking-[0.15em] border border-primary/20 self-start tablet:self-auto">
          <Zap size={14} className="animate-pulse" />
          Neural Sync Ready
        </div>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 gap-4 tablet:gap-6">
        {/* Local Upload */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "p-6 tablet:p-8 rounded-[2rem] relative overflow-hidden group border transition-all duration-500 cursor-pointer flex flex-col h-full",
            isDragging ? "bg-emerald-500/10 border-emerald-500 shadow-2xl shadow-emerald-500/10" : "glass border-border/50 hover:border-emerald-500/30"
          )}
          onClick={() => state === 'idle' && fileInputRef.current?.click()}
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <FolderUp size={80} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 tablet:w-14 tablet:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 shadow-inner border border-emerald-500/10 transition-transform group-hover:scale-110">
              <FolderUp size={24} className="tablet:w-28 tablet:h-28" />
            </div>
            <h3 className="text-lg tablet:text-xl font-bold mb-2">Internal Drive</h3>
            <p className="text-xs tablet:text-sm text-muted-foreground mb-8 leading-relaxed opacity-70 flex-grow">
              Direct ingestion from local filesystem. Smart parsing of directories into modules.
            </p>
            
            <div className="mt-auto">
              <AnimatePresence mode="wait">
                {state === 'idle' && (
                  <motion.button 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full bg-emerald-500 text-white py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    Select Folder
                    <ArrowRight size={16} />
                  </motion.button>
                )}

                {(state === 'uploading' || state === 'processing') && !extractedData && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full bg-muted/50 border border-border/60 rounded-xl p-4 flex flex-col justify-center gap-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-emerald-500" />
                        {state === 'uploading' ? 'Ingesting' : 'Indexing'}
                      </span>
                      <span className="text-emerald-500">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted-foreground/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <input 
              ref={fileInputRef}
              type="file" 
              // @ts-ignore
              webkitdirectory="" 
              directory="" 
              multiple 
              className="hidden" 
              onChange={(e) => handleLocalUpload(e.target.files)}
            />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass p-6 tablet:p-8 rounded-[2rem] relative overflow-hidden group border border-border/50 hover:border-blue-500/30 transition-all duration-500 flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Cloud size={80} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 tablet:w-14 tablet:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 shadow-inner border border-blue-500/10 transition-transform group-hover:scale-110">
              <Cloud size={24} />
            </div>
            <h3 className="text-lg tablet:text-xl font-bold mb-2">Cloud Connect</h3>
            <p className="text-xs tablet:text-sm text-muted-foreground mb-8 leading-relaxed opacity-70 flex-grow">
              Synchronize with Google Drive. Paste a public share link to bridge your assets.
            </p>
            
            <div className="space-y-3 mt-auto">
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={16} />
                <input 
                  type="text"
                  placeholder="Shared ID or Link..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full bg-muted border border-border/60 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                />
              </div>
              <button 
                onClick={handleDriveImport}
                disabled={state !== 'idle' || !driveLink}
                className="w-full bg-blue-500 text-white py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_8px_25px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === 'uploading' && isDriveImport ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Cloud size={16} />
                    Sync Data
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="glass p-6 tablet:p-8 rounded-[2rem] relative overflow-hidden group border border-border/50 hover:border-red-500/30 transition-all duration-500 flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Youtube size={80} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 tablet:w-14 tablet:h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-inner border border-red-500/10 transition-transform group-hover:scale-110">
              <Youtube size={24} />
            </div>
            <h3 className="text-lg tablet:text-xl font-bold mb-2">Social Archive</h3>
            <p className="text-xs tablet:text-sm text-muted-foreground mb-8 leading-relaxed opacity-70 flex-grow">
              Transform public metadata into a private curriculum. Support for all standard playlists.
            </p>
            
            <div className="space-y-3 mt-auto">
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={16} />
                <input 
                  type="text"
                  placeholder="Playlist URL..."
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="w-full bg-muted border border-border/60 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                />
              </div>
              <button 
                onClick={handleYoutubeImport}
                disabled={state !== 'idle' || !youtubeLink}
                className="w-full bg-red-500 text-white py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_8px_25px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === 'uploading' && isYoutubeImport ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Youtube size={16} />
                    Extract List
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 p-6 bg-muted/30 rounded-[2rem] border border-border/50 flex items-start gap-4 backdrop-blur-md">
        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-inner">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold mb-1">Architectural Insight</h4>
          <p className="text-xs text-muted-foreground leading-relaxed opacity-80">
            For rapid curriculum expansion, utilize the <span className="text-foreground font-bold italic underline decoration-primary/40 underline-offset-4">Intelligence</span> layer in the global navigation to auto-ingest relevant content clusters.
          </p>
        </div>
      </div>

      {/* Course Structure Preview Modal */}
      <AnimatePresence>
        {extractedData && (
          <CourseStructurePreview
            data={extractedData}
            onConfirm={handleConfirmPublish}
            onClose={() => {
              setExtractedData(null);
              setState('idle');
              setIsDriveImport(false);
              setIsYoutubeImport(false);
            }}
            isUploading={state === 'uploading'}
            progress={progress}
            isDriveImport={isDriveImport}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
