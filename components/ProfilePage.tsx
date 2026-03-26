import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, UserRole, UpdatePost } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [isExporting, setIsExporting] = useState(false);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<UpdatePost[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAllMembers(storageService.getUsers());
    const updates = storageService.getUpdates();
    setMyRegistrations(updates.filter(u => u.registrations?.includes(user.id)));
  }, [user.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...user, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleTogglePrivacy = () => {
    const updated = { 
      ...user, 
      settings: { ...user.settings, hideOnLeaderboard: !user.settings?.hideOnLeaderboard } 
    };
    onUpdate(updated);
    setFormData(updated);
  };

  const handleExportFellowship = () => {
    setIsExporting(true);
    const csvContent = syncService.generateMemberCSV(allMembers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZUCA_Fellowship_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);
  
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 blur-[100px] -ml-48 -mb-48 pointer-events-none"></div>
      
      {/* Hero-style Header */}
      <div className="relative p-12 md:p-20 rounded-[4rem] bg-slate-900 text-white overflow-hidden shadow-2xl border border-white/5 text-left">
        <div className="absolute inset-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1200" className="w-full h-full object-cover blur-[1px]" alt="" />
           <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-blue-900/30"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            {user.profilePic ? (
              <img src={user.profilePic} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-4 border-white/10 hover:scale-105 transition-all duration-500 object-cover shadow-2xl" alt="" />
            ) : (
              <div className="w-40 h-40 md:w-56 md:h-56 bg-white/10 backdrop-blur-xl border-4 border-white/10 rounded-[3rem] flex items-center justify-center text-6xl font-serif text-white/50">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[3rem]">
              <i className="fa-solid fa-camera text-white text-2xl"></i>
            </div>
          </div>

          <div className="flex-grow space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">
                Fellowship Profile
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter leading-none">{user.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest">
                {user.role}
              </span>
              <span className="px-5 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/20 rounded-2xl text-blue-300 text-[10px] font-black uppercase tracking-widest">
                ID: {user.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Sidebar: Technical Data */}
        <div className="md:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Apostolic Metrics</h3>
              <div className="space-y-6">
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Contribution Index</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-blue-600">{user.points}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                  </div>
                </div>
                
                {user.phoneNumber && (
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Contact</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{user.phoneNumber}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Apostolic Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Trivia Accuracy</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">84%</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Days Active</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Visibility</span>
                  <button 
                    onClick={handleTogglePrivacy}
                    className={`w-12 h-6 rounded-full relative transition-colors ${user.settings?.hideOnLeaderboard ? 'bg-slate-200 dark:bg-slate-800' : 'bg-blue-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.settings?.hideOnLeaderboard ? 'left-1' : 'left-7'}`}></div>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 italic leading-relaxed font-medium">
                  {user.settings?.hideOnLeaderboard ? 'Subject omitted from public logs.' : 'Subject indexed in system analytics.'}
                </p>
              </div>
            </section>

            <div className="pt-6 space-y-4">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Entry'}
              </button>
              
              {isLeaderOrTrainer && (
                <button 
                  onClick={handleExportFellowship}
                  disabled={isExporting}
                  className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Download Fellowship Records'}
                </button>
              )}

              <button onClick={onLogout} className="w-full py-5 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all">
                End Session
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Fellowship Details */}
        <div className="md:col-span-8">
          <div className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-xl">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-500">
                <div className="space-y-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 py-4 text-2xl font-serif outline-none focus:border-blue-600 transition-colors text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Contact Number</label>
                    <input 
                      type="tel" value={formData.phoneNumber || ''} 
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} 
                      className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 py-4 text-2xl font-serif outline-none focus:border-blue-600 transition-colors text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Subject Narrative</label>
                    <textarea 
                      value={formData.bio || ''} 
                      onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                      rows={4} 
                      className="w-full bg-transparent border border-slate-200 dark:border-slate-800 p-6 text-lg font-mono outline-none focus:border-slate-900 dark:focus:border-white transition-colors text-slate-900 dark:text-white resize-none" 
                      placeholder="Brief description..."
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-mono uppercase tracking-widest hover:opacity-80 transition-all">
                  Update Entry
                </button>
              </form>
            ) : (
              <div className="space-y-20 animate-in fade-in duration-500">
                <section className="space-y-8">
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.5em]">Narrative</h4>
                  <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                    {user.bio ? `"${user.bio}"` : '"No narrative provided for this subject."'}
                  </p>
                </section>

                <section className="space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.5em]">Fellowship Logs</h4>
                    <span className="text-[10px] font-mono text-slate-500">{myRegistrations.length} Entries</span>
                  </div>
                  
                  {/* Faith Journey Visualization */}
                  <div className="relative py-12 px-6 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-2">Current Path</p>
                        <h5 className="text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tighter">
                          {user.points > 500 ? 'Apostolic Pillar' : user.points > 200 ? 'Faithful Witness' : 'Aspiring Disciple'}
                        </h5>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <div 
                            key={step}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                              step <= Math.ceil(user.points / 200) 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'
                            }`}
                          >
                            <i className={`fa-solid ${step === 5 ? 'fa-crown' : 'fa-check'} text-xs`}></i>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {myRegistrations.length > 0 ? myRegistrations.map((reg, i) => (
                      <motion.div 
                        key={reg.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <i className="fa-solid fa-calendar-check text-xl"></i>
                          </div>
                          <div className="space-y-1">
                            <p className="font-sans font-bold text-xl text-slate-900 dark:text-white">{reg.title}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                              {new Date(reg.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[9px] font-mono uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">Active Record</span>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                        <i className="fa-solid fa-folder-open text-4xl text-slate-200 dark:text-slate-800 mb-4"></i>
                        <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">No fellowship logs indexed.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;