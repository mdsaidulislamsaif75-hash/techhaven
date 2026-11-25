import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import { CurrencyCode, CustomerSession, PhoneDialCode } from '../types/store';
import { clampString } from '../utils/format';

interface StoredAccountRecord {
  uid: string;
  displayName: string;
  email: string;
  phoneCode: PhoneDialCode;
  phone: string;
  password: string;
  photoURL?: string;
  preferredCurrency: CurrencyCode;
}

interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneCode?: PhoneDialCode;
  phone?: string;
  preferredCurrency: CurrencyCode;
  provider?: 'email' | 'google' | 'apple' | 'demo';
}

interface AuthContextValue {
  user: User | null;
  localSession: CustomerSession | null;
  isAuthenticated: boolean;
  profile: UserProfileDoc | null;
  authReady: boolean;
  signingIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  rememberedEmail: string;
  signUpWithEmail: (payload: {
    fullName: string;
    email: string;
    phoneCode: PhoneDialCode;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  loginWithEmail: (payload: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<boolean>;
  loginWithDemoAccount: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfileFields: (fields: {
    displayName?: string;
    phoneCode?: PhoneDialCode;
    phone?: string;
    photoURL?: string;
    preferredCurrency?: CurrencyCode;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
}

const SESSION_STORAGE_KEY = 'th_auth_session_v1';
const ACCOUNTS_STORAGE_KEY = 'th_registered_accounts_v1';
const REMEMBER_EMAIL_KEY = 'th_remembered_email_v1';
const AVATAR_OVERRIDES_KEY = 'th_user_avatar_overrides_v1';

const DEMO_ACCOUNT: StoredAccountRecord = {
  uid: 'demo_alex_reed',
  displayName: 'Alexander Reed',
  email: 'alex@techhaven.store',
  phoneCode: '+1',
  phone: '(212) 555-0194',
  password: 'Password123!',
  preferredCurrency: 'USD',
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeCurrency(val: unknown): CurrencyCode {
  if (val === 'AED' || val === 'GBP' || val === 'CAD' || val === 'USD') {
    return val;
  }
  return 'USD';
}

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage<T>(key: string, value: T | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore storage errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [localSession, setLocalSession] = useState<CustomerSession | null>(() =>
    readJsonStorage<CustomerSession | null>(SESSION_STORAGE_KEY, null)
  );
  const [firebaseProfile, setFirebaseProfile] = useState<UserProfileDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>(AVATAR_OVERRIDES_KEY, {})
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setFirebaseProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setFirebaseProfile({
            uid: firebaseUser.uid,
            displayName: String(data.displayName || firebaseUser.displayName || 'Customer'),
            email: String(data.email || firebaseUser.email || ''),
            photoURL: data.photoURL ? String(data.photoURL) : firebaseUser.photoURL ?? undefined,
            phone: data.phone ? String(data.phone) : undefined,
            preferredCurrency: normalizeCurrency(data.preferredCurrency),
            provider: 'google',
          });
        } else {
          const safeDisplayName = clampString(firebaseUser.displayName || 'TECHHAVEN Customer', 120);
          const safeEmail = clampString(firebaseUser.email || '', 160);
          const newDoc: Record<string, unknown> = {
            uid: firebaseUser.uid,
            displayName: safeDisplayName,
            email: safeEmail,
            preferredCurrency: 'USD',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (firebaseUser.photoURL) {
            newDoc.photoURL = clampString(firebaseUser.photoURL, 500);
          }

          await setDoc(userRef, newDoc);
          setFirebaseProfile({
            uid: firebaseUser.uid,
            displayName: safeDisplayName,
            email: safeEmail,
            photoURL: firebaseUser.photoURL ?? undefined,
            preferredCurrency: 'USD',
            provider: 'google',
          });
        }
      } catch (err) {
        console.error('Error syncing user profile:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signUpWithEmail = async (payload: {
    fullName: string;
    email: string;
    phoneCode: PhoneDialCode;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const accounts = readJsonStorage<StoredAccountRecord[]>(ACCOUNTS_STORAGE_KEY, []);
      if (
        normalizedEmail === DEMO_ACCOUNT.email ||
        accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail)
      ) {
        setAuthError('An account with this email already exists. Please switch to Login.');
        return false;
      }

      const uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const cleanName = clampString(payload.fullName, 120);
      const cleanPhone = clampString(payload.phone, 32);

      const newRecord: StoredAccountRecord = {
        uid,
        displayName: cleanName,
        email: normalizedEmail,
        phoneCode: payload.phoneCode,
        phone: cleanPhone,
        password: payload.password,
        preferredCurrency: 'USD',
      };

      writeJsonStorage(ACCOUNTS_STORAGE_KEY, [newRecord, ...accounts]);

      const session: CustomerSession = {
        uid,
        displayName: cleanName,
        email: normalizedEmail,
        phoneCode: payload.phoneCode,
        phone: cleanPhone,
        preferredCurrency: 'USD',
        provider: 'email',
      };
      setLocalSession(session);
      writeJsonStorage(SESSION_STORAGE_KEY, session);
      try {
        localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
        setRememberedEmail(normalizedEmail);
      } catch {
        // Ignore storage errors
      }
      return true;
    } finally {
      setSigningIn(false);
    }
  };

  const loginWithEmail = async (payload: {
    email: string;
    password: string;
    rememberMe: boolean;
  }): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const accounts = readJsonStorage<StoredAccountRecord[]>(ACCOUNTS_STORAGE_KEY, []);
      const allAccounts = [DEMO_ACCOUNT, ...accounts];
      const match = allAccounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);

      if (!match) {
        setAuthError('No account found for that email. Create an account on the Sign Up tab or use Demo Login.');
        return false;
      }

      if (match.password !== payload.password) {
        setAuthError('Incorrect password. Please try again or use Demo Account Login.');
        return false;
      }

      const savedAvatar = avatarOverrides[match.uid] || match.photoURL;
      const session: CustomerSession = {
        uid: match.uid,
        displayName: match.displayName,
        email: match.email,
        phoneCode: match.phoneCode,
        phone: match.phone,
        photoURL: savedAvatar === '__initials__' ? undefined : savedAvatar,
        preferredCurrency: match.preferredCurrency,
        provider: match.uid === DEMO_ACCOUNT.uid ? 'demo' : 'email',
      };
      setLocalSession(session);
      writeJsonStorage(SESSION_STORAGE_KEY, session);

      try {
        if (payload.rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
          setRememberedEmail(normalizedEmail);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
          setRememberedEmail('');
        }
      } catch {
        // Ignore storage errors
      }

      return true;
    } finally {
      setSigningIn(false);
    }
  };

  const loginWithDemoAccount = async (): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const savedAvatar = avatarOverrides[DEMO_ACCOUNT.uid];
      const session: CustomerSession = {
        uid: DEMO_ACCOUNT.uid,
        displayName: DEMO_ACCOUNT.displayName,
        email: DEMO_ACCOUNT.email,
        phoneCode: DEMO_ACCOUNT.phoneCode,
        phone: DEMO_ACCOUNT.phone,
        photoURL: savedAvatar === '__initials__' ? undefined : savedAvatar,
        preferredCurrency: DEMO_ACCOUNT.preferredCurrency,
        provider: 'demo',
      };
      setLocalSession(session);
      writeJsonStorage(SESSION_STORAGE_KEY, session);
      try {
        localStorage.setItem(REMEMBER_EMAIL_KEY, DEMO_ACCOUNT.email);
        setRememberedEmail(DEMO_ACCOUNT.email);
      } catch {
        // Ignore storage errors
      }
      return true;
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithApple = async (): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const savedAvatar = avatarOverrides['apple_jordan_mercer'];
      const session: CustomerSession = {
        uid: 'apple_jordan_mercer',
        displayName: 'Jordan Mercer',
        email: 'jordan.mercer@icloud.com',
        phoneCode: '+1',
        phone: '(415) 555-0182',
        photoURL: savedAvatar === '__initials__' ? undefined : savedAvatar,
        preferredCurrency: 'USD',
        provider: 'apple',
      };
      setLocalSession(session);
      writeJsonStorage(SESSION_STORAGE_KEY, session);
      return true;
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setLocalSession(null);
      writeJsonStorage(SESSION_STORAGE_KEY, null);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.replace('Firebase: ', '')
          : 'Google Sign-In could not be completed.';
      setAuthError(msg);
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async (): Promise<void> => {
    if (user) {
      await firebaseSignOut(auth);
      setFirebaseProfile(null);
    }
    setLocalSession(null);
    writeJsonStorage(SESSION_STORAGE_KEY, null);
  };

  const updateProfileFields = async (fields: {
    displayName?: string;
    phoneCode?: PhoneDialCode;
    phone?: string;
    photoURL?: string;
    preferredCurrency?: CurrencyCode;
  }): Promise<void> => {
    const activeUid = user?.uid || localSession?.uid;

    if (activeUid && fields.photoURL !== undefined) {
      const nextOverride = fields.photoURL ? fields.photoURL : '__initials__';
      setAvatarOverrides((prev) => {
        const next = { ...prev, [activeUid]: nextOverride };
        writeJsonStorage(AVATAR_OVERRIDES_KEY, next);
        return next;
      });
    }

    if (user) {
      const path = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);
      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      let hasFirestoreFields = false;

      if (fields.displayName !== undefined) {
        updates.displayName = clampString(fields.displayName || 'Customer', 120);
        hasFirestoreFields = true;
      }
      if (fields.phone !== undefined) {
        updates.phone = clampString(fields.phone, 32);
        hasFirestoreFields = true;
      }
      if (fields.preferredCurrency !== undefined) {
        updates.preferredCurrency = fields.preferredCurrency;
        hasFirestoreFields = true;
      }
      if (fields.photoURL !== undefined && fields.photoURL.startsWith('https://') && fields.photoURL.length <= 500) {
        updates.photoURL = fields.photoURL;
        hasFirestoreFields = true;
      }

      if (hasFirestoreFields) {
        try {
          await updateDoc(userRef, updates);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }

      setFirebaseProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName:
                fields.displayName !== undefined
                  ? clampString(fields.displayName || 'Customer', 120)
                  : prev.displayName,
              phoneCode: fields.phoneCode ?? prev.phoneCode,
              phone: fields.phone !== undefined ? clampString(fields.phone, 32) : prev.phone,
              photoURL:
                fields.photoURL !== undefined
                  ? fields.photoURL || undefined
                  : prev.photoURL,
              preferredCurrency: fields.preferredCurrency ?? prev.preferredCurrency,
            }
          : prev
      );
      return;
    }

