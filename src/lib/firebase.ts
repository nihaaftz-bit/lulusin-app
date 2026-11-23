import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';
import { ID_TEXT } from '../i18n/id';

const envConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId;

export const app = initializeApp(envConfig);
export const auth = getAuth(app);
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return (
    code.includes('permission-denied') ||
    message.toLowerCase().includes('missing or insufficient permissions')
  );
}

export interface AuthErrorDetail {
  message: string;
  code: string | null;
}

export function extractAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return null;
}

export function mapAuthErrorDetails(error: unknown): AuthErrorDetail {
  const code = extractAuthErrorCode(error);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      message: ID_TEXT.login.errorOffline,
      code: code || 'offline',
    };
  }

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return { message: ID_TEXT.login.errorPopupDitutup, code };
  }
  if (code === 'auth/popup-blocked') {
    return { message: ID_TEXT.login.errorPopupDiblokir, code };
  }
  if (code === 'auth/network-request-failed') {
    return { message: ID_TEXT.login.errorOffline, code };
  }
  return { message: ID_TEXT.login.errorUmum, code };
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Koneksi ke Firestore gagal: klien sedang offline atau konfigurasi bermasalah.');
    }
  }
}

void testConnection();
