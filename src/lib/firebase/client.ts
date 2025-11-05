'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Hardcoded Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCirE_T8r9KdP4S0VBu-ks1KI6ikNRyzlA",
  authDomain: "studio-2700453916-f3cc5.firebaseapp.com",
  projectId: "studio-2700453916-f3cc5",
  storageBucket: "studio-2700453916-f3cc5.appspot.com",
  messagingSenderId: "547373061001",
  appId: "1:547373061001:web:27115652eb686c7d7dc758"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
