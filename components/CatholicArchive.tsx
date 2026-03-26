
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import DivineGlow from './DivineGlow';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import ConfirmationModal from './ConfirmationModal';

interface GalleryItem {
  id: string;
  category: string;
  image: string;
  description: string;
  title: string;
}

const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: '1',
    title: 'Data Visualization',
    category: 'Historical Art',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda5366391?q=80&w=1000&auto=format&fit=crop',
    description: 'A moment of documented revelation, captured in period strokes.'
  },
  {
    id: '2',
    title: 'Morning Assembly',
    category: 'Moments',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop',
    description: 'The atmosphere of community gathering for collective observation.'
  },
  {
    id: '3',
    title: 'Sacred Architecture',
    category: 'Architecture',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
    description: 'The intricate design of historical spaces optimized for acoustic resonance.'
  },
  {
    id: '4',
    title: 'Atmospheric Data',
    category: 'Atmosphere',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
    description: 'The golden hour in the structure, where light meets geometry.'
  },
  {
    id: '5',
    title: 'Vocal Ensemble',
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop',
    description: 'Voices raised in harmony, echoing traditional compositions.'
  },
  {
    id: '6',
    title: 'Technical Manuscript',
    category: 'Relics',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
    description: 'The preserved text, maintained through ages for historical reference.'
  }
];

const CatholicArchive: React.FC<{ user: User }> = ({ user }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', category: 'Historical Art', image: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToGallery((newItems: GalleryItem[]) => {
      setItems(newItems);
      storageService.saveGallery(newItems);
    });
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...new Set(items.map(item => item.category))];
  const filteredItems = filter === 'All' ? items : items.filter(item => item.category === filter);

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
    if (!formData.image) {
      setError("Please upload an image.");
      return;
    }
    
    if (editingItem) {
      const updatedItem: GalleryItem = {
        ...editingItem,
        ...formData
      };
      firebaseService.updateGalleryItem(updatedItem);
      setEditingItem(null);
    } else {
      const newItem: GalleryItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      firebaseService.addGalleryItem(newItem);
    }
    
    setIsAdding(false);
    setFormData({ title: '', category: 'Historical Art', image: '', description: '' });
  };

  const handleEdit = (e: React.MouseEvent, item: GalleryItem) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      image: item.image,
      description: item.description
    });
    setIsAdding(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await firebaseService.deleteGalleryItem(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Archive Entry"
        message="Are you sure you want to remove this entry from the archive? This action is irreversible."
        confirmLabel="Delete Entry"
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-slate-600/10 border border-slate-600/20 rounded-full text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6"
          >
            <i className="fa-solid fa-images"></i>
            Visual Database
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-sans font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-4">
            Catholic <span className="text-blue-600 italic">Archive.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl font-medium">
            A curated collection of historical art, architecture, and documented moments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === cat 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {isLeaderOrTrainer && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/30 flex items-center gap-3"
            >
              <i className="fa-solid fa-plus"></i>
              Submit Archive Entry
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setSelectedItem(item)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 aura-card">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">{item.category}</p>
                  <h3 className="text-white font-sans text-3xl font-black tracking-tighter leading-none">{item.title}</h3>
                </div>
                <div className="absolute top-8 right-8 flex gap-2">
                  {isLeaderOrTrainer && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleEdit(e, item)}
                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 hover:scale-110"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 hover:scale-110"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  )}
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                    <i className="fa-solid fa-expand"></i>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative"
            >
              <DivineGlow color="rgba(37, 99, 235, 0.1)" intensity="high" />
              <h3 className="font-sans text-3xl font-black text-slate-800 dark:text-white mb-8 text-left">
                {editingItem ? 'Edit Archive Entry' : 'Submit to Visual Database'}
              </h3>
              {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-3">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6 text-left relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Historical Art', 'Moments', 'Architecture', 'Atmosphere', 'Audio', 'Relics'].map(c => (
                      <button 
                        key={c} type="button" 
                        onClick={() => setFormData({...formData, category: c})} 
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.category === c ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Archive Image</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 overflow-hidden relative group transition-all">
                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="" /> : <div className="text-center"><i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 mb-2"></i><p className="text-[10px] font-black uppercase text-slate-400">Select Image</p></div>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="space-y-4">
                  <input type="text" placeholder="Entry Title" required className="w-full px-8 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-slate-600 outline-none text-base font-black dark:text-white transition-all shadow-inner" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <textarea placeholder="Input metadata..." required rows={4} className="w-full px-8 py-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-slate-600 outline-none resize-none text-base font-medium dark:text-white transition-all shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                    setFormData({ title: '', category: 'Historical Art', image: '', description: '' });
                  }} className="flex-grow py-5 font-black text-slate-500 text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Discard</button>
                  <button type="submit" className="flex-grow py-5 bg-slate-800 text-white rounded-2xl font-black shadow-2xl text-xs uppercase tracking-widest hover:bg-slate-900 active:scale-95 transition-all">
                    {editingItem ? 'Save Entry' : 'Submit to Archive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setSelectedItem(null)}></div>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-6xl w-full bg-white dark:bg-slate-900 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-8 right-8 z-10 w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>

              <div className="lg:w-2/3 aspect-video lg:aspect-auto">
                <img src={selectedItem.image} className="w-full h-full object-cover" alt={selectedItem.title} />
              </div>

              <div className="lg:w-1/3 p-12 md:p-16 flex flex-col justify-center text-left">
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.5em] mb-6">{selectedItem.category}</p>
                <h2 className="text-4xl md:text-5xl font-sans font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-8">{selectedItem.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-12 italic">
                  "{selectedItem.description}"
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-calendar-day"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged On</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">March 15, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-user-shield"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archived By</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Catholic Archive</p>
                    </div>
                  </div>
                </div>

                <button className="mt-12 w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/30 hover:scale-105 transition-transform">
                  Download Asset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatholicArchive;
