require('dotenv').config();

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};


/*try {
  const app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}*/


const app = initializeApp(firebaseConfig); //  initializes the Firebase app with the provided configuration

/*try {
  const db = getFirestore(app);
  console.log("Database initialized successfully");
} catch (error) {
  console.error("Error initializing Database:", error);
}*/

const db = getFirestore(app); // gets a reference to the Firestore database

export { db };
