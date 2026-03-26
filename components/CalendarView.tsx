import React, { useState } from 'react';
import { UpdatePost } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  updates: UpdatePost[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ updates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const events = updates.filter(u => u.category === 'Event');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 aura-card text-left">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="font-serif text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
            {monthName} <span className="text-blue-600 italic">{year}</span>
          </h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Sacred Event Schedule</p>
        </div>
        <div className="flex gap-3">
          <button onClick={prevMonth} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button onClick={nextMonth} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-8">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square"></div>;
          
          const dayEvents = getEventsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selectedDate?.toDateString() === date.toDateString();

          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`aspect-square rounded-3xl p-4 flex flex-col items-center justify-between transition-all relative group border-2 ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105 z-10' 
                  : isToday 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <span className={`text-lg font-black tracking-tighter ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                {date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-1">
                  {dayEvents.slice(0, 3).map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600 animate-pulse'}`}></div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                Events for <span className="text-slate-800 dark:text-white">{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
              </h4>
              <button onClick={() => setSelectedDate(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear Selection</button>
            </div>
            
            <div className="space-y-4">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-calendar-check"></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white text-lg tracking-tight">{event.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sacred Gathering • {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1.5 bg-blue-600/10 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">View Details</span>
                      <i className="fa-solid fa-chevron-right text-slate-300"></i>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <i className="fa-solid fa-calendar-xmark text-4xl text-slate-200 mb-4"></i>
                  <p className="text-slate-400 text-xs italic font-medium">No events scheduled for this day.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