    if (localSession) {
      const resolvedPhoto =
        fields.photoURL !== undefined
          ? fields.photoURL || undefined
          : localSession.photoURL;

      const updatedSession: CustomerSession = {
        ...localSession,
        displayName:
          fields.displayName !== undefined
            ? clampString(fields.displayName || 'Customer', 120)
            : localSession.displayName,
        phoneCode: fields.phoneCode ?? localSession.phoneCode,
        phone: fields.phone !== undefined ? clampString(fields.phone, 32) : localSession.phone,
        photoURL: resolvedPhoto,
        preferredCurrency: fields.preferredCurrency ?? localSession.preferredCurrency,
      };
      setLocalSession(updatedSession);
      writeJsonStorage(SESSION_STORAGE_KEY, updatedSession);

      const accounts = readJsonStorage<StoredAccountRecord[]>(ACCOUNTS_STORAGE_KEY, []);
      if (accounts.some((acc) => acc.uid === localSession.uid)) {
        const updatedAccounts = accounts.map((acc) =>
          acc.uid === localSession.uid
            ? {
                ...acc,
                displayName: updatedSession.displayName,
                phoneCode: updatedSession.phoneCode || acc.phoneCode,
                phone: updatedSession.phone || acc.phone,
                photoURL: resolvedPhoto,
                preferredCurrency: updatedSession.preferredCurrency,
              }
            : acc
        );
        writeJsonStorage(ACCOUNTS_STORAGE_KEY, updatedAccounts);
      }
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!currentPassword.trim()) {
      return { ok: false, message: 'Please enter your current password.' };
    }
    if (newPassword.length < 8) {
      return { ok: false, message: 'New password must be at least 8 characters.' };
    }
    if (currentPassword === newPassword) {
      return { ok: false, message: 'New password must be different from your current password.' };
    }

