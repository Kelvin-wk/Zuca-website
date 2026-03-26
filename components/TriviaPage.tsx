
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, TriviaQuestion } from '../types';
import { generateBibleTrivia } from '../services/geminiService';
import Leaderboard from './Leaderboard';
import DivineGlow from './DivineGlow';

interface TriviaPageProps {
  user: User;
  onPointsUpdate: (user: User) => void;
}

const TriviaPage: React.FC<TriviaPageProps> = ({ user, onPointsUpdate }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [view, setView] = useState<'play' | 'leaderboard'>('play');
  const [pulseScore, setPulseScore] = useState(false);

  const questionImages = [
    "https://images.unsplash.com/photo-1504052434139-44b5509e6f9d?q=80&w=1200",
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1200",
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=1200",
    "https://images.unsplash.com/photo-1543165796-5426273eaab3?q=80&w=1200",
    "https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=1200",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200",
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1200"
  ];

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await generateBibleTrivia();
    setQuestions(qs);
    setLoading(false);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setAnswered(false);
    setSelectedOption(null);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    if (idx === questions[currentIdx].correctAnswer) {
      setScore(prev => prev + (questions[currentIdx].points || 0));
      setStreak(prev => prev + 1);
      setPulseScore(true);
      setTimeout(() => setPulseScore(false), 1000);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setGameOver(true);
      onPointsUpdate({ ...user, points: user.points + score });
    }
  };

  if (view === 'leaderboard') {
    return (
      <div className="max-w-4xl mx-auto animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-sans text-3xl md:text-4xl font-black dark:text-white tracking-tight">Fellowship of Excellence</h2>
          <button 
            onClick={() => setView('play')}
            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-play mr-2"></i> Play Trivia
          </button>
        </div>
        <Leaderboard currentUser={user} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex justify-between items-center mb-10">
        <div className="text-left">
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="font-sans text-4xl font-black dark:text-white tracking-tighter"
          >
            Trivia Module
          </motion.h2>
          <motion.p 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest"
          >
            Validate system knowledge
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('leaderboard')}
          className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all border border-transparent hover:border-blue-500/30"
        >
          Leaderboard
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 text-center shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="w-20 h-20 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-[0_0_20px_rgba(30,41,59,0.3)]"></div>
            <p className="text-slate-600 dark:text-slate-300 font-sans text-xl italic animate-pulse">Retrieving data modules...</p>
          </motion.div>
        ) : gameOver ? (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 text-center shadow-2xl border border-slate-100 dark:border-slate-800 aura-card"
          >
            <div className="w-28 h-28 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center text-6xl mx-auto mb-10 animate-float shadow-xl border-4 border-slate-400/20">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="font-sans text-5xl font-black mb-6 dark:text-white tracking-tight">Module Complete</h3>
            <p className="text-slate-500 dark:text-slate-400 text-2xl mb-12">Score recorded: <span className={`font-black text-slate-900 dark:text-white text-3xl px-2 ${pulseScore ? 'animate-glow' : ''}`}>{score} / 50</span> points.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadQuestions}
                className="py-6 bg-slate-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-2xl shadow-slate-900/30 active:scale-95"
              >
                Restart Module
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('leaderboard')}
                className="py-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Fellowship
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="play"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center px-6">
              <div className="flex flex-col items-start">
                <span className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-1">Sequence {currentIdx + 1} / {questions.length}</span>
                <AnimatePresence>
                  {streak > 1 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest"
                    >
                      <i className="fa-solid fa-bolt animate-bounce"></i> {streak} STREAK
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-4">
                 <span className="px-5 py-2 bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800 shadow-sm">Val: {questions[currentIdx].points} pts</span>
                 <motion.span 
                  animate={pulseScore ? { scale: [1, 1.2, 1], backgroundColor: ['#ffffff', '#1e293b', '#ffffff'], color: ['#1e293b', '#ffffff', '#1e293b'] } : {}}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500 shadow-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-100 dark:border-slate-800`}
                 >
                  Score: {score}
                 </motion.span>
              </div>
            </div>

            <div className="relative bg-white dark:bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-700 min-h-[580px] flex flex-col aura-card">
              <div className="absolute inset-0 h-64 overflow-hidden">
                <motion.img 
                  key={currentIdx}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.5 }}
                  transition={{ duration: 1.5 }}
                  src={questionImages[currentIdx % questionImages.length]} 
                  className="w-full h-full object-cover dark:opacity-30"
                  alt="Module Image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent"></div>
              </div>

              <div className="relative z-10 p-10 md:p-16 mt-28 flex-grow flex flex-col">
                <motion.h3 
                  key={currentIdx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-16 leading-[1.15] text-left font-sans tracking-tight"
                >
                  {questions[currentIdx].question}
                </motion.h3>

                <div className="grid grid-cols-1 gap-5 flex-grow">
                  {questions[currentIdx].options.map((option, idx) => {
                    let statusClass = "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:scale-[1.03] text-slate-700 dark:text-slate-200";
                    if (answered) {
                      if (idx === questions[currentIdx].correctAnswer) {
                        statusClass = "bg-slate-800 text-white border-slate-400 scale-[1.05] shadow-2xl z-20";
                      } else if (idx === selectedOption) {
                        statusClass = "bg-rose-600 text-white border-rose-400 opacity-95 animate-pulse";
                      } else {
                        statusClass = "bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-30 blur-[1px]";
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!answered ? { scale: 1.02, x: 5 } : {}}
                        whileTap={!answered ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(idx)}
                        disabled={answered}
                        className={`group p-6 rounded-[2rem] border text-left font-bold text-lg transition-all duration-500 flex items-center gap-6 relative overflow-hidden ${statusClass}`}
                      >
                        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-black transition-all duration-500 text-xl shadow-inner ${
                          answered && idx === questions[currentIdx].correctAnswer 
                            ? 'bg-white text-slate-800 border-white' 
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 group-hover:border-slate-500 group-hover:text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="relative z-10 font-sans font-black">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {answered && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-16 p-10 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 blur-3xl rounded-full"></div>
                      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-xl shadow-slate-500/30 animate-float">
                          <i className="fa-solid fa-scroll"></i>
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.4em] mb-4">Data Context</h4>
                          <p className="text-slate-800 dark:text-slate-100/90 text-lg md:text-xl leading-relaxed font-medium font-sans italic mb-10">"{questions[currentIdx].explanation}"</p>
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="w-full md:w-auto px-16 py-5 bg-slate-800 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-2xl shadow-slate-900/30 active:scale-95"
                          >
                            {currentIdx === questions.length - 1 ? 'Finalize Module' : 'Next Module'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="px-6">
              <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-6 shadow-inner border border-slate-100 dark:border-slate-700">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]" 
                 ></motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TriviaPage;
