import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initializeApp 
} from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  updateDoc,
  addDoc,
  collection
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';
import { toast } from 'sonner';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const ADMIN_EMAIL = '03xnik@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phoneNumber: string, password: string, confirmPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (action: string, metadata?: any) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Activity Logger
  const logActivity = async (action: string, metadata: any = {}) => {
    if (!auth.currentUser || !user) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        userId: auth.currentUser.uid,
        userName: user.name,
        action,
        timestamp: serverTimestamp(),
        metadata
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  // Online Tracking & Admin Sync
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
          } else {
            userData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Architect',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              provider: firebaseUser.providerData[0]?.providerId || 'google',
              createdAt: new Date().toISOString(),
              subscriptionPlan: 'free',
              learningStats: {
                coursesCompleted: 0,
                hoursLeaned: 0,
                points: 0
              }
            };
            await setDoc(userDocRef, {
              ...userData,
              createdAt: serverTimestamp()
            });
          }

          // Admin Check - STRICT HARDCODED CHECK
          const hasAdminAccess = firebaseUser.email === ADMIN_EMAIL;
          setIsAdmin(hasAdminAccess);
          setUser({ ...userData, isAdmin: hasAdminAccess });

          // Start Heartbeat
          await updateDoc(userDocRef, { 
            isOnline: true, 
            lastSeen: serverTimestamp() 
          });
          
          interval = setInterval(async () => {
            await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
          }, 60000); // 1 minute heartbeat

          logActivity('Session Start');

        } catch (err) {
          console.error("Profile sync error:", err);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        if (interval) clearInterval(interval);
      }
      setLoading(false);
    });

    return () => {
      if (interval) clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      const message = err.message || 'Failed to login';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, phoneNumber: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      throw new Error('Passwords do not match');
    }

    setLoading(true);
    setError(null);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(firebaseUser, { displayName: name });
      
      const newUser: User = {
        uid: firebaseUser.uid,
        name,
        email,
        provider: 'password',
        createdAt: new Date().toISOString(),
        subscriptionPlan: 'free',
        learningStats: {
          coursesCompleted: 0,
          hoursLeaned: 0,
          points: 0
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: serverTimestamp()
      });
      
      setUser(newUser);
      toast.success('Account created successfully!');
    } catch (err: any) {
      const message = err.message || 'Failed to sign up';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Welcome to SkillStudio!');
    } catch (err: any) {
      const message = err.message || 'Google login failed';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast.info('Logged out');
    } catch (err: any) {
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      login, 
      signup, 
      loginWithGoogle, 
      logout,
      logActivity,
      error, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