    if (localSession) {
      const accounts = readJsonStorage<StoredAccountRecord[]>(ACCOUNTS_STORAGE_KEY, []);
      const idx = accounts.findIndex((acc) => acc.uid === localSession.uid);
      if (idx >= 0) {
        if (accounts[idx].password !== currentPassword) {
          return { ok: false, message: 'Current password does not match your account.' };
        }
        const updated = accounts.map((acc) =>
          acc.uid === localSession.uid ? { ...acc, password: newPassword } : acc
        );
        writeJsonStorage(ACCOUNTS_STORAGE_KEY, updated);
        return { ok: true, message: 'Password updated securely for your account.' };
      }

      if (localSession.uid === DEMO_ACCOUNT.uid && currentPassword !== DEMO_ACCOUNT.password) {
        return { ok: false, message: 'Current demo password is Password123!' };
      }
    }

    return { ok: true, message: 'Security password updated for this session.' };
  };

  const resolvePhoto = (uid: string, fallback?: string): string | undefined => {
    const override = avatarOverrides[uid];
    if (override === '__initials__') return undefined;
    return override || fallback;
  };

  const profile: UserProfileDoc | null = user
    ? firebaseProfile
      ? {
          ...firebaseProfile,
          photoURL: resolvePhoto(user.uid, firebaseProfile.photoURL),
        }
      : null
    : localSession
      ? {
          uid: localSession.uid,
          displayName: localSession.displayName,
          email: localSession.email,
          photoURL: resolvePhoto(localSession.uid, localSession.photoURL),
          phoneCode: localSession.phoneCode,
          phone: localSession.phone,
          preferredCurrency: localSession.preferredCurrency,
          provider: localSession.provider,
        }
      : null;

  const isAuthenticated = Boolean(user || localSession);

  return (
    <AuthContext.Provider
      value={{
        user,
        localSession,
        isAuthenticated,
        profile,
        authReady,
        signingIn,
        authError,
        clearAuthError,
        rememberedEmail,
        signUpWithEmail,
        loginWithEmail,
        loginWithDemoAccount,
        signInWithApple,
        signInWithGoogle,
        signOut,
        updateProfileFields,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
