import React from 'react';
import { auth } from '../firebase-config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, Shield, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  user: any;
  loading: boolean;
  onLogin: (user: any) => void;
  onLogout: () => void;
  simulateRole: 'admin' | 'user';
  setSimulateRole: (role: 'admin' | 'user') => void;
}

export default function AuthModal({
  user,
  loading,
  onLogin,
  onLogout,
  simulateRole,
  setSimulateRole,
}: AuthModalProps) {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-[#1a1a1a]/60 font-sans text-xs uppercase tracking-widest font-bold">
        <div className="w-3.5 h-3.5 rounded-none border border-[#1a1a1a] border-t-transparent animate-spin" />
        <span>Syncing session...</span>
      </div>
    );
  }

  if (user) {
    const isAdminUser = user.email === "24eg107f29@anurag.edu.in";
    
    return (
      <div className="flex flex-wrap items-center gap-4 bg-[#e5e1da]/30 border border-[#1a1a1a]/10 rounded-none p-3 sm:px-4 sm:py-2 text-[#1a1a1a]">
        <div className="flex items-center space-x-3">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              className="w-8 h-8 rounded-none border border-[#1a1a1a]/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a] font-bold text-xs font-sans">
              {user.displayName ? user.displayName[0] : <UserIcon className="w-3.5 h-3.5" />}
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-[#1a1a1a] font-bold text-xs uppercase tracking-wider truncate max-w-[140px] font-sans">
              {user.displayName || "Shopper"}
            </span>
            <span className="text-[#1a1a1a]/60 text-[10px] truncate max-w-[140px] font-mono">
              {user.email}
            </span>
          </div>
        </div>

        {/* Dynamic Simulation Tools for Developers */}
        <div className="flex items-center space-x-2 border-l border-[#1a1a1a]/10 pl-4">
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-[#1a1a1a]/40 font-bold uppercase tracking-widest font-sans">Test Role</span>
            <div className="flex items-center bg-[#e5e1da]/40 rounded-none p-0.5 border border-[#1a1a1a]/10 mt-1">
              <button
                id="role-toggle-user"
                onClick={() => setSimulateRole('user')}
                className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  simulateRole === 'user'
                    ? 'bg-[#1a1a1a] text-[#f5f2ed]'
                    : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
                }`}
              >
                Customer
              </button>
              <button
                id="role-toggle-admin"
                onClick={() => setSimulateRole('admin')}
                className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 ${
                  simulateRole === 'admin'
                    ? 'bg-amber-500/15 text-amber-900 border border-amber-500/25'
                    : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
                }`}
              >
                <Shield className="w-3 h-3" />
                Store Manager
              </button>
            </div>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-none border border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:text-rose-800 hover:bg-rose-500/5 hover:border-rose-500/20 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ml-auto sm:ml-0"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <button
        id="login-btn"
        onClick={handleGoogleLogin}
        className="flex items-center space-x-2 px-5 py-2.5 rounded-none bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer w-full sm:w-auto"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In with Google</span>
      </button>
      <p className="text-[11px] text-[#1a1a1a]/50 font-serif italic text-left">
        Sign in to complete checkouts, view purchase order history, and access role simulations.
      </p>
    </div>
  );
}
