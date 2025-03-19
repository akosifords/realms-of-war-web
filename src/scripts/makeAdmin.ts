// Script to make a user an admin
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide a user email as an argument. Example: ts-node src/scripts/makeAdmin.ts user@example.com');
  process.exit(1);
}

const makeUserAdmin = async (email: string) => {
  try {
    console.log(`Searching for user with email: ${email}`);
    
    // Find the user document by email
    const usersCollectionRef = collection(db, 'users');
    const userQuery = query(usersCollectionRef, where('email', '==', email));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // Update the user document to add admin flag
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: true
    });
    
    console.log(`User ${email} (ID: ${userId}) is now an admin!`);
  } catch (error) {
    console.error('Error making user an admin:', error);
    process.exit(1);
  }
};

makeUserAdmin(userEmail); 