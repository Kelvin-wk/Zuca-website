import { User, ChatMessage, UpdatePost, PrayerPetition, ChoirMaterial, PaymentRecord, PaymentCollection, DailyContent, UpdateComment } from '../types';

const KEYS = {
  USERS: 'zuca_all_users',
  CHAT: 'zuca_chat_history',
  UPDATES: 'zuca_updates',
  PETITIONS: 'zuca_petitions',
  CHOIR: 'zuca_choir_materials',
  CURRENT_USER: 'zuca_user',
  PAYMENTS: 'zuca_payment_history',
  COLLECTIONS: 'zuca_payment_collections',
  DAILY_CONTENT: 'zuca_daily_content'
};

const get = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const set = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('storage_sync'));
};

export const storageService = {
  // --- USER MANAGEMENT ---
  getUsers: (): User[] => get(KEYS.USERS, []),
  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx > -1) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    set(KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = storageService.getUsers().filter(u => u.id !== id);
    set(KEYS.USERS, users);
  },
  
  // --- DAILY CONTENT ---
  getDailyContent: (): DailyContent | null => get(KEYS.DAILY_CONTENT, null),
  setDailyContent: (content: DailyContent) => set(KEYS.DAILY_CONTENT, content),

  // --- CHAT ---
  getChat: (): ChatMessage[] => get(KEYS.CHAT, []),
  addChatMessage: (msg: ChatMessage) => {
    const history = storageService.getChat();
    set(KEYS.CHAT, [...history, msg]);
  },
  syncChat: (history: ChatMessage[]) => {
    set(KEYS.CHAT, history);
  },
  deleteChatMessage: (id: string) => {
    const history = storageService.getChat().filter(m => m.id !== id);
    set(KEYS.CHAT, history);
  },

  // --- UPDATES ---
  getUpdates: (): UpdatePost[] => get(KEYS.UPDATES, []),
  addUpdate: (post: UpdatePost) => {
    const updates = [post, ...storageService.getUpdates()];
    set(KEYS.UPDATES, updates);
  },
  syncUpdates: (updates: UpdatePost[]) => {
    set(KEYS.UPDATES, updates);
  },
  deleteUpdate: (id: string) => {
    const updates = storageService.getUpdates().filter(u => u.id !== id);
    set(KEYS.UPDATES, updates);
  },
  registerForEvent: (updateId: string, userId: string) => {
    const updates = storageService.getUpdates().map(u => {
      if (u.id === updateId) {
        const registrations = u.registrations || [];
        if (registrations.includes(userId)) {
          return { ...u, registrations: registrations.filter(id => id !== userId) };
        }
        return { ...u, registrations: [...registrations, userId] };
      }
      return u;
    });
    set(KEYS.UPDATES, updates);
  },
  addUpdateComment: (updateId: string, comment: UpdateComment) => {
    const updates = storageService.getUpdates().map(u => {
      if (u.id === updateId) {
        const comments = u.comments || [];
        return { ...u, comments: [...comments, comment] };
      }
      return u;
    });
    set(KEYS.UPDATES, updates);
  },

  // --- PETITIONS ---
  getPetitions: (): PrayerPetition[] => get(KEYS.PETITIONS, []),
  addPetition: (petition: PrayerPetition) => {
    const petitions = [petition, ...storageService.getPetitions()];
    set(KEYS.PETITIONS, petitions);
  },
  syncPetitions: (petitions: PrayerPetition[]) => {
    set(KEYS.PETITIONS, petitions);
  },
  deletePetition: (id: string) => {
    const petitions = storageService.getPetitions().filter(p => p.id !== id);
    set(KEYS.PETITIONS, petitions);
  },
  likePetition: (id: string) => {
    const petitions = storageService.getPetitions().map(p => 
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    set(KEYS.PETITIONS, petitions);
  },

  // --- CHOIR ---
  getChoir: (): ChoirMaterial[] => get(KEYS.CHOIR, []),
  addChoirMaterial: (item: ChoirMaterial) => {
    const choir = [item, ...storageService.getChoir()];
    set(KEYS.CHOIR, choir);
  },
  syncChoir: (materials: ChoirMaterial[]) => {
    set(KEYS.CHOIR, materials);
  },
  deleteChoirMaterial: (id: string) => {
    const choir = storageService.getChoir().filter(c => c.id !== id);
    set(KEYS.CHOIR, choir);
  },

  // --- PAYMENTS ---
  getPayments: (): PaymentRecord[] => get(KEYS.PAYMENTS, []),
  getCollections: (): PaymentCollection[] => get(KEYS.COLLECTIONS, []),
  addCollection: (col: PaymentCollection) => {
    const collections = [col, ...storageService.getCollections()];
    set(KEYS.COLLECTIONS, collections);
  },
  deleteCollection: (id: string) => {
    const collections = storageService.getCollections().filter(c => c.id !== id);
    set(KEYS.COLLECTIONS, collections);
  },
  getGallery: (): any[] => get('zuca_gallery', []),
  saveGallery: (items: any[]) => set('zuca_gallery', items),
  addPayment: (record: PaymentRecord) => {
    const history = [record, ...storageService.getPayments()];
    set(KEYS.PAYMENTS, history);

    const collections = storageService.getCollections().map(c => 
      c.id === record.collectionId ? { ...c, currentAmount: c.currentAmount + record.amount } : c
    );
    set(KEYS.COLLECTIONS, collections);
  }
};