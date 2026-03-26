import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DivineGlow from './DivineGlow';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
          >
            <DivineGlow color={isDanger ? "rgba(244, 63, 94, 0.1)" : "rgba(37, 99, 235, 0.1)"} intensity="high" />
            
            <div className="relative z-10 text-center">
              <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center text-3xl mb-8 ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                <i className={`fa-solid ${isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question'}`}></i>
              </div>
              
              <h3 className="font-serif text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tighter">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium italic mb-10 leading-relaxed">
                "{message}"
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isDanger ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'}`}
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 font-black text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
