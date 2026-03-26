import React, { useState, useRef, useEffect } from 'react';
import { User, DailyContent, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';

interface BriefingPageProps {
  user: User;
}

const DEFAULT_DAILY: DailyContent = {
  verse: "Faith in action is the product of consistent prayer and service.",
  verseRef: "Catholic Action Protocol 1.1",
  saintName: "Alan Turing",
  saintFeast: "June 23",
  saintPatronage: "Computational Logic",
  saintBio: "Pioneer of theoretical computer science and artificial intelligence. His work provides the foundation for modern system architecture.",
  saintImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&auto=format&fit=crop"
};

const BriefingPage: React.FC<BriefingPageProps> = ({ user }) => {
  const [dailyForm, setDailyForm] = useState<DailyContent>(DEFAULT_DAILY);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const saintImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDaily = async () => {
      const savedDaily = await firebaseService.getDailyContent() as DailyContent;
      if (savedDaily) {
        setDailyForm(savedDaily);
        storageService.setDailyContent(savedDaily);
      } else {
        const localDaily = storageService.getDailyContent();
        if (localDaily) setDailyForm(localDaily);
      }
    };
    fetchDaily();
  }, []);

  const handleSaintImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDailyForm(prev => ({ ...prev, saintImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const saveDailyContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await firebaseService.setDailyContent(dailyForm);
      storageService.setDailyContent(dailyForm);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="text-left mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 animate-float">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <h2 className="font-sans text-4xl font-black text-slate-800 dark:text-white tracking-tight">Daily Briefing</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Update the daily sacred text and saint profile for the entire community.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-14 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative aura-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32"></div>
        
        <form onSubmit={saveDailyContent} className="space-y-12 relative z-10 text-left">
          {/* SCRIPTURE SECTION */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Sacred Text</h4>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Daily Text</label>
                <textarea 
                  placeholder="Enter the daily text..." required rows={3}
                  className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-slate-600 outline-none text-slate-800 dark:text-white font-medium text-lg md:text-xl transition-all resize-none italic font-sans"
                  value={dailyForm.verse} onChange={e => setDailyForm({...dailyForm, verse: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Reference Source</label>
                <input 
                  type="text" placeholder="e.g. Source 1:1" required
                  className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-slate-600 outline-none text-slate-800 dark:text-white font-black text-sm uppercase tracking-widest transition-all"
                  value={dailyForm.verseRef} onChange={e => setDailyForm({...dailyForm, verseRef: e.target.value})}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* SAINT SECTION */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Subject Profile</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Name</label>
                    <input type="text" placeholder="Subject Name" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm dark:text-white" value={dailyForm.saintName} onChange={e => setDailyForm({...dailyForm, saintName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Date Reference</label>
                    <input type="text" placeholder="e.g. Jan 1st" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm dark:text-white" value={dailyForm.saintFeast} onChange={e => setDailyForm({...dailyForm, saintFeast: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Classification</label>
                  <input type="text" placeholder="Classification..." required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm dark:text-white" value={dailyForm.saintPatronage} onChange={e => setDailyForm({...dailyForm, saintPatronage: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Historical Context</label>
                  <textarea placeholder="Brief history of the subject..." required rows={4} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm dark:text-white resize-none" value={dailyForm.saintBio} onChange={e => setDailyForm({...dailyForm, saintBio: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Subject Image</label>
                <div 
                  onClick={() => saintImageRef.current?.click()}
                  className="w-full h-80 rounded-[3rem] bg-slate-50 dark:bg-slate-800 border-4 border-dashed border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 transition-all group relative"
                >
                  {dailyForm.saintImage ? (
                    <>
                      <img src={dailyForm.saintImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fa-solid fa-camera text-2xl"></i></div>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-image text-3xl text-slate-300 mb-3"></i>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Image</p>
                    </>
                  )}
                </div>
                <input type="file" ref={saintImageRef} className="hidden" accept="image/*" onChange={handleSaintImageUpload} />
              </div>
            </div>
          </section>

          <div className="pt-8">
            <button 
              type="submit" disabled={isSaving}
              className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isSaving ? 'bg-slate-400' : saveStatus === 'success' ? 'bg-emerald-600 text-white' : saveStatus === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/30'}`}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Updating...</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Updated Successfully!</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <i className="fa-solid fa-circle-xmark"></i>
                  <span>Failed to Update</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Update Daily Briefing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BriefingPage;