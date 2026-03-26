import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "../firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    hasCurrentUser: boolean;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      hasCurrentUser: !!auth.currentUser,
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Health check
async function testConnection(retryCount = 0) {
  try {
    console.log(`[Firebase] Testing connection to Firestore (Attempt ${retryCount + 1})...`);
    const testRef = doc(db, 'test', 'connection');
    const getPromise = getDocFromServer(testRef);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection test timed out after 10s.")), 10000)
    );
    
    await Promise.race([getPromise, timeoutPromise]);
    console.log("[Firebase] Firestore connection successful.");
  } catch (error: any) {
    if (error.message?.includes('timed out') && retryCount < 1) {
      console.warn("[Firebase] Connection test timed out. Retrying in 3 seconds...");
      setTimeout(() => testConnection(retryCount + 1), 3000);
      return;
    }
    
    if (error.message?.includes('timed out')) {
      console.warn("[Firebase] Connection test timed out after retries. This might be due to a slow network. The app will continue to attempt connection in the background.");
    } else if(error.message?.includes('the client is offline')) {
      console.error("Firebase Connection Error: The client is offline. This usually means the Project ID or Database ID in firebase-applet-config.json is incorrect, or Firestore is not enabled for this project.");
    } else {
      console.error("Firebase Connection Error:", error.message || error);
    }
  }
}
testConnection();

