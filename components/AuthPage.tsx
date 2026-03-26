import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { firebaseService } from '../services/firebaseService';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<React.ReactNode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    adminKey: ''
  });

  useEffect(() => {
    setErrorMsg(null);
  }, [isLogin, isAdminMode]);

  const handleGoogleSignIn = async () => {
    const ADMIN_AUTH_KEY = 'ZUCA-ADMIN-2026';
    
    // Only require admin key if we are explicitly in Admin Mode AND trying to register/first-time login
    // However, we don't know if they exist yet. 
    // Let's allow the popup first, then check their role.
    
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      let userData;
      try {
        userData = await firebaseService.getUser(firebaseUser.uid);
      } catch (e) {
        console.warn("Failed to fetch user data after Google sign-in:", e);
      }

      if (userData) {
        // If they are trying to login as admin but don't have the role, warn them
        if (isAdminMode && userData.role !== UserRole.LEADER && userData.role !== UserRole.TRAINER) {
          setErrorMsg("This account does not have administrative privileges. Please sign in as a Member.");
          await auth.signOut();
          return;
        }
        onLogin(userData as User);
      } else {
        // Account not found - Request Sign Up
        // If they want to be an admin, they MUST have the key now
        if (isAdminMode && formData.adminKey !== ADMIN_AUTH_KEY) {
          setErrorMsg("To register as an Administrator via Google, please enter the correct Admin Authorization Key in the field first.");
          await auth.signOut();
          return;
        }

        setErrorMsg(
          <div className="flex flex-col gap-2">
            <span className="font-bold">Registry entry not found.</span>
            <p className="text-[9px] opacity-70 uppercase tracking-widest">Would you like to initialize your profile now?</p>
            <button 
              onClick={async () => {
                setIsLoading(true);
                try {
                  const newUser: User = {
                    id: firebaseUser.uid,
                    username: firebaseUser.displayName || 'Subject',
                    name: firebaseUser.displayName || 'Subject',
                    email: firebaseUser.email || '',
                    phoneNumber: '', // Will need to be updated in profile
                    role: isAdminMode ? UserRole.LEADER : UserRole.STUDENT,
                    points: 0,
                    joinedAt: new Date().toISOString(),
                    isVerified: isAdminMode,
                    profilePic: firebaseUser.photoURL || undefined
                  };
                  await firebaseService.saveUser(newUser);
                  onLogin(newUser);
                } catch (err) {
                  setErrorMsg("Failed to initialize profile. Please try manual registration.");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="mt-2 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              Initialize Profile
            </button>
          </div>
        );
        // We don't sign out yet, we give them the option to initialize
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: any) => {
    console.error("Auth error details:", error);
    
    const code = error.code || '';

    if (code === 'auth/email-already-in-use') {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-black">Email already registered.</span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }} 
            className="text-blue-600 underline font-black text-left text-[9px]"
          >
            Sign in with this email instead?
          </button>
        </div>
      );
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-black">Invalid credentials.</span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
            }} 
            className="text-blue-600 underline font-black text-left text-[9px]"
          >
            Don't have an account? Register here
          </button>
        </div>
      );
    } else if (code === 'auth/weak-password') {
      return "Password is too weak. Please use at least 6 characters.";
    } else if (code === 'auth/invalid-email') {
      return "Please enter a valid email address.";
    } else if (code === 'auth/operation-not-allowed') {
      return "Email/Password authentication is not enabled in the Firebase Console.";
    } else if (code === 'auth/network-request-failed') {
      return "Network error. Please check your internet connection or disable ad-blockers.";
    } else if (code === 'auth/popup-closed-by-user') {
      return null; // Silent for user closing popup
    } else if (error.message && error.message.includes('permission-denied')) {
      return "Fellowship access denied. Please contact an administrator.";
    } else if (error.message) {
      return error.message;
    }
    
    return "Authentication failed. Please check your credentials.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        let userData;
        try {
          userData = await firebaseService.getUser(firebaseUser.uid);
        } catch (e) {
          console.warn("Failed to fetch user data after login, using fallback:", e);
        }

        if (userData) {
          onLogin(userData as User);
        } else {
          // Fallback if firestore doc missing - Request Sign Up
          setErrorMsg(
            <div className="flex flex-col gap-2">
              <span>Account not found. Please register to create your profile.</span>
              <button 
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg(null);
                }}
                className="text-blue-600 underline font-black text-left"
              >
                Go to Registration
              </button>
            </div>
          );
          await auth.signOut();
        }
      } else {
        // Register
        const ADMIN_AUTH_KEY = 'ZUCA-ADMIN-2026';

        if (isAdminMode && formData.adminKey !== ADMIN_AUTH_KEY) {
          setErrorMsg("Invalid Admin Authorization Key. Please contact the lead administrator.");
          setIsLoading(false);
          return;
        }

        if (!formData.phoneNumber) {
          setErrorMsg("Phone number is required for registration.");
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: formData.name });

        const newUser: User = {
          id: firebaseUser.uid,
          username: formData.name,
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: isAdminMode ? UserRole.LEADER : UserRole.STUDENT,
          points: 0,
          joinedAt: new Date().toISOString(),
          isVerified: isAdminMode,
          stewardshipKey: isAdminMode ? formData.adminKey : undefined
        };
        
        await firebaseService.saveUser(newUser);
        await onLogin(newUser);
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[600px] flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500">
      {/* Visual Side Panel */}
      <div className={`h-48 md:h-auto md:w-2/5 relative overflow-hidden shrink-0 transition-colors duration-700 ${isAdminMode ? 'bg-slate-950' : 'bg-blue-900'}`}>
        <img 
          src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" 
          alt="ZUCA Fellowship" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-2xl animate-float transition-all duration-500 ${isAdminMode ? 'bg-amber-500 text-slate-950' : 'bg-white text-blue-900'}`}>
            <i className={`fa-solid ${isAdminMode ? 'fa-shield-halved' : 'fa-user-group'}`}></i>
          </div>
          <h1 className="font-serif text-3xl font-black text-white tracking-tighter mb-2">ZUCA Portal</h1>
          <p className="text-blue-100 text-xs opacity-80 italic max-w-[200px]">
            {isAdminMode ? "Administrative Terminal" : "Communal Fellowship Registry"}
          </p>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button 
                onClick={() => setIsAdminMode(false)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isAdminMode ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Member
              </button>
              <button 
                onClick={() => setIsAdminMode(true)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Admin
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black font-serif tracking-tight text-slate-800 dark:text-white mb-1">
                {isLogin ? 'Welcome' : 'Join Us'}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                {isAdminMode ? 'Authorized Personnel Only' : 'Fellowship Access'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-circle-exclamation text-xs"></i>
                  <div className="flex-1">{errorMsg}</div>
                  <button onClick={() => setErrorMsg(null)} className="opacity-50 hover:opacity-100">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" required placeholder="Full Name"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none border-2 border-transparent focus:border-blue-600 transition-all font-bold text-sm"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="tel" required placeholder="Phone Number"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none border-2 border-transparent focus:border-blue-600 transition-all font-bold text-sm"
                    value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="relative group">
              <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="email" required placeholder="Email Address"
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none border-2 border-transparent focus:border-blue-600 transition-all font-bold text-sm"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative group">
              <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="password" required placeholder="Password"
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none border-2 border-transparent focus:border-blue-600 transition-all font-bold text-sm"
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {isAdminMode && !isLogin && (
              <div className="relative group animate-in slide-in-from-top-2">
                <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-amber-500"></i>
                <input 
                  type="password" required placeholder="Admin Authorization Key"
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 dark:text-white outline-none border-2 border-amber-200 focus:border-amber-500 transition-all font-bold text-sm"
                  value={formData.adminKey} onChange={e => setFormData({ ...formData, adminKey: e.target.value })}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 mt-4 flex items-center justify-center gap-3 ${isAdminMode ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'} ${isLoading ? 'opacity-70' : ''}`}
            >
              <span>{isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}</span>
              {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-chevron-right"></i>}
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-white flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              <span>Continue with Google</span>
            </button>
          </form>

          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="w-full mt-6 text-slate-400 text-[10px] font-bold hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            {isLogin ? "Need an account? Register" : "Have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;