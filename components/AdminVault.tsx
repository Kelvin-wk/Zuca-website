import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, DailyContent } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { firebaseService } from '../services/firebaseService';
import ConfirmationModal from './ConfirmationModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminVaultProps {
  user: User;
}

const AdminVault: React.FC<AdminVaultProps> = ({ user }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'mosaic' | 'logs' | 'stats'>('mosaic');
  const [logs, setLogs] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  const canAccessStats = user.role === UserRole.TRAINER || (user.role !== UserRole.STUDENT && user.role !== UserRole.NON_STUDENT && user.role !== UserRole.GUEST);

  const refreshData = async () => {
    const data = await firebaseService.getAllUsers() as User[] || [];
    setMembers(data);
    
    const adminLogs = JSON.parse(localStorage.getItem('zuca_admin_logs') || '[]');
    
    const activityLogs = [
      ...adminLogs,
      ...data.map(m => ({ type: 'LOGIN', name: m.name, role: m.role, time: m.joinedAt })),
      ...storageService.getPayments().map(p => ({ 
        type: 'PAYMENT', 
        name: p.userName || 'Unknown', 
        amount: p.amount, 
        mission: p.collectionTitle,
        time: new Date(p.timestamp).toISOString()
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    setLogs(activityLogs);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('storage_sync', refreshData);
    return () => window.removeEventListener('storage_sync', refreshData);
  }, []);

  const handleToggleVerification = async (targetUser: User) => {
    const updatedUser = { ...targetUser, isVerified: !targetUser.isVerified };
    await firebaseService.saveUser(updatedUser);
    storageService.saveUser(updatedUser);
    
    // Log the administrative action
    const logEntry = {
      type: 'ADMIN_ACTION',
      name: user.name,
      action: `${updatedUser.isVerified ? 'Verified' : 'Unverified'} member: ${targetUser.name}`,
      time: new Date().toISOString()
    };
    
    const currentLogs = JSON.parse(localStorage.getItem('zuca_admin_logs') || '[]');
    localStorage.setItem('zuca_admin_logs', JSON.stringify([logEntry, ...currentLogs].slice(0, 100)));
    
    refreshData();
  };

  const handleDeleteMember = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await firebaseService.deleteUser(deleteConfirm.id);
      storageService.deleteUser(deleteConfirm.id);
      
      // Log the administrative action
      const logEntry = {
        type: 'ADMIN_ACTION',
        name: user.name,
        action: `Deleted member: ${deleteConfirm.name}`,
        time: new Date().toISOString()
      };
      
      const currentLogs = JSON.parse(localStorage.getItem('zuca_admin_logs') || '[]');
      localStorage.setItem('zuca_admin_logs', JSON.stringify([logEntry, ...currentLogs].slice(0, 100)));
      
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      refreshData();
    }
  };

  const handleExportFellowship = () => {
    setIsExporting(true);
    const csvContent = syncService.generateMemberCSV(members);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZUCA_Community_Fellowship_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setTimeout(() => setIsExporting(false), 1000);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.studentId && m.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: members.length,
    verified: members.filter(m => m.isVerified).length,
    leaders: members.filter(m => m.role !== UserRole.STUDENT && m.role !== UserRole.NON_STUDENT && m.role !== UserRole.GUEST).length,
    totalPoints: members.reduce((acc, curr) => acc + curr.points, 0)
  };

  const roleData = Object.values(UserRole).map(role => ({
    name: role,
    count: members.filter(m => m.role === role).length
  })).filter(d => d.count > 0);

  const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getRoleBadgeConfig = (role: string) => {
    if (role === UserRole.STUDENT) return { color: 'bg-blue-600', icon: 'fa-user-graduate', label: 'Scholar' };
    if (role === UserRole.NON_STUDENT) return { color: 'bg-indigo-600', icon: 'fa-user', label: 'Patron' };
    if (role === UserRole.TRAINER) return { color: 'bg-emerald-600', icon: 'fa-user-shield', label: 'Trainer' };
    return { color: 'bg-amber-500', icon: 'fa-crown', label: role || 'Leader' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Remove Member"
        message={`Are you sure you want to remove ${deleteConfirm.name} from the fellowship? This action is irreversible.`}
        confirmLabel="Erase Member"
      />
      <div className="relative p-12 md:p-20 rounded-[4rem] bg-slate-900 text-white overflow-hidden shadow-2xl border border-white/5 text-left">
        <div className="absolute inset-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1548625313-039e44749549?q=80&w=1200" className="w-full h-full object-cover blur-[1px]" alt="" />
           <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-blue-900/30"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
             <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8">
                Apostolic Console
             </div>
             <h2 className="text-6xl md:text-8xl font-serif font-black tracking-tighter mb-6 leading-[0.85]">Fellowship <span className="text-blue-500 italic">Vault.</span></h2>
             <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md opacity-80 mb-10">Administrative oversight for the communal records and vocational contributions of Catholic Action.</p>
             <button 
               onClick={handleExportFellowship}
               disabled={isExporting}
               className="px-12 py-6 bg-white text-slate-950 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl"
             >
               {isExporting && <i className="fa-solid fa-spinner animate-spin"></i>}
               Apostolic Export
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
             <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-md text-center">
                <p className="text-5xl font-black text-white mb-2">{stats.total}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Souls</p>
             </div>
             <div className="p-10 rounded-[3rem] bg-blue-600/10 border border-blue-500/20 backdrop-blur-md text-center">
                <p className="text-5xl font-black text-blue-400 mb-2">{stats.verified}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Members</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
         <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
            {['mosaic', 'logs', 'stats'].map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab as any)}
                className={`flex-grow md:flex-initial px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab === 'mosaic' ? 'Fellowship' : tab === 'logs' ? 'Audit' : 'Insight'}
              </button>
            ))}
         </div>
         {activeTab === 'mosaic' && (
           <div className="relative w-full md:w-96 group">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"></i>
              <input 
                type="text" placeholder="Search fellowship..." 
                className="w-full pl-16 pr-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 outline-none font-black text-xs dark:text-white transition-all shadow-inner"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
         )}
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'mosaic' && (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {filteredMembers.map((member) => {
                  const badge = getRoleBadgeConfig(member.role);
                  return (
                    <div key={member.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden aura-card flex flex-col items-center text-center">
                      <div className={`absolute top-0 right-0 w-2 h-full transition-all duration-700 ${member.isVerified ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                      
                      <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2 font-serif tracking-tight flex items-center gap-2">
                        {member.name}
                      </h4>
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${badge.color} bg-opacity-10 mb-8`}>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${badge.color.replace('bg-', 'text-')}`}>{badge.label}</span>
                      </div>

                      <div className="w-full pt-8 border-t border-slate-50 dark:border-slate-800 mt-auto flex flex-col gap-3">
                         <div className="flex justify-between items-center px-2 mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apostolic Rank</span>
                            <span className="text-sm font-black dark:text-white">{member.points} pts</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleToggleVerification(member)}
                              className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${member.isVerified ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'}`}
                            >
                              {member.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button 
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="py-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                              Erase
                            </button>
                         </div>
                      </div>
                    </div>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest">No members found in the registry.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar for Active Members / Stats to fill space */}
            <div className="w-full lg:w-80 shrink-0 space-y-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Active Fellowship</h4>
                <div className="space-y-6">
                  {members.slice(0, 5).map((m, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate">{m.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Now</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600 p-8 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-4">Apostolic Goal</h4>
                  <p className="text-2xl font-black tracking-tighter mb-6">1,000 Souls for Christ</p>
                  <div className="h-2 w-full bg-blue-900/30 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (members.length / 1000) * 100)}%` }}></div>
                  </div>
                  <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">{Math.min(100, Math.round((members.length / 1000) * 100))}% Progress ({members.length} members)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-950 rounded-[4rem] p-12 shadow-2xl border border-white/5 overflow-hidden text-left">
             <div className="font-mono text-[11px] space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-6">
                {logs.length > 0 ? logs.map((log, i) => {
                  const isPayment = log.type === 'PAYMENT';
                  const isAdmin = log.type === 'ADMIN_ACTION';
                  const isLogin = log.type === 'LOGIN';
                  
                  let color = 'emerald';
                  if (isPayment) color = 'blue';
                  if (isAdmin) color = 'amber';
                  
                  return (
                    <div key={i} className={`flex flex-col md:flex-row gap-4 p-6 rounded-[1.75rem] transition-all border-l-4 animate-in slide-in-from-left-4 duration-500 bg-${color}-600/5 border-${color}-500`} style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-center gap-4 shrink-0">
                         <span className="text-slate-600">[{new Date(log.time).toLocaleTimeString()}]</span>
                         <span className={`text-${color}-500 font-black uppercase tracking-widest`}>{log.type}</span>
                      </div>
                      <div className="flex-grow">
                         <span className="text-white font-black mr-2">{log.name}</span>
                         <span className="text-slate-400">
                           {isPayment && `sacrificed KES ${log.amount} for the mission "${log.mission}"`}
                           {isAdmin && log.action}
                           {isLogin && `accessed the portal via ${log.role} credentials`}
                         </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-32 text-center text-slate-700 uppercase font-black tracking-[0.5em]">No communal logs recorded.</div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'stats' && canAccessStats && (
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 border border-slate-100 dark:border-slate-800 shadow-2xl max-w-5xl mx-auto animate-scale-in">
             <div className="text-center mb-16">
               <h3 className="text-5xl font-black font-serif dark:text-white tracking-tight">Growth Insight</h3>
               <p className="text-slate-500 text-sm font-black uppercase tracking-[0.3em] mt-3">Sanctified Data Visualization</p>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                     { label: 'Scholarship', count: members.filter(m => m.role === UserRole.STUDENT).length, color: 'bg-blue-600', total: stats.total },
                     { label: 'Patronage', count: members.filter(m => m.role === UserRole.NON_STUDENT).length, color: 'bg-indigo-600', total: stats.total },
                     { label: 'Authorized Leads', count: stats.leaders, color: 'bg-amber-500', total: stats.total },
                     { label: 'Total Souls', count: stats.total, color: 'bg-emerald-500', total: stats.total }
                   ].map((item, i) => {
                     const perc = item.total > 0 ? (item.count / item.total) * 100 : 0;
                     return (
                       <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                          <p className="text-3xl font-black dark:text-white mb-1">{item.count}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{item.label}</p>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${perc}%` }}></div>
                          </div>
                       </div>
                     );
                   })}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 h-[400px]">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Apostolic Distribution</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleData}>
                         <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                            interval={0}
                         />
                         <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ 
                               backgroundColor: '#0f172a', 
                               border: 'none', 
                               borderRadius: '1rem', 
                               fontSize: '10px',
                               color: '#fff'
                            }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                         />
                         <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                            {roleData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVault;