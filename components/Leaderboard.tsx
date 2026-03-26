import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';

interface LeaderboardProps {
  currentUser?: User;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllUsers((allUsers) => {
      const parsed = allUsers as User[];
      // Filter out users who have chosen to hide their profile
      const visibleUsers = parsed.filter(u => !u.settings?.hideOnLeaderboard || u.id === currentUser?.id);
      const sorted = visibleUsers.sort((a, b) => b.points - a.points);
      setUsers(sorted);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-500 text-left">
      <div className="p-12 bg-blue-600 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <h3 className="font-serif text-5xl font-black mb-3 tracking-tight">Hall of Faith</h3>
          <p className="text-blue-100 text-lg font-medium opacity-90 italic">Celebrating the communal growth in wisdom and spirit.</p>
        </div>
      </div>
      
      <div className="p-10 md:p-14">
        <div className="space-y-6">
          {users.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-black uppercase tracking-[0.4em] text-xs opacity-50">
              The registry is currently private.
            </div>
          ) : (
            users.map((entry, idx) => {
              const isCurrentUser = currentUser && entry.id === currentUser.id;
              const isLeaderOrTrainer = entry.role === UserRole.TRAINER || (entry.role !== UserRole.STUDENT && entry.role !== UserRole.NON_STUDENT && entry.role !== UserRole.GUEST);
              const rank = idx + 1;
              const isHidden = entry.settings?.hideOnLeaderboard && isCurrentUser;
              
              return (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-500 border-2 ${
                    isCurrentUser 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-lg scale-[1.02]' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl transition-all duration-500 ${
                    rank === 1 ? 'bg-yellow-400 text-yellow-900 rotate-[-5deg]' :
                    rank === 2 ? 'bg-slate-200 text-slate-700' :
                    rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {rank}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {entry.profilePic ? (
                      <img src={entry.profilePic} className="w-16 h-16 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl" alt="" />
                    ) : (
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center text-slate-400 font-black text-xl">
                        {entry.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-slate-800 dark:text-white text-xl tracking-tight font-serif">
                        {entry.name}
                        {isHidden && <span className="text-[10px] text-blue-500 ml-2 font-sans italic tracking-normal">(Visible only to you)</span>}
                      </span>
                      {isLeaderOrTrainer && <i className="fa-solid fa-shield-check text-emerald-500 text-sm"></i>}
                      {rank <= 3 && <i className="fa-solid fa-crown text-amber-500 animate-bounce"></i>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{entry.role}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter text-glow">{entry.points}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] opacity-60">Grace Pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-14 p-10 bg-amber-50 dark:bg-amber-900/10 rounded-[3rem] border-2 border-amber-100 dark:border-amber-900/30 flex flex-col md:flex-row items-center gap-10 shadow-inner">
           <div className="w-24 h-24 bg-amber-400 text-white rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-amber-400/30 animate-float border-4 border-white/20">
              <i className="fa-solid fa-dove text-4xl"></i>
           </div>
           <div className="text-center md:text-left">
              <h4 className="text-2xl font-serif font-black text-amber-900 dark:text-amber-400 mb-2">Apostolic Reward</h4>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium italic">
                The top 3 souls in the Hall of Faith each month are granted the <span className="font-black underline">Sacred Bundle</span>—a custom ZUCA rosary, consecrated journal, and exclusive community badge.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
