import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Sun, Moon, Sparkles, Menu, Settings, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useSidebar } from '../store/SidebarContext';
import { useAuth } from '../store/AuthContext';
import { cn } from '../utils/cn';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 laptop:left-72 right-0 h-16 laptop:h-24 bg-background/40 backdrop-blur-3xl border-b border-border/40 z-40 px-4 laptop:px-10 flex items-center justify-between transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center gap-4 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggle}
          className="laptop:hidden p-2.5 bg-muted/50 hover:bg-muted border border-border/50 rounded-xl transition-all text-muted-foreground shadow-sm"
        >
          <Menu size={20} />
        </motion.button>
      </div>

      <div className="flex items-center gap-2 tablet:gap-4 relative z-10">
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-3 tablet:p-4 rounded-xl tablet:rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all text-foreground shadow-sm group backdrop-blur-xl"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="group-hover:rotate-45 transition-transform duration-500" />
          ) : (
            <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-500" />
          )}
        </motion.button>

        <div className="hidden sm:block h-8 w-px bg-border/40 mx-1 tablet:mx-2"></div>

        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1 tablet:p-1.5 tablet:pr-4 rounded-xl tablet:rounded-2xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-all group shadow-sm"
          >
            <div className="w-8 h-8 tablet:w-10 tablet:h-10 rounded-lg tablet:rounded-[1rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner overflow-hidden transition-all duration-500">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            <div className="text-left hidden tablet:block">
              <p className="text-xs font-bold leading-none mb-1 text-foreground">{user?.name || 'Guest User'}</p>
              <div className="flex items-center gap-1.5">
                <Sparkles size={9} className="text-primary fill-current animate-pulse" />
                <p className="text-[8px] font-bold text-primary uppercase tracking-[0.15em] opacity-80">Pro Member</p>
              </div>
            </div>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-500 hidden tablet:block", showUserMenu && "rotate-180")} />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowUserMenu(false)}
                  className="fixed inset-0 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-56 glass border border-glass-border rounded-[1.5rem] shadow-2xl p-2 z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border/50 mb-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Account</p>
                    <p className="text-sm font-bold truncate">{user?.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-sm font-bold group">
                      <UserIcon size={18} className="text-muted-foreground group-hover:text-primary" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-sm font-bold group">
                      <Settings size={18} className="text-muted-foreground group-hover:text-primary" />
                      Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-sm font-bold group">
                      <CreditCard size={18} className="text-muted-foreground group-hover:text-primary" />
                      Billing
                    </button>
                  </div>

                  <div className="h-px bg-border/50 my-1" />

                  <button 
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-sm font-bold group"
                  >
                    <LogOut size={18} className="text-muted-foreground group-hover:text-destructive" />
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
