// Type declarations for Firebase v9.22.0

declare module 'firebase/app' {
  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  }

  export interface FirebaseApp {
    name: string;
    options: FirebaseOptions;
    automaticDataCollectionEnabled: boolean;
  }

  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function deleteApp(app: FirebaseApp): Promise<void>;
}

declare module 'firebase/auth' {
  import { FirebaseApp } from 'firebase/app';

  export interface Auth {
    app: FirebaseApp;
    currentUser: User | null;
    languageCode: string | null;
    tenantId: string | null;
  }

  export interface User {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    isAnonymous: boolean;
    tenantId: string | null;
    providerData: any[];
  }

  export function getAuth(app?: FirebaseApp): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
  export function updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
  export function signOut(auth: Auth): Promise<void>;
}

declare module 'firebase/firestore' {
  import { FirebaseApp } from 'firebase/app';

  export interface Firestore {
    app: FirebaseApp;
    type: string;
  }

  export interface DocumentReference {
    id: string;
    path: string;
    parent: any;
  }

  export interface CollectionReference {
    id: string;
    path: string;
    parent: DocumentReference | null;
  }

  export interface QuerySnapshot {
    docs: QueryDocumentSnapshot[];
    empty: boolean;
    forEach(callback: (doc: QueryDocumentSnapshot) => void): void;
  }

  export interface DocumentSnapshot {
    id: string;
    exists(): boolean;
    data(): any;
  }

  export interface QueryDocumentSnapshot extends DocumentSnapshot {
    data(): DocumentData;
  }

  export interface DocumentData {
    [field: string]: any;
  }

  export interface Observer<T> {
    next?: (snapshot: T) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function collection(db: Firestore, path: string, ...pathSegments: string[]): CollectionReference;
  export function doc(db: Firestore, path: string, ...pathSegments: string[]): DocumentReference;
  export function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot>;
  export function setDoc(docRef: DocumentReference, data: any): Promise<void>;
  export function updateDoc(docRef: DocumentReference, data: any): Promise<void>;
  export function addDoc(collectionRef: CollectionReference, data: any): Promise<DocumentReference>;
  export function query(collectionRef: CollectionReference, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
  
  // Update onSnapshot to support error callbacks
  export function onSnapshot<T>(
    reference: any,
    observer: Observer<T> | ((snapshot: T) => void),
    onError?: (error: Error) => void
  ): () => void;
  
  export function deleteDoc(docRef: DocumentReference): Promise<void>;
  export function arrayUnion(...elements: any[]): any;
  export function serverTimestamp(): any;
  export function collection(firestore: Firestore, path: string): CollectionReference;
  export function getDocs(query: any): Promise<QuerySnapshot>;
  export function query(collectionRef: any, ...queryConstraints: any[]): any;
  export function where(field: string, operator: string, value: any): any;
  
  // Add functions for collection querying
  export function collection(firestore: any, path: string): any;
  export function getDocs(query: any): Promise<{
    empty: boolean;
    forEach: (callback: (doc: any) => void) => void;
  }>;
  export function query(collection: any, ...queryConstraints: any[]): any;
  export function where(field: string, opStr: string, value: any): any;
} 