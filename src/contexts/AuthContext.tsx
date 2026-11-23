import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  extractAuthErrorCode,
  googleProvider,
  handleFirestoreError,
  isPermissionDeniedError,
  mapAuthErrorDetails,
  OperationType,
  type AuthErrorDetail,
} from '../lib/firebase';
import { hapusSemuaDataFirestorePengguna } from '../lib/accountData';
import {
  getUpgradeBannerStorageKey,
  isAdminEmail,
  resolveEffectivePlan,
  type EffectivePlanStatus,
} from '../lib/planLogic';
import {
  FIELD_LIMITS,
  PERSETUJUAN_VERSI_SAAT_INI,
  type OnboardingPayload,
  type UserProfile,
} from '../types/user';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  planStatus: EffectivePlanStatus;
  isAdmin: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  isOffline: boolean;
  authRedirectError: AuthErrorDetail | null;
  clearAuthRedirectError: () => void;
  masukDenganGoogle: () => Promise<{ error: AuthErrorDetail | null }>;
  keluar: () => Promise<void>;
  simpanPersetujuan: () => Promise<void>;
  simpanOnboarding: (payload: OnboardingPayload) => Promise<void>;
  perbaruiProfil: (payload: OnboardingPayload) => Promise<void>;
  hapusAkunPermanen: () => Promise<{ error: AuthErrorDetail | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [authRedirectError, setAuthRedirectError] = useState<AuthErrorDetail | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      setAuthRedirectError(mapAuthErrorDetails(error));
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
      } else {
        setAuthRedirectError(null);
        setProfileLoading(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const userDocPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.data() as UserProfile;
          setProfile({
            ...raw,
            plan: raw.plan === 'premium' ? 'premium' : 'free',
            premiumUntil: raw.premiumUntil ?? null,
            sumberPremium: raw.sumberPremium ?? null,
          });
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (error) => {
        setProfileLoading(false);
        if (isPermissionDeniedError(error)) {
          handleFirestoreError(error, OperationType.GET, userDocPath);
        }
        console.error('Gagal memuat profil pengguna:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  async function masukDenganGoogle(): Promise<{ error: AuthErrorDetail | null }> {
    setAuthRedirectError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return { error: null };
    } catch (error) {
      const code = extractAuthErrorCode(error);
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { error: null };
        } catch (redirectError) {
          return { error: mapAuthErrorDetails(redirectError) };
        }
      }
      return { error: mapAuthErrorDetails(error) };
    }
  }

  async function keluar(): Promise<void> {
    await signOut(auth);
    setProfile(null);
  }

  async function simpanPersetujuan(): Promise<void> {
    if (!firebaseUser) {
      throw new Error('Sesi masuk tidak ditemukan.');
    }

    const userDocPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const persetujuanAt = new Date().toISOString();

    try {
      if (!profile) {
        const initialProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: sanitizeString(firebaseUser.email || '', FIELD_LIMITS.email),
          namaLengkap: sanitizeString(firebaseUser.displayName || '', FIELD_LIMITS.namaLengkap),
          universitas: '',
          fakultas: '',
          prodi: '',
          semester: '',
          judulSkripsi: '',
          jenisPenelitian: '',
          dosenPembimbing1: '',
          dosenPembimbing2: '',
          targetSidang: '',
          plan: 'free',
          premiumUntil: null,
          sumberPremium: null,
          persetujuanVersi: PERSETUJUAN_VERSI_SAAT_INI,
          persetujuanAt,
          onboardingSelesai: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, initialProfile);
      } else {
        await updateDoc(userRef, {
          persetujuanVersi: PERSETUJUAN_VERSI_SAAT_INI,
          persetujuanAt,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, userDocPath);
      }
      throw error;
    }
  }

  async function simpanOnboarding(payload: OnboardingPayload): Promise<void> {
    if (!firebaseUser) {
      throw new Error('Sesi masuk tidak ditemukan.');
    }

    const userDocPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    const updateData = {
      namaLengkap: sanitizeString(payload.namaLengkap, FIELD_LIMITS.namaLengkap),
      universitas: sanitizeString(payload.universitas, FIELD_LIMITS.universitas),
      fakultas: sanitizeString(payload.fakultas, FIELD_LIMITS.fakultas),
      prodi: sanitizeString(payload.prodi, FIELD_LIMITS.prodi),
      semester: sanitizeString(payload.semester, FIELD_LIMITS.semester),
      judulSkripsi: sanitizeString(payload.judulSkripsi, FIELD_LIMITS.judulSkripsi),
      jenisPenelitian: payload.jenisPenelitian,
      dosenPembimbing1: sanitizeString(payload.dosenPembimbing1, FIELD_LIMITS.dosenPembimbing1),
      dosenPembimbing2: sanitizeString(payload.dosenPembimbing2, FIELD_LIMITS.dosenPembimbing2),
      targetSidang: sanitizeString(payload.targetSidang, FIELD_LIMITS.targetSidang),
      onboardingSelesai: true,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(userRef, updateData);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
      throw error;
    }
  }

  async function perbaruiProfil(payload: OnboardingPayload): Promise<void> {
    return simpanOnboarding(payload);
  }

  async function hapusAkunPermanen(): Promise<{ error: AuthErrorDetail | null }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { error: { message: 'Sesi masuk tidak ditemukan. Silakan masuk ulang.', code: 'auth/no-current-user' } };
    }

    try {
      await reauthenticateWithPopup(currentUser, googleProvider);
    } catch (error) {
      return { error: mapAuthErrorDetails(error) };
    }

    const uid = currentUser.uid;
    await hapusSemuaDataFirestorePengguna(uid);
    await deleteUser(currentUser);

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(`lulusin_tutup_lengkapi_${uid}`);
      window.localStorage.removeItem(`lulusin_tur_beranda_${uid}`);
      window.localStorage.removeItem(getUpgradeBannerStorageKey(uid));
    }
    setProfile(null);
    return { error: null };
  }

  const planStatus = useMemo(() => resolveEffectivePlan(profile), [profile]);
  const isAdmin = Boolean(firebaseUser?.emailVerified && isAdminEmail(firebaseUser.email));

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        planStatus,
        isAdmin,
        authLoading,
        profileLoading,
        isOffline,
        authRedirectError,
        clearAuthRedirectError: () => setAuthRedirectError(null),
        masukDenganGoogle,
        keluar,
        simpanPersetujuan,
        simpanOnboarding,
        perbaruiProfil,
        hapusAkunPermanen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  }
  return ctx;
}
