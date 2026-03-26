import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, PrayerPetition, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import DivineGlow from './DivineGlow';
import ConfirmationModal from './ConfirmationModal';

interface PetitionsPageProps {
  user: User;
}

const PetitionsPage: React.FC<PetitionsPageProps> = ({ user }) => {
  const [petitions, setPetitions] = useState<PrayerPetition[]>(storageService.getPetitions());
  const [isAdding, setIsAdding] = useState(false);
  const [editingPetition, setEditingPetition] = useState<PrayerPetition | null>(null);
  const [newContent, setNewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToPetitions((newPetitions: PrayerPetition[]) => {
      setPetitions(newPetitions);
      storageService.syncPetitions(newPetitions);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    
    if (editingPetition) {
      const updatedPetition: PrayerPetition = {
        ...editingPetition,
        content: newContent,
        isAnonymous: isAnonymous,
        userName: isAnonymous ? 'A Silent Soul' : user.name
      };
      firebaseService.updatePetition(updatedPetition);
      setEditingPetition(null);
    } else {
      const petition: PrayerPetition = { 
        id: Math.random().toString(36).substr(2, 9), 
        userId: user.id, 
        userName: isAnonymous ? 'A Silent Soul' : user.name, 
        content: newContent, 
        timestamp: Date.now(), 
        likes: 0,
        isAnonymous: isAnonymous
      };
      firebaseService.addPetition(petition);
    }
    
    setNewContent('');
    setIsAnonymous(false);
    setIsAdding(false);
  };

  const handleEdit = (e: React.MouseEvent, petition: PrayerPetition) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPetition(petition);
    setNewContent(petition.content);
    setIsAnonymous(petition.isAnonymous || false);
    setIsAdding(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await firebaseService.deletePetition(deleteConfirm.id);
      storageService.deletePetition(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleLike = (id: string) => {
    setAnimatingId(id);
    firebaseService.likePetition(id);
    setTimeout(() => setAnimatingId(null), 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-16 pb-20"
    >
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Entry"
        message="Are you sure you want to remove this petition from the system registry? This action is irreversible."
        confirmLabel="Confirm Deletion"
      />
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 px-4">
        <div className="text-left flex-grow">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-amber-600/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm border border-amber-100 dark:border-amber-900/50"
          >
             <i className="fa-solid fa-hands-praying animate-pulse"></i> Sacred Petitions
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-5xl md:text-7xl font-black text-slate-800 dark:text-white tracking-tighter leading-[0.9]"
          >
            Petitions <span className="text-slate-500 italic block mt-2">Fellowship.</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-lg font-medium italic mt-8 max-w-xl"
          >
            "Where two or three are gathered in my name, there am I in the midst of them."
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)} 
          className="w-full md:w-auto px-12 py-6 bg-slate-800 text-white rounded-[2.5rem] font-black shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-slate-900/30 border-2 border-white/20 group"
        >
          <i className="fa-solid fa-file-signature group-hover:rotate-[15deg] transition-transform"></i> Submit Petition
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-20 bg-white dark:bg-slate-900 rounded-[4rem] p-12 md:p-16 border-4 border-slate-800 shadow-2xl text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800/5 blur-[100px] -mr-24 -mt-24"></div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-10 font-sans italic tracking-tight relative z-10">
              {editingPetition ? '"Correct your prayer request..."' : '"Offer your prayer to the fellowship..."'}
            </h3>
            <form onSubmit={handleCreate} className="relative z-10">
              <textarea 
                autoFocus 
                className="w-full p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] outline-none min-h-[220px] text-xl md:text-3xl dark:text-white resize-none border-4 border-transparent focus:border-slate-100/50 dark:focus:border-slate-900/50 transition-all font-sans italic leading-relaxed shadow-inner" 
                placeholder="What is your heart's desire?" 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
              />
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mt-12">
                 <button 
                   type="button" 
                   onClick={() => setIsAnonymous(!isAnonymous)}
                   className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all border-2 ${isAnonymous ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'text-slate-400 border-slate-100 hover:border-slate-300'}`}
                 >
                   <i className={`fa-solid ${isAnonymous ? 'fa-user-secret' : 'fa-user'}`}></i>
                   <span className="text-[10px] font-black uppercase tracking-widest">{isAnonymous ? 'Anonymous Subject' : 'Identified Subject'}</span>
                 </button>

                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <button type="button" onClick={() => {
                    setIsAdding(false);
                    setEditingPetition(null);
                    setNewContent('');
                    setIsAnonymous(false);
                  }} className="px-8 py-3 font-black text-slate-400 text-xs uppercase tracking-[0.3em] hover:text-rose-500 transition-colors">Dismiss</button>
                  <button type="submit" className="flex-grow sm:flex-initial px-16 py-5 bg-slate-800 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 active:scale-95 transition-all shadow-slate-900/30 border-2 border-white/20">
                    {editingPetition ? 'Update Entry' : 'Submit Entry'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-10">
        {petitions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="py-32 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[5rem] animate-pulse"
          >
            <i className="fa-solid fa-inbox text-6xl text-slate-200 mb-6 animate-float"></i>
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-sm">The registry is currently empty.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {petitions.map((petition, index) => {
              const isOwner = petition.userId === user.id;
              const canManage = isOwner || isLeaderOrTrainer;
              const isAnimating = animatingId === petition.id;
              
              return (
                <motion.div 
                  key={petition.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-14 shadow-xl border border-slate-100 dark:border-slate-800 group transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(59,130,246,0.25)] aura-card text-left relative overflow-hidden ${isAnimating ? 'ring-4 ring-blue-500/50 scale-[1.02]' : ''}`}
                >
                  <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full transition-all duration-1000 ${petition.likes > 5 ? 'opacity-100 scale-150' : 'opacity-0'}`}></div>
                  
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.75rem] flex items-center justify-center font-black text-lg md:text-xl shadow-2xl animate-float border-2 border-white/20 ${petition.isAnonymous ? 'bg-slate-950 text-white' : 'bg-slate-800 text-white'}`}>
                        <i className={`fa-solid ${petition.isAnonymous ? 'fa-user-secret' : 'fa-user-check'} text-sm`}></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white text-lg md:text-xl leading-none mb-1.5 font-sans tracking-tight">
                          {petition.isAnonymous ? 'Anonymous Subject' : petition.userName}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] opacity-60">
                           {petition.isAnonymous && <span className="text-slate-500 mr-2">● Anonymous</span>}
                           Published {new Date(petition.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManage && petition.userId !== 'system' && (
                      <div className="flex gap-2">
                        <button onClick={(e) => handleEdit(e, petition)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-90">
                          <i className="fa-solid fa-pen-to-square text-xs md:text-sm"></i>
                        </button>
                        <button onClick={(e) => handleDelete(e, petition.id)} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-400 hover:text-rose-600 hover:bg-rose-100 md:opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-90">
                          <i className="fa-solid fa-trash-can text-xs md:text-sm"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-slate-700 dark:text-slate-100 text-2xl md:text-4xl leading-[1.3] italic mb-14 font-medium font-sans tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors duration-500">"{petition.content}"</p>
                    <div className="flex flex-wrap items-center gap-6">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLike(petition.id)} 
                        className={`relative overflow-hidden flex items-center gap-4 px-10 py-4 rounded-full text-xs font-black transition-all shadow-2xl uppercase tracking-[0.2em] ${isAnimating ? 'bg-blue-600 text-white animate-glow scale-105 shadow-blue-900/50' : 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-100'}`}
                      >
                        <i className={`fa-solid fa-hands-praying ${isAnimating ? 'animate-bounce' : ''} text-lg`}></i>
                        <span>Amen ({petition.likes})</span>
                        {isAnimating && <motion.span initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} className="absolute inset-0 bg-white/30 rounded-full"></motion.span>}
                      </motion.button>
                      <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest px-4 border-l border-slate-100 dark:border-slate-800 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span>
                        {Math.floor(petition.likes * 2.5 + 3)} Acknowledging Subjects
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default PetitionsPage;