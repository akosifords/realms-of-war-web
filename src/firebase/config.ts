import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-tUZqPFnn_5D3m0sA29lYkevrjCPuYfU",
  authDomain: "realms-of-war-aaa1a.firebaseapp.com",
  databaseURL: "https://realms-of-war-aaa1a-default-rtdb.firebaseio.com",
  projectId: "realms-of-war-aaa1a",
  storageBucket: "realms-of-war-aaa1a.firebasestorage.app",
  messagingSenderId: "483077101503",
  appId: "1:483077101503:web:ecabb4ee6e311b8905f30a",
  measurementId: "G-NX2K9YMCZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseConfig }; 