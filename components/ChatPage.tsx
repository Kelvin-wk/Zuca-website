
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChatMessage, MediaType, UserRole } from '../types';
import { getSpiritualInsight } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import { Virtuoso } from 'react-virtuoso';
import DivineGlow from './DivineGlow';
import ConfirmationModal from './ConfirmationModal';

interface ChatPageProps {
  user: User;
  onNewMessage: (name: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, onNewMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(storageService.getChat());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMember, setTypingMember] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<{type: MediaType, data: string, name?: string} | null>(null);
  const [amens, setAmens] = useState<Record<string, number>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  useEffect(() => {
    let unsubscribeChat = () => {};
    let unsubscribePresence = () => {};

    const setupSubscriptions = () => {
      unsubscribeChat = firebaseService.subscribeToChat((newMessages: ChatMessage[]) => {
        setMessages(newMessages);
      });

      unsubscribePresence = firebaseService.subscribeToPresence((users: User[]) => {
        setOnlineUsers(users);
      });

      firebaseService.updatePresence(user);
    };

    setupSubscriptions();

    return () => {
      unsubscribeChat();
      unsubscribePresence();
    };
  }, [user.id]);

  const COMMON_EMOJIS = ['🙏', '🙌', '✨', '🕊️', '❤️', '🔥', '📖', '⛪', '🌟', '😇', '🤝', '💪', '😊', '🎉', '💡', '✅'];

