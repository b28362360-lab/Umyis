import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signIn = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/unauthorized-domain') {
       alert(`Domain Unauthorized: Please add your app domains to the Firebase Console's "Authorized Domains" list.\n\nDomains to add:\n1. ais-dev-g5ivzdhiwmo7uq6bmbwr73-181873511000.europe-west2.run.app\n2. ais-pre-g5ivzdhiwmo7uq6bmbwr73-181873511000.europe-west2.run.app`);
    } else {
       alert(`Login Failed: ${error.message}`);
    }
    throw error;
  }
};
export const signOut = () => auth.signOut();
