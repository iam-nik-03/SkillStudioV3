import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Shield, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Filter, 
  Trash2, 
  Crown, 
  MoreVertical,
  Activity,
  BookOpen,
  ArrowUpRight,
  UserCheck,
  TrendingUp,
  UserX,
  X,
  Clock,
  Zap,
  Globe,
  Share2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, isAfter, startOfDay, isValid, differenceInMinutes } from 'date-fns';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, useAuth } from '../store/AuthContext';
import { User, Course } from '../types';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { parseSafeDate } from '../utils/date';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalCourses: number;
  publishedCourses: number;
  newUsersToday: number;
  userGrowth: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: any;
  metadata?: any;
}

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    newUsersToday: 0,
    userGrowth: 0
  });

  useEffect(() => {
    // Real-time Users Listener with Online Logic
    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
      setUsers(usersData);
      
      const now = new Date();
      const today = startOfDay(now);
      const sevenDaysAgo = subDays(now, 7);
      
      // Online = heartbeat within last 3 minutes
      const onlineCount = usersData.filter(u => {
        if (!u.isOnline) return false;
        const lastSeen = parseSafeDate(u.lastSeen);
        return differenceInMinutes(now, lastSeen) < 3;
      }).length;

      const newToday = usersData.filter(u => isAfter(parseSafeDate(u.createdAt), today)).length;
      const oldUsersCount = usersData.filter(u => !isAfter(parseSafeDate(u.createdAt), sevenDaysAgo)).length;
      const growth = oldUsersCount > 0 ? ((usersData.length - oldUsersCount) / oldUsersCount) * 100 : 100;

      setStats((prev: DashboardStats) => ({
        ...prev,
        totalUsers: usersData.length,
        onlineUsers: onlineCount,
        activeUsers: usersData.filter((u: User) => u.learningStats.points > 0).length,
        newUsersToday: newToday,
        userGrowth: Math.round(growth)
      }));
      setLoading(false);
    });

    // Real-time Courses Listener
    const coursesUnsubscribe = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Course);
      setCourses(coursesData);
      setStats((prev: DashboardStats) => ({
        ...prev,
        totalCourses: coursesData.length,
        publishedCourses: coursesData.filter(c => c.isPublic).length
      }));
    });

    // Real-time Activity Logs (Recent 10)
    const logsQuery = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(15));
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ActivityLog));
    });

    return () => {
      usersUnsubscribe();
      coursesUnsubscribe();
      logsUnsubscribe();
    };
  }, []);

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('User deleted from ecosystem');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const toggleSubscription = async (user: User) => {
    try {
      const newPlan = user.subscriptionPlan === 'free' ? 'pro' : 'free';
      await updateDoc(doc(db, 'users', user.uid), { subscriptionPlan: newPlan });
      toast.success(`Subscription updated to ${newPlan.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4 tablet:p-8 laptop:p-12 overflow-x-hidden relative">
      {/* Abstract Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[30%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col laptop:flex-row laptop:items-end justify-between gap-8 mb-12 tablet:mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-5 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 hover:rotate-0 transition-all duration-500 border border-white/20">
                <Shield className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl tablet:text-5xl font-bold tracking-tight text-white mb-2 underline decoration-primary/30 decoration-4 underline-offset-8">Central Ops</h1>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] tablet:text-xs text-white/50 font-bold uppercase tracking-[0.3em]">SkillStudio Strategic Node • Real-Time Data Stream</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors duration-300" size={18} />
              <input
                type="text"
                placeholder="Locate identity signal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/[0.03] border border-white/10 rounded-[1.25rem] py-3.5 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-64 laptop:w-80 transition-all shadow-2xl backdrop-blur-3xl placeholder:text-white/20 font-medium"
              />
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 laptop:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Network Nodes', value: stats.totalUsers, icon: Users, color: 'blue', sub: `+${stats.userGrowth}% growth` },
            { label: 'Active Signals', value: stats.onlineUsers, icon: Globe, color: 'emerald', sub: 'Detected Live' },
            { label: 'Operational Courses', value: stats.totalCourses, icon: BookOpen, color: 'primary', sub: `${stats.publishedCourses} published` },
            { label: 'New Nodes', value: stats.newUsersToday, icon: UserCheck, color: 'purple', sub: 'Last 24h sync' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6 shadow-2xl hover:bg-white/[0.04] transition-all group relative overflow-hidden backdrop-blur-3xl"
            >
              <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 rotate-12">
                <stat.icon size={160} />
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                stat.color === 'blue' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                stat.color === 'primary' ? "bg-primary/10 text-primary border-primary/20" :
                stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                "bg-purple-500/10 text-purple-400 border-purple-500/20"
              )}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-white tabular-nums tracking-tighter leading-none">{stat.value}</p>
                  <p className="text-[10px] font-bold text-emerald-400/60 mb-0.5">{stat.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-8 mb-12">
          {/* Recent Activity Log */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="laptop:col-span-1 bg-white/[0.01] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[500px]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Activity Trace</h2>
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase">Live Stream</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                  <Activity size={32} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No activity signals</p>
                </div>
              ) : (
                logs.map((log: ActivityLog, i: number) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{log.action}</span>
                      <span className="text-[9px] text-white/20 font-medium">{log.timestamp ? format(parseSafeDate(log.timestamp), 'HH:mm:ss') : 'Just now'}</span>
                    </div>
                    <p className="text-xs text-white/70 font-medium mb-1 line-clamp-1">{log.userName}</p>
                    {log.metadata && log.metadata.to && (
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Target: {log.metadata.to}</p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Identity Registry (Users Table) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="laptop:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h2 className="text-xl font-bold tracking-tight">Identity Registry</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{filteredUsers.length} Nodes detected</span>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-5 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Signal</th>
                    <th className="px-8 py-5 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Hierarchy</th>
                    <th className="px-8 py-5 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Sync</th>
                    <th className="px-8 py-5 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={4} className="px-8 py-32 text-center text-white/20 uppercase tracking-widest text-xs">Accessing Data...</td></tr>
                  ) : filteredUsers.map((u: User, i: number) => {
                    const isOnline = u.isOnline && differenceInMinutes(new Date(), parseSafeDate(u.lastSeen)) < 3;
                    return (
                      <motion.tr key={u.uid} className="hover:bg-white/[0.03] transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold text-sm border border-white/10 overflow-hidden shadow-inner translate-y-1 group-hover:translate-y-0 transition-transform">
                                {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                              </div>
                              <div className={cn(
                                "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#050816] shadow-lg",
                                isOnline ? "bg-emerald-500 shadow-emerald-500/40" : "bg-white/10"
                              )} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">{u.name}</p>
                              <p className="text-[10px] text-white/20 truncate uppercase tracking-widest">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className={cn(
                            "inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                            u.isAdmin ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-white/30 border-white/10"
                          )}>
                            {u.isAdmin ? 'Root Admin' : 'Node User'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-white/30 text-[10px] font-bold tabular-nums">
                          {format(parseSafeDate(u.createdAt), 'dd.MM.yy')}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                              onClick={() => toggleSubscription(u)}
                              className={cn(
                                "p-2 rounded-lg transition-all border",
                                u.subscriptionPlan === 'pro' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-white/5 border-white/10 text-white/30"
                              )}
                              title="Toggle Tier"
                            >
                              <Crown size={14} />
                            </button>
                            {u.email !== currentAdmin?.email && (
                              <button 
                                onClick={() => handleDeleteUser(u.uid)}
                                className="p-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500/40 hover:text-red-500 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Admin Registry (Users Table) */}
    </div>
  );
};