  const filteredMentionUsers = useMemo(() => {
    if (mentionSearch === null) return [];
    return onlineUsers.filter(u => 
      u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    ).slice(0, 5);
  }, [mentionSearch, onlineUsers]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear the entire chat history? This cannot be undone.")) {
      try {
        await firebaseService.clearChat();
        storageService.syncChat([]);
        setMessages([]);
      } catch (error) {
        console.error("Failed to clear chat:", error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!query.includes(' ')) {
        setMentionSearch(query);
        setMentionIndex(0);
      } else {
        setMentionSearch(null);
      }
    } else {
      setMentionSearch(null);
    }
    
    setInput(value);
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const insertMention = (userName: string) => {
    if (mentionSearch === null) return;
    const cursorPosition = input.substring(0, input.lastIndexOf('@', input.length)).length;
    const textBefore = input.substring(0, input.lastIndexOf('@'));
    const textAfter = input.substring(input.lastIndexOf(mentionSearch) + mentionSearch.length);
    setInput(`${textBefore}@${userName} ${textAfter}`);
    setMentionSearch(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSearch !== null && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentionUsers[mentionIndex].name);
      } else if (e.key === 'Escape') {
        setMentionSearch(null);
      }
    }
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() && !mediaFile) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      content: textToSend,
      timestamp: Date.now(),
      ...(user.profilePic ? { userPic: user.profilePic } : {}),
      ...(mediaFile ? { media: { type: mediaFile.type, url: mediaFile.data, fileName: mediaFile.name } } : {})
    };

    firebaseService.sendMessage(newMsg);
    storageService.addChatMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setMediaFile(null);
    onNewMessage(user.name);

    if (textToSend.toLowerCase().includes('data') || textToSend.toLowerCase().includes('system') || textToSend.toLowerCase().includes('registry')) {
      setIsTyping(true);
      const insightResponse = await getSpiritualInsight(textToSend);
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'bot',
        userName: 'Portal Guide',
        userRole: UserRole.GUEST,
        content: insightResponse.text,
        timestamp: Date.now()
      };
      setIsTyping(false);
      firebaseService.sendMessage(botMsg);
    }
  };

  const handleAmen = (msgId: string) => {
    firebaseService.amenMessage(msgId);
    setAmens(prev => ({
      ...prev,
      [msgId]: (prev[msgId] || 0) + 1
    }));
  };

  const deleteMessage = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const idToDelete = deleteConfirm.id;
    if (idToDelete) {
      try {
        await firebaseService.deleteMessage(idToDelete);
        storageService.deleteChatMessage(idToDelete);
        setMessages(prev => prev.filter(m => m.id !== idToDelete));
        setDeleteConfirm({ isOpen: false, id: null });
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const scrollToBottom = () => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  };

  const startMeeting = () => {
    const meetUrl = "https://meet.google.com/new";
    window.open(meetUrl, '_blank');
    handleSend(undefined, `Digital communication room initialized. Join here: ${meetUrl}`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setMediaFile({ type: 'audio', data: reader.result as string, name: 'PortalVoice.webm' });
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { 
      setError("Microphone access denied."); 
      setTimeout(() => setError(null), 5000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let type: MediaType = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      const reader = new FileReader();
      reader.onloadend = () => setMediaFile({ type, data: reader.result as string, name: file.name });
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto h-[80vh] md:h-[88vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative group/chat transition-all duration-700"
    >
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Entry"
        message="Are you sure you want to remove this entry from the registry? This action is irreversible."
        confirmLabel="Confirm Deletion"
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <h3 className="font-black text-slate-800 dark:text-white text-lg md:text-xl font-sans tracking-tight">Chat Interface</h3>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse shadow-[0_0_8px_rgba(100,116,139,0.6)]"></span> {onlineUsers.length} Active Subjects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all ${showSearch ? 'bg-slate-800 text-white shadow-slate-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
            >
              <i className="fa-solid fa-magnifying-glass text-sm md:text-base"></i>
            </motion.button>

            {isLeaderOrTrainer && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClearChat}
                className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/50"
                title="Clear Portal Logs"
              >
                <i className="fa-solid fa-broom text-sm md:text-base"></i>
              </motion.button>
            )}

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startMeeting}
              className="relative group/meet overflow-hidden flex items-center gap-3 px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] md:text-xs font-black transition-all shadow-xl border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 opacity-0 group-hover/meet:opacity-100 transition-opacity duration-700"></div>
              <div className="relative z-10 flex items-center gap-2 tracking-widest uppercase">
                <i className="fa-solid fa-bolt animate-pulse"></i>
                <span className="hidden sm:inline">Initialize Meeting</span>
              </div>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4"
            >
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communication logs..."
                className="flex-grow bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-200"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-8 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest"
            >
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
              <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Gathered Fellowship</span>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">{u.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow relative bg-slate-50/10 dark:bg-slate-950/5 overflow-hidden">
          <DivineGlow color="rgba(37, 99, 235, 0.05)" intensity="low" />
          {/* Enhanced Divine Background Image */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.12] dark:opacity-[0.18] overflow-hidden flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1200" 
              className="w-full h-full object-cover md:object-contain scale-110 mix-blend-overlay animate-float-slow" 
              alt="Portal Background" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-slate-900 via-transparent to-white dark:to-slate-900"></div>
          </div>

          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={filteredMessages}
            initialTopMostItemIndex={filteredMessages.length > 0 ? filteredMessages.length - 1 : 0}
            followOutput="smooth"
            atBottomStateChange={(atBottom) => setShowScrollBottom(!atBottom)}
            itemContent={(index, msg) => {
              const isMe = msg.userId === user.id;
              const isSystem = msg.userId === 'system' || msg.userId === 'bot';
              const canDelete = isMe || isLeaderOrTrainer;
              const amenCount = msg.amens || 0;

              if (isSystem) {
                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center py-4"
                  >
                    <div className="bg-white/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] py-2.5 px-10 rounded-full font-black uppercase tracking-[0.3em] border border-slate-100 dark:border-slate-900/50 shadow-xl backdrop-blur-md">
                      <i className="fa-solid fa-microchip mr-2"></i> {msg.content}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-5 px-6 md:px-12 py-4 group/msg ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {msg.userPic ? (
                      <motion.img 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        src={msg.userPic} 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-[1.25rem] object-cover border-2 border-white dark:border-slate-800 shadow-2xl" 
                        alt="" 
                      />
                    ) : (
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-[1.25rem] flex items-center justify-center text-white text-[13px] font-black shadow-2xl ${isMe ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-slate-400'}`}
                      >
                        {msg.userName?.charAt(0) || '?'}
                      </motion.div>
                    )}
                  </div>
                  <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-3 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 tracking-tight">{msg.userName}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {canDelete && (
                        <button onClick={(e) => deleteMessage(e, msg.id)} className="text-rose-400 hover:text-rose-600 p-1.5 md:opacity-0 group-hover/msg:opacity-100 transition-all transform hover:scale-125">
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      )}
                    </div>
                    <motion.div 
                      layout
                      className={`group/bubble relative p-3 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-lg text-sm md:text-base leading-relaxed transition-all aura-card backdrop-blur-2xl border-2 ${
                        isMe ? 'bg-slate-800/95 text-white rounded-tr-none border-slate-700/30' : 'bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border-slate-100 dark:border-slate-700/50'
                      }`}
                    >
                      {msg.media && (
                        <div className="mb-4 overflow-hidden rounded-[1.75rem] shadow-inner border border-white/10">
                          {msg.media.type === 'image' && <motion.img whileHover={{ scale: 1.05 }} src={msg.media.url} className="w-full max-h-[400px] object-contain bg-black/5" alt="" />}
                          {msg.media.type === 'video' && <video src={msg.media.url} controls className="w-full max-h-[400px] rounded-[1.75rem]" />}
                          {msg.media.type === 'audio' && <audio src={msg.media.url} controls className="w-full h-11 mt-1 px-2" />}
                        </div>
                      )}
                      <p className="font-medium font-sans">{msg.content}</p>
                      
                      {/* Acknowledge Reaction */}
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAmen(msg.id)}
                        className={`absolute -bottom-3 ${isMe ? '-left-3' : '-right-3'} flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-full shadow-xl border border-slate-100 dark:border-slate-900/50 group/amen`}
                      >
                        <i className={`fa-solid fa-check-double text-[10px] ${amenCount > 0 ? 'text-blue-500' : 'text-slate-400 group-hover/amen:text-blue-500'} transition-colors`}></i>
                        {amenCount > 0 && <span className="text-[10px] font-black text-slate-800 dark:text-white">{amenCount}</span>}
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            }}
            components={{
              Footer: () => (
                <>
                  {(isTyping || typingMember) && (
                    <div className="p-4 md:p-12 space-y-4 md:space-y-8">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 md:gap-4"
                      >
                        <div className="flex gap-1.5 md:gap-2 p-2.5 md:p-3.5 bg-white/90 dark:bg-slate-800/90 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl backdrop-blur-md">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] italic animate-pulse">
                          {isTyping ? "Portal processing..." : `${typingMember} typing...`}
                        </span>
                      </motion.div>
                    </div>
                  )}
                  <div className="h-4" />
                </>
              )
            }}
          />

          <AnimatePresence>
            {showScrollBottom && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={scrollToBottom}
                className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-blue-700 transition-colors"
              >
                <i className="fa-solid fa-chevron-down"></i>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Improved Input Area */}
        <div className="p-4 md:p-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative">
          <AnimatePresence>
            {/* Mention List */}
            {mentionSearch !== null && filteredMentionUsers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-10 mb-4 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mention Member</p>
                </div>
                {filteredMentionUsers.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u.name)}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === mentionIndex ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'}`}
                  >
                    <img src={u.profilePic || `https://ui-avatars.com/api/?name=${u.name}`} className="w-6 h-6 rounded-lg object-cover" alt="" />
                    <span className="text-xs font-bold">{u.name}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-full left-10 mb-4 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50"
              >
                <div className="grid grid-cols-8 gap-2">
                  {COMMON_EMOJIS.map(emoji => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => insertEmoji(emoji)}
                      className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {mediaFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-6 p-5 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <i className={`fa-solid ${mediaFile.type === 'image' ? 'fa-image' : mediaFile.type === 'audio' ? 'fa-microphone' : 'fa-file'} text-base`}></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[240px] tracking-tight">{mediaFile.name || 'Portal File'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mediaFile.type} attachment</p>
                  </div>
                </div>
                <button onClick={() => setMediaFile(null)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"><i className="fa-solid fa-xmark"></i></button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSend} className="flex items-center gap-1.5 md:gap-4 bg-slate-100/90 dark:bg-slate-800/90 p-1 md:p-2.5 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-200/50 dark:border-slate-700/50 focus-within:ring-8 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all duration-500">
            <div className="flex gap-1 md:gap-1.5 pl-0.5 md:pl-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-8 h-8 md:w-13 md:h-13 rounded-full flex items-center justify-center transition-all shadow-sm ${showEmojiPicker ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-600'}`}
              >
                <i className="fa-regular fa-face-smile text-xs md:text-base"></i>
              </motion.button>
              <motion.label 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer w-8 h-8 md:w-13 md:h-13 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"
              >
                <i className="fa-solid fa-cloud-arrow-up text-xs md:text-base"></i>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </motion.label>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={`w-8 h-8 md:w-13 md:h-13 rounded-full flex items-center justify-center transition-all shadow-sm ${isRecording ? 'bg-rose-600 text-white animate-sacred-pulse' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-rose-600'}`}
              >
                <i className="fa-solid fa-microphone-lines text-xs md:text-base"></i>
              </motion.button>
            </div>
            
            <input 
              type="text" value={input} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Input data..."
              className="flex-grow px-1 md:px-4 py-2 md:py-4 outline-none bg-transparent text-slate-800 dark:text-white text-sm md:text-lg font-medium placeholder:text-slate-400"
            />
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              type="submit" disabled={!input.trim() && !mediaFile}
              className="w-8 h-8 md:w-13 md:h-13 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 transition-all shadow-slate-600/30"
            >
              <i className="fa-solid fa-paper-plane text-xs md:text-base"></i>
            </motion.button>
          </form>
          <div className="mt-3 hidden md:flex items-center justify-center gap-6">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Communication Channel</p>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Secure Interface</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPage;
