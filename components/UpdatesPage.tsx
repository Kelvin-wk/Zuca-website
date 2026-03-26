import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdatePost, User, UserRole, UpdateComment } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import CalendarView from './CalendarView';
import DivineGlow from './DivineGlow';
import ConfirmationModal from './ConfirmationModal';

interface UpdatesPageProps {
  user: User;
  onNewUpdate: (title: string) => void;
}

const UpdatesPage: React.FC<UpdatesPageProps> = ({ user, onNewUpdate }) => {
  const [updates, setUpdates] = useState<UpdatePost[]>(storageService.getUpdates());
  const [filter, setFilter] = useState<'All' | 'Event' | 'Notice' | 'Technical'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<UpdatePost | null>(null);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState<Partial<UpdatePost>>({ 
    title: '', 
    content: '', 
    category: 'Event',
    image: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToUpdates((newUpdates: UpdatePost[]) => {
      setUpdates(newUpdates);
      storageService.syncUpdates(newUpdates);
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUpdate) {
      const updatedUpdate: UpdatePost = {
        ...editingUpdate,
        title: formData.title || 'Untitled',
        content: formData.content || '',
        category: formData.category as any || 'Event',
        image: formData.image
      };
      firebaseService.updateUpdate(updatedUpdate);
      setEditingUpdate(null);
    } else {
      const newUpdate: UpdatePost = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        title: formData.title || 'Untitled',
        content: formData.content || '',
        category: formData.category as any || 'Event',
        date: new Date().toISOString(),
        image: formData.image,
        registrations: [],
        comments: []
      };
      firebaseService.addUpdate(newUpdate);
      onNewUpdate(newUpdate.title);
    }
    
    setIsAdding(false);
    setFormData({ title: '', content: '', category: 'Event', image: '' });
  };

  const handleEdit = (e: React.MouseEvent, update: UpdatePost) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      category: update.category,
      image: update.image
    });
    setIsAdding(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      firebaseService.deleteUpdate(deleteConfirm.id);
      storageService.deleteUpdate(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleRegister = (updateId: string) => {
    firebaseService.registerForEvent(updateId, user.id);
    storageService.registerForEvent(updateId, user.id);
  };

  const handleAddComment = (updateId: string) => {
    if (!newComment.trim()) return;
    const comment: UpdateComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      userPic: user.profilePic,
      text: newComment,
      timestamp: Date.now()
    };
    firebaseService.addUpdateComment(updateId, comment);
    storageService.addUpdateComment(updateId, comment);
    setNewComment('');
  };

  const filteredUpdates = filter === 'All' ? updates : updates.filter(u => u.category === filter);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto pb-20"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 px-4">
        <div className="text-left flex-grow">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm border border-blue-100 dark:border-blue-900/50"
          >
             <i className="fa-solid fa-cross animate-pulse"></i> Catholic News
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl font-black text-slate-800 dark:text-white tracking-tighter leading-[0.9]"
          >
            Fellowship <span className="text-blue-600 italic block mt-2 text-glow-blue">News.</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-lg font-medium italic mt-8 max-w-xl"
          >
            "Stay connected with the heartbeat of our communal fellowship."
          </motion.p>
        </div>
        
        {isLeaderOrTrainer && (
          <motion.button 
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)} 
            className="w-full md:w-auto px-12 py-6 bg-blue-600 text-white rounded-[2.5rem] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-blue-600/30 border-2 border-white/20 group"
          >
            <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> Post News
          </motion.button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 px-4">
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          {['All', 'Event', 'Notice', 'Technical'].map((cat) => (
            <motion.button 
              key={cat} 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilter(cat as any);
                setViewMode('list');
              }} 
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${filter === cat && viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-list-ul"></i> List
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-calendar-days"></i> Calendar
          </button>
        </div>
      </div>

      <AnimatePresence>
        <ConfirmationModal 
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          onConfirm={confirmDelete}
          title="Remove Update"
          message="Are you sure you want to delete this announcement? This action cannot be undone."
          confirmLabel="Delete Forever"
        />
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative"
            >
              <DivineGlow color="rgba(37, 99, 235, 0.1)" intensity="high" />
              <h3 className="font-serif text-3xl font-black text-slate-800 dark:text-white mb-8 text-left">
                {editingUpdate ? 'Edit Catholic Update' : 'Publish Catholic Update'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6 text-left relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Channel</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Event', 'Notice', 'Technical'].map(c => (
                      <button 
                        key={c} type="button" 
                        onClick={() => setFormData({...formData, category: c as any})} 
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.category === c ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cover Image</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden relative group transition-all">
                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="" /> : <div className="text-center"><i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 mb-2"></i><p className="text-[10px] font-black uppercase text-slate-400">Select Banner</p></div>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="space-y-4">
                  <input type="text" placeholder="Announcement Title" required className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 outline-none text-base font-black dark:text-white transition-all shadow-inner" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <textarea placeholder="Input data details..." required rows={5} className="w-full px-8 py-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 outline-none resize-none text-base font-medium dark:text-white transition-all shadow-inner" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => {
                    setIsAdding(false);
                    setEditingUpdate(null);
                    setFormData({ title: '', content: '', category: 'Event', image: '' });
                  }} className="flex-grow py-5 font-black text-slate-500 text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Discard</button>
                  <button type="submit" className="flex-grow py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all">
                    {editingUpdate ? 'Save Update' : 'Submit Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'calendar' ? (
        <CalendarView updates={updates} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-4">
          <AnimatePresence mode="popLayout">
            {filteredUpdates.map((update, index) => {
              const canDelete = update.userId === user.id || isLeaderOrTrainer;
              const isRegistered = update.registrations?.includes(user.id);
              const isEvent = update.category === 'Event';
              const regCount = update.registrations?.length || 0;
              const commentCount = update.comments?.length || 0;

              return (
                <motion.div 
                  key={update.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 group relative transition-all duration-700 hover:shadow-2xl flex flex-col aura-card text-left"
                >
                  <div className="relative h-64 md:h-72 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {update.image ? <motion.img whileHover={{ scale: 1.1 }} transition={{ duration: 1 }} src={update.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600/10"><i className="fa-solid fa-dove text-6xl"></i></div>}
                    <div className="absolute top-6 left-6"><span className="px-6 py-2 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">{update.category}</span></div>
                    <div className="absolute top-6 right-6 flex gap-2">
                      {canDelete && (
                        <>
                          <button onClick={(e) => handleEdit(e, update)} className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-950/80 text-blue-500 flex items-center justify-center shadow-xl hover:bg-blue-500 hover:text-white transition-all transform hover:-rotate-6">
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                          <button onClick={(e) => handleDelete(e, update.id)} className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-950/80 text-rose-500 flex items-center justify-center shadow-xl hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-6">
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </>
                      )}
                    </div>
                    {isEvent && (
                      <div className="absolute bottom-6 left-6 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-users text-xs"></i> {regCount} Registered
                      </div>
                    )}
                  </div>
                  
                  <div className="p-10 md:p-12 flex-grow flex flex-col">
                    <div className="flex items-center gap-3 mb-4 opacity-50">
                      <i className="fa-solid fa-calendar-day text-[10px]"></i>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(update.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-6 leading-tight group-hover:text-blue-600 transition-colors">{update.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed line-clamp-4 italic font-medium mb-10">"{update.content}"</p>
                    
                    <div className="mt-auto flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        {isEvent && (
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRegister(update.id)}
                            className={`flex-grow py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isRegistered ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30'}`}
                          >
                            <i className={`fa-solid ${isRegistered ? 'fa-circle-check' : 'fa-hand-pointer'}`}></i>
                            {isRegistered ? 'Registered' : 'Register Interest'}
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setActiveComments(activeComments === update.id ? null : update.id)}
                          className="flex-shrink-0 w-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-500 transition-all relative"
                        >
                          <i className="fa-solid fa-comments text-xl"></i>
                          {commentCount > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-lg">{commentCount}</span>}
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {activeComments === update.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-8 border-t border-slate-100 dark:border-slate-800 space-y-8"
                          >
                             <div className="max-h-64 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                                {update.comments && update.comments.length > 0 ? update.comments.map(c => (
                                  <div key={c.id} className="flex gap-4 group/comment">
                                     <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                        {c.userPic ? <img src={c.userPic} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-black">{c.userName?.charAt(0) || '?'}</div>}
                                     </div>
                                     <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                           <span className="text-[10px] font-black dark:text-white tracking-tight">{c.userName}</span>
                                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{c.text}</p>
                                     </div>
                                  </div>
                                )) : (
                                  <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] py-4">No data entries found.</p>
                                )}
                             </div>
                             <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                                <input 
                                  type="text" placeholder="Input comment..." 
                                  className="flex-grow bg-transparent outline-none px-4 py-2 text-sm font-bold dark:text-white placeholder:text-slate-400"
                                  value={newComment} onChange={e => setNewComment(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddComment(update.id)}
                                />
                                <button onClick={() => handleAddComment(update.id)} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                                   <i className="fa-solid fa-paper-plane text-xs"></i>
                                </button>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default UpdatesPage;