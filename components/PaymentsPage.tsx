
import React, { useState, useEffect } from 'react';
import { User, PaymentCollection, PaymentRecord, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';

interface PaymentsPageProps {
  user: User;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ user }) => {
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [globalHistory, setGlobalHistory] = useState<PaymentRecord[]>([]);
  const [isPaying, setIsPaying] = useState<PaymentCollection | null>(null);
  const [isAddingMission, setIsAddingMission] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');

  const TILL_NUMBER = "4587966";

  const [newMission, setNewMission] = useState<Partial<PaymentCollection>>({
    title: '',
    description: '',
    category: 'Events',
    targetAmount: 0,
    icon: 'fa-calendar-star'
  });

  const isLeaderOrTrainer = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  const refreshData = () => {
    setCollections(storageService.getCollections());
    const allPayments = storageService.getPayments();
    setHistory(allPayments.filter(p => p.userId === user.id));
    setGlobalHistory(allPayments);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('storage_sync', refreshData);
    return () => window.removeEventListener('storage_sync', refreshData);
  }, [user.id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaying || !payAmount || !phoneNumber) return;
    
    setPaymentStep('processing');
    setIsProcessing(true);
    
    // Simulate STK Push delay with a sacred cinematic wait
    await new Promise(r => setTimeout(r, 2800));

    const record: PaymentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      collectionId: isPaying.id,
      collectionTitle: isPaying.title,
      amount: parseFloat(payAmount),
      method: 'M-Pesa',
      timestamp: Date.now()
    };

    storageService.addPayment(record);
    await syncService.logActivity(user, 'PAYMENT', { amount: record.amount, mission: record.collectionTitle });
    
    setPaymentStep('success');
    setIsProcessing(false);
    
    setTimeout(() => {
      setIsPaying(null);
      setPaymentStep('details');
      setPayAmount('');
      setPhoneNumber('');
    }, 3500);
  };

  const handleAddMission = (e: React.FormEvent) => {
    e.preventDefault();
    const mission: PaymentCollection = {
      id: Math.random().toString(36).substr(2, 9),
      title: newMission.title || 'Sacred Mission',
      description: newMission.description || '',
      category: newMission.category as any || 'Events',
      targetAmount: Number(newMission.targetAmount) || 0,
      currentAmount: 0,
      icon: getCategoryIcon(newMission.category as any),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    storageService.addCollection(mission);
    setIsAddingMission(false);
    setNewMission({ title: '', description: '', category: 'Events', targetAmount: 0 });
  };

  const handleExportLedger = () => {
    setIsExporting(true);
    const csvContent = syncService.generatePaymentCSV(globalHistory);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZUCA_Sacrifice_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Tithes': return 'fa-hands-holding-seedling';
      case 'Events': return 'fa-calendar-star';
      case 'Charity': return 'fa-heart-pulse';
      case 'Projects': return 'fa-building-columns';
      default: return 'fa-gift';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch(cat) {
      case 'Tithes': return 'bg-emerald-600 text-white';
      case 'Events': return 'bg-blue-600 text-white';
      case 'Charity': return 'bg-rose-600 text-white';
      case 'Projects': return 'bg-amber-600 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700 pb-20">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-[5rem] bg-slate-900 p-12 md:p-24 text-white shadow-2xl border border-white/10 group transition-all duration-700">
        <div className="absolute inset-0 opacity-25">
          <img src="https://images.unsplash.com/photo-1543165796-5426273eaab3?q=80&w=1200" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[20s]" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-600/10 blur-[150px] animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-10 shadow-xl">
              <i className="fa-solid fa-hand-holding-heart animate-sacred-pulse"></i> Sacrifice & Mission
            </div>
            <h2 className="text-5xl md:text-8xl font-serif font-black tracking-tighter mb-8 leading-[0.85] text-sacred-glow">Divine <span className="text-blue-400 italic block mt-2">Offerings.</span></h2>
            <p className="text-slate-400 text-xl md:text-2xl font-medium leading-relaxed mb-12 opacity-80 italic">"Give and it will be given to you... a good measure, pressed down, shaken together and running over."</p>
            
            {isLeaderOrTrainer && (
              <button 
                onClick={handleExportLedger}
                disabled={isExporting}
                className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-slate-950 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-4 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-black/40"
              >
                {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-invoice-dollar text-blue-600 text-lg md:text-xl"></i>}
                Sacrifice Ledger
              </button>
            )}
          </div>
          
          <div className="bg-white/5 backdrop-blur-3xl p-14 rounded-[4rem] border border-white/20 w-full max-w-sm text-center aura-card shadow-2xl">
            <div className="flex justify-center mb-6">
               <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-10 brightness-0 invert" alt="M-Pesa" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6">ZUCA Heavenly Till</p>
            <p className="text-6xl font-black text-white font-mono tracking-tighter mb-4 text-glow">{TILL_NUMBER}</p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-[9px] font-bold uppercase tracking-widest">Active Steward Endpoint</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Missions Section */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
            <div className="flex flex-col text-left">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2">Sacred Missions</h3>
              <p className="text-xs font-bold text-slate-500">Fundraising for {collections.length} active vocational events</p>
            </div>
            {isLeaderOrTrainer && (
              <button 
                onClick={() => setIsAddingMission(true)} 
                className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-blue-600 text-white rounded-[1.25rem] md:rounded-[1.75rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-plus-circle text-base md:text-lg"></i>
                Establish Mission
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {collections.length === 0 ? (
              <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] opacity-50">
                <i className="fa-solid fa-leaf text-5xl text-slate-200 mb-6 animate-float"></i>
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Awaiting new missions of faith.</p>
              </div>
            ) : collections.map(col => {
              const progress = col.targetAmount ? Math.min(100, (col.currentAmount / col.targetAmount) * 100) : 0;
              return (
                <div key={col.id} className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl border border-slate-100 dark:border-slate-800 group aura-card flex flex-col relative overflow-hidden text-left transition-all duration-500">
                  <div className={`absolute top-0 right-12 px-5 py-2 rounded-b-2xl text-[9px] font-black uppercase tracking-widest shadow-md z-10 ${getCategoryBadge(col.category)}`}>
                    {col.category}
                  </div>
                  
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[2rem] flex items-center justify-center text-4xl mb-10 group-hover:rotate-[15deg] transition-all duration-700 shadow-inner">
                    <i className={`fa-solid ${getCategoryIcon(col.category)}`}></i>
                  </div>
                  
                  <h4 className="text-3xl font-black text-slate-800 dark:text-white mb-4 font-serif leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{col.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-base mb-12 line-clamp-3 italic leading-relaxed font-medium">"{col.description}"</p>
                  
                  <div className="mt-auto space-y-8">
                    {col.targetAmount ? (
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Offerings Fellowship</span>
                          <span className="text-blue-600">KES {col.currentAmount.toLocaleString()} <span className="text-slate-300 mx-1">/</span> {col.targetAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            style={{ width: `${progress}%` }}
                          ></div>
                          {/* Milestone Ticks */}
                          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/20"></div>
                          <div className="absolute left-[75%] top-0 w-0.5 h-full bg-white/20"></div>
                        </div>
                        {progress >= 100 && (
                          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                            <i className="fa-solid fa-check-circle"></i> Holy Goal Achieved!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-5 px-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] text-center border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cumulative Offerings</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">KES {col.currentAmount.toLocaleString()}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setIsPaying(col)} 
                      className="w-full py-6 bg-slate-950 dark:bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-slate-950/20 dark:shadow-blue-600/30 border border-white/10"
                    >
                      Support Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sacrifice Ledger */}
        <div className="lg:col-span-4 space-y-12">
          <div className="px-6 flex flex-col items-start">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2 text-left">
              {isLeaderOrTrainer ? 'Apostolic Ledger' : 'My Stewardship'}
            </h3>
            <p className="text-xs font-bold text-slate-500 text-left">Live offering registry</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden h-[750px] flex flex-col aura-card">
            <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar text-left bg-slate-50/20 dark:bg-slate-950/5">
              {(isLeaderOrTrainer ? globalHistory : history).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-slate-400">
                   <i className="fa-solid fa-receipt text-4xl mb-4"></i>
                   <p className="font-black uppercase tracking-[0.3em] text-[10px]">Fellowship is empty</p>
                </div>
              ) : (isLeaderOrTrainer ? globalHistory : history).map((record, i) => (
                <div key={record.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between items-start">
                    <div className="max-w-[150px]">
                      <p className="text-sm font-black text-slate-800 dark:text-white mb-1.5 leading-tight">{record.collectionTitle}</p>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-600/10 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                        {record.userName || 'Member'}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 font-black text-xl md:text-2xl text-glow">+{record.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase opacity-60">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="h-px bg-slate-50 dark:bg-slate-700/50"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-3.5 opacity-50" alt="" />
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Channel: M-Pesa</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(record.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-10 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cumulative Sacrifice</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Validated</span>
                  </div>
               </div>
               <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter text-glow">
                 <span className="text-sm text-slate-400 font-serif mr-1">KES</span>
                 {(isLeaderOrTrainer ? globalHistory : history).reduce((a, b) => a + b.amount, 0).toLocaleString()}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* STK Push Cinematic Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[5rem] p-8 md:p-16 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 border border-white/10">
            <button onClick={() => { setIsPaying(null); setPaymentStep('details'); }} className="absolute top-6 right-6 md:top-12 md:right-12 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:scale-110 hover:rotate-90 active:scale-95 transition-all shadow-lg z-20"><i className="fa-solid fa-xmark text-lg md:text-xl"></i></button>
            
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full"></div>

            {paymentStep === 'details' && (
              <div className="space-y-12 relative z-10">
                <div className="text-center">
                  <div className="flex justify-center mb-8">
                     <div className="w-20 h-20 bg-green-600 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-green-600/30 animate-float border-2 border-white/20">
                        <i className="fa-solid fa-mobile-retro"></i>
                     </div>
                  </div>
                  <h3 className="text-4xl font-black font-serif mb-3 dark:text-white tracking-tight">STK Prompt</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Sacrifice for <span className="text-green-600 font-black italic">{isPaying.title}</span></p>
                </div>
                
                <form onSubmit={handlePayment} className="space-y-8 text-left">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Sacrifice Amount</label>
                    <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl tracking-tight">KES</span>
                      <input 
                        type="number" required placeholder="0.00"
                        className="w-full pl-24 pr-10 py-7 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 text-4xl font-black dark:text-white outline-none focus:border-green-600 border-4 border-transparent transition-all shadow-inner placeholder:opacity-30"
                        value={payAmount} onChange={e => setPayAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Subscriber Mobile</label>
                    <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">+254</span>
                      <input 
                        type="tel" required placeholder="7XXXXXXXX"
                        className="w-full pl-24 pr-10 py-7 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 text-2xl font-black dark:text-white outline-none focus:border-green-600 border-4 border-transparent transition-all shadow-inner"
                        value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-[2rem] border border-green-100 dark:border-green-800 flex items-center gap-5">
                     <i className="fa-solid fa-shield-halved text-green-600 text-2xl"></i>
                     <p className="text-[11px] font-bold text-green-700 dark:text-green-300 leading-relaxed">Secure protocol initiated. You will receive an official M-Pesa prompt for Till <span className="font-black text-slate-900 dark:text-white">{TILL_NUMBER}</span>.</p>
                  </div>

                  <button type="submit" className="w-full py-7 bg-green-600 text-white rounded-[3rem] font-black text-xl shadow-2xl shadow-green-600/40 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 border-2 border-white/20">
                    <i className="fa-solid fa-lock"></i> Consecrate Offering
                  </button>
                </form>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-24 text-center space-y-12 animate-in zoom-in-95 relative z-10">
                <div className="relative w-40 h-40 mx-auto">
                   <div className="absolute inset-0 border-[6px] border-slate-100 dark:border-slate-800 rounded-[3rem]"></div>
                   <div className="absolute inset-0 border-[6px] border-green-600 border-t-transparent rounded-[3rem] animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-satellite-dish text-5xl text-green-600 animate-pulse"></i>
                   </div>
                </div>
                <div className="space-y-4">
                   <h3 className="text-4xl font-black font-serif dark:text-white tracking-tight">Transmission...</h3>
                   <p className="text-slate-400 text-lg font-medium max-w-[300px] mx-auto italic leading-relaxed">Validating your sacrifice with the sacred M-Pesa network. Enter PIN on your mobile.</p>
                </div>
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">
                   <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                   Syncing Sanctuary
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-24 text-center space-y-12 animate-in scale-in relative z-10">
                <div className="w-40 h-40 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-[3rem] mx-auto flex items-center justify-center text-white text-7xl shadow-2xl shadow-green-600/50 animate-float border-4 border-white/30">
                   <i className="fa-solid fa-check"></i>
                </div>
                <div className="space-y-4">
                   <h3 className="text-5xl font-black font-serif dark:text-white tracking-tighter text-glow">Blessings!</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-xl font-medium italic">Your vocational offering is recorded in the heavenly registry.</p>
                </div>
                <div className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] bg-blue-50 dark:bg-blue-900/30 py-3 px-8 rounded-full inline-block">
                   KES {payAmount} Validated
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Establish Mission Modal */}
      {isAddingMission && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-8 md:p-16 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 border border-white/10">
            <button onClick={() => setIsAddingMission(false)} className="absolute top-6 right-6 md:top-12 md:right-12 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:scale-110 hover:rotate-90 active:scale-95 transition-all shadow-lg z-20"><i className="fa-solid fa-xmark text-lg md:text-xl"></i></button>
            
            <div className="space-y-10 relative z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-xl shadow-blue-600/20">
                  <i className="fa-solid fa-plus"></i>
                </div>
                <h3 className="text-3xl font-black font-serif dark:text-white tracking-tight">Establish Mission</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Create a new fundraising goal for the community</p>
              </div>

              <form onSubmit={handleAddMission} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mission Title</label>
                  <input 
                    type="text" required placeholder="e.g. Annual Retreat 2026"
                    className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    value={newMission.title} onChange={e => setNewMission({...newMission, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Description</label>
                  <textarea 
                    required placeholder="The purpose of this mission..."
                    className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all min-h-[120px]"
                    value={newMission.description} onChange={e => setNewMission({...newMission, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</label>
                    <select 
                      className="w-full px-6 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                      value={newMission.category} onChange={e => setNewMission({...newMission, category: e.target.value as any})}
                    >
                      <option value="Tithes">Tithes</option>
                      <option value="Events">Events</option>
                      <option value="Charity">Charity</option>
                      <option value="Projects">Projects</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target (KES)</label>
                    <input 
                      type="number" required placeholder="0"
                      className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      value={newMission.targetAmount} onChange={e => setNewMission({...newMission, targetAmount: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                  Launch Mission
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
