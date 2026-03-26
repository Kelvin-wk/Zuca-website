import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from 'googleapis';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const databaseId = process.env.FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
  
  admin.initializeApp({
    projectId: projectId,
  });
  
  // If we have a service account in env, use it
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.app().delete(); // Reset
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
    }
  }
}
const db = getFirestore(admin.app(), process.env.FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId);

const setupApp = async () => {
  const PORT = 3000;

  // API Routes
  app.use(express.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google OAuth Routes
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/google/callback`
  );

  app.get('/api/auth/google/url', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      state: userId,
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.status(400).send('Missing code or state');

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in Firestore
      await db.collection('google_tokens').doc(userId as string).set({
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      });

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 1.5rem; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb;">Connection Successful!</h1>
              <p style="color: #64748b;">Your Google Calendar is now linked to ZUCA Sanctuary.</p>
              <p style="color: #94a3b8; font-size: 0.8rem;">This window will close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/calendar/events', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    try {
      const tokenDoc = await db.collection('google_tokens').doc(userId).get();
      if (!tokenDoc.exists) return res.status(404).json({ error: 'Not connected' });

      const tokens = tokenDoc.data();
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      client.setCredentials(tokens!);

      const calendar = google.calendar({ version: 'v3', auth: client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      res.json(response.data.items);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
};

setupApp();

// Export for Vercel and Firebase Functions
export default app;
export const api = functions.https.onRequest(app);
