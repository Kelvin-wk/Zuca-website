import React from 'react';
import { motion } from 'motion/react';
import { User, View, UserRole } from '../types';
import DivineGlow from './DivineGlow';

interface NavbarProps {
  user: User;
  currentView: View;
  setView: (view: View) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, currentView, setView, isDarkMode, setIsDarkMode, isOpen, setIsOpen }) => {
  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  const navItems: { name: string; icon: string; view: View; adminOnly?: boolean }[] = [
    { name: 'Dashboard', icon: 'fa-house', view: 'Home' },
    { name: 'Updates', icon: 'fa-newspaper', view: 'Updates' },
    { name: 'Catholic Archive', icon: 'fa-images', view: 'Archive' },
    { name: 'Trivia Module', icon: 'fa-trophy', view: 'Trivia' },
    { name: 'Payments', icon: 'fa-receipt', view: 'Payments' },
    { name: 'Daily Briefing', icon: 'fa-calendar-check', view: 'Briefing', adminOnly: true },
    { name: 'Requests', icon: 'fa-file-signature', view: 'Requests' },
    { name: 'Audio Library', icon: 'fa-compact-disc', view: 'Audio' },
    { name: 'Chat Interface', icon: 'fa-message', view: 'Chat' },
    { name: 'Admin Vault', icon: 'fa-vault', view: 'AdminVault', adminOnly: true },
  ];

  const filteredItems = navItems.filter(item => !item.adminOnly || isLeaderOrTrainer);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 md:p-10 flex-grow overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-5 mb-14">
          <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] animate-float-slow">
            <i className="fa-solid fa-cross text-xl"></i>
          </div>
          <div>
            <span className="font-sans text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter block leading-[0.8]">Catholic Action</span>
            <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.4em] dark:text-blue-400 mt-2 block">Faith in Action</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-6 mb-6">Fellowship Registry</p>
          {filteredItems.map((item) => (
            <motion.button
              key={item.view}
              whileHover={{ x: 8 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setView(item.view);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] font-bold transition-all duration-500 group relative ${
                currentView === item.view 
                  ? 'bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] z-10' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                currentView === item.view ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                <i className={`fa-solid ${item.icon} text-base transition-transform group-hover:scale-110 ${currentView === item.view ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
              </div>
              <span className="text-[14px] tracking-tight font-bold">{item.name}</span>
              {currentView === item.view && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute right-5 w-2 h-2 bg-white rounded-full shadow-[0_0_12px_white]"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800/50 space-y-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group btn-premium"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-400/10 text-slate-500' : 'bg-slate-800/10 text-slate-800'}`}>
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
          </div>
          <span className="text-[13px] font-semibold tracking-wide">{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <div className="bg-slate-50/50 dark:bg-slate-800/60 p-4 rounded-[2rem] border border-slate-100/50 dark:border-slate-700/50 flex items-center gap-3.5 shadow-sm group cursor-pointer hover:border-blue-500/50 transition-all duration-300" onClick={() => setView('Profile')}>
          <div className="relative shrink-0">
            {user.profilePic ? (
              <img src={user.profilePic} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-800 dark:text-white truncate leading-none mb-1.5 font-serif">{user.name}</p>
            <p className="text-[8px] text-slate-400 font-bold truncate uppercase tracking-widest leading-none">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-700 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>
        <div className={`absolute top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-2xl transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <NavContent />
        </div>
      </div>

      <nav className="hidden md:flex flex-col w-72 h-screen bg-white/40 dark:bg-slate-900/40 backdrop-blur-[30px] border-r border-slate-200/40 dark:border-slate-800/40 sticky top-0 shrink-0 z-50 glowing-path">
        <NavContent />
      </nav>
    </>
  );
};

export default Navbar;