
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, DailyContent } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import DivineGlow from './DivineGlow';

interface HeroProps {
  user: User;
  onPlayTrivia: () => void;
}

const DEFAULT_CONTENT: DailyContent = {
  verse: "I can do all things through Christ who strengthens me.",
  verseRef: "Philippians 4:13",
  saintName: "St. Thomas Aquinas",
  saintFeast: "January 28",
  saintPatronage: "Students",
  saintBio: "Doctor of the Church and patron of students. He is famous for providing the foundation for Catholic theology.",
  saintImage: "https://images.unsplash.com/photo-1548625313-039e44749549?q=80&w=400&auto=format&fit=crop"
};

const Hero: React.FC<HeroProps> = ({ user, onPlayTrivia }) => {
  const [daily, setDaily] = useState<DailyContent>(DEFAULT_CONTENT);
  const [onlineCount, setOnlineCount] = useState(0);
  const [stats, setStats] = useState({
    rank: '#--',
    events: '0 Active'
  });

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    // Wait for auth to be ready if needed
    const setupPresence = () => {
      unsubscribe = firebaseService.subscribeToPresence((users: any[]) => {
        setOnlineCount(users.length);
      });
    };

    setupPresence();

    const unsubscribeDaily = firebaseService.subscribeToDailyContent((content: DailyContent) => {
      if (content) {
        setDaily(content);
        storageService.setDailyContent(content);
      }
    });
    
    const refreshData = () => {
      const saved = storageService.getDailyContent();
      if (saved) setDaily(saved);

      // Calculate authentic stats
      const allUsers = storageService.getUsers();
      const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);
      const userRank = sortedUsers.findIndex(u => u.id === user.id) + 1;
      
      const collections = storageService.getCollections();
      const activeEvents = collections.length;

      setStats({
        rank: userRank > 0 ? `#${userRank}` : '#--',
        events: `${activeEvents} Active`
      });
    };
    refreshData();
    window.addEventListener('storage_sync', refreshData);
    return () => {
      window.removeEventListener('storage_sync', refreshData);
      unsubscribe();
      unsubscribeDaily();
    };
  }, [user.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Blessed Morning";
    if (hour < 17) return "Blessed Afternoon";
    return "Blessed Evening";
  };

  const faithLevel = Math.floor(user.points / 100) + 1;
  const progressToNext = user.points % 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Cinematic Main Banner */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-slate-900 text-white shadow-2xl min-h-[350px] md:min-h-[600px] flex items-center group border border-white/10 aura-card transition-all duration-700"
      >
        <div className="absolute inset-0">
          <img 
            src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
            alt="Portal Center" 
            className="w-full h-full object-cover object-center opacity-50 group-hover:scale-110 transition-transform duration-[25s] ease-linear"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/70 to-transparent"></div>
          <DivineGlow color="rgba(59, 130, 246, 0.3)" intensity="medium" />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/25 blur-[90px] animate-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-500/15 blur-[110px] animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10 px-6 md:px-20 lg:px-32 py-12 md:py-20 w-full flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16">
          <div className="max-w-4xl text-left">
            <motion.div 
              initial={{ x: -25, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 bg-blue-600/20 backdrop-blur-3xl border border-blue-500/30 rounded-full text-blue-400 font-black text-[9px] md:text-[11px] mb-8 md:mb-12 uppercase tracking-[0.3em] md:tracking-[0.4em] animate-float shadow-2xl"
            >
               <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-pulse"></span>
               Active Presence
            </motion.div>
            
            <div className="mb-8 md:mb-14">
              <motion.h2 
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl md:text-6xl font-sans font-bold text-slate-300 mb-4 md:mb-8 opacity-90 tracking-tighter"
              >
                {getGreeting()}, <span className="text-white">{user.name.split(' ')[0]}</span>.
              </motion.h2>
              <motion.h1 
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-sans text-4xl md:text-9xl lg:text-[10rem] leading-[0.8] font-black tracking-tighter mb-8 md:mb-12"
              >
                <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Faith</span> in <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] italic block mt-4 md:mt-6 animate-pulse-slow">Action.</span>
              </motion.h1>
            </div>

            {/* Daily Inspiration Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border border-white/10 max-w-3xl relative overflow-hidden group shadow-2xl mb-12 md:mb-20"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[60px] -mr-20 -mt-20"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-lg shadow-amber-900/20">
                  <i className="fa-solid fa-quote-left text-2xl md:text-3xl"></i>
                </div>
                <div className="space-y-3 text-center md:text-left">
                  <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.4em]">Daily Inspiration</p>
                  <p className="text-xl md:text-3xl font-serif italic text-white leading-tight">
                    "Faith is the realization of what is hoped for and evidence of things not seen."
                  </p>
                  <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">— Hebrews 11:1</p>
                </div>
              </div>
            </motion.div>

            <motion.p 
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-base md:text-3xl text-slate-300 mb-10 md:mb-16 max-w-2xl leading-relaxed font-medium opacity-80 tracking-tight"
            >
              Analyze, engage, and contribute to the Zetech community through a clinical lens of action and wisdom.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4 md:gap-6"
            >
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayTrivia}
                className="flex-grow md:flex-initial px-8 md:px-12 py-4 md:py-6 bg-blue-600 text-white rounded-2xl md:rounded-3xl font-black text-sm md:text-lg flex items-center justify-center gap-3 md:gap-4 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)]"
              >
                <i className="fa-solid fa-bolt-lightning text-white text-lg group-hover:rotate-12 transition-transform"></i>
                Trivia Module
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex-grow md:flex-initial px-8 md:px-12 py-4 md:py-6 bg-white/10 border border-white/20 text-white rounded-2xl md:rounded-3xl font-black text-sm md:text-lg backdrop-blur-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-xl"
              >
                <i className="fa-solid fa-users-rays text-amber-500 text-lg"></i>
                Fellowship
              </motion.button>
            </motion.div>
          </div>

          {/* Portal Level Gauge */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="hidden lg:flex flex-col items-center bg-white/10 backdrop-blur-3xl p-16 rounded-[5rem] border border-white/20 animate-scale-in shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] group-hover:translate-y-[-10px] transition-transform duration-700"
          >
             <div className="relative w-64 h-64 mb-10">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/5" />
                   <motion.circle 
                    initial={{ strokeDashoffset: 722 }}
                    animate={{ strokeDashoffset: 722 - (722 * progressToNext / 100) }}
                    transition={{ duration: 2.5, delay: 1, ease: "circOut" }}
                    cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,1)]" strokeDasharray={722} strokeLinecap="round" 
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <motion.span 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-7xl font-sans font-bold text-white"
                   >
                    {faithLevel}
                   </motion.span>
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Apostolic Progress</span>
                </div>
             </div>
             <div className="space-y-3 w-full">
               <div className="flex justify-between items-center px-2">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">{progressToNext}% Progress</p>
                 <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Next: {faithLevel + 1}</p>
               </div>
               <div className="h-[6px] w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 2, delay: 1.2, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                 ></motion.div>
               </div>
             </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Daily Scripture Card */}
        <motion.div 
          initial={{ x: -40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[4rem] p-16 md:p-20 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden group aura-card text-left transition-all"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -mr-60 -mt-60"></div>
          <DivineGlow color="rgba(37, 99, 235, 0.15)" intensity="low" />
          <div className="relative z-10">
            <div className="flex items-center gap-8 mb-16">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-5xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] animate-float-slow">
                <i className="fa-solid fa-quote-left"></i>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tighter">Faith Proclamation</h3>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.4em]">Sacred Word</p>
              </div>
            </div>

            <blockquote className="text-3xl md:text-6xl lg:text-7xl font-sans text-slate-800 dark:text-slate-100 leading-[1] mb-16 italic font-bold tracking-tighter group-hover:text-blue-600 transition-colors duration-700">
              "{daily.verse}"
            </blockquote>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="h-[4px] w-full flex-grow bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '75%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-blue-600 shadow-2xl"
                ></motion.div>
              </div>
              <cite className="not-italic font-black text-amber-500 text-2xl md:text-5xl tracking-tighter">
                — {daily.verseRef}
              </cite>
            </div>
          </div>
        </motion.div>

        {/* Historical Subject Card */}
        <motion.div 
          initial={{ x: 40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[4rem] p-12 border border-slate-100 dark:border-slate-800 shadow-2xl aura-card flex flex-col text-left group"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              <i className="fa-solid fa-scroll"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white font-serif tracking-tighter">Catholic Subject</h3>
              <p className="text-[11px] text-amber-600 font-black uppercase tracking-widest">Feast Day: {daily.saintFeast}</p>
            </div>
          </div>

          <div className="relative flex-grow rounded-[3rem] overflow-hidden mb-10 shadow-2xl group/img min-h-[300px]">
            <img src={daily.saintImage} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-[15s] ease-out" alt={daily.saintName} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-10 left-10 right-10">
              <h4 className="text-white font-serif text-3xl md:text-4xl font-black mb-2 tracking-tighter drop-shadow-lg">{daily.saintName}</h4>
              <p className="text-amber-500 text-[11px] font-black uppercase tracking-[0.5em] drop-shadow-md">{daily.saintPatronage}</p>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed italic line-clamp-5 font-medium px-4 opacity-80">
            "{daily.saintBio}"
          </p>
        </motion.div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-10">
        {[
          { label: 'Faith Points', value: user.points, icon: 'fa-star', color: 'text-slate-500', bg: 'bg-slate-500/10' },
          { label: 'Fellowship Rank', value: stats.rank, icon: 'fa-trophy', color: 'text-slate-500', bg: 'bg-slate-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -15, scale: 1.05 }}
            className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col items-center text-center group transition-all duration-700 aura-card"
          >
            <div className={`w-20 h-20 ${stat.bg} ${stat.color} rounded-[2rem] flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-700 shadow-inner`}>
              <i className={`fa-solid ${stat.icon} text-3xl`}></i>
            </div>
            <p className="text-4xl font-sans font-bold dark:text-white mb-2 tracking-tighter">{stat.value}</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
};

export default Hero;
