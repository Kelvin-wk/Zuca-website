import React, { useState, useEffect } from 'react';
import { User, View, Notification, UserRole } from './types';
import { storageService } from './services/storageService';
import { syncService } from './services/syncService';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import TriviaPage from './components/TriviaPage';
import ChatPage from './components/ChatPage';
import UpdatesPage from './components/UpdatesPage';
import Hero from './components/Hero';
import RequestsPage from './components/PetitionsPage';
import FaithAIPage from './components/FaithAIPage';
import AudioPage from './components/ChoirPage';
import PaymentsPage from './components/PaymentsPage';
import AdminVault from './components/AdminVault';
import BriefingPage from './components/BriefingPage';
import CatholicArchive from './components/CatholicArchive';
import { motion, AnimatePresence } from 'motion/react';

import { firebaseService } from './services/firebaseService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Error Boundary Component to catch and display runtime errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-6 max-w-md">The application encountered an unexpected error. We've logged the details for our team.</p>
          <div className="bg-slate-800 p-4 rounded-lg text-left text-xs font-mono mb-6 max-w-full overflow-auto border border-slate-700">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors font-medium"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<View>('Home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('zuca_theme');
    return saved === 'dark';
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFaithAIOpen, setIsFaithAIOpen] = useState(false);

  useEffect(() => {
    console.log("[App] Initializing auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[App] Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user");
      setIsAuthReady(true);
      if (firebaseUser) {
        // User is signed in, fetch data
        try {
          console.log("[App] Fetching user data for UID:", firebaseUser.uid);
          const userData = await firebaseService.getUser(firebaseUser.uid);
          if (userData) {
            const u = userData as User;
            console.log("[App] User data loaded successfully:", u.name);
            setUser(u);
            localStorage.setItem('zuca_user', JSON.stringify(u));
            storageService.saveUser(u);
          } else {
            console.warn("[App] User authenticated but no document found in Firestore.");
            // If user exists in Auth but not in Firestore, we don't automatically create one.
            // This is handled in AuthPage.tsx for new logins.
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error("[App] Failed to fetch user data on auth change:", error);
          addNotification("Connection slow. Using offline data.", "info");
          // If we have a cached user, use it as fallback
          const savedUser = localStorage.getItem('zuca_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
              console.log("[App] Fallback to cached user data:", parsed.name);
            } catch (e) {
              console.error("[App] Failed to parse cached user:", e);
            }
          }
        }
      } else {
        // User is signed out
        console.log("[App] User is signed out.");
        setUser(null);
        localStorage.removeItem('zuca_user');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseService.subscribeToUser(user.id, (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem('zuca_user', JSON.stringify(updatedUser));
      storageService.saveUser(updatedUser);
    });

    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    const savedUser = localStorage.getItem('zuca_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const handleSync = () => {
      const saved = localStorage.getItem('zuca_user');
      if (saved) setUser(JSON.parse(saved));
    };

    window.addEventListener('storage_sync', handleSync);
    
    const handleChangeView = (e: any) => {
      if (e.detail) setCurrentView(e.detail);
    };
    window.addEventListener('change_view', handleChangeView);

    return () => {
      window.removeEventListener('storage_sync', handleSync);
      window.removeEventListener('change_view', handleChangeView);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zuca_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zuca_theme', 'light');
    }
  }, [isDarkMode]);

  const addNotification = (message: string, type: 'info' | 'success' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleLogin = async (userData: User) => {
    // Set user immediately to unmount AuthPage and show the app
    setUser(userData);
    localStorage.setItem('zuca_user', JSON.stringify(userData));
    storageService.saveUser(userData);
    addNotification(`Welcome, ${userData.name}!`, 'success');
    
    // Perform background sync
    try {
      await firebaseService.saveUser(userData);
      await syncService.logUserActivity(userData);
    } catch (e) {
      console.error('Background sync failed', e);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Logout failed', e);
    }
    setUser(null);
    localStorage.removeItem('zuca_user');
    setCurrentView('Home');
    setIsMobileMenuOpen(false);
    setIsFaithAIOpen(false);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    storageService.saveUser(updatedUser);
    setUser(updatedUser);
    localStorage.setItem('zuca_user', JSON.stringify(updatedUser));
    try {
      await firebaseService.saveUser(updatedUser);
    } catch (e) {
      console.error('Failed to sync user to Firebase', e);
    }
  };

  const handleSetView = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-100 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen relative flex items-center justify-center overflow-x-hidden bg-slate-900">
          <div className="fixed inset-0 z-0">
            <img src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" className="w-full h-full object-cover" alt="Zetech" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-slate-900/50 to-blue-900/60 backdrop-blur-[2px]"></div>
          </div>
          <div className="relative z-10 w-full max-w-5xl m-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-scale-in">
            <AuthPage onLogin={handleLogin} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const renderView = () => {
    const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

    const viewContent = () => {
      switch (currentView) {
        case 'Home': return <Hero user={user} onPlayTrivia={() => setCurrentView('Trivia')} />;
        case 'FaithAI': return <FaithAIPage user={user} />;
        case 'Trivia': return <TriviaPage user={user} onPointsUpdate={handleUpdateUser} />;
        case 'Chat': return <ChatPage user={user} onNewMessage={(msg) => addNotification(`Portal activity: ${msg}`)} />;
        case 'Profile': return <ProfilePage user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} />;
        case 'Updates': return <UpdatesPage user={user} onNewUpdate={(title) => addNotification(`Update: ${title}`, 'success')} />;
        case 'Requests': return <RequestsPage user={user} />;
        case 'Audio': return <AudioPage user={user} />;
        case 'Payments': return <PaymentsPage user={user} />;
        case 'Archive': return <CatholicArchive user={user} />;
        case 'AdminVault': 
          if (!isLeaderOrTrainer) return <Hero user={user} onPlayTrivia={() => setCurrentView('Trivia')} />;
          return <AdminVault user={user} />;
        case 'Briefing': 
          if (!isLeaderOrTrainer) return <Hero user={user} onPlayTrivia={() => setCurrentView('Trivia')} />;
          return <BriefingPage user={user} />;
        default: return <Hero user={user} onPlayTrivia={() => setCurrentView('Trivia')} />;
      }
    };

    return (
      <div className="flex flex-col min-h-full">
        {/* View Header - Desktop only, mobile has its own sticky header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-sans font-black text-slate-800 dark:text-white tracking-tighter">{currentView}</h1>
            <div className="h-1 w-12 bg-slate-800 rounded-full mt-2"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Portal Status</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Action in Progress</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {viewContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300 relative overflow-x-hidden">
      {/* Fixed Persistent Background Image - Refined for clarity and diminished feel */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 0.15 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
          className="w-full h-full object-cover blur-[3px]" 
          alt="" 
        />
        {/* Portal overlay with high-end masking */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/80 dark:from-slate-950/40 dark:to-slate-950/90"></div>
        <div className="absolute inset-0 bg-blue-500/[0.02] dark:bg-blue-900/[0.06] animate-pulse-slow"></div>
        
        {/* Animated Divine Rays */}
        <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-[repeating-linear-gradient(-25deg,transparent,transparent_120px,rgba(255,255,255,0.05)_160px,transparent_200px)] blur-[60px] animate-divine-ray"></div>
      </div>

      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100] space-y-3 pointer-events-none w-[calc(100%-2rem)] md:w-auto">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${n.type === 'success' ? 'bg-green-600/90 border-green-500/50 text-white' : 'bg-blue-600/90 border-blue-500/50 text-white'} animate-in slide-in-from-right-10 flex items-center gap-3 ml-auto max-w-sm`}>
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <i className={`fa-solid ${n.type === 'success' ? 'fa-circle-check' : 'fa-bell'} text-xs`}></i>
            </div>
            <span className="font-bold text-xs tracking-wide">{n.message}</span>
          </div>
        ))}
      </div>

      {/* Floating Faith AI Persistent Icon */}
      <div className="fixed bottom-24 right-4 md:bottom-12 md:right-12 z-[60] flex flex-col items-end gap-3">
        {isFaithAIOpen && (
          <div className="w-[280px] sm:w-[320px] md:w-[400px] mb-1 animate-in slide-in-from-bottom-10 fade-in duration-500 origin-bottom-right">
             <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-800 p-4 md:p-5 flex items-center justify-between">
                   <div className="flex items-center gap-2 md:gap-3">
                      <i className="fa-solid fa-comment-dots text-white animate-pulse text-xs md:text-sm"></i>
                      <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest">Faith AI</span>
                   </div>
                   <button onClick={() => setIsFaithAIOpen(false)} className="text-white/60 hover:text-white transition-colors p-1">
                      <i className="fa-solid fa-xmark text-sm md:text-base"></i>
                   </button>
                </div>
                <div className="max-h-[400px] md:max-h-[500px] overflow-hidden">
                   <FaithAIPage user={user} isOverlay={true} />
                </div>
             </div>
          </div>
        )}
        <button 
          onClick={() => setIsFaithAIOpen(!isFaithAIOpen)}
          className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 relative ${isFaithAIOpen ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-90' : 'bg-blue-600 text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)]'}`}
        >
          {isFaithAIOpen ? (
            <i className="fa-solid fa-xmark text-sm md:text-base"></i>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
              <i className="fa-solid fa-dove text-sm md:text-base relative z-10"></i>
            </>
          )}
          {!isFaithAIOpen && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white dark:border-slate-950 rounded-full"></span>}
        </button>
      </div>

      <Navbar user={user} currentView={currentView} setView={handleSetView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="flex-grow flex flex-col h-screen overflow-y-auto relative z-10 custom-scrollbar pb-20 md:pb-0">
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-5 h-14 flex items-center justify-between md:hidden">
           <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"><i className="fa-solid fa-bars-staggered text-lg"></i></button>
            <span className="font-serif text-lg font-black dark:text-white text-slate-800 tracking-tighter">{currentView === 'Home' ? 'ZUCA' : currentView}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 active:scale-90 transition-all"><i className={`fa-solid ${isDarkMode ? 'fa-sun text-yellow-500' : 'fa-moon'} text-xs`}></i></button>
            <button onClick={() => setCurrentView('Profile')} className="w-8 h-8 rounded-full overflow-hidden border border-blue-100 dark:border-blue-900/50 active:scale-90 transition-all shadow-sm"><img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" alt="" /></button>
          </div>
        </header>

        <main className="p-5 md:p-8 lg:p-12 max-w-7xl mx-auto w-full flex-grow relative z-10">
          <div className="relative z-20">
            {renderView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 px-4 py-2 flex items-center justify-around md:hidden">
          {[
            { id: 'Home', icon: 'fa-house', label: 'Home' },
            { id: 'Updates', icon: 'fa-newspaper', label: 'News' },
            { id: 'Chat', icon: 'fa-comments', label: 'Chat' },
            { id: 'Archive', icon: 'fa-images', label: 'Archive' },
            { id: 'Profile', icon: 'fa-user', label: 'Profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${currentView === item.id ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {currentView === item.id && (
                <motion.div layoutId="mobileActive" className="w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <footer className="mt-auto border-t border-slate-200/50 dark:border-slate-800/50 p-8 md:p-12 text-center relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex justify-center gap-4 md:gap-8 mb-8">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg group">
              <i className="fa-brands fa-facebook-f text-sm md:text-base group-hover:scale-110 transition-transform"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-110 hover:-rotate-6 transition-all duration-300 shadow-lg group">
              <i className="fa-brands fa-x-twitter text-sm md:text-base group-hover:scale-110 transition-transform"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg group">
              <i className="fa-brands fa-instagram text-sm md:text-base group-hover:scale-110 transition-transform"></i>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:scale-110 hover:-rotate-6 transition-all duration-300 shadow-lg group">
              <i className="fa-brands fa-youtube text-sm md:text-base group-hover:scale-110 transition-transform"></i>
            </a>
          </div>
          <p className="text-slate-400 dark:text-slate-600 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black">
            &copy; {new Date().getFullYear()} Catholic Action • <span className="text-blue-600 dark:text-blue-400">Faith</span> in <span className="text-amber-500">Action</span>
          </p>
        </footer>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;
