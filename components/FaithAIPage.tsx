import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { getSpiritualInsight } from '../services/geminiService';
import DivineGlow from './DivineGlow';
import ConfirmationModal from './ConfirmationModal';

interface FaithAIPageProps {
  user: User;
  isOverlay?: boolean;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  location?: string;
}

const FaithAIPage: React.FC<FaithAIPageProps> = ({ user, isOverlay = false }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, sources?: {uri: string, title: string}[], events?: CalendarEvent[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    checkConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkConnection();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const res = await fetch(`/api/calendar/events?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`/api/auth/google/url?userId=${user.id}`);
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  };

  const cleanResponse = (text: string) => {
    return text.replace(/\*/g, '').trim();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    let context = "";
    if (isConnected && events.length > 0) {
      context = `\n\n[USER CALENDAR CONTEXT]: The following upcoming events are on the user's Google Calendar:
      ${events.map(e => `- ${e.summary} at ${e.start.dateTime || e.start.date} (Location: ${e.location || 'N/A'})`).join('\n')}
      
      If the user asks about their schedule or reminders, use this information. If they want to send a reminder, generate a warm, spiritual message for them.`;
    } else if (!isConnected) {
      context = `\n\n[SYSTEM NOTE]: The user has NOT connected their Google Calendar. If they ask about events or reminders, politely suggest they connect their calendar using the "Connect Google Calendar" button in the interface.`;
    }

    const insightResponse = await getSpiritualInsight(userText + context);
    
    // Check if AI mentioned calendar or reminders
    const showEvents = isConnected && (userText.toLowerCase().includes('calendar') || userText.toLowerCase().includes('reminder') || userText.toLowerCase().includes('schedule') || userText.toLowerCase().includes('event'));

    setMessages(prev => [...prev, { 
      role: 'ai', 
      content: cleanResponse(insightResponse.text),
      sources: insightResponse.sources,
      events: showEvents ? events : undefined
    }]);
    setIsLoading(false);
  };

  const sendReminder = (event: CalendarEvent, type: 'WhatsApp' | 'Email') => {
    const message = `Reminder: ${event.summary}\nTime: ${new Date(event.start.dateTime || event.start.date || '').toLocaleString()}\nLocation: ${event.location || 'Sanctuary'}\n\n"Let all that you do be done in love." - 1 Corinthians 16:14`;
    
    if (type === 'WhatsApp') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      const url = `mailto:?subject=${encodeURIComponent('Reminder: ' + event.summary)}&body=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const clearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setMessages([]);
    setShowClearConfirm(false);
  };

  const suggestions = [
    "What's on my calendar?",
    "Help me send a reminder",
    "Verses for peace?",
    "Daily prayer help"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl overflow-hidden relative ${isOverlay ? 'h-[500px] w-full' : 'max-w-4xl mx-auto h-[calc(100vh-180px)] rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800/50'}`}
    >
      <ConfirmationModal 
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClear}
        title="Clear Session"
        message="Are you sure you want to clear this system session? Your conversation history will be erased."
        confirmLabel="Erase Session"
      />
      
      {/* Centered Faith Background Image */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200" 
          className="w-full h-full object-cover md:object-contain opacity-[0.07] dark:opacity-[0.1] mix-blend-overlay animate-float-slow" 
          alt="Faith Presence"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 dark:via-slate-900/40 to-white/80 dark:to-slate-900/80"></div>
      </div>

      <DivineGlow color="rgba(37, 99, 235, 0.05)" intensity="low" />

      <div className="flex-grow flex flex-col min-h-0 relative z-10">
        {!isOverlay && (
          <div className="p-8 pb-0 flex items-center justify-between">
            <div className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20"
                >
                   <i className="fa-solid fa-wand-magic-sparkles"></i>
                </motion.div>
                <div className="flex flex-col">
                  <h2 className="font-sans text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                    Faith AI
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-300'} animate-pulse`}></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      {isConnected ? 'Calendar Linked' : 'Calendar Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isConnected && (
                <button 
                  onClick={handleConnect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"
                >
                  Link Calendar
                </button>
              )}
              <AnimatePresence>
                {messages.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={clearChat}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Clear
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-[280px] mx-auto space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 blur-2xl animate-pulse rounded-full"></div>
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="relative w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-blue-100 dark:border-blue-800"
                >
                  <i className="fa-solid fa-microchip"></i>
                </motion.div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 font-sans italic">Awaiting input...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed font-bold uppercase tracking-wider">Query the system for technical data or check your schedule.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                {suggestions.map((s, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setInput(s); setTimeout(() => handleSend(), 50); }}
                    className="p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 dark:border-slate-700 transition-all text-center shadow-sm"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white shadow-lg'}`}>
                          <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-[10px]`}></i>
                        </div>
                        <motion.div 
                          layout
                          className={`p-4 rounded-[1.25rem] text-xs leading-relaxed shadow-sm text-left ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none font-bold' 
                            : 'bg-white/90 dark:bg-slate-900/90 border border-blue-100 dark:border-blue-900/30 text-slate-700 dark:text-slate-200 rounded-tl-none font-sans italic'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          
                          {msg.events && msg.events.length > 0 && (
                            <div className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sanctuary Schedule</p>
                              {msg.events.map(event => (
                                <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-black text-[10px] text-slate-800 dark:text-white">{event.summary}</p>
                                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                        {new Date(event.start.dateTime || event.start.date || '').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => sendReminder(event, 'WhatsApp')}
                                      className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-[7px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                    >
                                      <i className="fa-brands fa-whatsapp"></i> WhatsApp
                                    </button>
                                    <button 
                                      onClick={() => sendReminder(event, 'Email')}
                                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[7px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                    >
                                      <i className="fa-solid fa-envelope"></i> Email
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Web Sources</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, idx) => (
                                  <motion.a 
                                    key={idx} 
                                    whileHover={{ scale: 1.05 }}
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[8px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                                  >
                                    <i className="fa-solid fa-link text-[7px]"></i>
                                    {source.title || 'Source'}
                                  </motion.a>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center animate-pulse">
                     <i className="fa-solid fa-ellipsis"></i>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                     <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                     <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        <div className={`p-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800`}>
          <form onSubmit={handleSend} className="relative flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input 
              type="text" 
              placeholder="Query Faith AI..."
              className="flex-grow px-4 py-2 outline-none text-slate-800 dark:text-white bg-transparent font-bold text-xs placeholder:text-slate-400"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${!input.trim() || isLoading ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white'}`}
            >
              <i className="fa-solid fa-arrow-up text-[10px]"></i>
            </motion.button>
          </form>
          <p className="mt-2 text-center text-[7px] font-black text-slate-400 uppercase tracking-widest">Faith Logic • Spiritual Guidance</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FaithAIPage;
