import { User, PaymentRecord } from '../types';

/**
 * Sync Service: Handles logging member activity to external sheets/docs.
 */

const GOOGLE_SCRIPT_WEBHOOK_URL = ''; // Placeholder for user's Google Apps Script URL

export const syncService = {
  /**
   * Logs a user activity (Login or Payment) to an external registry.
   */
  logActivity: async (user: User, action: 'LOGIN' | 'PAYMENT', metadata?: any) => {
    console.log(`[SyncService] Syncing ${action} for: ${user.name}`);
    
    const payload = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || 'N/A',
      action: action,
      amount: metadata?.amount || 0,
      mission: metadata?.mission || 'N/A'
    };

    if (GOOGLE_SCRIPT_WEBHOOK_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return true;
      } catch (error) {
        console.error('[SyncService] Failed to sync:', error);
        return false;
      }
    }

    return new Promise((resolve) => setTimeout(() => resolve(true), 1200));
  },

  /**
   * Legacy wrapper for backward compatibility
   */
  logUserActivity: async (user: User) => {
    return syncService.logActivity(user, 'LOGIN');
  },

  /**
   * Generates a CSV string formatted for direct import into Google Sheets for members.
   */
  generateMemberCSV: (users: User[]): string => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Admission/Student ID', 'Points', 'Joined At'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      u.studentId || 'N/A',
      u.points,
      u.joinedAt
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  /**
   * Generates a CSV string for payment history.
   */
  generatePaymentCSV: (payments: PaymentRecord[]): string => {
    const headers = ['Record ID', 'Member Name', 'Member ID', 'Mission/Mission', 'Amount', 'Method', 'Timestamp'];
    const rows = payments.map(p => [
      p.id,
      `"${p.userName || 'Anonymous'}"`,
      p.userId,
      `"${p.collectionTitle}"`,
      p.amount,
      p.method,
      new Date(p.timestamp).toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
};