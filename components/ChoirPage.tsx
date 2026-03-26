
import React, { useState, useEffect } from 'react';
import { User, ChoirMaterial, MediaType, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import ConfirmationModal from './ConfirmationModal';

interface ChoirPageProps {
  user: User;
}

const ChoirPage: React.FC<ChoirPageProps> = ({ user }) => {
  const [materials, setMaterials] = useState<ChoirMaterial[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ChoirMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MediaType | 'all'>('all');
  const [formData, setFormData] = useState({ title: '', description: '', type: 'audio' as MediaType, url: '', fileName: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToChoir((newMaterials: ChoirMaterial[]) => {
      setMaterials(newMaterials);
      storageService.syncChoir(newMaterials);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, url: reader.result as string, fileName: file.name });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      setError("Please upload a file.");
      return;
    }
    
    if (editingMaterial) {
      const updatedMaterial: ChoirMaterial = {
        ...editingMaterial,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.url,
        fileName: formData.fileName
      };
      firebaseService.updateChoirMaterial(updatedMaterial);
      setEditingMaterial(null);
    } else {
      const newMaterial: ChoirMaterial = { 
        id: Math.random().toString(36).substr(2, 9), 
        title: formData.title, 
        description: formData.description, 
        type: formData.type, 
        url: formData.url, 
        fileName: formData.fileName, 
        uploadedBy: user.id, 
        uploaderName: user.name, 
        timestamp: Date.now() 
      };
      firebaseService.addChoirMaterial(newMaterial);
    }
    
    setIsAdding(false);
    setFormData({ title: '', description: '', type: 'audio', url: '', fileName: '' });
  };

  const handleEdit = (e: React.MouseEvent, material: ChoirMaterial) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      url: material.url,
      fileName: material.fileName || ''
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
      await firebaseService.deleteChoirMaterial(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const filtered = filter === 'all' ? materials : materials.filter(m => m.type === filter);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message="Are you sure you want to remove this audio resource from the archive? This action is irreversible."
        confirmLabel="Delete Resource"
      />
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
            <i className="fa-solid fa-compact-disc animate-spin-slow"></i>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">Audio Library</h2>
        </div>
        {isLeaderOrTrainer && (
          <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
            <i className="fa-solid fa-cloud-arrow-up"></i> Upload
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
        {['all', 'audio', 'video', 'document'].map((f) => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-bold border transition-all ${filter === f ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-left">
            <h3 className="font-serif text-xl md:text-2xl font-bold mb-6 dark:text-white">
              {editingMaterial ? 'Edit Resource' : 'Submit Resource'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none text-xs md:text-sm dark:text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                <option value="audio">Audio Resource</option>
                <option value="video">Catholic Video</option>
                <option value="document">Document</option>
              </select>
              <input type="text" required placeholder="Title" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none text-xs md:text-sm dark:text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <input type="file" required onChange={handleFileUpload} className="w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => {
                  setIsAdding(false);
                  setEditingMaterial(null);
                  setFormData({ title: '', description: '', type: 'audio', url: '', fileName: '' });
                }} className="flex-grow py-3 font-bold text-slate-500 text-xs md:text-sm">Cancel</button>
                <button type="submit" className="flex-grow py-3 bg-blue-600 text-white rounded-xl font-bold text-xs md:text-sm">
                  {editingMaterial ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const canDelete = item.uploadedBy === user.id || user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);
          return (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800 group relative transition-all hover:shadow-lg flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl ${item.type === 'audio' ? 'bg-amber-100 text-amber-600' : item.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <i className={`fa-solid ${item.type === 'audio' ? 'fa-microphone-lines' : item.type === 'video' ? 'fa-play' : 'fa-file-pdf'}`}></i>
                  </div>
                  {canDelete && (
                    <div className="flex gap-2">
                      <button onClick={(e) => handleEdit(e, item)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all">
                        <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                      </button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  )}
                </div>
              <div className="text-left flex-grow">
                <h3 className="font-serif text-base md:text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">{item.title}</h3>
                <p className="text-slate-400 text-[8px] md:text-[9px] uppercase font-bold tracking-widest mb-4">By {item.uploaderName}</p>
                {item.type === 'audio' && <audio src={item.url} controls className="w-full h-8 mt-2" />}
                {item.type === 'video' && <video src={item.url} controls className="w-full rounded-xl mt-2 max-h-40" />}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <a href={item.url} download={item.fileName} className="text-blue-600 text-[9px] md:text-[10px] font-black flex items-center gap-1 hover:underline">
                    <i className="fa-solid fa-download"></i> Save
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChoirPage;
