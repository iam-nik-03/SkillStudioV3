import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Workspace } from './pages/Workspace';
import { CoursePlayer } from './pages/CoursePlayer';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { FileStoreProvider } from './store/FileStore';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { SidebarProvider } from './store/SidebarContext';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <GlobalLoader />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <GlobalLoader />;
  
  if (user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <GlobalLoader />;
  
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function GlobalLoader() {
  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-6">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6"
      >
        <Zap size={32} className="text-white fill-current" />
      </motion.div>
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
        />
      </div>
      <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Initializing SkillStudio</p>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/course/');

  if (loading) return <GlobalLoader />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected App Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar />
              <div className="flex-1 laptop:ml-72 relative">
                <Header />
                <main className="pt-20 laptop:pt-24 min-h-screen">
                  <Workspace />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar />
              <div className="flex-1 laptop:ml-72 relative">
                <Header />
                <main className="pt-20 laptop:pt-24 min-h-screen">
                  <AdminDashboard />
                </main>
              </div>
            </div>
          </AdminRoute>
        } />

        <Route path="/course/:id" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground">
              <CoursePlayer />
            </div>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" expand={false} richColors />
      <AuthProvider>
        <FileStoreProvider>
          <Router>
            <SidebarProvider>
              <AppRoutes />
            </SidebarProvider>
          </Router>
        </FileStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
