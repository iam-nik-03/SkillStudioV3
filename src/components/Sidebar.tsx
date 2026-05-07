import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid, 
  Compass, 
  Library, 
  BarChart3, 
  UserIcon, 
  LogOut,
  Zap,
  X,
  Settings,
  Shield,
  CreditCard
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useSidebar } from '../store/SidebarContext';
import { useAuth } from '../store/AuthContext';

const navItems = [
  { icon: LayoutGrid, label: 'Workspace', path: '/' },
  { icon: Shield, label: 'Admin', path: '/admin' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isOpen, close } = useSidebar();
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-[#050816]/60 backdrop-blur-md z-[60] laptop:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-72 bg-background/80 backdrop-blur-3xl border-r border-border/40 z-[70] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] laptop:translate-x-0 shadow-2xl laptop:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-7 pb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group" onClick={close}>
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-all duration-500 group-hover:rotate-6 ring-2 ring-primary/20">
              <Zap size={22} className="text-white fill-current animate-pulse-slow" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none mb-1 text-foreground">
                SkillStudio
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                Learning Hub
              </span>
            </div>
          </Link>
          <button 
            onClick={close}
            className="laptop:hidden p-2.5 hover:bg-muted rounded-xl transition-all active:scale-90 text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto course-sidebar-scroll">
          {navItems.map((item) => {
            // Only show Admin related items to admins
            if (item.path === '/admin' && !isAdmin) return null;
            
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={close}
                className={cn(
                  "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative",
                  active 
                    ? "bg-primary/5 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-primary/10" 
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground translate-gpu hover:translate-x-1"
                )}
              >
                <div className="flex items-center gap-4 relative z-10 transition-transform group-active:scale-95 duration-200">
                  <item.icon 
                    size={21} 
                    className={cn(
                      "transition-all duration-500",
                      active ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "group-hover:text-foreground group-hover:scale-110"
                    )} 
                  />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                {active && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-[-4px] w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-8 mt-auto">
          <div className="bg-muted/30 border border-border/40 p-4 rounded-3xl relative overflow-hidden group/card shadow-sm backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 overflow-hidden shadow-inner">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-foreground">{user?.name || 'Guest'}</p>
                <p className="text-[10px] text-muted-foreground truncate opacity-70">{user?.email || 'guest@example.com'}</p>
              </div>
            </div>

            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-muted/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl transition-all duration-300 text-[11px] font-bold group/btn active:scale-[0.98] border border-transparent hover:border-destructive/20"
            >
              <LogOut size={13} className="group-hover/btn:-translate-x-0.5 transition-transform" />
              Logout Session
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