export const firebaseService = {
  // --- CHAT ---
  subscribeToChat: (callback: (messages: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const chatRef = collection(db, 'chat');
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat');
    });
  },
  sendMessage: async (msg: any) => {
    try {
      const chatRef = collection(db, 'chat');
      const msgId = msg.id || Math.random().toString(36).substr(2, 9);
      await setDoc(doc(chatRef, msgId), { 
        ...msg, 
        id: msgId,
        timestamp: Date.now(), 
        serverTimestamp: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat');
    }
  },
  deleteMessage: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'chat', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chat/${id}`);
    }
  },
  clearChat: async () => {
    try {
      const chatRef = collection(db, 'chat');
      const snapshot = await getDocs(chatRef);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chat');
    }
  },
  amenMessage: async (id: string) => {
    try {
      const chatRef = doc(db, 'chat', id);
      const snap = await getDoc(chatRef);
      if (snap.exists()) {
        const currentAmens = snap.data().amens || 0;
        await updateDoc(chatRef, { amens: currentAmens + 1 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chat/${id}`);
    }
  },

  // --- UPDATES ---
  subscribeToUpdates: (callback: (updates: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const updatesRef = collection(db, 'updates');
    const q = query(updatesRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'updates');
    });
  },
  addUpdate: async (update: any) => {
    try {
      const updatesRef = doc(db, 'updates', update.id);
      await setDoc(updatesRef, { ...update, timestamp: Date.now(), serverTimestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `updates/${update.id}`);
    }
  },
  updateUpdate: async (update: any) => {
    try {
      const updatesRef = doc(db, 'updates', update.id);
      await updateDoc(updatesRef, { ...update, updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `updates/${update.id}`);
    }
  },
  deleteUpdate: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'updates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `updates/${id}`);
    }
  },

  // --- PETITIONS ---
  subscribeToPetitions: (callback: (petitions: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const petitionsRef = collection(db, 'petitions');
    const q = query(petitionsRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'petitions');
    });
  },
  addPetition: async (petition: any) => {
    try {
      const petitionsRef = doc(db, 'petitions', petition.id);
      await setDoc(petitionsRef, { ...petition, timestamp: Date.now(), serverTimestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `petitions/${petition.id}`);
    }
  },
  updatePetition: async (petition: any) => {
    try {
      const petitionsRef = doc(db, 'petitions', petition.id);
      await updateDoc(petitionsRef, { ...petition, updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `petitions/${petition.id}`);
    }
  },
  likePetition: async (id: string) => {
    try {
      const petitionRef = doc(db, 'petitions', id);
      const snap = await getDoc(petitionRef);
      if (snap.exists()) {
        const currentLikes = snap.data().likes || 0;
        await updateDoc(petitionRef, { likes: currentLikes + 1 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `petitions/${id}`);
    }
  },
  deletePetition: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'petitions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `petitions/${id}`);
    }
  },

  // --- USERS ---
  saveUser: async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.id);
      // Add a 20-second timeout to the Firestore operation
      const savePromise = setDoc(userRef, { ...user, lastSeen: serverTimestamp() }, { merge: true });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Fellowship connection timed out. Please check your internet or Firebase console.")), 20000)
      );
      
      await Promise.race([savePromise, timeoutPromise]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  },
  getUser: async (id: string) => {
    try {
      const userRef = doc(db, 'users', id);
      const getPromise = getDoc(userRef);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("User data retrieval timed out. The server might be unreachable.")), 15000)
      );
      
      const snap = await Promise.race([getPromise, timeoutPromise]) as any;
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${id}`);
    }
  },
  subscribeToUser: (id: string, callback: (user: any) => void) => {
    if (!auth.currentUser) return () => {};
    const userRef = doc(db, 'users', id);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${id}`);
    });
  },
  getAllUsers: async () => {
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },
  subscribeToAllUsers: (callback: (users: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const usersRef = collection(db, 'users');
    return onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  },

  // --- DAILY CONTENT ---
  getDailyContent: async () => {
    try {
      const dailyRef = doc(db, 'daily', 'current');
      const snap = await getDoc(dailyRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'daily/current');
    }
  },
  setDailyContent: async (content: any) => {
    try {
      const dailyRef = doc(db, 'daily', 'current');
      await setDoc(dailyRef, { ...content, updatedAt: Date.now(), serverTimestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'daily/current');
    }
  },
  subscribeToDailyContent: (callback: (content: any) => void) => {
    const dailyRef = doc(db, 'daily', 'current');
    return onSnapshot(dailyRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'daily/current');
    });
  },

  // --- ADMIN ---
  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      // Also delete presence if it exists
      await deleteDoc(doc(db, 'presence', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },

  // --- PRESENCE ---
  updatePresence: async (user: any) => {
    if (!auth.currentUser || auth.currentUser.uid !== user.id) return;
    try {
      const presenceRef = doc(db, 'presence', user.id);
      await setDoc(presenceRef, {
        id: user.id,
        name: user.name,
        profilePic: user.profilePic,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      // Silent fail for presence
      console.warn("Presence update failed:", error);
    }
  },
  subscribeToPresence: (callback: (users: any[]) => void) => {
    if (!auth.currentUser) {
      console.warn("Attempted to subscribe to presence without authenticated user.");
      return () => {};
    }
    const presenceRef = collection(db, 'presence');
    return onSnapshot(presenceRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(users);
    }, (error) => {
      // Only report if we still have a user
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'presence');
      }
    });
  },

  // --- INTERACTIONS ---
  registerForEvent: async (updateId: string, userId: string) => {
    try {
      const updateRef = doc(db, 'updates', updateId);
      const snap = await getDoc(updateRef);
      if (snap.exists()) {
        const registrations = snap.data().registrations || [];
        if (registrations.includes(userId)) {
          await updateDoc(updateRef, { 
            registrations: registrations.filter((id: string) => id !== userId) 
          });
        } else {
          await updateDoc(updateRef, { 
            registrations: [...registrations, userId] 
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `updates/${updateId}`);
    }
  },
  addUpdateComment: async (updateId: string, comment: any) => {
    try {
      const updateRef = doc(db, 'updates', updateId);
      const snap = await getDoc(updateRef);
      if (snap.exists()) {
        const comments = snap.data().comments || [];
        await updateDoc(updateRef, { 
          comments: [...comments, comment] 
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `updates/${updateId}`);
    }
  },

  // --- GALLERY ---
  subscribeToGallery: (callback: (items: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const galleryRef = collection(db, 'gallery');
    const q = query(galleryRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });
  },
  addGalleryItem: async (item: any) => {
    try {
      const galleryRef = doc(db, 'gallery', item.id);
      await setDoc(galleryRef, { ...item, timestamp: Date.now(), serverTimestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `gallery/${item.id}`);
    }
  },
  updateGalleryItem: async (item: any) => {
    try {
      const galleryRef = doc(db, 'gallery', item.id);
      await updateDoc(galleryRef, { ...item, updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `gallery/${item.id}`);
    }
  },
  deleteGalleryItem: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  },

  // --- CHOIR ---
  subscribeToChoir: (callback: (materials: any[]) => void) => {
    if (!auth.currentUser) return () => {};
    const choirRef = collection(db, 'choir');
    const q = query(choirRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'choir');
    });
  },
  addChoirMaterial: async (material: any) => {
    try {
      const choirRef = doc(db, 'choir', material.id);
      await setDoc(choirRef, { ...material, timestamp: Date.now(), serverTimestamp: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `choir/${material.id}`);
    }
  },
  updateChoirMaterial: async (material: any) => {
    try {
      const choirRef = doc(db, 'choir', material.id);
      await updateDoc(choirRef, { ...material, updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `choir/${material.id}`);
    }
  },
  deleteChoirMaterial: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'choir', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `choir/${id}`);
    }
  }
};
